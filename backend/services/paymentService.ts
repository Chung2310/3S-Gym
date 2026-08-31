import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import CreditPackage from '../models/CreditPackage.js';
import CreditPricing from '../models/CreditPricing.js';
import PaymentOrder, { type IPaymentOrder, type PaymentGateway } from '../models/PaymentOrder.js';
import { createMomoPayment, isMomoConfigured, verifyMomoCallback } from './momoGateway.js';
import type { GatewayCallbackResult } from './paymentGatewayTypes.js';
import { createVnpayPayment, isVnpayConfigured, verifyVnpayCallback } from './vnpayGateway.js';
import { ensureWallet, grantTopupCredits } from './creditWalletService.js';
import { recordUserAudit } from './auditService.js';
import { withTransaction } from './transactionService.js';

type OrderDocument = mongoose.HydratedDocument<IPaymentOrder>;

function unavailable(message: string): never {
  throw new AppError({ status: 503, code: ERROR_CODES.UNAVAILABLE, message });
}

function orderView(order: OrderDocument, redirectUrl?: string) {
  return {
    id: order.id, orderCode: order.orderCode, gateway: order.gateway, status: order.status,
    source: order.source, amountVnd: order.amountVnd, baseCredits: order.baseCredits,
    bonusCredits: order.bonusCredits, grantCredits: order.grantCredits,
    expiresAt: order.expiresAt, ...(redirectUrl ? { redirectUrl } : {}),
  };
}

export function gatewayAvailability() {
  return { VNPAY: isVnpayConfigured(), MOMO: isMomoConfigured() };
}

export async function listActivePackages() {
  const packages = await CreditPackage.find({ active: true }).sort({ sortOrder: 1, amountVnd: 1 }).lean();
  return packages.map((item) => ({
    id: String(item._id), name: item.name, description: item.description, amountVnd: item.amountVnd,
    baseCredits: item.baseCredits, bonusCredits: item.bonusCredits, grantCredits: item.baseCredits + item.bonusCredits,
  }));
}

