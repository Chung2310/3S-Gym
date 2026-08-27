import mongoose, { Schema } from 'mongoose';
export interface IExercise {
  name: string; muscleGroup: string; level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  equipment: string[]; videoUrl: string; technique: string; commonMistakes: string[];
  contraindications: string[]; variants: string[]; scope: 'GLOBAL' | 'PRIVATE'; ownerPtId?: mongoose.Types.ObjectId;
}
const schema = new Schema<IExercise>({
  name: { type: String, required: true, trim: true, index: true }, muscleGroup: { type: String, required: true, index: true },
  level: { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], required: true, index: true },
  equipment: { type: [String], default: [] }, videoUrl: { type: String, default: '' }, technique: { type: String, default: '' },
  commonMistakes: { type: [String], default: [] }, contraindications: { type: [String], default: [] }, variants: { type: [String], default: [] },
  scope: { type: String, enum: ['GLOBAL', 'PRIVATE'], default: 'PRIVATE', index: true }, ownerPtId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
}, { timestamps: true });
schema.index({ scope: 1, ownerPtId: 1, muscleGroup: 1, level: 1 });
export default mongoose.model<IExercise>('Exercise', schema);
