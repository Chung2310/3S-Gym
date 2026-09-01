import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest';

vi.mock('../services/aiProvider.js', () => ({
  generateText: vi.fn().mockResolvedValue(JSON.stringify({ exercises: [
    { name: 'Cable Row', muscleGroup: 'Lưng', level: 'INTERMEDIATE', defaultTrackingType: 'STRENGTH', equipment: ['Cáp'], description: '', technique: 'Kéo khuỷu tay về sau.', commonMistakes: [], contraindications: [], variants: [] },
    { name: 'Lat Pulldown', muscleGroup: 'Lưng', level: 'INTERMEDIATE', defaultTrackingType: 'STRENGTH', equipment: ['Cáp'], description: '', technique: 'Kéo thanh về ngực trên.', commonMistakes: [], contraindications: [], variants: [] },
  ] })),
}));

import app from '../app.js';
import Exercise from '../models/Exercise.js';
import FeatureFlag from '../models/FeatureFlag.js';
import User, { type UserRole } from '../models/User.js';

let mongo: MongoMemoryReplSet;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
  await mongoose.connection.db!.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

async function tokenFor(role: UserRole): Promise<string> {
  const user = await User.create({ username: `ai-exercise-${role.toLowerCase()}`, password: 'hashed', role });
  return jwt.sign({ id: user.id, role }, process.env.JWT_SECRET || 'secret_key');
}

async function enableLibrary(roles: UserRole[] = ['ADMIN', 'PT']): Promise<void> {
  await FeatureFlag.create({ key: 'EXERCISE_LIBRARY', enabled: true, roles });
}

const generationBody = {
  mode: 'BATCH', muscleGroup: 'Lưng', level: 'INTERMEDIATE', defaultTrackingType: 'STRENGTH',
  equipment: ['Cáp'], quantity: 2, additionalRequest: '',
};

describe('POST /api/ai/exercise-generations', () => {
  it.each(['PT', 'ADMIN'] as const)('allows %s to generate drafts without persistence', async (role) => {
    await enableLibrary();
    const token = await tokenFor(role);
    const before = await Exercise.countDocuments();

    const response = await request(app)
      .post('/api/ai/exercise-generations')
      .set('Authorization', `Bearer ${token}`)
      .send(generationBody);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ drafts: [{ name: 'Cable Row' }, { name: 'Lat Pulldown' }], discardedCount: 0 });
    expect(await Exercise.countDocuments()).toBe(before);
  });

  it('rejects customers', async () => {
    await enableLibrary(['CUSTOMER']);
    const token = await tokenFor('CUSTOMER');
    const response = await request(app).post('/api/ai/exercise-generations').set('Authorization', `Bearer ${token}`).send(generationBody);
    expect(response.status).toBe(403);
  });

  it('rejects access when the exercise feature is disabled', async () => {
    await FeatureFlag.create({ key: 'EXERCISE_LIBRARY', enabled: false, roles: ['PT'] });
    const token = await tokenFor('PT');
    const response = await request(app).post('/api/ai/exercise-generations').set('Authorization', `Bearer ${token}`).send(generationBody);
    expect(response.status).toBe(403);
  });

  it('rejects a batch above ten exercises', async () => {
    await enableLibrary();
    const token = await tokenFor('PT');
    const response = await request(app).post('/api/ai/exercise-generations').set('Authorization', `Bearer ${token}`).send({ ...generationBody, quantity: 11 });
    expect(response.status).toBe(400);
  });

  it('requires a quantity of one in single mode', async () => {
    await enableLibrary();
    const token = await tokenFor('PT');
    const response = await request(app).post('/api/ai/exercise-generations').set('Authorization', `Bearer ${token}`).send({ ...generationBody, mode: 'SINGLE', quantity: 2 });
    expect(response.status).toBe(400);
  });
});

const reviewedDraft = (name: string) => ({
  name,
  muscleGroup: 'Chân',
  level: 'BEGINNER' as const,
  defaultTrackingType: 'STRENGTH' as const,
  equipment: ['Tạ đơn'],
  description: 'Bài tập chân.',
  technique: 'Giữ lưng trung lập.',
  commonMistakes: ['Gối đổ vào trong'],
  contraindications: [],
  variants: [],
});

describe('POST /api/exercises/bulk', () => {
  it('persists all reviewed drafts with the shared-library ownership policy', async () => {
    await enableLibrary();
    const token = await tokenFor('PT');
    const pt = await User.findOne({ role: 'PT' }).orFail();

    const response = await request(app)
      .post('/api/exercises/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ exercises: [reviewedDraft('Goblet Squat'), reviewedDraft('Split Squat')] });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveLength(2);
    const stored = await Exercise.find().sort({ name: 1 }).lean();
    expect(stored).toHaveLength(2);
    expect(stored.every((exercise) => exercise.scope === 'GLOBAL')).toBe(true);
    expect(stored.every((exercise) => String(exercise.ownerPtId) === pt.id)).toBe(true);
  });

  it('rejects duplicate normalized names in one request without partial persistence', async () => {
    await enableLibrary();
    const token = await tokenFor('PT');
    const before = await Exercise.countDocuments();

    const response = await request(app)
      .post('/api/exercises/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ exercises: [reviewedDraft('Goblet Squat'), reviewedDraft('  goblet   squat  ')] });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Goblet Squat');
    expect(await Exercise.countDocuments()).toBe(before);
  });

  it('rejects a database duplicate regardless of case and extra whitespace', async () => {
    await enableLibrary();
    const token = await tokenFor('PT');
    await Exercise.create(reviewedDraft('Goblet Squat'));
    const before = await Exercise.countDocuments();

    const response = await request(app)
      .post('/api/exercises/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ exercises: [reviewedDraft('  GOBLET   SQUAT '), reviewedDraft('Cable Row')] });

    expect(response.status).toBe(400);
    expect(await Exercise.countDocuments()).toBe(before);
  });

  it('rejects an invalid item before saving any valid item', async () => {
    await enableLibrary();
    const token = await tokenFor('PT');
    const response = await request(app)
      .post('/api/exercises/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ exercises: [reviewedDraft('Goblet Squat'), { ...reviewedDraft('Invalid'), defaultTrackingType: 'UNCLASSIFIED' }] });

    expect(response.status).toBe(400);
    expect(await Exercise.countDocuments()).toBe(0);
  });

  it('rejects more than ten reviewed drafts', async () => {
    await enableLibrary();
    const token = await tokenFor('ADMIN');
    const response = await request(app)
      .post('/api/exercises/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ exercises: Array.from({ length: 11 }, (_, index) => reviewedDraft(`Exercise ${index + 1}`)) });

    expect(response.status).toBe(400);
    expect(await Exercise.countDocuments()).toBe(0);
  });
});
