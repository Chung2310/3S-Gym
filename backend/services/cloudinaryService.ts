import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImage(fileBuffer: Buffer): Promise<UploadApiResponse> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new AppError({ status: 503, code: ERROR_CODES.UNAVAILABLE, message: 'Dịch vụ tải ảnh chưa sẵn sàng.' });
  }

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: '3s-gym/avatars',
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Cloudinary không trả kết quả upload.'));
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

async function uploadVideo(fileBuffer: Buffer): Promise<UploadApiResponse> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new AppError({ status: 503, code: ERROR_CODES.UNAVAILABLE, message: 'Dịch vụ tải video chưa sẵn sàng.' });
  }

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: '3s-gym/exercises/videos', resource_type: 'video' },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Cloudinary không trả kết quả upload video.'));
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

export { uploadImage, uploadVideo };
