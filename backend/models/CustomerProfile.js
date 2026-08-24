const mongoose = require('mongoose');

const customerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
  assignedPtId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fullName: { type: String, required: true, trim: true, index: true },
  phone: { type: String, required: true, trim: true, index: true },
  email: { type: String, trim: true, lowercase: true, default: null },
  dateOfBirth: { type: Date, default: null },
  gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], default: 'OTHER' },
  height: { type: Number, min: 0, default: null },
  initialWeight: { type: Number, min: 0, default: null },
  medicalNotes: { type: String, trim: true, default: '' },
  initialGoal: { type: String, trim: true, default: '' },
  internalNotes: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'LEAD'], default: 'ACTIVE', index: true },
}, { timestamps: true });

customerProfileSchema.index({ assignedPtId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('CustomerProfile', customerProfileSchema);
