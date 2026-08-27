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
import type { Model } from 'mongoose';

interface VersionedContent { version?: number; status?: string }

const featureKeys = ['OCR_INBODY', 'ROADMAP', 'EXERCISE_LIBRARY', 'PROGRESS', 'CARE', 'DASHBOARD', 'NUTRITION_AI', 'KNOWLEDGE_BASE', 'PT_ASSISTANT'] as const;

async function runMigrations() {
  const contentModels: Model<VersionedContent>[] = [KnowledgeDocument, Roadmap, InBodyRecord, Goal, WorkoutPlan, NutritionPlan].map((model) => model as unknown as Model<VersionedContent>);
  for (const Model of contentModels) {
    await Model.updateMany({ version: { $exists: false } }, { $set: { version: 1 } });
    await Model.updateMany({ status: { $exists: false } }, { $set: { status: 'DRAFT' } });
  }
  await WorkoutTemplate.updateMany({ version: { $exists: false } }, { $set: { version: 1 } });
  await WorkoutTemplate.updateMany({ status: { $exists: false } }, { $set: { status: 'ACTIVE' } });
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

export { runMigrations, seedReferenceData };
