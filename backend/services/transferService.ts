import { Types, type ClientSession, type QueryFilter } from 'mongoose';
import TransferRequest, { type ITransferRequest, type TransferStatus } from '../models/TransferRequest.js';
import CustomerProfile from '../models/CustomerProfile.js';
import User from '../models/User.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { AuthenticatedUser } from '../types/express.js';
import { recordAudit } from './auditService.js';
import CareAlert from '../models/CareAlert.js';
import CareTask from '../models/CareTask.js';
import { withTransaction } from './transactionService.js';

async function reassignOpenCare(customerId: Types.ObjectId, toPtId: Types.ObjectId, session: ClientSession) {
  await Promise.all([
    CareAlert.updateMany({ customerId, status: 'OPEN' }, { $set: { ptId: toPtId } }, { session }),
    CareTask.updateMany({ customerId, status: 'OPEN' }, { $set: { assignedPtId: toPtId } }, { session }),
  ]);
}

interface TransferPayload { customerId: string; toPtId: string; reason: string }
interface TransferQuery { page?: unknown; limit?: unknown; status?: unknown; customerId?: unknown }

function businessError(message: string, status = 400) {
  const code = status === 404 ? ERROR_CODES.NOT_FOUND : status === 409 ? ERROR_CODES.DUPLICATE : ERROR_CODES.VALIDATION;
  return new AppError({ message, status, code });
}

async function assertActivePt(ptId: string) {
  const pt = await User.findOne({ _id: ptId, role: 'PT', status: 'ACTIVE' });
  if (!pt) throw businessError('PT nhận không tồn tại hoặc đã bị khóa.', 404);
  return pt;
}

async function createTransfer(user: AuthenticatedUser, payload: TransferPayload) {
  const customer = await CustomerProfile.findOne({ _id: payload.customerId, assignedPtId: user.id });
  if (!customer) throw businessError('Không tìm thấy khách hàng.', 404);
  if (payload.toPtId === user.id) throw businessError('PT nhận phải khác PT đang phụ trách.');
  const [toPt, fromPt] = await Promise.all([assertActivePt(payload.toPtId), User.findById(user.id)]);
  if (!fromPt) throw businessError('Không tìm thấy PT đang phụ trách.', 404);
  try {
    return await TransferRequest.create({
      customerId: customer._id, fromPtId: new Types.ObjectId(user.id), fromPtName: fromPt.fullName || fromPt.username,
      toPtId: new Types.ObjectId(payload.toPtId), toPtName: toPt.fullName || toPt.username, reason: payload.reason,
    });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) throw businessError('Khách hàng đang có yêu cầu chuyển PT chờ xử lý.', 409);
    throw error;
  }
}

async function updateTransfer(user: AuthenticatedUser, id: string, payload: TransferPayload) {
  const transfer = await TransferRequest.findOne({ _id: id, fromPtId: user.id, status: 'PENDING' });
  if (!transfer) throw businessError('Không tìm thấy yêu cầu chuyển PT đang chờ xử lý.', 404);
  if (payload.toPtId === user.id) throw businessError('PT nhận phải khác PT đang phụ trách.');
  const toPt = await assertActivePt(payload.toPtId);
  transfer.toPtId = new Types.ObjectId(payload.toPtId);
  transfer.toPtName = toPt.fullName || toPt.username;
  transfer.reason = payload.reason.trim();
  return transfer.save();
}

async function deleteTransfer(user: AuthenticatedUser, id: string) {
  const transfer = await TransferRequest.findOneAndDelete({ _id: id, fromPtId: user.id, status: 'PENDING' });
  if (!transfer) throw businessError('Không tìm thấy yêu cầu chuyển PT đang chờ xử lý.', 404);
}

