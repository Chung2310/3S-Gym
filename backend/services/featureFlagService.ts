import FeatureFlag, { FEATURE_KEYS, type FeatureKey } from '../models/FeatureFlag.js';
import type { UserRole } from '../models/User.js';
import type { AuthenticatedUser } from '../types/express.js';
import { hasRequiredRole } from './roles.js';

interface UpdateFeaturePayload {
  enabled: boolean;
  roles: UserRole[];
  pilotUserIds?: string[];
}

async function updateFeature(key: FeatureKey, payload: UpdateFeaturePayload) {
  return FeatureFlag.findOneAndUpdate(
    { key },
    { $set: { enabled: payload.enabled, roles: payload.roles, pilotUserIds: payload.pilotUserIds ?? [] } },
    { returnDocument: 'after', upsert: true, runValidators: true },
  ).lean();
}

async function isEnabled(key: FeatureKey, user: AuthenticatedUser): Promise<boolean> {
  const flag = await FeatureFlag.findOne({ key }).lean();
  if (!flag?.enabled) return false;
  if (hasRequiredRole(user.role, flag.roles)) return true;
  return flag.pilotUserIds.some((id) => String(id) === user.id);
}

async function getFeaturesForUser(user: AuthenticatedUser): Promise<Record<FeatureKey, boolean>> {
  const entries = await Promise.all(FEATURE_KEYS.map(async (key) => [key, await isEnabled(key, user)] as const));
  return Object.fromEntries(entries) as Record<FeatureKey, boolean>;
}

export { getFeaturesForUser, isEnabled, updateFeature };
