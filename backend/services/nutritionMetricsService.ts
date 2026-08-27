import ActivityCalorie from '../models/ActivityCalorie.js';
import NutritionFormula from '../models/NutritionFormula.js';
import { withTransaction } from './transactionService.js';
interface MetricsInput { sex: 'MALE' | 'FEMALE'; weightKg: number; heightCm: number; age: number; activityFactor: number; goal: 'FAT_LOSS' | 'MAINTAIN' | 'MUSCLE_GAIN' }
export async function calculateMetrics(input: MetricsInput) {
  const configured = await NutritionFormula.findOne({ name: 'MIFFLIN_ST_JEOR', active: true }).sort({ version: -1 }).lean();
  const formula = configured || { name: 'MIFFLIN_ST_JEOR', version: 1, fatLossFactor: 0.85, muscleGainFactor: 1.1, proteinPerKg: 2, fatPerKg: 0.8 };
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age; const bmr = base + (input.sex === 'MALE' ? 5 : -161); const tdee = bmr * input.activityFactor;
  const factor = input.goal === 'FAT_LOSS' ? formula.fatLossFactor : input.goal === 'MUSCLE_GAIN' ? formula.muscleGainFactor : 1; const targetCalories = tdee * factor;
  const protein = input.weightKg * formula.proteinPerKg; const fat = input.weightKg * formula.fatPerKg; const carbs = Math.max(0, (targetCalories - protein * 4 - fat * 9) / 4);
  return { formula: formula.name, formulaVersion: formula.version, bmr: Math.round(bmr), tdee: Math.round(tdee), targetCalories: Math.round(targetCalories), macros: { protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) } };
}
export async function createActivity(payload: { name: string; category: string; met: number }) { return ActivityCalorie.create(payload); }
export async function listActivities(query: Record<string, unknown>, includeInactive: boolean) { const page = Number(query.page || 1); const limit = Number(query.limit || 20); const filter: Record<string, unknown> = includeInactive ? {} : { active: true }; if (typeof query.category === 'string') filter.category = query.category; const [items, total] = await Promise.all([ActivityCalorie.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(), ActivityCalorie.countDocuments(filter)]); return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }; }
export async function updateActivity(id: string, payload: { name?: string; category?: string; met?: number; active?: boolean }) { return ActivityCalorie.findByIdAndUpdate(id, { $set: payload }, { returnDocument: 'after', runValidators: true }); }
export async function estimateActivity(id: string, weightKg: number, durationMinutes: number) { const activity = await ActivityCalorie.findById(id); if (!activity) return null; return { activityId: activity._id, name: activity.name, calories: Math.round(activity.met * 3.5 * weightKg / 200 * durationMinutes), met: activity.met, weightKg, durationMinutes }; }
export async function createFormula(payload: { name: string; fatLossFactor: number; muscleGainFactor: number; proteinPerKg: number; fatPerKg: number }) {
  return withTransaction(async (session) => {
    const latest = await NutritionFormula.findOne({ name: payload.name }).sort({ version: -1 }).session(session).lean();
    const version = (latest?.version || 0) + 1;
    await NutritionFormula.updateMany({ name: payload.name, active: true }, { $set: { active: false } }, { session });
    const [formula] = await NutritionFormula.create([{ ...payload, version, active: true }], { session });
    return formula;
  });
}
