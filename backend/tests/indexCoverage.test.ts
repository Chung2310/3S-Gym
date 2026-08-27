import { expect, it } from 'vitest';
import CalendarEvent from '../models/CalendarEvent.js';
import CareAlert from '../models/CareAlert.js';
import CareTask from '../models/CareTask.js';
import CustomerProfile from '../models/CustomerProfile.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';

function expectIndex(model: { schema: { indexes(): Array<[Record<string, number | string>, unknown]> } }, expected: Record<string, number>) {
  const keys = model.schema.indexes().map(([index]) => index);
  expect(keys).toContainEqual(expected);
}

it('indexes customer assignment lists in their filter and sort order', () => {
  expectIndex(CustomerProfile, { assignedPtId: 1, status: 1, createdAt: -1 });
});

it('indexes care queues by owner, status, and due date', () => {
  expectIndex(CareAlert, { ptId: 1, status: 1, dueAt: 1 });
  expectIndex(CareTask, { assignedPtId: 1, status: 1, dueAt: 1 });
});

it('indexes calendar lists and ordered knowledge chunks', () => {
  expectIndex(CalendarEvent, { ownerPtId: 1, status: 1, startsAt: 1 });
  expectIndex(KnowledgeChunk, { documentId: 1, documentVersion: 1, position: 1 });
});
