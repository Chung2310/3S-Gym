import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerProfile', required: true, index: true },
  ptId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  measurementDate: { type: Date, required: true },
  weight: { type: Number, required: true, min: 0 },
  bmi: { type: Number, min: 0, default: null },
  bodyFatPercentage: { type: Number, min: 0, max: 100, default: null },
  bodyFatMass: { type: Number, min: 0, default: null },
  muscleMass: { type: Number, min: 0, default: null },
  bmr: { type: Number, min: 0, default: null },
  visceralFatLevel: { type: Number, min: 0, default: null },
  inbodyScore: { type: Number, min: 0, default: null },
  strengths: { type: String, default: '' },
  priorities: { type: String, default: '' },
  recommendation: { type: String, default: '' },
  source: { type: String, enum: ['MANUAL', 'AI_SCAN'], default: 'MANUAL' },
  ocrStatus: { type: String, enum: ['NOT_APPLICABLE', 'REVIEW_REQUIRED', 'CONFIRMED'], default: 'NOT_APPLICABLE' },
  confidence: { type: Number, min: 0, max: 1, default: null },
  ocrWarnings: { type: [String], default: [] },
  sourceImage: {
    fileName: { type: String, default: '' }, mimeType: { type: String, default: '' }, data: { type: Buffer, default: null },
  },
  status: { type: String, enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT', index: true },
  publishedAt: { type: Date, default: null },
  version: { type: Number, default: 1 },
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      delete ret.sourceImage;
      return ret;
    },
  },
});

export default mongoose.model('InBodyRecord', schema);
