import express, { type Request } from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../middlewares/auth.js';
import { requireFeature } from '../middlewares/requireFeature.js';
import { validate, listValidator, type ValidationIssue } from '../middlewares/validate.js';
import * as c from '../controllers/operationsController.js';

const router = express.Router();
const progress = [authenticate, authorize('ADMIN', 'PT'), requireFeature('PROGRESS')] as const;
const idValidator = (req: Request): ValidationIssue[] => mongoose.isValidObjectId(req.params.id) ? [] : [{ field: 'id', message: 'Mã dữ liệu không hợp lệ.' }];
const reportValidator = (req: Request): ValidationIssue[] => { const e: ValidationIssue[] = []; if (!mongoose.isValidObjectId(req.body.customerId)) e.push({ field: 'customerId', message: 'Mã khách hàng không hợp lệ.' }); if (!req.body.periodStart || Number.isNaN(Date.parse(req.body.periodStart))) e.push({ field: 'periodStart', message: 'Ngày bắt đầu không hợp lệ.' }); if (!req.body.periodEnd || Number.isNaN(Date.parse(req.body.periodEnd))) e.push({ field: 'periodEnd', message: 'Ngày kết thúc không hợp lệ.' }); if (typeof req.body.summary !== 'string' || !req.body.summary.trim()) e.push({ field: 'summary', message: 'Vui lòng nhập nội dung báo cáo.' }); return e; };

router.post('/progress-reports', ...progress, validate(reportValidator), c.createReport);
router.get('/progress-reports', ...progress, validate(listValidator), c.reports);
router.patch('/progress-reports/:id/publish', ...progress, validate(idValidator), c.publishReport);
router.patch('/progress-reports/:id/unpublish', ...progress, validate(idValidator), c.unpublishReport);
router.get('/progress-reports/:id', ...progress, validate(idValidator), c.getReport);
router.patch('/progress-reports/:id', ...progress, validate((req) => { const e = idValidator(req); if (req.body.summary !== undefined && (typeof req.body.summary !== 'string' || !req.body.summary.trim())) e.push({ field: 'summary', message: 'Nội dung báo cáo không hợp lệ.' }); return e; }), c.updateReport);
router.delete('/progress-reports/:id', ...progress, validate(idValidator), c.deleteReport);

router.get('/notifications', authenticate, validate(listValidator), c.notifications);
router.patch('/notifications/:id/read', authenticate, validate(idValidator), c.readNotification);

const eventValidator = (req: Request): ValidationIssue[] => { const e: ValidationIssue[] = []; if (req.body.customerId && !mongoose.isValidObjectId(req.body.customerId)) e.push({ field: 'customerId', message: 'Mã khách hàng không hợp lệ.' }); if (typeof req.body.title !== 'string' || !req.body.title.trim()) e.push({ field: 'title', message: 'Vui lòng nhập tên lịch.' }); if (!req.body.startsAt || Number.isNaN(Date.parse(req.body.startsAt))) e.push({ field: 'startsAt', message: 'Thời gian bắt đầu không hợp lệ.' }); if (!req.body.endsAt || Number.isNaN(Date.parse(req.body.endsAt)) || new Date(req.body.endsAt) <= new Date(req.body.startsAt)) e.push({ field: 'endsAt', message: 'Thời gian kết thúc không hợp lệ.' }); return e; };
router.post('/calendar-events', authenticate, authorize('ADMIN', 'PT'), validate(eventValidator), c.createEvent);
router.get('/calendar-events', authenticate, authorize('ADMIN', 'PT'), validate((req) => { const e = listValidator(req); for (const f of ['fromDate', 'toDate']) if (req.query[f] && Number.isNaN(Date.parse(String(req.query[f])))) e.push({ field: f, message: `Ngày ${f} không hợp lệ.` }); return e; }), c.events);
router.get('/calendar-events/:id', authenticate, authorize('ADMIN', 'PT'), validate(idValidator), c.getEvent);
router.patch('/calendar-events/:id', authenticate, authorize('ADMIN', 'PT'), validate((req) => { const e = idValidator(req); if (req.body.status && !['SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(req.body.status)) e.push({ field: 'status', message: 'Trạng thái lịch không hợp lệ.' }); return e; }), c.updateEvent);
router.delete('/calendar-events/:id', authenticate, authorize('ADMIN', 'PT'), validate(idValidator), c.deleteEvent);

router.get('/dashboard/admin', authenticate, authorize('ADMIN'), requireFeature('DASHBOARD'), validate((req) => { const e: ValidationIssue[] = []; if (req.query.ptId && !mongoose.isValidObjectId(String(req.query.ptId))) e.push({ field: 'ptId', message: 'Mã PT không hợp lệ.' }); if (req.query.customerStatus && !['ACTIVE', 'INACTIVE', 'LEAD'].includes(String(req.query.customerStatus))) e.push({ field: 'customerStatus', message: 'Trạng thái khách hàng không hợp lệ.' }); for (const field of ['fromDate', 'toDate']) if (req.query[field] && Number.isNaN(Date.parse(String(req.query[field])))) e.push({ field, message: `Ngày ${field} không hợp lệ.` }); if (req.query.fromDate && req.query.toDate && new Date(String(req.query.toDate)) <= new Date(String(req.query.fromDate))) e.push({ field: 'toDate', message: 'Ngày kết thúc phải sau ngày bắt đầu.' }); return e; }), c.adminDashboard);
export default router;
