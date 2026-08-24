const CustomerProfile = require('../models/CustomerProfile');
const InBodyRecord = require('../models/InBodyRecord');
const Goal = require('../models/Goal');
const WorkoutPlan = require('../models/WorkoutPlan');
const NutritionPlan = require('../models/NutritionPlan');
const { AppError } = require('../errors/AppError');
const { ERROR_CODES } = require('../errors/errorCodes');

const models = { inbody: InBodyRecord, goals: Goal, workoutPlans: WorkoutPlan, nutritionPlans: NutritionPlan };

function appError(message, status = 400) { const code = status === 404 ? ERROR_CODES.NOT_FOUND : status === 403 ? ERROR_CODES.AUTHORIZATION : ERROR_CODES.VALIDATION; return new AppError({ message, status, code }); }

async function assertCustomerAccess(user, customerId) {
  const filter = { _id: customerId };
  if (user.role === 'PT') filter.assignedPtId = user.id;
  const customer = await CustomerProfile.findOne(filter);
  if (!customer) throw appError('Không tìm thấy khách hàng.', 404);
  return customer;
}

async function createContent(resource, user, payload) {
  const Model = models[resource];
  await assertCustomerAccess(user, payload.customerId);
  return Model.create({ ...payload, ptId: user.id, status: 'DRAFT', publishedAt: null });
}

async function updateContent(resource, user, id, payload) {
  const Model = models[resource];
  const item = await Model.findById(id);
  if (!item) throw appError('Không tìm thấy nội dung.', 404);
  await assertCustomerAccess(user, item.customerId);
  const protectedFields = new Set(['_id', 'ptId', 'status', 'publishedAt', 'version', 'createdAt', 'updatedAt']);
  for (const [field, value] of Object.entries(payload)) {
    if (!protectedFields.has(field)) item[field] = value;
  }
  if (item.status === 'PUBLISHED') {
    item.status = 'DRAFT';
    item.publishedAt = null;
    item.version += 1;
  }
  return item.save();
}

async function deleteContent(resource, user, id) {
  const Model = models[resource];
  const item = await Model.findById(id);
  if (!item) throw appError('Không tìm thấy nội dung.', 404);
  await assertCustomerAccess(user, item.customerId);
  await item.deleteOne();
}

async function listContent(resource, user, query) {
  const Model = models[resource];
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const filter = {};
  if (query.customerId) filter.customerId = query.customerId;
  if (query.status) filter.status = query.status;
  if (user.role === 'PT') {
    const ids = await CustomerProfile.find({ assignedPtId: user.id }).distinct('_id');
    filter.customerId = query.customerId && ids.some((id) => String(id) === query.customerId) ? query.customerId : { $in: ids };
  }
  const [items, total] = await Promise.all([
    Model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Model.countDocuments(filter),
  ]);
  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function setPublication(resource, user, id, publish) {
  const Model = models[resource];
  const item = await Model.findById(id);
  if (!item) throw appError('Không tìm thấy nội dung.', 404);
  await assertCustomerAccess(user, item.customerId);
  item.status = publish ? 'PUBLISHED' : 'DRAFT';
  item.publishedAt = publish ? new Date() : null;
  return item.save();
}

async function getMyContent(user) {
  const customer = await CustomerProfile.findOne({ userId: user.id });
  if (!customer) throw appError('Không tìm thấy hồ sơ khách hàng.', 404);
  const filter = { customerId: customer.id, status: 'PUBLISHED' };
  const [inbody, goals, workoutPlans, nutritionPlans] = await Promise.all([
    InBodyRecord.find(filter).sort({ measurementDate: -1 }).lean(), Goal.find(filter).sort({ createdAt: -1 }).lean(),
    WorkoutPlan.find(filter).sort({ createdAt: -1 }).lean(), NutritionPlan.find(filter).sort({ createdAt: -1 }).lean(),
  ]);
  return { profile: customer, inbody, goals, workoutPlans, nutritionPlans };
}

module.exports = { createContent, updateContent, deleteContent, listContent, setPublication, getMyContent };
