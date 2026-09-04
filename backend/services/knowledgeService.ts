import KnowledgeDocument, { type IKnowledgeDocument } from '../models/KnowledgeDocument.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { AuthenticatedUser } from '../types/express.js';
import { Types } from 'mongoose';

export async function createDocument(payload: Partial<IKnowledgeDocument>, user: AuthenticatedUser) {
  return KnowledgeDocument.create({
    ...payload,
    status: 'DRAFT',
    version: 1,
    approvedById: user?.id ? new Types.ObjectId(user.id) : undefined,
  });
}

export async function listDocuments(query: { page?: number; limit?: number; status?: string; topic?: string; search?: string }) {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  const filter: Record<string, any> = {};

  if (query.status === 'DRAFT' || query.status === 'PUBLISHED') {
    filter.status = query.status;
  }
  if (query.topic && typeof query.topic === 'string') {
    filter.topic = query.topic;
  }
  if (query.search && query.search.trim()) {
    filter.$or = [
      { title: { $regex: query.search.trim(), $options: 'i' } },
      { topic: { $regex: query.search.trim(), $options: 'i' } },
      { content: { $regex: query.search.trim(), $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    KnowledgeDocument.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    KnowledgeDocument.countDocuments(filter),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateDocument(id: string, payload: Partial<IKnowledgeDocument>) {
  const doc = await KnowledgeDocument.findById(id);
  if (!doc) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy tài liệu.' });

  if (payload.title !== undefined) doc.title = payload.title;
  if (payload.topic !== undefined) doc.topic = payload.topic;
  if (payload.content !== undefined) doc.content = payload.content;
  doc.version += 1;

  return doc.save();
}

export async function deleteDocument(id: string) {
  const doc = await KnowledgeDocument.findById(id);
  if (!doc) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy tài liệu.' });
  await doc.deleteOne();
  return true;
}

export async function publishDocument(id: string, user: AuthenticatedUser) {
  const doc = await KnowledgeDocument.findById(id);
  if (!doc) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy tài liệu.' });

  doc.status = 'PUBLISHED';
  doc.publishedAt = new Date();
  doc.effectiveAt = new Date();
  if (user?.id) doc.approvedById = new Types.ObjectId(user.id);

  return doc.save();
}

export async function unpublishDocument(id: string) {
  const doc = await KnowledgeDocument.findById(id);
  if (!doc) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy tài liệu.' });

  doc.status = 'DRAFT';
  doc.publishedAt = undefined;

  return doc.save();
}

export async function seedStandardKnowledgeLibrary(user: AuthenticatedUser) {
  const STANDARD_DOCS = [
    {
      title: 'Quy chuẩn dinh dưỡng thể hình 3S: Tỷ lệ Macro theo mục tiêu',
      topic: 'DINH DƯỠNG',
      content: 'Tỷ lệ Protein cho người tập gym duy trì từ 1.8g - 2.2g/kg thể trọng. Nguồn đạm ưu tiên: ức gà, bò nạc, cá hồi, trứng, whey protein isolate. Carbs sạch: gạo lứt, khoai lang, yến mạch. Chất béo tốt: dầu ô liu, quả bơ, các loại hạt hạnh nhân, óc chó.',
    },
    {
      title: 'Nguyên tắc bổ sung nước & điện giải trong buổi tập gym',
      topic: 'TẬP LUYỆN',
      content: 'Uống 500ml nước trước tập 2 tiếng. Trong buổi tập, cứ mỗi 15-20 phút uống ngụm nhỏ 150-200ml. Tránh để khát mới uống vì khi cơ thể mất 2% lượng nước, sức mạnh và hiệu suất cơ bắp giảm tới 15%.',
    },
    {
      title: 'Chiến lược phục hồi cơ bắp sau buổi tập cường độ cao',
      topic: 'PHỤC HỒI',
      content: 'Cửa sổ đồng hóa sau tập: nạp 25-30g protein hấp thu nhanh và 40-50g carbs trong vòng 45-60 phút. Giấc ngủ ban đêm từ 7-8 tiếng là thời điểm hoocmon tăng trưởng GH tiết ra nhiều nhất để tái tạo sợi cơ bị tổn thương.',
    },
    {
      title: 'Quy trình khởi động khớp và kích hoạt cơ chuẩn 3S-Gym',
      topic: 'TẬP LUYỆN',
      content: 'Bắt đầu với 5 phút đi bộ dốc nhẹ để nâng thân nhiệt. Xoay tròn khớp linh hoạt (cổ tay, cổ chân, khớp gối, khớp háng, khớp vai). Thực hiện 2 bài kích hoạt cơ trọng tâm (Glute Bridge, Cat-Cow, Band Pull-Apart) trước khi nâng tạ nặng.',
    },
  ];

  const seeded = [];
  for (const item of STANDARD_DOCS) {
    let doc = await KnowledgeDocument.findOne({ title: item.title });
    if (!doc) {
      doc = new KnowledgeDocument({
        title: item.title,
        topic: item.topic,
        content: item.content,
        version: 1,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        effectiveAt: new Date(),
        approvedById: user?.id ? new Types.ObjectId(user.id) : undefined,
      });
      await doc.save();
      seeded.push(doc);
    }
  }

  return {
    count: seeded.length,
    message: `Đã nạp ${seeded.length} tài liệu tri thức chuẩn 3S-Gym thành công!`,
  };
}
