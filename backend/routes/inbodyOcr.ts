import express, { type Request } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { authenticate, authorize } from '../middlewares/auth.js';
import { requireFeature } from '../middlewares/requireFeature.js';
import { validate, type ValidationIssue } from '../middlewares/validate.js';
import * as controller from '../controllers/inbodyOcrController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const validator = (req: Request): ValidationIssue[] => {
  const errors: ValidationIssue[] = [];
  if (!mongoose.isValidObjectId(req.body.customerId)) errors.push({ field: 'customerId', message: 'Mã khách hàng không hợp lệ.' });
  if (!req.body.measurementDate || Number.isNaN(Date.parse(req.body.measurementDate))) errors.push({ field: 'measurementDate', message: 'Ngày đo không hợp lệ.' });
  if (!req.file) errors.push({ field: 'image', message: 'Vui lòng cung cấp ảnh phiếu InBody.' });
  else if (!['image/jpeg', 'image/png', 'image/webp'].includes(req.file.mimetype)) errors.push({ field: 'image', message: 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.' });
  return errors;
};

router.post('/', authenticate, authorize('ADMIN', 'PT'), requireFeature('OCR_INBODY'), upload.single('image'), validate(validator), controller.create);
export default router;
