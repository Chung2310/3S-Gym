import CustomerProfile from '../models/CustomerProfile.js';
import NutritionPlan from '../models/NutritionPlan.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import InBodyRecord from '../models/InBodyRecord.js';
import Goal from '../models/Goal.js';
import {
  generateNutritionDraft,
  generateWorkoutDraft,
  generateRoadmapDraft,
  generateNutritionAnalysis,
} from './aiProvider.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { AuthenticatedUser } from '../types/express.js';

function parseJson(text: string): Record<string, unknown> {
  if (!text || typeof text !== 'string') {
    throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI không trả nội dung có cấu trúc hợp lệ.' });
  }

  const cleaned = text.trim();

  // 1. Thử parse trực tiếp
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {}

  // 2. Thử bóc tách từ markdown code block ```json ... ```
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as Record<string, unknown>;
    } catch {}
  }

  // 3. Thử tìm khối ngoặc nhọn ngoài cùng { ... }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const jsonSubstr = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonSubstr) as Record<string, unknown>;
    } catch {}
  }

  throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI không trả nội dung có cấu trúc hợp lệ.' });
}

/**
 * 1. TÁC VỤ RIÊNG BIỆT: TẠO THỰC ĐƠN DINH DƯỠNG CHI TIẾT
 */
