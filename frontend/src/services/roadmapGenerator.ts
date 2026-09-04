import type { InBodyRecordData } from '../types/inbody';

export type RoadmapGoalType =
  | 'WEIGHT_LOSS'
  | 'FAT_LOSS'
  | 'WEIGHT_GAIN'
  | 'MUSCLE_GAIN'
  | 'RECOMPOSITION'
  | 'FITNESS'
  | 'STRENGTH';

export interface RoadmapCustomerMeta {
  _id?: string;
  fullName?: string;
  gender?: string;
  height?: number;
  initialWeight?: number;
  medicalNotes?: string;
  phone?: string;
}

export interface RoadmapGoalInput {
  type: RoadmapGoalType;
  targetValue?: number | null;
  targetUnit?: string;
  durationWeeks?: number; // 4, 8, 12, 16, 24 (default 12)
  sessionsPerWeek?: number; // 3, 4, 5, 6 (default 3 or 4)
  customNotes?: string;
}

export interface RoadmapSessionProposal {
  sessionNumber: number;
  name: string;
  focus: string;
  exercises: string[];
}

export interface RoadmapWeekProposal {
  week: number;
  focus: string;
  sessionTargets?: number;
  sessions?: RoadmapSessionProposal[];
}

export interface RoadmapPhaseProposal {
  order: number;
  name: string;
  durationWeeks: number;
  goals: string[];
  weeks: RoadmapWeekProposal[];
}

export interface RoadmapNutritionStrategy {
  bmr: number;
  tdee: number;
  targetCalories: number;
  calorieDeficitOrSurplus: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterLiters: number;
  advice: string;
}

export interface RoadmapEvaluationCheckpoint {
  week: number;
  title: string;
  description: string;
}

export interface RoadmapStrategyProposal {
  targetSummary: string;
  estimatedWeeks: number;
  sessionsPerWeek: number;
  trainingMethod: string;
  trainingSplit: string;
  cardioProtocol: string;
  nutrition: RoadmapNutritionStrategy;
  checkpoints: RoadmapEvaluationCheckpoint[];
}

export interface GeneratedRoadmapProposal {
  title: string;
  strategy: RoadmapStrategyProposal;
  phases: RoadmapPhaseProposal[];
  baseline: Record<string, number>;
}

// BMR Formula (Mifflin-St Jeor)
function calculateBmr(weight: number, heightCm: number, isFemale: boolean): number {
  if (isFemale) {
    return Math.round(10 * weight + 6.25 * heightCm - 5 * 28 - 161);
  }
  return Math.round(10 * weight + 6.25 * heightCm - 5 * 28 + 5);
}

// TDEE Multiplier
function calculateTdee(bmr: number, sessionsPerWeek: number): number {
  let multiplier = 1.375; // 1-3 sessions
  if (sessionsPerWeek >= 5) multiplier = 1.65;
  else if (sessionsPerWeek >= 4) multiplier = 1.55;
  else if (sessionsPerWeek >= 3) multiplier = 1.45;
  return Math.round(bmr * multiplier);
}

