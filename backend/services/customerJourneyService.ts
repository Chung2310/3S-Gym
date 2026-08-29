import { Types } from 'mongoose';
import BodyMeasurement from '../models/BodyMeasurement.js';
import CalendarEvent from '../models/CalendarEvent.js';
import CustomerProfile from '../models/CustomerProfile.js';
import ProgressPhoto from '../models/ProgressPhoto.js';
import ProgressReport from '../models/ProgressReport.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import WorkoutSession from '../models/WorkoutSession.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { AuthenticatedUser } from '../types/express.js';
import { analyzeProgress } from './progressAnalyticsService.js';

const fail = (message: string, status: number) => new AppError({ message, status, code: status === 403 ? ERROR_CODES.AUTHORIZATION : ERROR_CODES.NOT_FOUND });

async function staffCustomer(user: AuthenticatedUser, customerId: string) {
  const customer = await CustomerProfile.findById(customerId).lean();
  if (!customer) throw fail('Không tìm thấy khách hàng.', 404);
  if (user.role === 'PT' && String(customer.assignedPtId) !== user.id) throw fail('Bạn không có quyền xem hành trình khách hàng này.', 403);
  return customer;
}

async function ownCustomer(user: AuthenticatedUser) {
  const customer = await CustomerProfile.findOne({ userId: user.id }).lean();
  if (!customer) throw fail('Không tìm thấy hồ sơ khách hàng.', 404);
  return customer;
}

function dateFilter(field: string, from?: unknown, to?: unknown) {
  if (typeof from !== 'string' && typeof to !== 'string') return {};
  return { [field]: { ...(typeof from === 'string' ? { $gte: new Date(from) } : {}), ...(typeof to === 'string' ? { $lte: new Date(to) } : {}) } };
}

export async function getJourney(user: AuthenticatedUser, options: { customerId?: string; from?: unknown; to?: unknown; customerView?: boolean }) {
  const customer = options.customerView ? await ownCustomer(user) : await staffCustomer(user, String(options.customerId));
  const customerId = new Types.ObjectId(String(customer._id));
  const [sessions, measurements, calendar, photos, activePlan, planHistory, reports] = await Promise.all([
    WorkoutSession.find({ customerId, ...dateFilter('performedAt', options.from, options.to) }).sort({ performedAt: -1 }).lean(),
    BodyMeasurement.find({ customerId, ...dateFilter('measuredAt', options.from, options.to) }).sort({ measuredAt: 1 }).lean(),
    CalendarEvent.find({ customerId, ...dateFilter('startsAt', options.from, options.to) }).sort({ startsAt: 1 }).lean(),
    ProgressPhoto.find({ customerId, ...dateFilter('takenDate', options.from, options.to) }).sort({ takenDate: 1 }).lean(),
    WorkoutPlan.findOne({ customerId, lifecycleStatus: 'ACTIVE' }).lean(),
    WorkoutPlan.find({ customerId, lifecycleStatus: 'ARCHIVED' }).sort({ archivedAt: -1 }).lean(),
    ProgressReport.find({ customerId, ...(options.customerView ? { status: 'PUBLISHED' } : {}) }).sort({ periodEnd: -1 }).lean(),
  ]);
  const analytics = analyzeProgress({ sessions: sessions as unknown as Parameters<typeof analyzeProgress>[0]['sessions'], measurements: measurements as unknown as Parameters<typeof analyzeProgress>[0]['measurements'], ...(typeof options.from === 'string' ? { periodStart: options.from } : {}), ...(typeof options.to === 'string' ? { periodEnd: options.to } : {}) });
  return {
    customer: { _id: String(customer._id), fullName: customer.fullName, phone: customer.phone },
    sessions, measurements, calendar, photos, plans: { active: activePlan, history: planHistory }, reports, analytics,
  };
}