export async function createNutritionDraft(user: AuthenticatedUser, customerId: string, request: string) {
  const customer = await CustomerProfile.findById(customerId).lean();
  if (!customer) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy khách hàng.' });
  if (String(customer.assignedPtId) !== user.id && user.role !== 'ADMIN') {
    throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền quản lý khách hàng này.' });
  }

  const [latestInBody, latestGoal] = await Promise.all([
    InBodyRecord.findOne({ customerId: customer._id }).sort({ measurementDate: -1, createdAt: -1 }).lean() as Promise<any>,
    Goal.findOne({ customerId: customer._id }).sort({ createdAt: -1 }).lean() as Promise<any>,
  ]);

  const customerWeight = latestInBody?.weight || customer.initialWeight || 65;
  const customerHeight = customer.height || 170;
  const customerGender = customer.gender || 'MALE';
  const customerGoal = latestGoal?.type || customer.initialGoal || 'Tập luyện khỏe đẹp & Tăng cơ giảm mỡ';
  const customerBf = latestInBody?.bodyFatPercentage || null;
  const customerBmr = latestInBody?.bmr || null;

  const prompt = `Bạn là Chuyên gia dinh dưỡng thể hình & Đầu bếp dinh dưỡng thể thao hàng đầu tại Việt Nam (3S Wellness Fitness & Yoga).
Hãy thiết kế một THỰC ĐƠN MÓN ĂN THỰC TẾ 100% CƠM VIỆT DỄ MUA, DỄ NẤU, ĐẦY ĐỦ DINH DƯỠNG CHO GYMER:

HỌC VIÊN:
- Họ tên: ${customer.fullName}
- Giới tính: ${customerGender === 'MALE' ? 'Nam' : 'Nữ'}
- Chiều cao: ${customerHeight} cm, Cân nặng hiện tại: ${customerWeight} kg
- Body fat InBody: ${customerBf ? customerBf + '%' : 'Chưa có'} | BMR đo thực tế: ${customerBmr ? customerBmr + ' kcal' : 'Chưa có'}
- Mục tiêu thể hình: ${customerGoal}
- Tiền sử sức khỏe & Bệnh lý: ${customer.medicalNotes || 'Bình thường'}

YÊU CẦU CHI TIẾT TỪ PT VÀ NHU CẦU HỌC VIÊN:
${request}

QUY TẮC BẮT BUỘC VỀ MÓN ĂN THỰC TẾ:
1. CẤU TRÚC BỮA CHÍNH (Trưa, Tối): Mỗi bữa chính CHỈ GỒM ĐÚNG 3 MÓN CHUẨN MÂM CƠM GIA ĐÌNH VIỆT:
   - 1 Món đạm chính (Protein): Ức gà áp chảo sốt tiêu, Bò xào cần tỏi / ớt chuông, Cá hồi / Cá thu áp chảo, Thịt heo nạc vai luộc / xào, Tôm rim mặn ngọt nhạt, Trứng cuộn thịt nạc...
   - 1 Món tinh bột phức (Carbs): Cơm gạo lứt (140-160g), Khoai lang luộc / hấp (150g), Cơm trắng (nếu cần)...
   - 1 Món canh / rau (Fiber): Canh cải ngọt nấu tôm / thịt bằm, Canh bí đỏ tôm tươi, Rau muống luộc (kèm nước canh vắt chanh), Bông cải xanh luộc, Salad xà lách dưa chuột cà chua...
2. BỮA SÁNG: Món ăn sáng Việt Nam quen thuộc, đủ chất (Bánh mì đen kẹp 2 trứng ốp la, Phở bò nạc tái, Bún bò nạc, Cháo yến mạch ức gà xé...). Kèm 1 món uống hoặc trái cây nhẹ (Sữa đậu nành không đường, 1 quả chuối già).
3. BỮA PHỤ (Trước / Sau tập): Tinh gọn, tiện lợi (1 muỗng Whey Protein pha nước + 1 quả chuối, HOẶC 1 hũ sữa chua Hy Lạp + hạt / hoa quả, HOẶC 1 củ khoai lang + 2 lòng trắng trứng).
4. CẤM TUYỆT ĐỐI (STRICT PROHIBITIONS):
   - ❌ KHÔNG ĐƯỢC TÁCH nước sốt, gia vị, dầu ăn, nước chấm thành 1 món ăn riêng biệt (CẤM tạo món "Sốt mè rang", CẤM "1 muỗng dầu ô liu", CẤM "Nước mắm tỏi ớt"). Toàn bộ gia vị và nước sốt PHẢI ĐƯỢC GHI VÀO "prepTip" (cách chế biến) của món chính!
   - ❌ KHÔNG BỊA các món dị thường, gượng ép (CẤM "Dưa leo sống chấm tương ớt", CẤM "Cơm trộn hạt sen", CẤM các món không ai ăn ngoài đời thực).
   - ❌ TÍNH TOÁN MACRO CHÍNH XÁC:
     * Thịt nạc, ức gà, tôm, cá: Carbs = 0g (hoặc 1-3g nếu có rau gia vị đi kèm), Protein cao, Fat vừa.
     * Rau xanh, canh, dưa leo: Calo thấp (15-45 kcal), Fat = 0g, Carbs thấp (2-5g), Protein = 1-3g.
     * Cơm lứt, khoai lang: Giàu Carbs (25-35g carbs/100g), Fat = 0-1g, Protein = 2-4g.
5. Trả về DUY NHẤT 1 JSON object hợp lệ, KHÔNG kèm markdown giải thích ngoài JSON:
{
  "title": "Thực Đơn Dinh Dưỡng - ${customer.fullName}",
  "bmr": 1550,
  "tdee": 2250,
  "targetCalories": 1850,
  "macros": { "protein": 140, "carbs": 180, "fat": 50 },
  "menu": [
    {
      "name": "Bữa Sáng",
      "timeSlot": "07:00 - 07:45",
      "calories": 450,
      "items": [
        { "name": "Bánh mì đen kẹp trứng ốp la (2 quả)", "amount": "60g bánh mì + 2 trứng", "calories": 290, "protein": 18, "carbs": 28, "fat": 12, "prepTip": "Áp chảo trứng ít dầu, kẹp kèm vài lát dưa chuột tươi" },
        { "name": "Sữa đậu nành không đường", "amount": "250ml", "calories": 90, "protein": 8, "carbs": 5, "fat": 4, "prepTip": "Uống ấm hoặc để mát buổi sáng" },
        { "name": "Chuối già chín vừa", "amount": "1 quả (80g)", "calories": 70, "protein": 1, "carbs": 18, "fat": 0, "prepTip": "Ăn tráng miệng bổ sung Kali" }
      ]
    },
    {
      "name": "Bữa Trưa",
      "timeSlot": "12:00 - 12:45",
      "calories": 600,
      "items": [
        { "name": "Ức gà áp chảo sốt tiêu đen", "amount": "180g ức gà tươi", "calories": 290, "protein": 45, "carbs": 5, "fat": 6, "prepTip": "Ướp chút muối tiêu, tỏi băm. Áp chảo vàng đều với 1 thìa cafe dầu ô liu" },
        { "name": "Cơm gạo lứt", "amount": "150g cơm chín", "calories": 165, "protein": 4, "carbs": 35, "fat": 1, "prepTip": "Nấu mềm dẻo vừa ăn" },
        { "name": "Canh cải ngọt nấu tôm tươi", "amount": "1 bát tô (150g cải + 30g tôm)", "calories": 145, "protein": 10, "carbs": 4, "fat": 2, "prepTip": "Nấu canh thanh mát, nêm nhạt ít gia vị" }
      ]
    },
    {
      "name": "Bữa Phụ Chiều (Trước Tập)",
      "timeSlot": "16:30 - 17:00",
      "calories": 250,
      "items": [
        { "name": "Whey Protein Isolate", "amount": "1 muỗng (30g)", "calories": 120, "protein": 27, "carbs": 1, "fat": 1, "prepTip": "Pha 250ml nước mát, lắc đều uống trước tập 30 phút" },
        { "name": "Khoai lang vàng luộc", "amount": "1 củ nhỏ (120g)", "calories": 105, "protein": 2, "carbs": 24, "fat": 0, "prepTip": "Luộc hoặc hấp chín trước mang theo" }
      ]
    },
    {
      "name": "Bữa Tối (Sau Tập)",
      "timeSlot": "19:30 - 20:15",
      "calories": 550,
      "items": [
        { "name": "Thịt bò xào cần tây hành tây", "amount": "150g thịt bò nạc + 100g rau", "calories": 280, "protein": 38, "carbs": 6, "fat": 10, "prepTip": "Ướp tỏi gừng, xào nhanh lửa lớn giữ độ ngọt tự nhiên" },
        { "name": "Cơm gạo lứt", "amount": "130g cơm chín", "calories": 145, "protein": 3, "carbs": 30, "fat": 1, "prepTip": "Ăn ấm nóng" },
        { "name": "Rau muống luộc (kèm nước canh vắt chanh)", "amount": "1 đĩa (150g)", "calories": 45, "protein": 4, "carbs": 6, "fat": 0, "prepTip": "Luộc chín giòn, nước luộc vắt chanh làm canh thanh mát" }
      ]
    }
  ],
  "notes": "Uống đủ 2.5 - 3 lít nước mỗi ngày, ăn chậm nhai kỹ và ưu tiên chế biến luộc, hấp, áp chảo ít dầu."
}`;

  const raw = await generateNutritionDraft(prompt);
  const generated = parseJson(raw);
  const plan = {
    ...generated,
    customerId: customer._id,
    ptId: user.id,
    createdByAi: true,
    reviewStatus: 'PT_REVIEW_REQUIRED' as const,
    status: 'DRAFT' as const,
    publishedAt: null,
    version: 1,
  };
  return NutritionPlan.create(plan);
}

