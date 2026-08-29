import { afterAll, beforeAll, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { seedProgressDemo } from '../services/progressDemoSeedService.js';
import WorkoutSession from '../models/WorkoutSession.js';
import BodyMeasurement from '../models/BodyMeasurement.js';
import CalendarEvent from '../models/CalendarEvent.js';

let mongo: MongoMemoryServer;
beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('creates a rich demo journey and remains idempotent', async () => {
  const first = await seedProgressDemo();
  const second = await seedProgressDemo();
  expect(second.customerId).toBe(first.customerId);
  expect(second.counts).toEqual({ sessions: 36, measurements: 13, calendarEvents: 36, photos: 3, reports: 2 });
  expect(await WorkoutSession.countDocuments({ customerId: first.customerId })).toBe(36);
  expect(await BodyMeasurement.countDocuments({ customerId: first.customerId })).toBe(13);
  expect(await CalendarEvent.countDocuments({ customerId: first.customerId })).toBe(36);
});
