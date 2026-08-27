import CustomerProfile from '../models/CustomerProfile.js';
import BodyMeasurement from '../models/BodyMeasurement.js';
import CareAlert from '../models/CareAlert.js';
import type { AuthenticatedUser } from '../types/express.js';
async function getPtDashboard(user: AuthenticatedUser) {
  const customers = await CustomerProfile.find({ assignedPtId: user.id, status: 'ACTIVE' }).lean();
  const summaries = await Promise.all(customers.map(async (customer) => {
    const [measurements, openAlerts] = await Promise.all([
      BodyMeasurement.find({ customerId: customer._id }).sort({ measuredAt: 1 }).lean(),
      CareAlert.countDocuments({ customerId: customer._id, status: 'OPEN' }),
    ]);
    const sufficient = measurements.length >= 2;
    if (!sufficient) return { customerId: String(customer._id), fullName: customer.fullName, dataStatus: 'INSUFFICIENT_DATA', rank: null, score: null, scoreBreakdown: null, sourcePath: `/api/progress/${customer._id}`, latestMeasurement: measurements.at(-1) ?? null };
    const first = measurements[0]; const latest = measurements.at(-1)!;
    const bodyFatChange = (first.bodyFatPercentage ?? 0) - (latest.bodyFatPercentage ?? 0);
    const muscleChange = (latest.muscleMass ?? 0) - (first.muscleMass ?? 0);
    const measurementTrend = Math.max(0, Math.min(70, Math.round(50 + bodyFatChange * 5 + muscleChange * 5)));
    const careRisk = Math.max(0, 30 - openAlerts * 10);
    return { customerId: String(customer._id), fullName: customer.fullName, dataStatus: 'READY', rank: null, score: measurementTrend + careRisk, scoreBreakdown: { measurementTrend, careRisk }, sourcePath: `/api/progress/${customer._id}`, latestMeasurement: latest };
  }));
  return { totalCustomers: customers.length, openAlerts: await CareAlert.countDocuments({ ptId: user.id, status: 'OPEN' }), customers: summaries };
}
export { getPtDashboard };