/**
 * 2. TÁC VỤ RIÊNG BIỆT: TẠO GIÁO ÁN TẬP LUYỆN (WORKOUT DRAFT)
 */
export async function createWorkoutDraft(user: AuthenticatedUser, customerId: string, request: string) {
  const customer = await CustomerProfile.findById(customerId).lean();
  if (!customer) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy khách hàng.' });
  if (String(customer.assignedPtId) !== user.id && user.role !== 'ADMIN') {
    throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền quản lý khách hàng này.' });
  }

  const prompt = `Bạn là Huấn luyện viên Thể hình 3S Gym. Hãy tạo giáo án thể hình JSON cho học viên ${customer.fullName}.
Yêu cầu từ PT: ${request}.
Trả về DUY NHẤT 1 JSON object hợp lệ gồm: title, sessions (buổi tập, bài tập, sets, reps, restSeconds, targetRpe).`;

  const raw = await generateWorkoutDraft(prompt);
  const generated = parseJson(raw);
  const plan = {
    ...generated,
    customerId: customer._id,
    ptId: user.id,
    createdByAi: true,
    reviewStatus: 'PT_REVIEW_REQUIRED' as const,
    status: 'DRAFT' as const,
    publishedAt: null,
    version: 1,
  };
  return WorkoutPlan.create(plan);
}

