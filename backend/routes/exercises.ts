import express, { type Request } from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../middlewares/auth.js';
import { requireFeature } from '../middlewares/requireFeature.js';
import { validate, listValidator, type ValidationIssue } from '../middlewares/validate.js';
import * as controller from '../controllers/exerciseController.js';
const router = express.Router();
const base = [authenticate, authorize('ADMIN', 'PT'), requireFeature('EXERCISE_LIBRARY')] as const;
const bodyValidator = (req: Request): ValidationIssue[] => {
  const errors: ValidationIssue[] = [];
  if (typeof req.body.name !== 'string' || !req.body.name.trim()) errors.push({ field: 'name', message: 'Vui lòng nhập tên bài tập.' });
  if (typeof req.body.muscleGroup !== 'string' || !req.body.muscleGroup.trim()) errors.push({ field: 'muscleGroup', message: 'Vui lòng chọn nhóm cơ.' });
  if (!['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(req.body.level)) errors.push({ field: 'level', message: 'Cấp độ bài tập không hợp lệ.' });
  if (req.body.equipment !== undefined && !Array.isArray(req.body.equipment)) errors.push({ field: 'equipment', message: 'Danh sách thiết bị không hợp lệ.' });
  if (req.body.scope !== undefined && !['GLOBAL', 'PRIVATE'].includes(req.body.scope)) errors.push({ field: 'scope', message: 'Phạm vi bài tập không hợp lệ.' });
  return errors;
};
const queryValidator = (req: Request): ValidationIssue[] => {
  const errors = listValidator(req);
  if (req.query.level && !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(String(req.query.level))) errors.push({ field: 'level', message: 'Cấp độ bài tập không hợp lệ.' });
  return errors;
};
router.get('/', ...base, validate(queryValidator), controller.list);
router.get('/:id', ...base, validate((req) => mongoose.isValidObjectId(req.params.id) ? [] : [{ field: 'id', message: 'Mã bài tập không hợp lệ.' }]), controller.get);
router.post('/', ...base, validate(bodyValidator), controller.create);
router.patch('/:id', ...base, validate((req) => {
  const errors: ValidationIssue[] = mongoose.isValidObjectId(req.params.id) ? [] : [{ field: 'id', message: 'MÃ£ bÃ i táº­p khÃ´ng há»£p lá»‡.' }];
  if (req.body.name !== undefined && (typeof req.body.name !== 'string' || !req.body.name.trim())) errors.push({ field: 'name', message: 'TÃªn bÃ i táº­p khÃ´ng há»£p lá»‡.' });
  if (req.body.level !== undefined && !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(req.body.level)) errors.push({ field: 'level', message: 'Cáº¥p Ä‘á»™ bÃ i táº­p khÃ´ng há»£p lá»‡.' });
  for (const field of ['scope', 'ownerPtId']) if (Object.prototype.hasOwnProperty.call(req.body, field)) errors.push({ field, message: `KhÃ´ng Ä‘Æ°á»£c phÃ©p cáº­p nháº­t ${field}.` });
  return errors;
}), controller.update);
router.delete('/:id', ...base, validate((req) => mongoose.isValidObjectId(req.params.id) ? [] : [{ field: 'id', message: 'Mã bài tập không hợp lệ.' }]), controller.remove);
export default router;
