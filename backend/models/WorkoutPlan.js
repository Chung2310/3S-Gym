const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true }, sets: { type: Number, min: 1, default: 3 }, reps: { type: String, default: '8-12' },
  weight: { type: String, default: '' }, rest: { type: String, default: '' }, tempo: { type: String, default: '' }, notes: { type: String, default: '' },
}, { _id: false });
const sessionSchema = new mongoose.Schema({ name: { type: String, required: true }, exercises: { type: [exerciseSchema], default: [] } }, { _id: false });
const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerProfile', required: true, index: true },
  ptId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  sessions: { type: [sessionSchema], default: [] },
  status: { type: String, enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT', index: true },
  publishedAt: { type: Date, default: null },
  version: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('WorkoutPlan', schema);
