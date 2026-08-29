import CustomerProfile from '../models/CustomerProfile.js';
import NutritionPlan from '../models/NutritionPlan.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import InBodyRecord from '../models/InBodyRecord.js';
import Goal from '../models/Goal.js';
import { generateText } from './aiProvider.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { AuthenticatedUser } from '../types/express.js';

function parseJson(text: string): Record<string, unknown> {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI không trả nội dung có cấu trúc hợp lệ.' });
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch (cause) {
    throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI không trả nội dung có cấu trúc hợp lệ.', cause });
  }
}

export async function createDraft(user: AuthenticatedUser, kind: 'nutrition' | 'workout' | 'roadmap', customerId: string, request: string) {
  const customer = await CustomerProfile.findById(customerId).lean();
  if (!customer) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy khách hàng.' });
  if (String(customer.assignedPtId) !== user.id) throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền quản lý khách hàng này.' });

  if (kind === 'roadmap') {
    const [inbody, goal] = await Promise.all([
      InBodyRecord.findOne({ customerId: customer._id }).sort({ measurementDate: -1, createdAt: -1 }).lean() as Promise<any>,
      Goal.findOne({ customerId: customer._id }).sort({ createdAt: -1 }).lean() as Promise<any>,
    ]);

    const prompt = `Bạn là Chuyên gia Khoa học Thể thao & Huấn luyện viên thể hình 3S Wellness Fitness & Yoga.
Hãy tạo Lộ trình huấn luyện (Roadmap) và Mục tiêu toàn diện dạng JSON cho học viên:
- Học viên: ${customer.fullName}, Giới tính: ${customer.gender || 'MALE'}, Chiều cao: ${customer.height || 170}cm, Cân nặng ban đầu: ${customer.initialWeight || 60}kg
- Tiền sử chấn thương / Sức khỏe: ${customer.medicalNotes || 'Không có'}
- Dữ liệu InBody gần nhất: ${inbody ? `Cân nặng ${inbody.weight}kg, % Mỡ ${inbody.bodyFatPercentage || '--'}%, Cơ ${inbody.muscleMass || '--'}kg, Mỡ nội tạng Level ${inbody.visceralFatLevel || '--'}, BMR ${inbody.bmr || '--'} kcal, Điểm InBody ${inbody.inbodyScore || '--'}đ` : 'Chưa có dữ liệu InBody'}
- Mục tiêu đã lưu: ${goal ? `${goal.title} (${goal.type}): ${goal.targetValue} ${goal.targetUnit || 'kg'}` : 'Chưa có'}
- Yêu cầu và mục tiêu từ PT: ${request}

QUY TẮC BẮT BUỘC:
1. Trả về DUY NHẤT 1 JSON object hợp lệ, không kèm markdown giải thích ngoài JSON.
2. Chia lộ trình thành các Phase liên tục, mỗi Phase bao gồm đầy đủ tất cả các tuần theo thứ tự từ 1 đến hết thời lượng (Ví dụ Lộ trình 12 tuần: Phase 1 gồm tuần 1, 2, 3, 4; Phase 2 gồm tuần 5, 6, 7, 8; Phase 3 gồm tuần 9, 10, 11, 12).
3. Mỗi tuần có trọng tâm (focus) và danh sách các buổi tập (sessions) tương ứng.

Hãy phân tích và trả về ĐÚNG 1 JSON object hợp lệ với cấu trúc sau:
{
  "title": "Tên lộ trình chi tiết...",
  "strategy": {
    "targetSummary": "Mục tiêu cụ thể...",
    "estimatedWeeks": 12,
    "sessionsPerWeek": 4,
    "trainingMethod": "Phương pháp tập (Hypertrophy/Progressive Overload/RPE)...",
    "trainingSplit": "Phân chia lịch tập...",
    "cardioProtocol": "Chiến lược cardio Zone 2 / HIIT...",
    "nutrition": {
      "bmr": 1600,
      "tdee": 2200,
      "targetCalories": 1800,
      "calorieDeficitOrSurplus": -400,
      "proteinGrams": 140,
      "carbsGrams": 180,
      "fatGrams": 50,
      "waterLiters": 2.8,
      "advice": "Lời khuyên dinh dưỡng..."
    },
    "checkpoints": [
      { "week": 4, "title": "Mốc 1: Đánh giá thích nghi & InBody 1", "description": "Chi tiết..." },
      { "week": 8, "title": "Mốc 2: Kiểm tra tỷ lệ mỡ/cơ & InBody 2", "description": "Chi tiết..." },
      { "week": 12, "title": "Mốc 3: Tổng kết chu kỳ & Before/After", "description": "Chi tiết..." }
    ]
  },
  "phases": [
    {
      "order": 1,
      "name": "Phase 1: Thích nghi & Chuẩn hóa Kỹ thuật (Tuần 1 - 4)",
      "durationWeeks": 4,
      "goals": ["Chuẩn hóa chuyển động", "Tăng sức bền core"],
      "weeks": [
        {
          "week": 1,
          "focus": "Làm quen bài tập và kiểm tra ROM",
          "sessionTargets": 4,
          "sessions": [
            { "sessionNumber": 1, "name": "Buổi 1: Thân trên", "focus": "Kỹ thuật Bench press & Lat pulldown", "exercises": ["Bench Press 4x10", "Lat Pulldown 4x10"] }
          ]
        },
        {
          "week": 2,
          "focus": "Tăng dần mức tạ vừa phải",
          "sessionTargets": 4,
          "sessions": []
        },
        {
          "week": 3,
          "focus": "Củng cố form chuyển động",
          "sessionTargets": 4,
          "sessions": []
        },
        {
          "week": 4,
          "focus": "Đo InBody mốc 1 & Deload nhẹ",
          "sessionTargets": 4,
          "sessions": []
        }
      ]
    }
  ],
  "baseline": {
    "initialWeight": ${inbody?.weight || customer.initialWeight || 60},
    "initialBodyFat": ${inbody?.bodyFatPercentage || 20},
    "initialMuscleMass": ${inbody?.muscleMass || 30}
  }
}`;

    const raw = await generateText(prompt);
    const generated = parseJson(raw) as any;

    // Chuẩn hóa tự động đảm bảo tất cả các tuần từ 1 đến hết chu kỳ hiển thị đầy đủ, không bị đứt quãng
    if (generated && Array.isArray(generated.phases)) {
      let currentWeekCounter = 1;
      generated.phases = generated.phases.map((phase: any, pIdx: number) => {
        const duration = phase.durationWeeks || (phase.weeks ? phase.weeks.length : 4);
        const existingWeeks = Array.isArray(phase.weeks) ? phase.weeks : [];
        const fullWeeks = [];

        for (let w = 0; w < duration; w++) {
          const weekNum = currentWeekCounter + w;
          const matchWeek = existingWeeks.find((ew: any) => ew.week === weekNum || ew.week === (w + 1)) || existingWeeks[w];
          if (matchWeek) {
            fullWeeks.push({
              ...matchWeek,
              week: weekNum,
              sessionTargets: matchWeek.sessionTargets || generated.strategy?.sessionsPerWeek || 3,
              sessions: Array.isArray(matchWeek.sessions) && matchWeek.sessions.length > 0 ? matchWeek.sessions : (existingWeeks[0]?.sessions || []),
            });
          } else {
            const templateWeek = existingWeeks[0] || {};
            fullWeeks.push({
              week: weekNum,
              focus: `Tuần ${weekNum}: Phân kỳ huấn luyện theo ${phase.name || `Phase ${pIdx + 1}`}`,
              sessionTargets: generated.strategy?.sessionsPerWeek || 3,
              sessions: templateWeek.sessions || [],
            });
          }
        }
        currentWeekCounter += duration;
        return {
          ...phase,
          order: pIdx + 1,
          durationWeeks: duration,
          weeks: fullWeeks,
        };
      });
    }

    return {
      ...generated,
      customerId: customer._id,
      ptId: user.id,
      createdByAi: true,
      status: 'DRAFT' as const,
      publishedAt: null,
      version: 1,
    };
  }

  const prompt = kind === 'nutrition'
    ? `Tạo kế hoạch dinh dưỡng JSON cho ${customer.fullName}. Yêu cầu: ${request}. Trả title,targetCalories,macros,menu.`
    : `Tạo giáo án JSON cho ${customer.fullName}. Yêu cầu: ${request}. Trả title,sessions.`;
  const generated = parseJson(await generateText(prompt));
  const common = { ...generated, customerId: customer._id, ptId: user.id, createdByAi: true, reviewStatus: 'PT_REVIEW_REQUIRED' as const, status: 'DRAFT' as const, publishedAt: null, version: 1 };
  return kind === 'nutrition' ? NutritionPlan.create(common) : WorkoutPlan.create(common);
}
