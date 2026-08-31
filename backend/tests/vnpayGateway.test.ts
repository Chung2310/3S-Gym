import { describe, expect, it } from 'vitest';
import { loadEnv } from '../config/env.js';
import { createVnpayPayment, verifyVnpayCallback } from '../services/vnpayGateway.js';

const configuredEnv = () => loadEnv({
  NODE_ENV: 'test',
  VNPAY_TMN_CODE: 'TMNTEST',
  VNPAY_HASH_SECRET: 'vnp-secret',
  VNPAY_PAYMENT_URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  VNPAY_RETURN_URL: 'https://app.test/api/credits/payments/vnpay/return',
  VNPAY_IPN_URL: 'https://app.test/api/credits/payments/vnpay/ipn',
});

describe('VNPay gateway', () => {
  it('sorts parameters, scales VND by 100, and signs the payment URL with SHA-512', () => {
    const payment = createVnpayPayment({
      orderCode: 'ORD001', amountVnd: 10_000, ipAddress: '127.0.0.1',
      description: 'Nap credit ORD001', createdAt: new Date('2026-08-31T08:00:00.000Z'),
    }, configuredEnv());
    if (!payment.configured) throw new Error('VNPay fixture must be configured.');
    const url = new URL(payment.redirectUrl);

    expect(payment.configured).toBe(true);
    expect(url.searchParams.get('vnp_Amount')).toBe('1000000');
    expect(url.searchParams.get('vnp_SecureHash')).toBe('c8bd843ebe5088a42b1a34686411c5f0189af6be0b8dac10d8b5716137be1d214a6a2aa0d7389ebbf92b28782a0c62cd0464ef3c5c34f88b766078b80ad85845');
    expect([...url.searchParams.keys()].slice(0, 3)).toEqual(['vnp_Amount', 'vnp_Command', 'vnp_CreateDate']);
  });

  it('verifies a signed callback and rejects amount or signature tampering', () => {
    const payment = createVnpayPayment({
      orderCode: 'ORD001', amountVnd: 10_000, ipAddress: '127.0.0.1',
      description: 'Nap credit ORD001', createdAt: new Date('2026-08-31T08:00:00.000Z'),
    }, configuredEnv());
    if (!payment.configured) throw new Error('VNPay fixture must be configured.');
    const params = Object.fromEntries(new URL(payment.redirectUrl).searchParams);

    expect(verifyVnpayCallback(params, configuredEnv())).toMatchObject({ valid: true, orderCode: 'ORD001', amountVnd: 10_000 });
    expect(verifyVnpayCallback({ ...params, vnp_Amount: '999900' }, configuredEnv()).valid).toBe(false);
    expect(verifyVnpayCallback({ ...params, vnp_SecureHash: '00' }, configuredEnv()).valid).toBe(false);
  });

  it('reports unavailable when any required setting is absent', () => {
    expect(createVnpayPayment({ orderCode: 'ORD', amountVnd: 10_000, ipAddress: '127.0.0.1', description: 'Topup' }, loadEnv({ NODE_ENV: 'test' })))
      .toEqual({ configured: false });
  });
});
