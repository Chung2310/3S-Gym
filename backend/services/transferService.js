const TransferRequest = require('../models/TransferRequest');
const CustomerProfile = require('../models/CustomerProfile');
const User = require('../models/User');
const { AppError } = require('../errors/AppError');
const { ERROR_CODES } = require('../errors/errorCodes');

function businessError(message, status = 400) {
  const code = status === 404 ? ERROR_CODES.NOT_FOUND : status === 409 ? ERROR_CODES.DUPLICATE : ERROR_CODES.VALIDATION;
  return new AppError({ message, status, code });
}

async function assertActivePt(ptId) {
  const pt = await User.findOne({ _id: ptId, role: 'PT', status: 'ACTIVE' });
  if (!pt) throw businessError('PT nhận không tồn tại hoặc đã bị khóa.', 404);
  return pt;
}

async function createTransfer(user, payload) {
  const customer = await CustomerProfile.findOne({ _id: payload.customerId, assignedPtId: user.id });
  if (!customer) throw businessError('Không tìm thấy khách hàng.', 404);
  if (String(payload.toPtId) === user.id) throw businessError('PT nhận phải khác PT đang phụ trách.');
  const [toPt, fromPt] = await Promise.all([assertActivePt(payload.toPtId), User.findById(user.id)]);
  try {
    return await TransferRequest.create({
      customerId: customer.id,
      fromPtId: user.id,
      fromPtName: fromPt.fullName || fromPt.username,
      toPtId: payload.toPtId,
      toPtName: toPt.fullName || toPt.username,
      reason: payload.reason,
    });
  } catch (error) {
    if (error.code === 11000) throw businessError('Khách hàng đang có yêu cầu chuyển PT chờ xử lý.', 409);
    throw error;
  }
}

async function updateTransfer(user, id, payload) {
  const transfer = await TransferRequest.findOne({ _id: id, fromPtId: user.id, status: 'PENDING' });
  if (!transfer) throw businessError('Không tìm thấy yêu cầu chuyển PT đang chờ xử lý.', 404);
  if (String(payload.toPtId) === user.id) throw businessError('PT nhận phải khác PT đang phụ trách.');
  const toPt = await assertActivePt(payload.toPtId);
  transfer.toPtId = payload.toPtId;
  transfer.toPtName = toPt.fullName || toPt.username;
  transfer.reason = payload.reason.trim();
  return transfer.save();
}

async function deleteTransfer(user, id) {
  const transfer = await TransferRequest.findOneAndDelete({ _id: id, fromPtId: user.id, status: 'PENDING' });
  if (!transfer) throw businessError('Không tìm thấy yêu cầu chuyển PT đang chờ xử lý.', 404);
}

async function resolveTransfer(user, id, action) {
  const transfer = await TransferRequest.findOne({ _id: id, toPtId: user.id, status: 'PENDING' });
  if (!transfer) throw businessError('Không tìm thấy yêu cầu chuyển PT đang chờ xử lý.', 404);
  transfer.status = action === 'accept' ? 'ACCEPTED' : 'REJECTED';
  transfer.resolvedById = user.id;
  const resolver = await User.findById(user.id);
  transfer.resolvedByName = resolver?.fullName || resolver?.username || '';
  transfer.resolvedAt = new Date();
  await transfer.save();
  if (action === 'accept') {
    await CustomerProfile.updateOne({ _id: transfer.customerId, assignedPtId: transfer.fromPtId }, { assignedPtId: transfer.toPtId });
  }
  return transfer;
}

async function forceTransfer(user, requestId, payload) {
  const customer = await CustomerProfile.findById(payload.customerId);
  if (!customer) throw businessError('Không tìm thấy khách hàng.', 404);
  const toPt = await assertActivePt(payload.toPtId);
  const existing = await TransferRequest.findOne({ _id: requestId, status: 'PENDING' });
  const transfer = existing || new TransferRequest({ _id: requestId, customerId: customer.id, fromPtId: customer.assignedPtId, toPtId: payload.toPtId, reason: payload.reason });
  transfer.toPtId = payload.toPtId;
  transfer.toPtName = toPt.fullName || toPt.username;
  transfer.reason = payload.reason;
  transfer.status = 'ADMIN_FORCED';
  transfer.resolvedById = user.id;
  transfer.resolvedByName = user.fullName || user.username || '';
  transfer.resolvedAt = new Date();
  await transfer.save();
  await CustomerProfile.updateOne({ _id: customer.id }, { assignedPtId: payload.toPtId });
  return transfer;
}

async function listTransfers(user, query) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const filter = {};
  if (user.role === 'PT') filter.$or = [{ fromPtId: user.id }, { toPtId: user.id }];
  if (query.status) filter.status = query.status;
  if (query.customerId) filter.customerId = query.customerId;
  const [items, total] = await Promise.all([
    TransferRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    TransferRequest.countDocuments(filter),
  ]);
  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

module.exports = { createTransfer, updateTransfer, deleteTransfer, resolveTransfer, forceTransfer, listTransfers };
