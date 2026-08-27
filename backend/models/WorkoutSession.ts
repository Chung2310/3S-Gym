import mongoose, { Schema } from 'mongoose';
export interface IWorkoutSession {
  customerId: mongoose.Types.ObjectId; ptId: mongoose.Types.ObjectId; templateId?: mongoose.Types.ObjectId;
  performedAt: Date; attendance: 'PRESENT' | 'ABSENT' | 'LATE'; absenceReason: string;
  planSnapshot: Record<string, unknown>; exerciseLogs: Array<Record<string, unknown>>; feeling: string; notes: string; idempotencyKey: string;
}
const setLogSchema = new Schema({ reps: { type: Number, min: 0 }, weight: { type: Number, min: 0 }, rpe: { type: Number, min: 0, max: 10 }, rir: { type: Number, min: 0 }, completed: { type: Boolean, default: true } }, { _id: false });
const exerciseLogSchema = new Schema({ exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise' }, name: { type: String, required: true }, sets: { type: [setLogSchema], default: [] }, notes: { type: String, default: '' } }, { _id: false });
const schema = new Schema<IWorkoutSession>({
  customerId: { type: Schema.Types.ObjectId, ref: 'CustomerProfile', required: true, index: true }, ptId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  templateId: { type: Schema.Types.ObjectId, ref: 'WorkoutTemplate' }, performedAt: { type: Date, required: true, index: true },
  attendance: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE'], required: true }, absenceReason: { type: String, default: '' },
  planSnapshot: { type: Schema.Types.Mixed, required: true }, exerciseLogs: { type: [exerciseLogSchema], default: [] },
  feeling: { type: String, default: '' }, notes: { type: String, default: '' }, idempotencyKey: { type: String, required: true },
}, { timestamps: true });
schema.index({ ptId: 1, idempotencyKey: 1 }, { unique: true });
export default mongoose.model<IWorkoutSession>('WorkoutSession', schema);
