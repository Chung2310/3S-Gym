import { Types } from 'mongoose';
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

async function recordAudit(input: AuditInput) {
  return AuditLog.create({
    actorId: new Types.ObjectId(input.actor.id),
    actorRole: input.actor.role,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    customerId: input.customerId ? new Types.ObjectId(String(input.customerId)) : undefined,
    metadata: input.metadata ?? {},
  });
}

export { recordAudit };
