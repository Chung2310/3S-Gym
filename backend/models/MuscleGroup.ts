import mongoose, { Schema } from 'mongoose';

export interface IMuscleGroup {
  name: string;
  isDefault?: boolean;
  order?: number;
}

const schema = new Schema<IMuscleGroup>({
  name: { type: String, required: true, trim: true, unique: true },
  isDefault: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IMuscleGroup>('MuscleGroup', schema);
