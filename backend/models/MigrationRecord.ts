import mongoose, { Schema } from 'mongoose';

export interface IMigrationRecord {
  version: string;
  name: string;
  status: 'APPLIED' | 'ROLLED_BACK';
  appliedAt: Date;
  rolledBackAt?: Date;
  metadata: Record<string, unknown>;
}

const schema = new Schema<IMigrationRecord>({
  version: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['APPLIED', 'ROLLED_BACK'], required: true, index: true },
  appliedAt: { type: Date, required: true },
  rolledBackAt: Date,
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model<IMigrationRecord>('MigrationRecord', schema);
