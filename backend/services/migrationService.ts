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
import mongoose, { type Model } from 'mongoose';

interface VersionedContent { version?: number; status?: string }

const featureKeys = ['OCR_INBODY', 'ROADMAP', 'EXERCISE_LIBRARY', 'PROGRESS', 'CARE', 'DASHBOARD', 'NUTRITION_AI', 'KNOWLEDGE_BASE', 'PT_ASSISTANT'] as const;

interface MigrationChange { model: string; versionIds: string[]; statusIds: string[] }
const MIGRATION_VERSION = '001-content-defaults';

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

async function runMigrations() {
  const existing = await MigrationRecord.findOne({ version: MIGRATION_VERSION, status: 'APPLIED' }).lean();
  if (existing) return { applied: [] as string[] };
  const metadata = await applyContentDefaults();
  await MigrationRecord.findOneAndUpdate({ version: MIGRATION_VERSION }, { $set: { name: 'Add version and status defaults to legacy content', status: 'APPLIED', appliedAt: new Date(), metadata }, $unset: { rolledBackAt: 1 } }, { upsert: true, returnDocument: 'after' });
  return { applied: [MIGRATION_VERSION] };
}

async function migrateDown() {
  const record = await MigrationRecord.findOne({ status: 'APPLIED' }).sort({ appliedAt: -1 });
  if (!record) return { rolledBack: null };
  const changes = (record.metadata.changes || []) as MigrationChange[];
  for (const change of changes) {
    const Model = mongoose.model(change.model);
    if (change.versionIds.length) await Model.updateMany({ _id: { $in: change.versionIds } }, { $unset: { version: 1 } });
    if (change.statusIds.length) await Model.updateMany({ _id: { $in: change.statusIds } }, { $unset: { status: 1 } });
  }
  record.status = 'ROLLED_BACK'; record.rolledBackAt = new Date(); await record.save();
  return { rolledBack: record.version };
}

async function migrationStatus() {
  return MigrationRecord.find().sort({ version: 1 }).select({ _id: 0, version: 1, name: 1, status: 1, appliedAt: 1, rolledBackAt: 1 }).lean();
}

async function seedReferenceData() {
  for (const key of featureKeys) await FeatureFlag.updateOne({ key }, { $setOnInsert: { key, enabled: false, roles: [], pilotUserIds: [] } }, { upsert: true });
  await NutritionFormula.updateOne({ name: 'MIFFLIN_ST_JEOR', version: 1 }, { $setOnInsert: { name: 'MIFFLIN_ST_JEOR', version: 1, active: true, fatLossFactor: 0.85, muscleGainFactor: 1.1, proteinPerKg: 2, fatPerKg: 0.8 } }, { upsert: true });
  const activities = [
    { name: 'Đi bộ', category: 'CARDIO', met: 3.5 },
    { name: 'Chạy bộ', category: 'CARDIO', met: 8.3 },
    { name: 'Tập tạ', category: 'STRENGTH', met: 6 },
  ];
  for (const activity of activities) await ActivityCalorie.updateOne({ name: activity.name }, { $setOnInsert: { ...activity, active: true } }, { upsert: true });
}

export { runMigrations, migrateDown, migrationStatus, seedReferenceData };
