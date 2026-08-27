import express, { type Request } from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate, createUserValidator, updateUserValidator, listValidator, type ValidationIssue } from '../middlewares/validate.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();
const idValidator = (req: Request): ValidationIssue[] => mongoose.isValidObjectId(req.params.id) ? [] : [{ field: 'id', message: 'Mã PT không hợp lệ.' }];
const userListValidator = (req: Request): ValidationIssue[] => {
  const errors = listValidator(req);
  if (req.query.role && !['ADMIN', 'PT', 'CUSTOMER'].includes(String(req.query.role))) errors.push({ field: 'role', message: 'Vai trò không hợp lệ.' });
  if (req.query.status && !['ACTIVE', 'LOCKED'].includes(String(req.query.status))) errors.push({ field: 'status', message: 'Trạng thái tài khoản không hợp lệ.' });
  return errors;
};

router.get('/', authenticate, authorize('ADMIN'), validate(userListValidator), userController.list);
router.post('/', authenticate, authorize('ADMIN'), validate(createUserValidator), userController.create);
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updateUserValidator), userController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), validate(idValidator), userController.remove);

export default router;
