import FeatureFlag from '../models/FeatureFlag.js';
import NutritionFormula from '../models/NutritionFormula.js';
import ActivityCalorie from '../models/ActivityCalorie.js';
import KnowledgeDocument from '../models/KnowledgeDocument.js';
import Roadmap from '../models/Roadmap.js';
import InBodyRecord from '../models/InBodyRecord.js';
import Goal from '../models/Goal.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import NutritionPlan from '../models/NutritionPlan.js';
import WorkoutTemplate from '../models/WorkoutTemplate.js';
import MigrationRecord from '../models/MigrationRecord.js';
import User from '../models/User.js';
import CreditWallet from '../models/CreditWallet.js';
import CreditPricing from '../models/CreditPricing.js';
import AiBillingPolicy from '../models/AiBillingPolicy.js';
import { ensureWallet } from './creditWalletService.js';
import { AI_TASK_TYPES, type AiTaskType } from './creditTypes.js';
import mongoose, { type Model } from 'mongoose';
import { randomUUID } from 'node:crypto';

interface VersionedContent { version?: number; status?: string }

const featureKeys = ['OCR_INBODY', 'ROADMAP', 'EXERCISE_LIBRARY', 'PROGRESS', 'CARE', 'DASHBOARD', 'NUTRITION_AI', 'KNOWLEDGE_BASE', 'PT_ASSISTANT'] as const;

interface MigrationChange { model: string; versionIds: string[]; statusIds: string[] }
interface CreditMigrationMetadata { walletIds: string[]; pricingIds: string[]; policyIds: string[] }
interface MigrationDefinition {
  version: string;
  name: string;
  up: () => Promise<Record<string, unknown>>;
  down: (metadata: Record<string, unknown>) => Promise<void>;
}
const LOCK_DURATION_MS = 60_000;

