import CustomerProfile from '../models/CustomerProfile.js';
import InBodyRecord from '../models/InBodyRecord.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { extractInBody } from './ocrProvider.js';
import type { AuthenticatedUser } from '../types/express.js';
import { recordAudit } from './auditService.js';

async function createOcrDraft(user: AuthenticatedUser, customerId: string, measurementDate: string, file: Express.Multer.File) {
  const customer = await CustomerProfile.findOne({ _id: customerId, ...(user.role === 'PT' ? { assignedPtId: user.id } : {}) });
  if (!customer) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy khách hàng.' });
  const extracted = await extractInBody(file);
  return InBodyRecord.create({
    customerId: customer._id, ptId: user.id, measurementDate,
    ...extracted, source: 'AI_SCAN', status: 'DRAFT', publishedAt: null,
    ocrStatus: 'REVIEW_REQUIRED', ocrWarnings: extracted.warnings,
    sourceImage: { fileName: file.originalname, mimeType: file.mimetype, data: file.buffer },
  });
}

async function confirmOcrDraft(user: AuthenticatedUser, id: string, corrections: Record<string, unknown>) {
  const record = await InBodyRecord.findById(id);
  if (!record) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy kết quả InBody.' });
  const customer = await CustomerProfile.findOne({
    _id: record.customerId,
    ...(user.role === 'PT' ? { assignedPtId: user.id } : {}),
  });
  if (!customer) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy khách hàng.' });
  if (record.source !== 'AI_SCAN' || record.ocrStatus !== 'REVIEW_REQUIRED') {
    throw new AppError({ status: 409, code: ERROR_CODES.VALIDATION, message: 'Kết quả OCR không ở trạng thái chờ xác nhận.' });
  }
  const allowed = [
    'measurementDate', 'weight', 'bmi', 'bodyFatPercentage', 'bodyFatMass',
    'muscleMass', 'bmr', 'visceralFatLevel', 'inbodyScore', 'bodyWater',
    'boneMineral', 'waistHipRatio', 'segmentalMuscle', 'segmentalFat',
    'consultationNotes', 'strengths', 'priorities', 'recommendation',
  ];
  for (const field of allowed) if (Object.prototype.hasOwnProperty.call(corrections, field)) record.set(field, corrections[field]);
  record.ocrStatus = 'CONFIRMED';
  const saved = await record.save();
  await recordAudit({ actor: user, action: 'INBODY_OCR_CONFIRMED', resourceType: 'inbody', resourceId: id, customerId: record.customerId! });
  return saved;
}

export { createOcrDraft, confirmOcrDraft };
