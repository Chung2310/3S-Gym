import express, { type Request } from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../middlewares/auth.js';
import { requireFeature } from '../middlewares/requireFeature.js';
import { validate, listValidator, type ValidationIssue } from '../middlewares/validate.js';
import * as controller from '../controllers/workoutProgressController.js';
const router = express.Router();
const auth = [authenticate, authorize('ADMIN', 'PT')] as const;
const templateValidator = (req: Request): ValidationIssue[] => {
  const errors: ValidationIssue[] = [];
  if (typeof req.body.title !== 'string' || !req.body.title.trim()) errors.push({ field: 'title', message: 'Vui lòng nhập tên giáo án.' });
  if (!Array.isArray(req.body.sessions) || req.body.sessions.length === 0) errors.push({ field: 'sessions', message: 'Giáo án phải có ít nhất một buổi.' });
  return errors;
};
const sessionValidator = (req: Request): ValidationIssue[] => {
  const errors: ValidationIssue[] = [];
  for (const field of ['customerId', 'templateId']) if (!mongoose.isValidObjectId(req.body[field])) errors.push({ field, message: `Mã ${field} không hợp lệ.` });
  if (!['PRESENT', 'ABSENT', 'LATE'].includes(req.body.attendance)) errors.push({ field: 'attendance', message: 'Trạng thái điểm danh không hợp lệ.' });
  if (typeof req.body.idempotencyKey !== 'string' || !req.body.idempotencyKey.trim()) errors.push({ field: 'idempotencyKey', message: 'Thiếu mã chống ghi trùng.' });
  return errors;
};
const measurementValidator = (req: Request): ValidationIssue[] => {
  const errors: ValidationIssue[] = [];
  if (!mongoose.isValidObjectId(req.body.customerId)) errors.push({ field: 'customerId', message: 'Mã khách hàng không hợp lệ.' });
  if (!req.body.measuredAt || Number.isNaN(Date.parse(req.body.measuredAt))) errors.push({ field: 'measuredAt', message: 'Ngày đo không hợp lệ.' });
  return errors;
};
router.post('/workout-templates', ...auth, requireFeature('EXERCISE_LIBRARY'), validate(templateValidator), controller.createTemplate);
router.get('/workout-templates', ...auth, requireFeature('EXERCISE_LIBRARY'), validate((req) => {
  const errors = listValidator(req);
  if (req.query.status && !['ACTIVE', 'ARCHIVED'].includes(String(req.query.status))) errors.push({ field: 'status', message: 'Tráº¡ng thÃ¡i giÃ¡o Ã¡n khÃ´ng há»£p lá»‡.' });
  return errors;
}), controller.listTemplates);
router.patch('/workout-templates/:id', ...auth, requireFeature('EXERCISE_LIBRARY'), validate((req) => {
  const errors: ValidationIssue[] = mongoose.isValidObjectId(req.params.id) ? [] : [{ field: 'id', message: 'MÃ£ giÃ¡o Ã¡n khÃ´ng há»£p lá»‡.' }];
  if (req.body.title !== undefined && (typeof req.body.title !== 'string' || !req.body.title.trim())) errors.push({ field: 'title', message: 'TÃªn giÃ¡o Ã¡n khÃ´ng há»£p lá»‡.' });
  if (req.body.sessions !== undefined && (!Array.isArray(req.body.sessions) || req.body.sessions.length === 0)) errors.push({ field: 'sessions', message: 'GiÃ¡o Ã¡n pháº£i cÃ³ Ã­t nháº¥t má»™t buá»•i.' });
  return errors;
}), controller.updateTemplate);
router.post('/workout-sessions', ...auth, requireFeature('PROGRESS'), validate(sessionValidator), controller.createSession);
router.post('/body-measurements', ...auth, requireFeature('PROGRESS'), validate(measurementValidator), controller.createMeasurement);
router.get('/progress/:customerId', ...auth, requireFeature('PROGRESS'), validate((req) => mongoose.isValidObjectId(req.params.customerId) ? [] : [{ field: 'customerId', message: 'Mã khách hàng không hợp lệ.' }]), controller.getProgress);
export default router;
