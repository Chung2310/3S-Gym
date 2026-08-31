import { Readable } from 'node:stream';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import AiBillingPolicy from '../models/AiBillingPolicy.js';
import AiUsage from '../models/AiUsage.js';
import CreditLedgerEntry from '../models/CreditLedgerEntry.js';
import CreditPricing from '../models/CreditPricing.js';
import CreditWallet from '../models/CreditWallet.js';
import User from '../models/User.js';
import { generateText } from '../services/aiProvider.js';
import { AI_TASK_TYPES, type AiTaskType } from '../services/creditTypes.js';
import { embedTextBillable } from '../services/embeddingProvider.js';
import { generateImage } from '../services/imageProvider.js';
import { extractInBody } from '../services/ocrProvider.js';

let mongo: MongoMemoryReplSet;
let userId: string;
const context = (taskType: AiTaskType, suffix: string) => ({ userId, taskType, requestKey: `integration:${suffix}` });
const file = (): Express.Multer.File => {
  const buffer = Buffer.from('image-bytes');
  return { fieldname: 'image', originalname: 'inbody.png', encoding: '7bit', mimetype: 'image/png', size: buffer.length, buffer, stream: Readable.from(buffer), destination: '', filename: '', path: '' };
};

beforeAll(async () => { mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(mongo.getUri()); });
beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase(); process.env.OPENROUTER_API_KEY = 'integration-key';
  const user = await User.create({ username: 'ai-integration-user', password: 'hash', role: 'PT' }); userId = user.id;
  await CreditPricing.create({ key: 'GLOBAL', vndPerCredit: 1_000, usdToVnd: 26_000 });
  await AiBillingPolicy.create(AI_TASK_TYPES.map((taskType) => ({ taskType, enabled: true, maxReservationCredits: 2, fallbackCredits: 1, markupBasisPoints: 10_000, minBillableCredits: 1 })));
  await CreditWallet.create({ userId, availableCredits: 100, reservedCredits: 0, version: 0 });
  await Promise.all([AiUsage.createIndexes(), CreditLedgerEntry.createIndexes(), CreditWallet.createIndexes()]);
});
afterEach(() => { vi.unstubAllGlobals(); delete process.env.OPENROUTER_API_KEY; });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

describe('all AI provider families use credit billing', () => {
  it('records every task type through normalized provider entry points', async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const target = String(url);
      if (target.endsWith('/images')) return new Response(JSON.stringify({ data: [{ b64_json: 'image', media_type: 'image/jpeg' }], usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3, cost: 0 } }), { status: 200 });
      if (target.includes('/chat/completions')) {
        return new Response(JSON.stringify({ choices: [{ message: { content: target.includes('chat') ? '{"weight":62.5,"confidence":0.9,"warnings":[]}' : 'ok' } }] }), { status: 200 });
      }
      return new Response('', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    for (const taskType of ['TEXT_NUTRITION', 'TEXT_WORKOUT', 'TEXT_ROADMAP', 'TEXT_ASSISTANT', 'TEXT_GENERIC'] as const) {
      await generateText(context(taskType, taskType.toLowerCase()), 'prompt');
    }
    await extractInBody(context('OCR_INBODY', 'ocr'), file());
    await generateImage(context('IMAGE_GENERATION', 'image'), { prompt: 'meal' });
    await embedTextBillable(context('EMBEDDING_DOCUMENT', 'embedding-document'), 'document');
    await embedTextBillable(context('EMBEDDING_QUERY', 'embedding-query'), 'query');

    expect((await AiUsage.distinct('taskType')).sort()).toEqual([...AI_TASK_TYPES].sort());
    expect(await AiUsage.countDocuments({ status: 'SUCCEEDED' })).toBe(AI_TASK_TYPES.length);
    expect(await CreditWallet.findOne({ userId })).toMatchObject({ availableCredits: 92, reservedCredits: 0 });
  });

  it('rejects every provider family before invocation when the wallet is empty', async () => {
    await CreditWallet.updateOne({ userId }, { $set: { availableCredits: 0 } });
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    const attempts = [
      () => generateText(context('TEXT_GENERIC', 'poor-text'), 'prompt'),
      () => extractInBody(context('OCR_INBODY', 'poor-ocr'), file()),
      () => generateImage(context('IMAGE_GENERATION', 'poor-image'), { prompt: 'meal' }),
      () => embedTextBillable(context('EMBEDDING_QUERY', 'poor-embedding'), 'query'),
    ];
    for (const attempt of attempts) await expect(attempt()).rejects.toMatchObject({ status: 402, code: 'INSUFFICIENT_CREDITS' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await AiUsage.countDocuments()).toBe(0);
  });

  it('keeps assistant query embedding and text generation as separate usages', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: 'answer' } }] }), { status: 200 })));
    await embedTextBillable(context('EMBEDDING_QUERY', 'assistant:embedding-query'), 'question');
    await generateText(context('TEXT_ASSISTANT', 'assistant:text-assistant'), 'question plus sources');
    expect(await AiUsage.find({ requestKey: /^integration:assistant:/ }).sort({ requestKey: 1 }).distinct('taskType')).toEqual(expect.arrayContaining(['EMBEDDING_QUERY', 'TEXT_ASSISTANT']));
  });
});
