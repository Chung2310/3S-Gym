import mongoose, { Schema } from 'mongoose';
export interface IWorkoutTemplate {
  ownerPtId: mongoose.Types.ObjectId; title: string; goal: string; level: string;
  sessions: Array<Record<string, unknown>>; version: number; status: 'ACTIVE' | 'ARCHIVED';
}
const templateExerciseSchema = new Schema({
  exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise' }, name: { type: String, required: true }, sets: { type: Number, min: 1, default: 3 },
  reps: { type: String, default: '' }, weight: { type: String, default: '' }, rpe: { type: Number, min: 0, max: 10 }, rir: { type: Number, min: 0 },
  tempo: { type: String, default: '' }, restSeconds: { type: Number, min: 0, default: 0 }, notes: { type: String, default: '' },
}, { _id: false });
const templateSessionSchema = new Schema({ name: { type: String, required: true }, exercises: { type: [templateExerciseSchema], default: [] } }, { _id: false });
const schema = new Schema<IWorkoutTemplate>({
  ownerPtId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, title: { type: String, required: true, trim: true },
  goal: { type: String, required: true, index: true }, level: { type: String, required: true, index: true },
  sessions: { type: [templateSessionSchema], default: [] }, version: { type: Number, default: 1 },
  status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE', index: true },
}, { timestamps: true });
export default mongoose.model<IWorkoutTemplate>('WorkoutTemplate', schema);