export async function createPaymentOrder(userId: string, input: { gateway: PaymentGateway; packageId?: string; customAmountVnd?: number }, ipAddress: string) {
  if (input.gateway === 'VNPAY' && !isVnpayConfigured()) unavailable('VNPay chưa được cấu hình.');
  if (input.gateway === 'MOMO' && !isMomoConfigured()) unavailable('MoMo chưa được cấu hình.');
  const wallet = await ensureWallet(userId);
  let source: 'PACKAGE' | 'CUSTOM'; let packageId: mongoose.Types.ObjectId | undefined;
  let amountVnd: number; let baseCredits: number; let bonusCredits: number;
  if (input.packageId) {
    const selected = await CreditPackage.findOne({ _id: input.packageId, active: true });
    if (!selected) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy gói credit đang hoạt động.' });
    source = 'PACKAGE'; packageId = selected._id; amountVnd = selected.amountVnd;
    baseCredits = selected.baseCredits; bonusCredits = selected.bonusCredits;
  } else {
    const pricing = await CreditPricing.findOne({ key: 'GLOBAL' }).lean();
    if (!pricing) unavailable('Chính sách quy đổi credit chưa được cấu hình.');
    source = 'CUSTOM'; amountVnd = input.customAmountVnd!;
    baseCredits = Math.floor(amountVnd / pricing.vndPerCredit); bonusCredits = 0;
  }
  const orderCode = `CR${Date.now().toString(36).toUpperCase()}${randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
  const requestId = `REQ-${orderCode}`;
  const order = await PaymentOrder.create({
    userId, walletId: wallet._id, gateway: input.gateway, orderCode, status: 'PENDING', source, packageId,
    amountVnd, baseCredits, bonusCredits, grantCredits: baseCredits + bonusCredits,
    gatewayRequestId: requestId, expiresAt: new Date(Date.now() + 15 * 60_000), grantIdempotencyKey: `payment-grant:${orderCode}`,
  });
  const description = `Nap credit ${orderCode}`;
  const result = input.gateway === 'VNPAY'
    ? createVnpayPayment({ orderCode, amountVnd, description, ipAddress })
    : await createMomoPayment({ orderCode, requestId, amountVnd, description });
  if (!result.configured) unavailable(`${input.gateway} chưa được cấu hình.`);
  return orderView(order, result.redirectUrl);
}

export async function getPaymentOrder(userId: string, id: string) {
  let order = await PaymentOrder.findOne({ _id: id, userId });
  if (!order) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy đơn nạp credit.' });
  if (order.status === 'PENDING' && order.expiresAt.getTime() <= Date.now()) {
    order = await PaymentOrder.findOneAndUpdate({ _id: order._id, status: 'PENDING' }, { $set: { status: 'EXPIRED' } }, { returnDocument: 'after' }) || order;
  }
  return orderView(order);
}

async function settleVerifiedCallback(gateway: PaymentGateway, verified: GatewayCallbackResult) {
  try {
    if (!verified.valid) throw new AppError({ status: 400, code: ERROR_CODES.VALIDATION, message: 'Chữ ký callback thanh toán không hợp lệ.' });
    if (!verified.orderCode) throw new AppError({ status: 400, code: ERROR_CODES.VALIDATION, message: 'Callback thiếu mã đơn thanh toán.' });
    return await withTransaction(async (session) => {
    const order = await PaymentOrder.findOne({ orderCode: verified.orderCode, gateway }).session(session);
    if (!order) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy đơn thanh toán.' });
    if (verified.amountVnd !== order.amountVnd) throw new AppError({ status: 409, code: ERROR_CODES.VALIDATION, message: 'Số tiền callback không khớp đơn thanh toán.' });
    if (!verified.success) {
      if (order.status === 'PENDING' || order.status === 'EXPIRED') {
        order.status = 'FAILED'; order.gatewayResultCode = verified.resultCode; await order.save({ session });
      }
      return orderView(order);
    }
    const transactionId = verified.transactionId?.trim();
    if (!transactionId) throw new AppError({ status: 400, code: ERROR_CODES.VALIDATION, message: 'Callback thiếu mã giao dịch cổng thanh toán.' });
    if (order.status === 'PAID') {
      if (order.gatewayTransactionId !== transactionId) throw new AppError({ status: 409, code: ERROR_CODES.DUPLICATE, message: 'Đơn đã được thanh toán bằng giao dịch khác.' });
      return orderView(order);
    }
    if (order.status === 'FAILED') throw new AppError({ status: 409, code: ERROR_CODES.VALIDATION, message: 'Đơn thanh toán đã thất bại.' });
    const conflict = await PaymentOrder.exists({ gateway, gatewayTransactionId: transactionId, _id: { $ne: order._id } }).session(session);
    if (conflict) throw new AppError({ status: 409, code: ERROR_CODES.DUPLICATE, message: 'Giao dịch cổng thanh toán đã được sử dụng.' });
    order.status = 'PAID'; order.gatewayTransactionId = transactionId;
    order.gatewayResultCode = verified.resultCode; order.paidAt = new Date(); await order.save({ session });
    await grantTopupCredits({ userId: String(order.userId), paymentOrderId: order.id, credits: order.grantCredits, idempotencyKey: order.grantIdempotencyKey }, session);
    await recordUserAudit(String(order.userId), {
      action: 'CREDIT_PAYMENT_GRANTED', resourceType: 'payment_order', resourceId: order.id,
      metadata: { credits: order.grantCredits, amountVnd: order.amountVnd, gateway },
    }, session);
    return orderView(order);
    });
  } catch (error) {
    if (verified.orderCode) {
      const order = await PaymentOrder.findOne({ orderCode: verified.orderCode, gateway }).select({ _id: 1, userId: 1 }).lean();
      if (order) {
        const reasonCode = error instanceof AppError ? error.code : ERROR_CODES.INTERNAL;
        await recordUserAudit(String(order.userId), {
          action: 'CREDIT_PAYMENT_CALLBACK_REJECTED', resourceType: 'payment_order', resourceId: String(order._id),
          metadata: { gateway, reasonCode, ...(verified.amountVnd === undefined ? {} : { amountVnd: verified.amountVnd }) },
        }).catch(() => undefined);
      }
    }
    throw error;
  }
}

export function settleVnpayCallback(input: Record<string, unknown>) { return settleVerifiedCallback('VNPAY', verifyVnpayCallback(input)); }
export function settleMomoCallback(input: Record<string, unknown>) { return settleVerifiedCallback('MOMO', verifyMomoCallback(input)); }