/**
 * 3. TÁC VỤ RIÊNG BIỆT: TẠO LỘ TRÌNH HUẤN LUYỆN DÀI HẠN (ROADMAP DRAFT)
 */
export async function createRoadmapDraft(user: AuthenticatedUser, customerId: string, request: string) {
  const customer = await CustomerProfile.findById(customerId).lean();
  if (!customer) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy khách hàng.' });
  if (String(customer.assignedPtId) !== user.id && user.role !== 'ADMIN') {
    throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền quản lý khách hàng này.' });
  }

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

  const raw = await generateRoadmapDraft(prompt);
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

/**
 * Hàm điều phối chung tạo Draft (Tương thích ngược)
 */
export async function createDraft(user: AuthenticatedUser, kind: 'nutrition' | 'workout' | 'roadmap', customerId: string, request: string) {
  if (kind === 'nutrition') {
    return createNutritionDraft(user, customerId, request);
  }
  if (kind === 'workout') {
    return createWorkoutDraft(user, customerId, request);
  }
  return createRoadmapDraft(user, customerId, request);
}

export interface NutritionAnalysisPayload {
  customerId?: string;
  weight?: number;
  height?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  age?: number;
  bodyFat?: number;
  bodyType?: string;
  dailySchedule?: string;
  dietaryPreferences?: string;
  medicalNotes?: string;
  fitnessGoal?: string;
  request?: string;
}

/**
 * 4. TÁC VỤ RIÊNG BIỆT: PHÂN TÍCH THỂ TRẠNG & TÍNH TOÁN NĂNG LƯỢNG MACROS BẰNG AI
 */
export async function analyzeNutritionByAi(user: AuthenticatedUser, payload: NutritionAnalysisPayload) {
  let customerName = 'Khách hàng';
  let customerGender = payload.gender || 'MALE';
  let customerWeight = payload.weight || 65;
  let customerHeight = payload.height || 170;
  let customerAge = payload.age || 26;
  let customerBf = payload.bodyFat || null;
  let customerBmr: number | null = null;
  let customerGoal = payload.fitnessGoal || 'Tập luyện khỏe đẹp & Cân đối vóc dáng';
  let medicalNotes = payload.medicalNotes || '';

  if (payload.customerId) {
    const customer = await CustomerProfile.findById(payload.customerId).lean();
    if (customer) {
      if (String(customer.assignedPtId) !== user.id && user.role !== 'ADMIN') {
        throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền quản lý khách hàng này.' });
      }
      customerName = customer.fullName;
      if (customer.gender) customerGender = customer.gender;
      if (customer.height) customerHeight = customer.height;
      if (customer.initialWeight) customerWeight = customer.initialWeight;
      if (customer.initialGoal) customerGoal = customer.initialGoal;
      if (customer.medicalNotes) medicalNotes = `${customer.medicalNotes}. ${medicalNotes}`;

      const [latestInBody, latestGoal] = await Promise.all([
        InBodyRecord.findOne({ customerId: customer._id }).sort({ measurementDate: -1 }).lean() as Promise<any>,
        Goal.findOne({ customerId: customer._id }).sort({ createdAt: -1 }).lean() as Promise<any>,
      ]);

      if (latestInBody) {
        if (latestInBody.weight) customerWeight = latestInBody.weight;
        if (latestInBody.bodyFatPercentage) customerBf = latestInBody.bodyFatPercentage;
        if (latestInBody.bmr) customerBmr = latestInBody.bmr;
      }
      if (latestGoal?.title) customerGoal = `${latestGoal.title} (${latestGoal.type})`;
    }
  }

  const prompt = `Bạn là Chuyên gia Dinh dưỡng Thể hình & Khoa học Trao đổi chất cao cấp tại 3S Wellness Fitness & Yoga.

HỌC VIÊN:
- Họ tên: ${customerName}
- Giới tính: ${customerGender === 'MALE' ? 'Nam' : 'Nữ'}, Tuổi: ${customerAge}, Chiều cao: ${customerHeight} cm, Cân nặng: ${customerWeight} kg
- Body fat: ${customerBf ? `${customerBf}%` : 'Chưa đo'} | BMR đo thực tế: ${customerBmr ? `${customerBmr} kcal` : 'Chưa có'}
- Dạng thể chất & Cơ địa: ${payload.bodyType || 'Bình thường'}
- Lịch trình sinh hoạt & Giờ tập luyện: ${payload.dailySchedule || 'Làm việc giờ hành chính, tập gym buổi chiều tối'}
- Thói quen, Dị ứng & Nhu cầu đặc thù: ${payload.dietaryPreferences || 'Không có dị ứng đặc biệt, ưu tiên món Việt dễ nấu'}
- Tiền sử sức khỏe & Bệnh lý: ${medicalNotes || 'Bình thường, không có tiền sử bệnh lý'}
- Mục tiêu thể hình: ${customerGoal}
${payload.request ? `- Yêu cầu thêm từ PT: ${payload.request}` : ''}

QUY TẮC BẮT BUỘC:
1. Đánh giá thể trạng thực tế, cơ chế chuyển hóa, mức tiêu hao năng lượng NEAT theo lịch làm việc và giờ tập.
2. Tính toán chính xác:
   - BMR
   - TDEE thực tế (chuẩn hóa theo mức vận động thật)
   - Calo mục tiêu (thâm hụt hoặc dư thừa an toàn khoa học)
   - Phân bổ 3 chất đa lượng Macros (Protein, Carbs, Fat) tính theo gram và tỷ lệ % phù hợp với cơ địa/dị ứng.
3. Chia thời điểm nạp calo (Timing) tối ưu cho từng bữa trong ngày khớp với lịch trình sinh hoạt.
4. Trả về DUY NHẤT 1 JSON object hợp lệ:
{
  "summary": "Đánh giá chi tiết thể trạng và cơ chế chuyển hóa...",
  "bmr": 1600,
  "tdee": 2300,
  "targetCalories": 1850,
  "deficitOrSurplus": -450,
  "goalLabel": "Giảm mỡ siết cơ cá nhân hóa",
  "macros": { "protein": 145, "carbs": 170, "fat": 55 },
  "macroCalories": { "proteinKcal": 580, "carbsKcal": 680, "fatKcal": 495 },
  "macroPercentages": { "proteinPct": 33, "carbsPct": 39, "fatPct": 28 },
  "waterLiters": 2.8,
  "timingStrategy": [
    { "time": "07:30", "meal": "Bữa Sáng", "focus": "Trọng tâm dinh dưỡng", "calorieTarget": 450 },
    { "time": "12:00", "meal": "Bữa Trưa", "focus": "Trọng tâm dinh dưỡng", "calorieTarget": 600 },
    { "time": "16:30", "meal": "Bữa Phụ Trước Tập", "focus": "Nạp năng lượng tập", "calorieTarget": 250 },
    { "time": "19:30", "meal": "Bữa Tối Sau Tập", "focus": "Phục hồi cơ bắp", "calorieTarget": 550 }
  ],
  "dietaryAdvice": {
    "recommendedFoods": ["Ức gà", "Trứng", "Cơm lứt"],
    "avoidFoods": ["Đồ chiên rán", "Đường tinh luyện"],
    "supplements": ["Whey Isolate", "Omega 3", "Creatine"],
    "keyNotes": "Lời khuyên then chốt cho học viên..."
  }
}`;

  const raw = await generateNutritionAnalysis(prompt);
  return parseJson(raw);
}
