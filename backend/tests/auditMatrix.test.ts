import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, expect, it } from 'vitest';
import AuditLog from '../models/AuditLog.js';
import CareAlert from '../models/CareAlert.js';
import CustomerProfile from '../models/CustomerProfile.js';
import User from '../models/User.js';
import { recordAudit } from '../services/auditService.js';
import * as exercises from '../services/exerciseService.js';
import * as care from '../services/careService.js';

let mongo: MongoMemoryServer;
let ptId: string;
let customerId: string;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri());
  const pt = await User.create({ username: 'pt-audit-matrix', password: 'hashed', role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách Audit Matrix', phone: '0908111004', assignedPtId: pt.id });
  ptId = pt.id; customerId = customer.id;
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('audits exercise and care-alert mutations exactly once', async () => {
  const actor = { id: ptId, role: 'PT' as const };
  const exercise = await exercises.create(actor, { name: 'Audit Squat', muscleGroup: 'LEGS', level: 'BEGINNER' });
  const alert = await CareAlert.create({ customerId, ptId, ruleKey: 'audit-matrix', title: 'Audit Alert', reason: 'Follow up', dueAt: new Date() });
  await care.resolve(actor, alert.id, 'Resolved safely');

  expect(await AuditLog.countDocuments({ action: 'EXERCISE_CREATED', resourceId: exercise.id })).toBe(1);
  expect(await AuditLog.countDocuments({ action: 'CARE_ALERT_RESOLVED', resourceId: alert.id })).toBe(1);
});

it('redacts sensitive metadata with an allowlist', async () => {
  const audit = await recordAudit({
    actor: { id: ptId, role: 'PT' }, action: 'REDACTION_TEST', resourceType: 'test', resourceId: 'resource-1',
    metadata: { version: 2, reasonCode: 'MANUAL', token: 'secret', medicalNote: 'private', imageBase64: 'private-image' },
  });
  expect(audit.metadata).toEqual({ version: 2, reasonCode: 'MANUAL' });
});
