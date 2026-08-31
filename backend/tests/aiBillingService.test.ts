import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import AiBillingPolicy from '../models/AiBillingPolicy.js';
import AiUsage from '../models/AiUsage.js';
import AuditLog from '../models/AuditLog.js';
import CreditLedgerEntry from '../models/CreditLedgerEntry.js';
import CreditPricing from '../models/CreditPricing.js';
import CreditWallet from '../models/CreditWallet.js';
import User from '../models/User.js';
import { withAiBilling } from '../services/aiBillingService.js';
import type { AiBillingContext, ProviderResult } from '../services/creditTypes.js';
import { embedTextBillable } from '../services/embeddingProvider.js';

let mongo: MongoMemoryReplSet;
let userId: string;
const context = (requestKey: string): AiBillingContext => ({ userId, taskType: 'TEXT_GENERIC', requestKey });
const result = (usage: ProviderResult<string>['usage'] = { providerCostMicrousd: 100_000 }): ProviderResult<string> => ({ value: 'ok', provider: 'openrouter', model: 'model-test', usage });

beforeAll(async () => { mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(mongo.getUri()); });
beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase();
  const user = await User.create({ username: 'billing-user', password: 'hash', role: 'CUSTOMER' }); userId = user.id;
  await Promise.all([
    CreditPricing.create({ key: 'GLOBAL', vndPerCredit: 1_000, usdToVnd: 26_000 }),
    AiBillingPolicy.create({ taskType: 'TEXT_GENERIC', enabled: true, maxReservationCredits: 20, fallbackCredits: 3, markupBasisPoints: 12_500, minBillableCredits: 1 }),
    CreditWallet.create({ userId, availableCredits: 20, reservedCredits: 0, version: 0 }),
  ]);
  await Promise.all([AiUsage.createIndexes(), CreditLedgerEntry.createIndexes(), CreditWallet.createIndexes()]);
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

describe('withAiBilling', () => {
  it('reserves maximum, settles actual cost, and releases the remainder', async () => {
    await expect(withAiBilling(context('billing-success'), async () => result())).resolves.toBe('ok');
    expect(await AiUsage.findOne({ requestKey: 'billing-success' })).toMatchObject({
      status: 'SUCCEEDED', reservedCredits: 20, settledCredits: 4, releasedCredits: 16,
      provider: 'openrouter', model: 'model-test', providerCostMicrousd: 100_000,
    });
    expect(await CreditWallet.findOne({ userId })).toMatchObject({ availableCredits: 16, reservedCredits: 0 });
  });

  it('uses fallback credits when provider omits cost metadata', async () => {
    await withAiBilling(context('billing-fallback'), async () => result({ totalTokens: 50 }));
    expect(await AiUsage.findOne({ requestKey: 'billing-fallback' })).toMatchObject({ settledCredits: 3, releasedCredits: 17, totalTokens: 50 });
  });

  it('fully releases the reservation when invocation fails', async () => {
    await expect(withAiBilling(context('billing-failure'), async () => { throw new Error('timeout'); })).rejects.toThrow('timeout');
    expect(await AiUsage.findOne({ requestKey: 'billing-failure' })).toMatchObject({ status: 'FAILED', settledCredits: 0, releasedCredits: 20 });
    expect(await CreditWallet.findOne({ userId })).toMatchObject({ availableCredits: 20, reservedCredits: 0 });
  });

  it('rejects disabled policies and insufficient balances before invoking', async () => {
    const invoke = vi.fn(async () => result());
    await AiBillingPolicy.updateOne({ taskType: 'TEXT_GENERIC' }, { $set: { enabled: false } });
    await expect(withAiBilling(context('billing-disabled'), invoke)).rejects.toMatchObject({ status: 503 });
    await AiBillingPolicy.updateOne({ taskType: 'TEXT_GENERIC' }, { $set: { enabled: true } });
    await CreditWallet.updateOne({ userId }, { $set: { availableCredits: 19 } });
    await expect(withAiBilling(context('billing-poor'), invoke)).rejects.toMatchObject({ status: 402, code: 'INSUFFICIENT_CREDITS' });
    expect(invoke).not.toHaveBeenCalled();
  });

  it('rejects a repeated request key without invoking twice', async () => {
    const invoke = vi.fn(async () => result());
    await withAiBilling(context('billing-repeat'), invoke);
    await expect(withAiBilling(context('billing-repeat'), invoke)).rejects.toMatchObject({ status: 409 });
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('releases credit for malformed usage metadata', async () => {
    await expect(withAiBilling(context('billing-invalid'), async () => result({ providerCostMicrousd: -1 }))).rejects.toMatchObject({ status: 502 });
    expect(await AiUsage.findOne({ requestKey: 'billing-invalid' })).toMatchObject({ status: 'FAILED', releasedCredits: 20 });
    expect(await CreditWallet.findOne({ userId })).toMatchObject({ availableCredits: 20, reservedCredits: 0 });
  });

  it('records a shortfall without allowing a negative wallet', async () => {
    await AiBillingPolicy.updateOne({ taskType: 'TEXT_GENERIC' }, { $set: { maxReservationCredits: 2, fallbackCredits: 1 } });
    await CreditWallet.updateOne({ userId }, { $set: { availableCredits: 2 } });
    await withAiBilling(context('billing-shortfall'), async () => result({ providerCostMicrousd: 1_000_000 }));
    expect(await AiUsage.findOne({ requestKey: 'billing-shortfall' })).toMatchObject({ status: 'BILLING_SHORTFALL', reservedCredits: 2, settledCredits: 33, billingShortfall: 31 });
    expect(await CreditWallet.findOne({ userId })).toMatchObject({ availableCredits: 0, reservedCredits: 0 });
    expect(await AuditLog.findOne({ action: 'AI_BILLING_SHORTFALL' })).toMatchObject({ metadata: { taskType: 'TEXT_GENERIC', billingShortfall: 31 } });
  });

  it('bills local application embeddings with the configured fallback', async () => {
    await AiBillingPolicy.create({ taskType: 'EMBEDDING_QUERY', enabled: true, maxReservationCredits: 2, fallbackCredits: 1, markupBasisPoints: 10_000, minBillableCredits: 1 });
    const vector = await embedTextBillable({ userId, taskType: 'EMBEDDING_QUERY', requestKey: 'embedding-query' }, 'squat strength');
    expect(vector).toHaveLength(128);
    expect(await AiUsage.findOne({ requestKey: 'embedding-query' })).toMatchObject({ provider: 'local', settledCredits: 1, releasedCredits: 1 });
  });
});
