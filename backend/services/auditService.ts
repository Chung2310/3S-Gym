import { Types, type ClientSession } from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import type { AuthenticatedUser } from '../types/express.js';

interface AuditInput {
  actor: AuthenticatedUser;
  action: string;
  resourceType: string;
  resourceId: string;
  customerId?: string | Types.ObjectId;
  metadata?: Record<string, unknown>;
}

const allowedMetadataKeys = new Set(['fromPtId', 'toPtId', 'version', 'reasonCode']);
function sanitizeMetadata(metadata?: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(metadata || {}).filter(([key, value]) => allowedMetadataKeys.has(key) && ['string', 'number', 'boolean'].includes(typeof value)));
}

async function recordAudit(input: AuditInput, session?: ClientSession) {
  const [audit] = await AuditLog.create([{
    actorId: new Types.ObjectId(input.actor.id),
    actorRole: input.actor.role,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    customerId: input.customerId ? new Types.ObjectId(String(input.customerId)) : undefined,
    metadata: sanitizeMetadata(input.metadata),
  }], session ? { session } : {});
  return audit;
}

export { recordAudit };
