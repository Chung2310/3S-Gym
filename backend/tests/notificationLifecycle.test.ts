import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, expect, it } from 'vitest';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import { createNotificationOnce } from '../services/notificationService.js';
import { createEvent, updateEvent } from '../services/operationsService.js';

let mongo: MongoMemoryServer;
let ptId: string; let customerId: string; let customerUserId: string;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri());
  const [pt, customerUser] = await User.create([
    { username: 'pt-notification-matrix', password: 'hashed', role: 'PT' },
    { username: 'customer-notification-matrix', password: 'hashed', role: 'CUSTOMER' },
  ]);
  const customer = await CustomerProfile.create({ userId: customerUser.id, fullName: 'Khách Notification Matrix', phone: '0908111005', assignedPtId: pt.id });
  ptId = pt.id; customerId = customer.id; customerUserId = customerUser.id;
  await Notification.syncIndexes();
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('deduplicates by recipient, type, resource type and resource id', async () => {
  const common = { userId: customerUserId, type: 'RESOURCE_CHANGED', title: 'Changed', message: 'Changed', resourceId: 'same-id' };
  await Promise.all([
    createNotificationOnce({ ...common, resourceType: 'calendarEvents' }),
    createNotificationOnce({ ...common, resourceType: 'calendarEvents' }),
    createNotificationOnce({ ...common, resourceType: 'careTasks' }),
  ]);
  expect(await Notification.countDocuments({ userId: customerUserId, type: common.type, resourceId: common.resourceId })).toBe(2);
});

it('notifies the customer when an event is updated or cancelled', async () => {
  const actor = { id: ptId, role: 'PT' as const };
  const event = await createEvent(actor, { customerId: new mongoose.Types.ObjectId(customerId), title: 'Lifecycle event', startsAt: new Date('2026-09-01T01:00:00Z'), endsAt: new Date('2026-09-01T02:00:00Z') });
  await updateEvent(actor, event.id, { title: 'Lifecycle updated' });
  await updateEvent(actor, event.id, { status: 'CANCELLED' });
  expect(await Notification.countDocuments({ userId: customerUserId, type: 'CALENDAR_EVENT_UPDATED', resourceId: event.id })).toBe(1);
  expect(await Notification.countDocuments({ userId: customerUserId, type: 'CALENDAR_EVENT_CANCELLED', resourceId: event.id })).toBe(1);
});