function isDuplicateKey(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

function sanitizedError(error: unknown) {
  return {
    name: error instanceof Error && error.name ? error.name : 'Error',
    message: 'Migration failed.',
  };
}

async function applyContentDefaults() {
  const contentModels: Model<VersionedContent>[] = [KnowledgeDocument, Roadmap, InBodyRecord, Goal, WorkoutPlan, NutritionPlan].map((model) => model as unknown as Model<VersionedContent>);
  const changes: MigrationChange[] = [];
  for (const Model of contentModels) {
    const [versionIds, statusIds] = await Promise.all([Model.find({ version: { $exists: false } }).distinct('_id'), Model.find({ status: { $exists: false } }).distinct('_id')]);
    await Model.updateMany({ version: { $exists: false } }, { $set: { version: 1 } });
    await Model.updateMany({ status: { $exists: false } }, { $set: { status: 'DRAFT' } });
    changes.push({ model: Model.modelName, versionIds: versionIds.map(String), statusIds: statusIds.map(String) });
  }
  const templateModel = WorkoutTemplate as unknown as Model<VersionedContent>;
  const [versionIds, statusIds] = await Promise.all([templateModel.find({ version: { $exists: false } }).distinct('_id'), templateModel.find({ status: { $exists: false } }).distinct('_id')]);
  await WorkoutTemplate.updateMany({ version: { $exists: false } }, { $set: { version: 1 } });
  await WorkoutTemplate.updateMany({ status: { $exists: false } }, { $set: { status: 'ACTIVE' } });
  changes.push({ model: WorkoutTemplate.modelName, versionIds: versionIds.map(String), statusIds: statusIds.map(String) });
  return { changes };
}

async function rollbackContentDefaults(metadata: Record<string, unknown>) {
  const changes = (metadata.changes || []) as MigrationChange[];
  for (const change of changes) {
    const Model = mongoose.model(change.model);
    if (change.versionIds.length) await Model.updateMany({ _id: { $in: change.versionIds } }, { $unset: { version: 1 } });
    if (change.statusIds.length) await Model.updateMany({ _id: { $in: change.statusIds } }, { $unset: { status: 1 } });
  }
}

const defaultPolicy = (taskType: AiTaskType) => ({
  taskType,
  enabled: true,
  maxReservationCredits: taskType === 'IMAGE_GENERATION' ? 50 : 20,
  fallbackCredits: taskType === 'IMAGE_GENERATION' ? 10 : 1,
  markupBasisPoints: 12_500,
  minBillableCredits: 1,
});

async function seedCreditReferenceData(): Promise<Pick<CreditMigrationMetadata, 'pricingIds' | 'policyIds'>> {
  await Promise.all([CreditPricing.createIndexes(), AiBillingPolicy.createIndexes()]);
  const pricing = await CreditPricing.updateOne(
    { key: 'GLOBAL' },
    { $setOnInsert: { key: 'GLOBAL', vndPerCredit: 1_000, usdToVnd: 26_000 } },
    { upsert: true },
  );
  const policies = await Promise.all(AI_TASK_TYPES.map((taskType) => AiBillingPolicy.updateOne(
    { taskType },
    { $setOnInsert: defaultPolicy(taskType) },
    { upsert: true },
  )));
  return {
    pricingIds: pricing.upsertedId ? [String(pricing.upsertedId)] : [],
    policyIds: policies.flatMap((result) => result.upsertedId ? [String(result.upsertedId)] : []),
  };
}

async function applyCreditWalletsAndPricing(): Promise<Record<string, unknown>> {
  await CreditWallet.createIndexes();
  const walletIds: string[] = [];
  const users = await User.find().select({ _id: 1 }).lean();
  for (const user of users) {
    const existed = await CreditWallet.exists({ userId: user._id });
    const wallet = await ensureWallet(String(user._id));
    if (!existed) walletIds.push(wallet.id);
  }
  const seeded = await seedCreditReferenceData();
  return { walletIds, ...seeded } satisfies CreditMigrationMetadata;
}

async function rollbackCreditWalletsAndPricing(metadata: Record<string, unknown>) {
  const credit = metadata as unknown as CreditMigrationMetadata;
  await Promise.all([
    CreditWallet.deleteMany({ _id: { $in: credit.walletIds || [] } }),
    CreditPricing.deleteMany({ _id: { $in: credit.pricingIds || [] } }),
    AiBillingPolicy.deleteMany({ _id: { $in: credit.policyIds || [] } }),
  ]);
}

const migrations: MigrationDefinition[] = [
  { version: '001-content-defaults', name: 'Add version and status defaults to legacy content', up: applyContentDefaults, down: rollbackContentDefaults },
  { version: '002-credit-wallets-and-pricing', name: 'Backfill credit wallets and seed billing policies', up: applyCreditWalletsAndPricing, down: rollbackCreditWalletsAndPricing },
];

async function applyMigration(migration: MigrationDefinition): Promise<'APPLIED' | 'SKIPPED' | 'BLOCKED'> {
  const ownerId = randomUUID();
  const lockedAt = new Date();
  const expiresAt = new Date(lockedAt.getTime() + LOCK_DURATION_MS);
  let lock;
  try {
    lock = await MigrationRecord.findOneAndUpdate(
      {
        version: migration.version,
        $or: [
          { status: { $in: ['FAILED', 'ROLLED_BACK'] } },
          { status: 'RUNNING', expiresAt: { $lte: lockedAt } },
        ],
      },
      {
        $set: { name: migration.name, status: 'RUNNING', ownerId, lockedAt, expiresAt, metadata: {} },
        $unset: { appliedAt: 1, rolledBackAt: 1, error: 1 },
      },
      { upsert: true, returnDocument: 'after' },
    );
  } catch (error) {
    if (isDuplicateKey(error)) {
      const existing = await MigrationRecord.findOne({ version: migration.version }).select({ status: 1 }).lean();
      return existing?.status === 'APPLIED' ? 'SKIPPED' : 'BLOCKED';
    }
    throw error;
  }
  if (!lock || lock.ownerId !== ownerId) return 'BLOCKED';

  try {
    const metadata = await migration.up();
    const applied = await MigrationRecord.findOneAndUpdate(
      { version: migration.version, status: 'RUNNING', ownerId },
      {
        $set: { status: 'APPLIED', appliedAt: new Date(), metadata },
        $unset: { ownerId: 1, lockedAt: 1, expiresAt: 1, rolledBackAt: 1, error: 1 },
      },
      { returnDocument: 'after' },
    );
    return applied ? 'APPLIED' : 'BLOCKED';
  } catch (error) {
    await MigrationRecord.updateOne(
      { version: migration.version, status: 'RUNNING', ownerId },
      {
        $set: { status: 'FAILED', error: sanitizedError(error) },
        $unset: { ownerId: 1, lockedAt: 1, expiresAt: 1 },
      },
    );
    throw error;
  }
}

async function runMigrations() {
  await MigrationRecord.createIndexes();
  const applied: string[] = [];
  for (const migration of migrations) {
    const result = await applyMigration(migration);
    if (result === 'BLOCKED') break;
    if (result === 'APPLIED') applied.push(migration.version);
  }
  return { applied };
}

async function migrateDown() {
  const record = await MigrationRecord.findOne({ status: 'APPLIED' }).sort({ version: -1 });
  if (!record) return { rolledBack: null };
  const migration = migrations.find((candidate) => candidate.version === record.version);
  if (!migration) throw new Error(`Unknown migration version: ${record.version}`);
  await migration.down(record.metadata);
  record.status = 'ROLLED_BACK'; record.rolledBackAt = new Date(); await record.save();
  return { rolledBack: record.version };
}

async function migrationStatus() {
  return MigrationRecord.find().sort({ version: 1 }).select({ _id: 0, version: 1, name: 1, status: 1, appliedAt: 1, rolledBackAt: 1, error: 1 }).lean();
}

async function seedReferenceData() {
  for (const key of featureKeys) await FeatureFlag.updateOne({ key }, { $setOnInsert: { key, enabled: false, roles: [], pilotUserIds: [] } }, { upsert: true });
  await NutritionFormula.updateOne({ name: 'MIFFLIN_ST_JEOR', version: 1 }, { $setOnInsert: { name: 'MIFFLIN_ST_JEOR', version: 1, active: true, fatLossFactor: 0.85, muscleGainFactor: 1.1, proteinPerKg: 2, fatPerKg: 0.8 } }, { upsert: true });
  const activities = [
    { name: 'Gym / Kháng lực cường độ cao (1h)', category: 'STRENGTH', met: 6.5 },
    { name: 'Tập tạ / Thể hình cơ bản (1h)', category: 'STRENGTH', met: 5.5 },
    { name: 'Chạy bộ 5km (Pace ~6:00)', category: 'CARDIO', met: 9.8 },
    { name: 'Chạy bộ nhanh / Chạy dốc (Pace ~5:00)', category: 'CARDIO', met: 11.5 },
    { name: 'Bơi lội 1km (Bơi sải / Bơi ếch)', category: 'CARDIO', met: 7.5 },
    { name: 'Cycling / Đạp xe ngoài trời 20km', category: 'CARDIO', met: 7.5 },
    { name: 'Đạp xe trong nhà / Spinning class (45p)', category: 'CARDIO', met: 8.5 },
    { name: 'Cardio Zone 2 (LISS 30-45 phút)', category: 'CARDIO', met: 5.5 },
    { name: 'Tabata / HIIT (Đốt mỡ ngắt quãng)', category: 'CARDIO', met: 9.5 },
    { name: 'Boxing / Kickfit (Đấm bao cát & Di chuyển)', category: 'MARTIAL_ARTS', met: 8.5 },
    { name: 'Nhảy dây (Jumping Rope)', category: 'CARDIO', met: 10.0 },
    { name: 'Cầu lông / Tennis đối kháng', category: 'SPORTS', met: 6.5 },
    { name: 'Yoga & Giãn cơ (Stretching / Mobility)', category: 'RECOVERY', met: 3.0 },
    { name: 'Đi bộ nhanh / Đi bộ dốc máy (Incline Walk)', category: 'CARDIO', met: 4.5 },
  ];
  for (const activity of activities) await ActivityCalorie.updateOne({ name: activity.name }, { $set: { ...activity, active: true } }, { upsert: true });
  await seedCreditReferenceData();
}

export { runMigrations, migrateDown, migrationStatus, seedReferenceData };
