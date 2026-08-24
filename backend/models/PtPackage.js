const mongoose = require('mongoose');

const ptPackageSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerProfile', required: true, index: true },
  name: { type: String, required: true, trim: true },
  totalSessions: { type: Number, required: true, min: 1 },
  usedSessions: { type: Number, min: 0, default: 0 },
  remainingSessions: { type: Number, min: 0, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'COMPLETED', 'CANCELLED'], default: 'ACTIVE', index: true },
}, { timestamps: true });

module.exports = mongoose.model('PtPackage', ptPackageSchema);
