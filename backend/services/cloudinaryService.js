const cloudinary = require('cloudinary').v2;
const { AppError } = require('../errors/AppError');
const { ERROR_CODES } = require('../errors/errorCodes');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImage(fileBuffer) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new AppError({ status: 503, code: ERROR_CODES.UNAVAILABLE, message: 'Dịch vụ tải ảnh chưa sẵn sàng.' });
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: '3s-gym/avatars',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

module.exports = { uploadImage };
