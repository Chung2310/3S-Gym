import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import User from '../models/User.js';
import CreditWallet from '../models/CreditWallet.js';
import CreditLedgerEntry from '../models/CreditLedgerEntry.js';
import {
  adjustCredits,
  ensureWallet,
  grantTopupCredits,
  releaseCredits,
  reserveCredits,
  settleCredits,
} from '../services/creditWalletService.js';

let mongo: MongoMemoryReplSet;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
  await Promise.all([CreditWallet.createIndexes(), CreditLedgerEntry.createIndexes()]);
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), CreditWallet.deleteMany({}), CreditLedgerEntry.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

async function user() {
  return User.create({ username: `wallet-${crypto.randomUUID()}`, password: 'hashed', role: 'PT' });
}

describe('creditWalletService', () => {
  it('tạo đúng một ví số dư 0 cho mỗi tài khoản', async () => {
    const owner = await user();
    const [first, second] = await Promise.all([ensureWallet(owner.id), ensureWallet(owner.id)]);

    expect(first.userId.toString()).toBe(owner.id);
    expect(second.userId.toString()).toBe(owner.id);
    expect(await CreditWallet.countDocuments({ userId: owner.id })).toBe(1);
    expect(first).toMatchObject({ availableCredits: 0, reservedCredits: 0 });
  });

  it('grant, reserve và settle ghi đủ ledger rồi trả phần giữ dư', async () => {
    const owner = await user();
    await ensureWallet(owner.id);
    await grantTopupCredits({ userId: owner.id, paymentOrderId: new mongoose.Types.ObjectId().toString(), credits: 10, idempotencyKey: 'grant:order-1' });
    await reserveCredits({ userId: owner.id, usageId: new mongoose.Types.ObjectId().toString(), credits: 6, idempotencyKey: 'reserve:usage-1' });
    const result = await settleCredits({ userId: owner.id, usageId: 'usage-1', reservedCredits: 6, settledCredits: 4 });

    expect(result.billingShortfall).toBe(0);
    expect(await CreditWallet.findOne({ userId: owner.id })).toMatchObject({ availableCredits: 6, reservedCredits: 0 });
    const entries = await CreditLedgerEntry.find({ userId: owner.id }).sort({ _id: 1 }).lean();
    expect(entries.map((entry) => entry.type)).toEqual(['TOPUP', 'RESERVE', 'SETTLE', 'RELEASE']);
  });

  it('từ chối trước khi reserve nếu số dư không đủ', async () => {
    const owner = await user();
    await ensureWallet(owner.id);

    await expect(reserveCredits({ userId: owner.id, usageId: 'usage-poor', credits: 1, idempotencyKey: 'reserve:poor' }))
      .rejects.toMatchObject({ status: 402, code: 'INSUFFICIENT_CREDITS' });
    expect(await CreditLedgerEntry.countDocuments()).toBe(0);
  });

  it('release hoàn toàn reservation khi provider thất bại', async () => {
    const owner = await user();
    await ensureWallet(owner.id);
    await grantTopupCredits({ userId: owner.id, paymentOrderId: 'order-release', credits: 8, idempotencyKey: 'grant:release' });
    await reserveCredits({ userId: owner.id, usageId: 'usage-release', credits: 5, idempotencyKey: 'reserve:release' });
    await releaseCredits({ userId: owner.id, usageId: 'usage-release', credits: 5, idempotencyKey: 'release:usage-release' });

    expect(await CreditWallet.findOne({ userId: owner.id })).toMatchObject({ availableCredits: 8, reservedCredits: 0 });
  });

  it('idempotency key lặp không cộng credit lần hai', async () => {
    const owner = await user();
    await ensureWallet(owner.id);
    const input = { userId: owner.id, paymentOrderId: 'order-repeat', credits: 10, idempotencyKey: 'grant:repeat' };

    await grantTopupCredits(input);
    await grantTopupCredits(input);

    expect(await CreditWallet.findOne({ userId: owner.id })).toMatchObject({ availableCredits: 10 });
    expect(await CreditLedgerEntry.countDocuments({ idempotencyKey: 'grant:repeat' })).toBe(1);
  });

  it('hai reservation đồng thời không thể chi vượt số dư', async () => {
    const owner = await user();
    await ensureWallet(owner.id);
    await grantTopupCredits({ userId: owner.id, paymentOrderId: 'order-race', credits: 5, idempotencyKey: 'grant:race' });

    const results = await Promise.allSettled([
      reserveCredits({ userId: owner.id, usageId: 'usage-race-a', credits: 4, idempotencyKey: 'reserve:race-a' }),
      reserveCredits({ userId: owner.id, usageId: 'usage-race-b', credits: 4, idempotencyKey: 'reserve:race-b' }),
    ]);

    expect(results.filter((item) => item.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((item) => item.status === 'rejected')).toHaveLength(1);
    expect(await CreditWallet.findOne({ userId: owner.id })).toMatchObject({ availableCredits: 1, reservedCredits: 4 });
  });

  it('ghi shortfall và không âm số dư khi phí vượt reservation', async () => {
    const owner = await user();
    await ensureWallet(owner.id);
    await grantTopupCredits({ userId: owner.id, paymentOrderId: 'order-shortfall', credits: 5, idempotencyKey: 'grant:shortfall' });
    await reserveCredits({ userId: owner.id, usageId: 'usage-shortfall', credits: 3, idempotencyKey: 'reserve:shortfall' });

    const result = await settleCredits({ userId: owner.id, usageId: 'usage-shortfall', reservedCredits: 3, settledCredits: 7 });

    expect(result.billingShortfall).toBe(2);
    expect(await CreditWallet.findOne({ userId: owner.id })).toMatchObject({ availableCredits: 0, reservedCredits: 0 });
  });

  it('adjustment bắt buộc lý do và không cho debit làm âm ví', async () => {
    const owner = await user();
    const actor = await User.create({ username: `admin-${crypto.randomUUID()}`, password: 'hashed', role: 'ADMIN' });
    await ensureWallet(owner.id);
    await adjustCredits({ userId: owner.id, actorUserId: actor.id, credits: 3, reason: 'Đối soát', idempotencyKey: 'adjust:1' });

    await expect(adjustCredits({ userId: owner.id, actorUserId: actor.id, credits: -4, reason: 'Thu hồi', idempotencyKey: 'adjust:2' }))
      .rejects.toMatchObject({ status: 402, code: 'INSUFFICIENT_CREDITS' });
    await expect(adjustCredits({ userId: owner.id, actorUserId: actor.id, credits: 1, reason: ' ', idempotencyKey: 'adjust:3' }))
      .rejects.toMatchObject({ status: 400 });
  });
});
