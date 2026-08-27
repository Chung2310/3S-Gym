import express from 'express';
const router = express.Router();
import multer from 'multer';
import { uploadImage } from '../services/cloudinaryService.js';
import { success } from '../middlewares/response.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import type { Request } from 'express';
import type { ValidationIssue } from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

const imageValidator = (req: Request): ValidationIssue[] => {
  const errors: ValidationIssue[] = [];
  if (!req.file) errors.push({ field: 'image', message: 'Vui lòng cung cấp file ảnh để upload.' });
  else if (!['image/jpeg', 'image/png', 'image/webp'].includes(req.file.mimetype)) errors.push({ field: 'image', message: 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.' });
  return errors;
};

router.post('/image', authenticate, authorize('ADMIN', 'PT'), upload.single('image'), validate(imageValidator), asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError({ status: 400, code: ERROR_CODES.UPLOAD, message: 'Vui lòng cung cấp file ảnh để upload.' });
    }

    const result = await uploadImage(req.file.buffer);
    return success(res, {
      message: 'Tải ảnh lên thành công.',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
}));

export default router;
