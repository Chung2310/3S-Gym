import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import User from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import CareAlert from '../models/CareAlert.js';
import CareTask from '../models/CareTask.js';
import TransferRequest from '../models/TransferRequest.js';
import { forceTransfer } from '../services/transferService.js';

let mongo: MongoMemoryReplSet;
beforeAll(async () => { mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(mongo.getUri()); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('rolls back customer ownership and transfer state when care reassignment fails', async () => {
  const [admin, fromPt, toPt] = await User.create([
    { username: 'admin-transfer-atomic', password: 'hashed', role: 'ADMIN' },
    { username: 'from-transfer-atomic', password: 'hashed', role: 'PT' },
    { username: 'to-transfer-atomic', password: 'hashed', role: 'PT' },
  ]);
  const customer = await CustomerProfile.create({ fullName: 'Khách Transfer Atomic', phone: '0908111003', assignedPtId: fromPt.id });
  await CareAlert.create({ customerId: customer.id, ptId: fromPt.id, ruleKey: 'atomic', title: 'Atomic', reason: 'Atomic test', dueAt: new Date() });
  await CareTask.create({ customerId: customer.id, assignedPtId: fromPt.id, title: 'Atomic task', dueAt: new Date() });
  vi.spyOn(CareTask, 'updateMany').mockRejectedValueOnce(new Error('care reassignment failed'));
  const requestId = new mongoose.Types.ObjectId().toString();

  await expect(forceTransfer({ id: admin.id, role: 'ADMIN' }, requestId, { customerId: customer.id, toPtId: toPt.id, reason: 'Atomic transfer' }))
    .rejects.toThrow('care reassignment failed');

  expect(String((await CustomerProfile.findById(customer.id).lean())?.assignedPtId)).toBe(fromPt.id);
  expect(await TransferRequest.findById(requestId)).toBeNull();
  vi.restoreAllMocks();
});
