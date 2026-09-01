import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { requireFeature } from '../middlewares/requireFeature.js';
import { validate } from '../middlewares/validate.js';
import * as controller from '../controllers/exerciseController.js';
import { contentIdSchema, createExerciseSchema, listExercisesSchema, updateExerciseSchema } from '../validators/contentValidator.js';
const router = express.Router();
const base = [authenticate, authorize('ADMIN', 'PT'), requireFeature('EXERCISE_LIBRARY')] as const;
/* legacy manual validators
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
*/
router.get('/', ...base, validate(listExercisesSchema), controller.list);
router.get('/:id', ...base, validate(contentIdSchema), controller.get);
router.post('/', ...base, validate(createExerciseSchema), controller.create);
router.patch('/:id', ...base, validate(updateExerciseSchema), controller.update);
router.delete('/:id', ...base, validate(contentIdSchema), controller.remove);
export default router;