async function resolveTransfer(user: AuthenticatedUser, id: string, action: 'accept' | 'reject') {
  return withTransaction(async (session) => {
    const transfer = await TransferRequest.findOne({ _id: id, toPtId: user.id, status: 'PENDING' }).session(session);
    if (!transfer) throw businessError('Không tìm thấy yêu cầu chuyển PT đang chờ xử lý.', 404);
    transfer.status = action === 'accept' ? 'ACCEPTED' : 'REJECTED'; transfer.resolvedById = new Types.ObjectId(user.id);
    const resolver = await User.findById(user.id).session(session); transfer.resolvedByName = resolver?.fullName || resolver?.username || ''; transfer.resolvedAt = new Date();
    await transfer.save({ session });
    if (action === 'accept') {
      await CustomerProfile.updateOne({ _id: transfer.customerId, assignedPtId: transfer.fromPtId }, { assignedPtId: transfer.toPtId }, { session });
      await reassignOpenCare(transfer.customerId, transfer.toPtId, session);
    }
    await recordAudit({ actor: user, action: action === 'accept' ? 'TRANSFER_ACCEPTED' : 'TRANSFER_REJECTED', resourceType: 'transfers', resourceId: transfer.id, customerId: transfer.customerId, metadata: { fromPtId: String(transfer.fromPtId), toPtId: String(transfer.toPtId) } }, session);
    return transfer;
  });
}

async function forceTransfer(user: AuthenticatedUser, requestId: string, payload: TransferPayload) {
  const toPt = await assertActivePt(payload.toPtId);
  return withTransaction(async (session) => {
    const customer = await CustomerProfile.findById(payload.customerId).session(session);
    if (!customer) throw businessError('Không tìm thấy khách hàng.', 404);

    let fromPtName = 'Chưa có PT';
    if (customer.assignedPtId) {
      const fromPt = await User.findById(customer.assignedPtId).session(session);
      if (fromPt) fromPtName = fromPt.fullName || fromPt.username || 'PT cũ';
    }

    const existing = await TransferRequest.findOne({ _id: requestId, status: 'PENDING' }).session(session);
    const transfer = existing || new TransferRequest({
      _id: requestId,
      customerId: customer._id,
      fromPtId: customer.assignedPtId,
      fromPtName,
      toPtId: payload.toPtId,
      toPtName: toPt.fullName || toPt.username,
      reason: payload.reason,
    });

    transfer.toPtId = new Types.ObjectId(payload.toPtId);
    transfer.toPtName = toPt.fullName || toPt.username;
    transfer.fromPtName = fromPtName;
    transfer.reason = payload.reason;
    transfer.status = 'ADMIN_FORCED';
    transfer.resolvedById = new Types.ObjectId(user.id);
    transfer.resolvedByName = user.fullName || user.username || '';
    transfer.resolvedAt = new Date();

    await transfer.save({ session });
    await CustomerProfile.updateOne({ _id: customer._id }, { assignedPtId: transfer.toPtId }, { session });
    await reassignOpenCare(customer._id, transfer.toPtId, session);
    await recordAudit(
      {
        actor: user,
        action: 'TRANSFER_ADMIN_FORCED',
        resourceType: 'transfers',
        resourceId: transfer.id,
        customerId: customer._id,
        metadata: { fromPtId: String(transfer.fromPtId), toPtId: String(transfer.toPtId), reason: transfer.reason },
      },
      session
    );
    return transfer;
  });
}

async function listTransfers(user: AuthenticatedUser, query: TransferQuery) {
  const page = Number(query.page || 1); const limit = Number(query.limit || 20);
  const filter: QueryFilter<ITransferRequest> = {};
  if (user.role === 'PT') filter.$or = [{ fromPtId: new Types.ObjectId(user.id) }, { toPtId: new Types.ObjectId(user.id) }];
  const statuses: TransferStatus[] = ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'ADMIN_FORCED'];
  if (typeof query.status === 'string' && statuses.includes(query.status as TransferStatus)) filter.status = query.status as TransferStatus;
  if (typeof query.customerId === 'string') filter.customerId = new Types.ObjectId(query.customerId);
  const [items, total] = await Promise.all([
    TransferRequest.find(filter).populate('customerId', 'fullName phone').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    TransferRequest.countDocuments(filter),
  ]);
  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export { createTransfer, updateTransfer, deleteTransfer, resolveTransfer, forceTransfer, listTransfers };
