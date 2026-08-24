const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadImage } = require('../services/cloudinaryService');
const { success } = require('../middlewares/response');
const { AppError } = require('../errors/AppError');
const { ERROR_CODES } = require('../errors/errorCodes');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { validate } = require('../middlewares/validate');

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

const imageValidator = (req) => {
  const errors = [];
  if (!req.file) errors.push({ field: 'image', message: 'Vui lòng cung cấp file ảnh để upload.' });
  else if (!['image/jpeg', 'image/png', 'image/webp'].includes(req.file.mimetype)) errors.push({ field: 'image', message: 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.' });
  return errors;
};

router.post('/image', upload.single('image'), validate(imageValidator), asyncHandler(async (req, res) => {
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

module.exports = router;
