import { createHmac } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../app.js';
import AuditLog from '../models/AuditLog.js';
import { loadEnv } from '../config/env.js';
import CreditLedgerEntry from '../models/CreditLedgerEntry.js';
import CreditPackage from '../models/CreditPackage.js';
import CreditPricing from '../models/CreditPricing.js';
import CreditWallet from '../models/CreditWallet.js';
import PaymentOrder from '../models/PaymentOrder.js';
import User, { type UserRole } from '../models/User.js';

let mongo: MongoMemoryReplSet;
const secret = 'secret_key';
const tokens: Partial<Record<UserRole, string>> = {};

function paymentEnv(overrides: NodeJS.ProcessEnv = {}) {
  return loadEnv({
    NODE_ENV: 'test', JWT_SECRET: secret,
    VNPAY_TMN_CODE: 'TMNTEST', VNPAY_HASH_SECRET: 'vnp-secret',
    VNPAY_PAYMENT_URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    VNPAY_RETURN_URL: 'https://app.test/wallet/payment-result', VNPAY_IPN_URL: 'https://app.test/api/credits/payments/vnpay/ipn',
    MOMO_PARTNER_CODE: 'MOMOTEST', MOMO_ACCESS_KEY: 'access-test', MOMO_SECRET_KEY: 'momo-secret',
    MOMO_API_URL: 'https://momo.test/create', MOMO_REDIRECT_URL: 'https://app.test/wallet/payment-result', MOMO_IPN_URL: 'https://app.test/api/credits/payments/momo/ipn',
    ...overrides,
  });
}

function signVnpay(values: Record<string, string>) {
  const params = new URLSearchParams();
  for (const key of Object.keys(values).sort()) params.append(key, values[key] || '');
  return createHmac('sha512', 'vnp-secret').update(params.toString()).digest('hex');
}

function momoCallback(orderCode: string, amount = 10_000, transId = '123456', resultCode = 0) {
  const values = {
    partnerCode: 'MOMOTEST', orderId: orderCode, requestId: `REQ-${orderCode}`, amount,
    orderInfo: `Nap credit ${orderCode}`, orderType: 'momo_wallet', transId,
    resultCode, message: resultCode === 0 ? 'Successful.' : 'Failed', payType: 'qr', responseTime: 1_788_159_600_000, extraData: '',
  };
  const raw = `accessKey=access-test&amount=${values.amount}&extraData=&message=${values.message}&orderId=${values.orderId}&orderInfo=${values.orderInfo}&orderType=${values.orderType}&partnerCode=${values.partnerCode}&payType=${values.payType}&requestId=${values.requestId}&responseTime=${values.responseTime}&resultCode=${values.resultCode}&transId=${values.transId}`;
  return { ...values, signature: createHmac('sha256', 'momo-secret').update(raw).digest('hex') };
}

async function createTopup(role: UserRole, body: Record<string, unknown>) {
  return request(app).post('/api/credits/topups').set('Authorization', `Bearer ${tokens[role]}`).send(body);
}

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase();
  paymentEnv();
  const password = await bcrypt.hash('MatKhau123!', 4);
  for (const role of ['ADMIN', 'PT', 'CUSTOMER'] as const) {
    const user = await User.create({ username: `credit-${role.toLowerCase()}`, password, role });
    tokens[role] = jwt.sign({ id: user.id, role }, secret);
  }
  await CreditPricing.create({ key: 'GLOBAL', vndPerCredit: 1_000, usdToVnd: 26_000 });
  await CreditPackage.create({ name: 'Gói 50', description: 'Tặng 5', amountVnd: 50_000, baseCredits: 50, bonusCredits: 5, active: true, sortOrder: 1 });
  await Promise.all([CreditWallet.createIndexes(), CreditLedgerEntry.createIndexes(), PaymentOrder.createIndexes()]);
});

afterEach(() => vi.unstubAllGlobals());
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

