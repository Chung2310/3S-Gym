import mongoose, { Schema } from 'mongoose';
export interface IActivityCalorie { name: string; category: string; met: number; active: boolean }
const schema = new Schema<IActivityCalorie>({ name: { type: String, required: true, trim: true, unique: true }, category: { type: String, required: true, index: true }, met: { type: Number, required: true, min: 0.1, max: 30 }, active: { type: Boolean, default: true, index: true } }, { timestamps: true });
export default mongoose.model<IActivityCalorie>('ActivityCalorie', schema);
