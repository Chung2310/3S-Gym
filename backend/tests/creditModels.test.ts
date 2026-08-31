import { Types, type IndexDefinition, type IndexOptions } from 'mongoose';
import { describe, expect, it } from 'vitest';
import CreditWallet from '../models/CreditWallet.js';
import CreditLedgerEntry from '../models/CreditLedgerEntry.js';
import AiUsage from '../models/AiUsage.js';
import AiBillingPolicy from '../models/AiBillingPolicy.js';
import CreditPricing from '../models/CreditPricing.js';
import CreditPackage from '../models/CreditPackage.js';
import PaymentOrder from '../models/PaymentOrder.js';

function hasUniqueIndex(model: { schema: { indexes(): Array<[IndexDefinition, IndexOptions]> } }, field: string) {
  return model.schema.indexes().some(([keys, options]) => keys[field] === 1 && options.unique === true);
}

describe('credit domain models', () => {
  it('không chấp nhận số dư âm hoặc số credit không nguyên', async () => {
    const userId = new Types.ObjectId();
    await expect(new CreditWallet({ userId, availableCredits: -1, reservedCredits: 0 }).validate()).rejects.toBeTruthy();
    await expect(new CreditWallet({ userId, availableCredits: 1.5, reservedCredits: 0 }).validate()).rejects.toBeTruthy();
    await expect(new CreditWallet({ userId, availableCredits: 0, reservedCredits: -1 }).validate()).rejects.toBeTruthy();
  });

  it('khóa unique cho mọi idempotency boundary', () => {
    expect(hasUniqueIndex(CreditWallet, 'userId')).toBe(true);
    expect(hasUniqueIndex(CreditLedgerEntry, 'idempotencyKey')).toBe(true);
    expect(hasUniqueIndex(AiUsage, 'requestKey')).toBe(true);
    expect(hasUniqueIndex(AiBillingPolicy, 'taskType')).toBe(true);
    expect(hasUniqueIndex(CreditPricing, 'key')).toBe(true);
    expect(hasUniqueIndex(PaymentOrder, 'orderCode')).toBe(true);
    expect(hasUniqueIndex(PaymentOrder, 'grantIdempotencyKey')).toBe(true);
  });

  it('kiểm tra giới hạn package và snapshot payment', async () => {
    const userId = new Types.ObjectId();
    await expect(new CreditPackage({ name: 'Nhỏ', amountVnd: 9_000, baseCredits: 9, bonusCredits: 0, active: true }).validate()).rejects.toBeTruthy();
    await expect(new PaymentOrder({
      userId,
      walletId: new Types.ObjectId(),
      gateway: 'VNPAY',
      orderCode: 'ORDER1',
      status: 'PENDING',
      source: 'CUSTOM',
      amountVnd: 10_000,
      baseCredits: 10,
      bonusCredits: 0,
      grantCredits: 10,
      grantIdempotencyKey: 'payment:ORDER1',
      expiresAt: new Date(Date.now() + 60_000),
    }).validate()).resolves.toBeUndefined();
  });
});
