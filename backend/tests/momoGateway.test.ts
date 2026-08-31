import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadEnv } from '../config/env.js';
import { createMomoPayment, verifyMomoCallback } from '../services/momoGateway.js';

const configuredEnv = () => loadEnv({
  NODE_ENV: 'test',
  MOMO_PARTNER_CODE: 'MOMOTEST', MOMO_ACCESS_KEY: 'access-test', MOMO_SECRET_KEY: 'momo-secret',
  MOMO_API_URL: 'https://test-payment.momo.vn/v2/gateway/api/create',
  MOMO_REDIRECT_URL: 'https://app.test/wallet/payment-result',
  MOMO_IPN_URL: 'https://app.test/api/credits/payments/momo/ipn',
});

afterEach(() => vi.unstubAllGlobals());

describe('MoMo gateway', () => {
  it('uses the documented raw field order and HMAC-SHA256 request signature', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ resultCode: 0, payUrl: 'https://momo.test/pay', requestId: 'REQ001', orderId: 'ORD001' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createMomoPayment({ orderCode: 'ORD001', requestId: 'REQ001', amountVnd: 10_000, description: 'Nap credit ORD001' }, configuredEnv()))
      .resolves.toMatchObject({ configured: true, redirectUrl: 'https://momo.test/pay' });
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.signature).toBe('f31da1eb41854080077d952755d47d0583df9023805419c8a73609c243d7322a');
    expect(body).toMatchObject({ partnerCode: 'MOMOTEST', amount: '10000', requestType: 'captureWallet', autoCapture: true, lang: 'vi' });
  });

  it('verifies callback signatures and rejects tampered amounts', () => {
    const callback = {
      partnerCode: 'MOMOTEST', orderId: 'ORD001', requestId: 'REQ001', amount: 10_000,
      orderInfo: 'Nap credit ORD001', orderType: 'momo_wallet', transId: 123456,
      resultCode: 0, message: 'Successful.', payType: 'qr', responseTime: 1_788_159_600_000, extraData: '',
    };
    const raw = 'accessKey=access-test&amount=10000&extraData=&message=Successful.&orderId=ORD001&orderInfo=Nap credit ORD001&orderType=momo_wallet&partnerCode=MOMOTEST&payType=qr&requestId=REQ001&responseTime=1788159600000&resultCode=0&transId=123456';
    const signature = createHmac('sha256', 'momo-secret').update(raw).digest('hex');

    expect(verifyMomoCallback({ ...callback, signature }, configuredEnv())).toMatchObject({ valid: true, orderCode: 'ORD001', amountVnd: 10_000, success: true });
    expect(verifyMomoCallback({ ...callback, amount: 20_000, signature }, configuredEnv()).valid).toBe(false);
    expect(verifyMomoCallback({ ...callback, signature: 'bad' }, configuredEnv()).valid).toBe(false);
  });

  it('does not call the network when configuration is incomplete', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    await expect(createMomoPayment({ orderCode: 'ORD', requestId: 'REQ', amountVnd: 10_000, description: 'Topup' }, loadEnv({ NODE_ENV: 'test' })))
      .resolves.toEqual({ configured: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
