import { Types, type ClientSession, type QueryFilter } from 'mongoose';
import ProgressReport, { type IProgressReport } from '../models/ProgressReport.js'; import Notification, { type INotification } from '../models/Notification.js'; import CalendarEvent, { type ICalendarEvent } from '../models/CalendarEvent.js';
import CustomerProfile from '../models/CustomerProfile.js'; import User, { type IUser } from '../models/User.js'; import CareAlert from '../models/CareAlert.js'; import PtPackage from '../models/PtPackage.js';
import { AppError } from '../errors/AppError.js'; import { ERROR_CODES } from '../errors/errorCodes.js'; import { recordAudit } from './auditService.js'; import type { AuthenticatedUser } from '../types/express.js';
import { createNotificationOnce } from './notificationService.js';
import { withTransaction } from './transactionService.js';
const denied = (message: string, status: number) => new AppError({ message, status, code: status === 403 ? ERROR_CODES.AUTHORIZATION : ERROR_CODES.NOT_FOUND });
async function customerFor(user: AuthenticatedUser, id: string, session?: ClientSession) { const customer = await CustomerProfile.findById(id).session(session || null); if (!customer) throw denied('Không tìm thấy khách hàng.', 404); if (user.role === 'PT' && String(customer.assignedPtId) !== user.id) throw denied('Bạn không có quyền quản lý khách hàng này.', 403); return customer; }
export async function createReport(user: AuthenticatedUser, payload: Partial<IProgressReport>) { await customerFor(user, String(payload.customerId)); const report = await ProgressReport.create({ ...payload, ptId: user.id, status: 'DRAFT', version: 1, publishedAt: null }); await recordAudit({ actor: user, action: 'PROGRESS_REPORT_CREATED', resourceType: 'progressReports', resourceId: report.id, customerId: report.customerId }); return report; }
async function reportFor(user: AuthenticatedUser, id: string) { const report = await ProgressReport.findById(id); if (!report) throw denied('Không tìm thấy báo cáo.', 404); await customerFor(user, String(report.customerId)); return report; }
export async function listReports(user: AuthenticatedUser, query: Record<string, unknown>) { const page = Number(query.page || 1), limit = Number(query.limit || 20); const filter: QueryFilter<IProgressReport> = {}; if (user.role === 'PT') { const customerIds = await CustomerProfile.find({ assignedPtId: user.id }).distinct('_id'); filter.customerId = { $in: customerIds }; } if (typeof query.customerId === 'string') { await customerFor(user, query.customerId); filter.customerId = new Types.ObjectId(query.customerId); } if (query.status === 'DRAFT' || query.status === 'PUBLISHED') filter.status = query.status; const [items, total] = await Promise.all([ProgressReport.find(filter).sort({ periodEnd: -1 }).skip((page - 1) * limit).limit(limit).lean(), ProgressReport.countDocuments(filter)]); return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }; }
export async function getReport(user: AuthenticatedUser, id: string) { return reportFor(user, id); }
export async function updateReport(user: AuthenticatedUser, id: string, payload: Partial<IProgressReport>) { const report = await reportFor(user, id); for (const field of ['periodStart', 'periodEnd', 'summary', 'metrics', 'sourceVersions'] as const) if (payload[field] !== undefined) report.set(field, payload[field]); report.status = 'DRAFT'; report.publishedAt = null; report.version += 1; await report.save(); await recordAudit({ actor: user, action: 'PROGRESS_REPORT_UPDATED', resourceType: 'progressReports', resourceId: report.id, customerId: report.customerId }); return report; }
export async function publishReport(user: AuthenticatedUser, id: string) {
  return withTransaction(async (session) => {
    const report = await ProgressReport.findById(id).session(session); if (!report) throw denied('Không tìm thấy báo cáo.', 404); const customer = await customerFor(user, String(report.customerId), session);
    report.status = 'PUBLISHED'; report.publishedAt = new Date(); await report.save({ session });
    if (customer.userId) await createNotificationOnce({ userId: customer.userId, type: 'PROGRESS_REPORT_PUBLISHED', title: 'Báo cáo tiến độ mới', message: 'PT đã công bố báo cáo tiến độ của bạn.', resourceType: 'progressReports', resourceId: id }, session);
    await recordAudit({ actor: user, action: 'PROGRESS_REPORT_PUBLISHED', resourceType: 'progressReports', resourceId: id, customerId: report.customerId }, session);
    return report;
  });
}
export async function unpublishReport(user: AuthenticatedUser, id: string) { const report = await reportFor(user, id); report.status = 'DRAFT'; report.publishedAt = null; await report.save(); await recordAudit({ actor: user, action: 'PROGRESS_REPORT_UNPUBLISHED', resourceType: 'progressReports', resourceId: id, customerId: report.customerId }); return report; }
export async function deleteReport(user: AuthenticatedUser, id: string) { const report = await reportFor(user, id); if (report.status !== 'DRAFT') throw denied('Chỉ có thể xóa báo cáo chưa công bố.', 403); await report.deleteOne(); await recordAudit({ actor: user, action: 'PROGRESS_REPORT_DELETED', resourceType: 'progressReports', resourceId: id, customerId: report.customerId }); return report; }
export async function listNotifications(user: AuthenticatedUser, query: Record<string, unknown>) { const page = Number(query.page || 1), limit = Number(query.limit || 20); const filter: QueryFilter<INotification> = { userId: new Types.ObjectId(user.id) }; const [items, total] = await Promise.all([Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Notification.countDocuments(filter)]); return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }; }
export async function readNotification(user: AuthenticatedUser, id: string) { const item = await Notification.findOneAndUpdate({ _id: id, userId: user.id }, { $set: { readAt: new Date() } }, { returnDocument: 'after' }); if (!item) throw denied('Không tìm thấy thông báo.', 404); return item; }
export async function createEvent(user: AuthenticatedUser, payload: Partial<ICalendarEvent>) { const customer = payload.customerId ? await customerFor(user, String(payload.customerId)) : null; const event = await CalendarEvent.create({ ...payload, ownerPtId: user.id, status: 'SCHEDULED' }); if (customer?.userId) await createNotificationOnce({ userId: customer.userId, type: 'CALENDAR_EVENT_CREATED', title: 'Lịch tập mới', message: event.title, resourceType: 'calendarEvents', resourceId: event.id }); await recordAudit({ actor: user, action: 'CALENDAR_EVENT_CREATED', resourceType: 'calendarEvent', resourceId: event.id, customerId: event.customerId }); return event; }
export async function listEvents(user: AuthenticatedUser, query: Record<string, unknown>) { const page = Number(query.page || 1), limit = Number(query.limit || 20); const filter: QueryFilter<ICalendarEvent> = user.role === 'ADMIN' ? {} : { ownerPtId: new Types.ObjectId(user.id) }; if (query.fromDate || query.toDate) filter.startsAt = { ...(query.fromDate ? { $gte: new Date(String(query.fromDate)) } : {}), ...(query.toDate ? { $lt: new Date(String(query.toDate)) } : {}) }; const [items, total] = await Promise.all([CalendarEvent.find(filter).sort({ startsAt: 1 }).skip((page - 1) * limit).limit(limit).lean(), CalendarEvent.countDocuments(filter)]); return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }; }
export async function updateEvent(user: AuthenticatedUser, id: string, payload: Partial<ICalendarEvent>) {
  const item = await CalendarEvent.findOne({ _id: id, ...(user.role === 'ADMIN' ? {} : { ownerPtId: user.id }) }); if (!item) throw denied('Không tìm thấy lịch.', 404);
  for (const field of ['title', 'startsAt', 'endsAt', 'notes', 'status'] as const) if (payload[field] !== undefined) item.set(field, payload[field]);
  await item.save();
  await recordAudit({ actor: user, action: 'CALENDAR_EVENT_UPDATED', resourceType: 'calendarEvent', resourceId: item.id, customerId: item.customerId });
  if (item.customerId) {
    const customer = await CustomerProfile.findById(item.customerId).lean();
    if (customer?.userId) {
      const cancelled = item.status === 'CANCELLED';
      await createNotificationOnce({ userId: customer.userId, type: cancelled ? 'CALENDAR_EVENT_CANCELLED' : 'CALENDAR_EVENT_UPDATED', title: cancelled ? 'Lịch tập đã hủy' : 'Lịch tập đã cập nhật', message: item.title, resourceType: 'calendarEvents', resourceId: item.id });
    }
  }
  return item;
}
export async function getEvent(user: AuthenticatedUser, id: string) { const item = await CalendarEvent.findOne({ _id: id, ...(user.role === 'ADMIN' ? {} : { ownerPtId: user.id }) }); if (!item) throw denied('Không tìm thấy lịch.', 404); return item; }
export async function deleteEvent(user: AuthenticatedUser, id: string) { const item = await CalendarEvent.findOneAndDelete({ _id: id, ...(user.role === 'ADMIN' ? {} : { ownerPtId: user.id }) }); if (!item) throw denied('Không tìm thấy lịch.', 404); await recordAudit({ actor: user, action: 'CALENDAR_EVENT_DELETED', resourceType: 'calendarEvent', resourceId: item.id, customerId: item.customerId }); return item; }
export async function adminDashboard(query: Record<string, unknown> = {}) {
  const customerFilter: Record<string, unknown> = {};
  if (typeof query.ptId === 'string') customerFilter.assignedPtId = new Types.ObjectId(query.ptId);
  if (query.customerStatus === 'ACTIVE' || query.customerStatus === 'INACTIVE' || query.customerStatus === 'LEAD') customerFilter.status = query.customerStatus;
  if (query.fromDate || query.toDate) customerFilter.createdAt = { ...(query.fromDate ? { $gte: new Date(String(query.fromDate)) } : {}), ...(query.toDate ? { $lt: new Date(String(query.toDate)) } : {}) };
  const customerIds = await CustomerProfile.find(customerFilter).distinct('_id');
  const ptFilter: QueryFilter<IUser> = { role: 'PT', status: 'ACTIVE' };
  if (typeof query.ptId === 'string') ptFilter._id = new Types.ObjectId(query.ptId);
  const [totalPts, openAlerts, activePackages] = await Promise.all([
    User.countDocuments(ptFilter),
    CareAlert.countDocuments({ customerId: { $in: customerIds }, status: 'OPEN' }),
    PtPackage.countDocuments({ customerId: { $in: customerIds }, status: 'ACTIVE' }),
  ]);
  const filters = { ...(typeof query.ptId === 'string' ? { ptId: query.ptId } : {}), ...(typeof query.customerStatus === 'string' ? { customerStatus: query.customerStatus } : {}), ...(typeof query.fromDate === 'string' ? { fromDate: query.fromDate } : {}), ...(typeof query.toDate === 'string' ? { toDate: query.toDate } : {}) };
  return { totalPts, totalCustomers: customerIds.length, openAlerts, activePackages, filters, sourcePaths: ['/api/users', '/api/customers', '/api/care/alerts', '/api/pt-packages'] };
}