export function generateSmartRoadmap(
  customer: RoadmapCustomerMeta,
  inbody?: InBodyRecordData | null,
  input?: RoadmapGoalInput
): GeneratedRoadmapProposal {
  const goalType: RoadmapGoalType = input?.type || 'FAT_LOSS';
  const durationWeeks = Math.max(4, Math.min(24, Number(input?.durationWeeks) || 12));
  const sessionsPerWeek = Math.max(2, Math.min(6, Number(input?.sessionsPerWeek) || 3));
  const targetValue = input?.targetValue != null ? Number(input.targetValue) : 5;
  const targetUnit = input?.targetUnit || (['FAT_LOSS'].includes(goalType) && targetValue <= 15 ? 'kg' : 'kg');
  const customNotes = (input?.customNotes || '').trim();

  const gender = customer.gender || (typeof inbody?.customerId === 'object' && inbody?.customerId?.gender) || 'MALE';
  const isFemale = gender.toUpperCase() === 'FEMALE' || gender.toUpperCase() === 'NỮ';
  const currentWeight = inbody?.weight || customer.initialWeight || (isFemale ? 55 : 70);
  const heightCm = customer.height || 170;
  const bodyFat = inbody?.bodyFatPercentage || (isFemale ? 28 : 20);
  const muscleMass = inbody?.muscleMass || (isFemale ? 22 : 32);

  const bmr = inbody?.bmr || calculateBmr(currentWeight, heightCm, isFemale);
  const tdee = calculateTdee(bmr, sessionsPerWeek);

  // 1. Calculate Nutrition Strategy based on Goal
  let targetCalories = tdee;
  let calorieDelta = 0;
  let proteinPerKg = 1.8;
  let cardioDesc = '';
  let trainingMethod = '';
  let trainingSplit = '';
  let goalLabel = '';

  switch (goalType) {
    case 'FAT_LOSS':
    case 'WEIGHT_LOSS': {
      calorieDelta = -450;
      targetCalories = Math.max(bmr + 100, tdee + calorieDelta);
      proteinPerKg = 2.0; // High protein to preserve LBM during deficit
      goalLabel = `Giảm mỡ & Giảm ${targetValue}${targetUnit}`;
      trainingMethod = 'Kháng lực Hypertrophy + Tối ưu hóa tiêu hao năng lượng qua RPE 7-8 và thâm hụt calo';
      trainingSplit = sessionsPerWeek >= 4 ? 'Upper / Lower Split (Thân Trên / Thân Dưới)' : 'Full Body 3 buổi/tuần';
      cardioDesc = 'Cardio Zone 2 (Đi bộ dốc / Đạp xe tốc độ ổn định nhịp tim 120-135 bpm) 20-30 phút cuối buổi tạ + 1 buổi LISS 45 phút vào ngày nghỉ.';
      break;
    }
    case 'MUSCLE_GAIN':
    case 'WEIGHT_GAIN': {
      calorieDelta = +300;
      targetCalories = tdee + calorieDelta;
      proteinPerKg = 2.2;
      goalLabel = `Tăng cơ nạc & Tăng ${targetValue}${targetUnit}`;
      trainingMethod = 'Tăng tiến áp lực (Progressive Overload) + Tập trung thời gian chịu tải (TUT 3-0-1-0) với RPE 8-9';
      trainingSplit = sessionsPerWeek >= 4 ? 'Push - Pull - Legs (Đẩy - Kéo - Chân)' : 'Upper - Lower - Fullbody';
      cardioDesc = 'Cardio duy trì tim mạch nhẹ nhàng 15 phút (Zone 1-2) 2 lần/tuần sau buổi tập, tránh tiêu hao quá nhiều calo thặng dư.';
      break;
    }
    case 'RECOMPOSITION': {
      calorieDelta = -150;
      targetCalories = tdee + calorieDelta;
      proteinPerKg = 2.2;
      goalLabel = `Tái cấu trúc vóc dáng (Giảm ${targetValue}% mỡ & Tăng cơ)`;
      trainingMethod = 'Tập kháng lực nặng các bài tập đa khớp (Compound Lifts) kết hợp luân phiên thâm hụt calo ngày tập và ngày nghỉ';
      trainingSplit = sessionsPerWeek >= 4 ? 'Upper / Lower kết hợp Strength & Hypertrophy' : 'Full Body Compound';
      cardioDesc = 'Tích hợp 15 phút HIIT (Chèo thuyền Concept2 / Battle Rope / Đạp xe nước rút) xen kẽ 2 buổi tạ.';
      break;
    }
    case 'FITNESS':
    case 'STRENGTH':
    default: {
      calorieDelta = 0;
      targetCalories = tdee;
      proteinPerKg = 1.8;
      goalLabel = `Cải thiện Thể lực, Sức bền & Sức mạnh toàn diện`;
      trainingMethod = 'Tăng cường sức mạnh nền tảng (Squat, Deadlift, Bench Press, Overhead Press) + Circuit Conditioning';
      trainingSplit = 'Toàn thân (Full Body Functional Split)';
      cardioDesc = 'Cardio phối hợp chức năng (Rowing, SkiErg, Sled Push, Kettlebell Swing) 25 phút mỗi buổi tập.';
      break;
    }
  }

  // Macro Calculation (Protein 4kcal/g, Fat 9kcal/g, Carb 4kcal/g)
  const proteinGrams = Math.round(currentWeight * proteinPerKg);
  const fatGrams = Math.round((targetCalories * 0.25) / 9);
  const remainingCalories = targetCalories - (proteinGrams * 4 + fatGrams * 9);
  const carbsGrams = Math.max(50, Math.round(remainingCalories / 4));
  const waterLiters = Number(((currentWeight * 0.04) + (sessionsPerWeek >= 4 ? 0.5 : 0.3)).toFixed(1));

  // 2. Build Strategy Proposal
  const checkpoints: RoadmapEvaluationCheckpoint[] = [];
  const phaseCount = durationWeeks >= 12 ? 4 : durationWeeks >= 8 ? 3 : 2;
  const weeksPerPhase = Math.floor(durationWeeks / phaseCount);

  for (let i = 1; i <= phaseCount; i++) {
    const checkWeek = i * weeksPerPhase;
    if (i === phaseCount) {
      checkpoints.push({
        week: durationWeeks,
        title: `Mốc Tổng kết Tuần ${durationWeeks}: Đánh giá Chu kỳ & Chụp ảnh Before/After`,
        description: `Đo lại InBody tổng kết, so sánh với mốc ban đầu (Mục tiêu: ${goalLabel}), kiểm tra sức mạnh tối đa và lập kế hoạch chu kỳ tiếp theo.${customNotes ? ` Lưu ý cá nhân: ${customNotes}` : ''}`,
      });
    } else {
      checkpoints.push({
        week: checkWeek,
        title: `Mốc Đánh giá ${i} (Tuần ${checkWeek}): Đo lại InBody & Tinh chỉnh`,
        description: `Kiểm tra tốc độ ${goalType.includes('FAT') ? 'giảm mỡ' : 'tăng cơ'}, đánh giá khả năng thích nghi cơ xương khớp, tinh chỉnh calo và mức tạ.`,
      });
    }
  }

  const strategy: RoadmapStrategyProposal = {
    targetSummary: `${goalLabel} trong ${durationWeeks} tuần (Tần suất ${sessionsPerWeek} buổi/tuần). Thể trạng: Cân nặng ${currentWeight}kg, % Mỡ ${bodyFat}%, Cơ ${muscleMass}kg.${customNotes ? ` Ghi chú: ${customNotes}` : ''}`,
    estimatedWeeks: durationWeeks,
    sessionsPerWeek,
    trainingMethod,
    trainingSplit,
    cardioProtocol: cardioDesc,
    nutrition: {
      bmr,
      tdee,
      targetCalories,
      calorieDeficitOrSurplus: calorieDelta,
      proteinGrams,
      carbsGrams,
      fatGrams,
      waterLiters,
      advice: calorieDelta < 0
        ? `Thâm hụt ${Math.abs(calorieDelta)} kcal/ngày. Ưu tiên đạm nạc (${proteinGrams}g) để giữ cơ bắp, chia 4 bữa/ngày.`
        : calorieDelta > 0
        ? `Thặng dư ${calorieDelta} kcal/ngày. Tăng cường carb phức hợp trước/sau tập, bổ sung đủ ${proteinGrams}g đạm.`
        : `Duy trì năng lượng cân bằng ${targetCalories} kcal, ăn uống giàu vi chất và uống đủ ${waterLiters}L nước.`,
    },
    checkpoints,
  };

  // 3. Build Multi-phase Periodization Breakdown (Phases -> Weeks -> Sessions)
  const phases: RoadmapPhaseProposal[] = [];
  let currentWeekCounter = 1;

  for (let pIndex = 0; pIndex < phaseCount; pIndex++) {
    const isFirst = pIndex === 0;
    const isLast = pIndex === phaseCount - 1;
    const thisPhaseWeeks = isLast
      ? durationWeeks - currentWeekCounter + 1
      : weeksPerPhase;

    let phaseName = '';
    const phaseGoals: string[] = [];

    if (isFirst) {
      phaseName = `Phase 1: Thích nghi & Chuẩn hóa Kỹ thuật (Tuần ${currentWeekCounter} - ${currentWeekCounter + thisPhaseWeeks - 1})`;
      phaseGoals.push(
        'Chuẩn hóa tư thế và kỹ thuật các bài chuyển động đa khớp (Squat, Deadlift, Push, Pull, Hinge)',
        'Tăng cường độ ổn định của nhóm cơ trung tâm (Core) và độ linh hoạt khớp vai/hông',
        'Kích hoạt trao đổi chất và thiết lập thói quen ghi chép dinh dưỡng'
      );
    } else if (isLast) {
      phaseName = `Phase ${pIndex + 1}: Hoàn thiện, Bứt phá & Đánh giá (Tuần ${currentWeekCounter} - ${currentWeekCounter + thisPhaseWeeks - 1})`;
      phaseGoals.push(
        `Đạt chỉ tiêu mốc ${goalLabel}`,
        'Siết gọn đường nét cơ bắp / Thử thách kiểm tra sức bền & sức mạnh 1RM/3RM',
        'Tổng kết InBody cuối chu kỳ và chuyển giao cẩm nang duy trì phong độ'
      );
    } else {
      phaseName = `Phase ${pIndex + 1}: Tăng cường độ & Đẩy mạnh ${goalType.includes('FAT') ? 'Đốt mỡ' : 'Tăng cơ'} (Tuần ${currentWeekCounter} - ${currentWeekCounter + thisPhaseWeeks - 1})`;
      phaseGoals.push(
        'Áp dụng quy tắc tăng tải trọng tiến tiến (Progressive Overload - tăng mức tạ/reps)',
        'Gia tăng mật độ vận động (Superset/Drop-set) và đẩy nhịp tim vào vùng đốt mỡ tối ưu',
        'Củng cố kỷ luật dinh dưỡng theo đúng chỉ tiêu Macro'
      );
    }

    const weeks: RoadmapWeekProposal[] = [];
    for (let w = 0; w < thisPhaseWeeks; w++) {
      const weekNumber = currentWeekCounter + w;
      let weekFocus = '';

      if (isFirst) {
        weekFocus = w === 0
          ? 'Kiểm tra ROM khớp, làm quen máy tập và chỉnh nhịp thở cơ bản'
          : 'Tăng dần khối lượng tạ vừa phải, kiểm soát tempo chuyển động 3-0-1-0';
      } else if (isLast) {
        weekFocus = w === thisPhaseWeeks - 1
          ? `Đo InBody tổng kết chu kỳ, kiểm tra thành tích và giảm nhẹ tải (Deload nhẹ)`
          : 'Bứt phá cường độ tối đa, siết chặt calo và hoàn thiện form bài tập';
      } else {
        weekFocus = `Gia tăng áp lực cơ bắp (RPE 8), duy trì đều đặn ${sessionsPerWeek} buổi tập`;
      }

      weeks.push({
        week: weekNumber,
        focus: weekFocus,
        sessionTargets: sessionsPerWeek,
        sessions: [],
      });
    }

    phases.push({
      order: pIndex + 1,
      name: phaseName,
      durationWeeks: thisPhaseWeeks,
      goals: phaseGoals,
      weeks,
    });

    currentWeekCounter += thisPhaseWeeks;
  }

  const customerName = customer.fullName || 'Học viên';
  const title = `Lộ trình ${goalLabel} ${durationWeeks} tuần - ${customerName}`;

  return {
    title,
    strategy,
    phases,
    baseline: {
      initialWeight: currentWeight,
      initialBodyFat: bodyFat,
      initialMuscleMass: muscleMass,
      targetCalories,
      sessionsPerWeek,
      bmr,
      tdee,
    },
  };
}