describe('credit payment API', () => {
  it('creates a zero wallet and exposes active packages for every role', async () => {
    for (const role of ['ADMIN', 'PT', 'CUSTOMER'] as const) {
      const wallet = await request(app).get('/api/credits/me').set('Authorization', `Bearer ${tokens[role]}`);
      expect(wallet.status).toBe(200);
      expect(wallet.body.data).toMatchObject({ availableCredits: 0, reservedCredits: 0 });
    }
    const packages = await request(app).get('/api/credits/packages').set('Authorization', `Bearer ${tokens.CUSTOMER}`);
    expect(packages.body.data.packages).toEqual([expect.objectContaining({ name: 'Gói 50', grantCredits: 55 })]);
    expect(packages.body.data.gateways).toEqual({ VNPAY: true, MOMO: true });
  });

  it('creates package and custom orders while enforcing custom bounds and XOR input', async () => {
    const pkg = await CreditPackage.findOne({ name: 'Gói 50' }).lean();
    const packageOrder = await createTopup('PT', { gateway: 'VNPAY', packageId: String(pkg?._id) });
    expect(packageOrder.status).toBe(201);
    expect(packageOrder.body.data).toMatchObject({ status: 'PENDING', amountVnd: 50_000, grantCredits: 55 });
    expect(packageOrder.body.data.redirectUrl).toContain('vnp_SecureHash=');
    const custom = await createTopup('CUSTOMER', { gateway: 'VNPAY', customAmountVnd: 12_000 });
    expect(custom.status, JSON.stringify(custom.body)).toBe(201);
    expect(custom.body.data).toMatchObject({ amountVnd: 12_000, grantCredits: 12 });
    expect((await createTopup('CUSTOMER', { gateway: 'VNPAY', customAmountVnd: 10_500 })).status).toBe(400);
    expect((await createTopup('CUSTOMER', { gateway: 'VNPAY', packageId: String(pkg?._id), customAmountVnd: 10_000 })).status).toBe(400);
  });

  it('does not expose another user order and rejects an unavailable gateway', async () => {
    const created = await createTopup('PT', { gateway: 'VNPAY', customAmountVnd: 10_000 });
    const foreign = await request(app).get(`/api/credits/topups/${created.body.data.id}`).set('Authorization', `Bearer ${tokens.CUSTOMER}`);
    expect(foreign.status).toBe(404);

    paymentEnv({ MOMO_SECRET_KEY: '' });
    const unavailable = await createTopup('CUSTOMER', { gateway: 'MOMO', customAmountVnd: 10_000 });
    expect(unavailable.status).toBe(503);
  });

  it('grants a VNPay order exactly once and rejects bad signatures or wrong amounts', async () => {
    const created = await createTopup('CUSTOMER', { gateway: 'VNPAY', customAmountVnd: 10_000 });
    const base = { vnp_TxnRef: created.body.data.orderCode, vnp_Amount: '1000000', vnp_ResponseCode: '00', vnp_TransactionStatus: '00', vnp_TransactionNo: 'VNP-TXN-1' };
    const valid = { ...base, vnp_SecureHash: signVnpay(base) };
    const browserReturn = await request(app).get('/api/credits/payments/vnpay/return').query(valid);
    expect(browserReturn.body.data.valid).toBe(true);
    expect(await CreditLedgerEntry.countDocuments({ type: 'TOPUP' })).toBe(0);
    const first = await request(app).get('/api/credits/payments/vnpay/ipn').query(valid);
    const second = await request(app).get('/api/credits/payments/vnpay/ipn').query(valid);
    expect(first.status).toBe(200); expect(second.status).toBe(200);
    expect(await CreditWallet.findOne({ userId: (await User.findOne({ role: 'CUSTOMER' }))?._id })).toMatchObject({ availableCredits: 10 });
    expect(await CreditLedgerEntry.countDocuments({ type: 'TOPUP' })).toBe(1);
    expect(await AuditLog.countDocuments({ action: 'CREDIT_PAYMENT_GRANTED', resourceId: created.body.data.id })).toBe(1);
    const customerLedger = await request(app).get('/api/credits/me/ledger').set('Authorization', `Bearer ${tokens.CUSTOMER}`);
    const ptLedger = await request(app).get('/api/credits/me/ledger').set('Authorization', `Bearer ${tokens.PT}`);
    expect(customerLedger.body.data).toHaveLength(1);
    expect(ptLedger.body.data).toHaveLength(0);

    const other = await createTopup('PT', { gateway: 'VNPAY', customAmountVnd: 10_000 });
    const wrong = { ...base, vnp_TxnRef: other.body.data.orderCode, vnp_Amount: '2000000' };
    expect((await request(app).get('/api/credits/payments/vnpay/ipn').query({ ...wrong, vnp_SecureHash: signVnpay(wrong) })).status).toBe(409);
    expect((await request(app).get('/api/credits/payments/vnpay/ipn').query({ ...wrong, vnp_SecureHash: 'bad' })).status).toBe(400);
    expect(await AuditLog.findOne({ action: 'CREDIT_PAYMENT_CALLBACK_REJECTED', resourceId: other.body.data.id })).toMatchObject({
      metadata: { gateway: 'VNPAY', reasonCode: 'VALIDATION_ERROR' },
    });
  });

  it('creates and settles a MoMo order, preventing transaction reuse across orders', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(JSON.stringify({ resultCode: 0, payUrl: 'https://momo.test/pay' }), { status: 200 })));
    const firstOrder = await createTopup('ADMIN', { gateway: 'MOMO', customAmountVnd: 10_000 });
    expect(firstOrder.status).toBe(201);
    expect((await request(app).post('/api/credits/payments/momo/ipn').send(momoCallback(firstOrder.body.data.orderCode))).status).toBe(200);

    const secondOrder = await createTopup('PT', { gateway: 'MOMO', customAmountVnd: 10_000 });
    expect(secondOrder.status, JSON.stringify(secondOrder.body)).toBe(201);
    expect((await request(app).post('/api/credits/payments/momo/ipn').send(momoCallback(secondOrder.body.data.orderCode, 10_000, '123456'))).status).toBe(409);
  });

  it('marks a failed callback terminal but accepts a late valid success for an expired unpaid order', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(JSON.stringify({ resultCode: 0, payUrl: 'https://momo.test/pay' }), { status: 200 })));
    const failed = await createTopup('PT', { gateway: 'MOMO', customAmountVnd: 10_000 });
    expect((await request(app).post('/api/credits/payments/momo/ipn').send(momoCallback(failed.body.data.orderCode, 10_000, 'fail-txn', 1006))).status).toBe(200);
    expect(await PaymentOrder.findById(failed.body.data.id)).toMatchObject({ status: 'FAILED' });

    const late = await createTopup('CUSTOMER', { gateway: 'MOMO', customAmountVnd: 10_000 });
    expect(late.status, JSON.stringify(late.body)).toBe(201);
    await PaymentOrder.updateOne({ _id: late.body.data.id }, { $set: { status: 'EXPIRED', expiresAt: new Date(Date.now() - 1_000) } });
    expect((await request(app).post('/api/credits/payments/momo/ipn').send(momoCallback(late.body.data.orderCode, 10_000, 'late-txn'))).status).toBe(200);
    expect(await PaymentOrder.findById(late.body.data.id)).toMatchObject({ status: 'PAID' });
  });
});
