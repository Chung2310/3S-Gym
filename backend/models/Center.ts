import mongoose from 'mongoose';

export type CenterStatus = 'ACTIVE' | 'SUSPENDED';

export interface ICenter {
  name: string;
  slug: string;
  status: CenterStatus;
  ownerAdminId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const centerSchema = new mongoose.Schema<ICenter>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  status: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE', required: true, index: true },
  ownerAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

export default mongoose.model<ICenter>('Center', centerSchema);
