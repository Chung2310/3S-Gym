// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CustomerOverview from '../../../src/components/customer-portal/CustomerOverview';
import CustomerWorkouts from '../../../src/components/customer-portal/CustomerWorkouts';
import CustomerNutrition from '../../../src/components/customer-portal/CustomerNutrition';
import CustomerRoadmap from '../../../src/components/customer-portal/CustomerRoadmap';
import CustomerInBodyGoals from '../../../src/components/customer-portal/CustomerInBodyGoals';
import CustomerSessions from '../../../src/components/customer-portal/CustomerSessions';
import CustomerReportsPhotos from '../../../src/components/customer-portal/CustomerReportsPhotos';
import type { CustomerJourneyDto } from '../../../src/types/progress';

const mockJourney: CustomerJourneyDto = {
  customer: {
    _id: 'cust-123',
    fullName: 'Hoàng Anh',
    phone: '0909123456',
    gender: 'MALE',
    height: 175,
    initialWeight: 75,
    initialGoal: 'Giảm 5kg mỡ và tăng cơ ngực',
    status: 'ACTIVE',
    assignedPt: {
      _id: 'pt-001',
      fullName: 'HLV Tuấn Kiệt',
      username: 'tuankiet',
      phone: '0988776655',
      email: 'kiet@3sgym.vn',
    },
    packages: [
      {
        name: 'Gói PT 1-1 Chuyên Sâu 36 Buổi',
        totalSessions: 36,
        usedSessions: 12,
        remainingSessions: 24,
        startDate: '2026-08-01',
        endDate: '2026-12-31',
        status: 'ACTIVE',
      },
    ],
    activePackage: {
      name: 'Gói PT 1-1 Chuyên Sâu 36 Buổi',
      totalSessions: 36,
      usedSessions: 12,
      remainingSessions: 24,
      startDate: '2026-08-01',
      endDate: '2026-12-31',
      status: 'ACTIVE',
    },
  },
  plans: {
    active: {
      _id: 'plan-active',
      title: 'Giáo Án Tăng Cơ Hypertrophy 4 Buổi',
      goal: 'Tăng cơ nạc và nâng cao thể lực',
      level: 'Nâng cao',
      muscleGroups: ['Ngực', 'Lưng', 'Chân', 'Vai'],
      technicalNotes: 'Khởi động kỹ khớp vai trước khi đẩy tạ nặng',
      sessions: [
        {
          name: 'Ngày 1: Ngực & Tay sau',
          exercises: [
            {
              name: 'Barbell Bench Press',
              sets: 4,
              reps: '8 - 10',
              weight: '70 kg',
              rest: '90s',
              tempo: '3-0-1-0',
              notes: 'Gồng core và ép bả vai xuống ghế',
            },
            {
              name: 'Incline Dumbbell Press',
              sets: 3,
              reps: '10 - 12',
              weight: '24 kg',
              rest: '60s',
              tempo: '2-0-1-0',
              notes: 'Hạ sâu kéo căng ngực trên',
            },
          ],
        },
        {
          name: 'Ngày 2: Lưng & Tay trước',
          exercises: [
            {
              name: 'Lat Pulldown',
              sets: 4,
              reps: '10 - 12',
              weight: '55 kg',
              rest: '60s',
              tempo: '2-0-1-0',
            },
          ],
        },
      ],
    },
    history: [
      {
        _id: 'plan-old-1',
        title: 'Giáo án Thích nghi 4 tuần đầu',
        goal: 'Học form chuẩn các bài cơ bản',
        archivedAt: '2026-08-01',
      },
    ],
  },
  nutritionPlans: [
    {
      _id: 'nutri-01',
      title: 'Thực đơn Tăng Cơ Nạc 2200 Kcal',
      targetCalories: 2200,
      bmr: 1650,
      tdee: 2400,
      macros: {
        protein: 165,
        carbs: 240,
        fat: 60,
      },
      menu: [
        {
          meal: 'Bữa sáng',
          time: '07:30',
          calories: 550,
          items: [
            { name: 'Yến mạch + Sữa hạt', weightGrams: 80, calories: 300, protein: 12 },
            { name: 'Trứng gà luộc (3 quả)', weightGrams: 150, calories: 250, protein: 20 },
          ],
        },
        {
          meal: 'Bữa trưa',
          time: '12:00',
          calories: 750,
          items: [
            { name: 'Ức gà áp chảo', weightGrams: 200, calories: 330, protein: 62 },
            { name: 'Cơm gạo lứt', weightGrams: 150, calories: 220, protein: 5 },
          ],
        },
      ],
      notes: 'Uống đủ nước, hạn chế đồ ngọt và dầu mỡ bão hòa.',
      status: 'PUBLISHED',
      publishedAt: '2026-08-15',
    },
  ],
  roadmaps: [
    {
      _id: 'road-01',
      customerId: 'cust-123',
      title: 'Lộ Trình Toàn Diện 12 Tuần',
      strategy: {
        targetSummary: 'Giảm 4kg mỡ, tăng 2kg cơ trong 12 tuần',
        estimatedWeeks: 12,
        sessionsPerWeek: 4,
        trainingMethod: 'Hypertrophy & Progressive Overload',
        trainingSplit: 'Upper / Lower Split',
        cardioProtocol: 'Zone 2 Cardio 20 phút sau buổi tập',
        nutritionStrategy: 'High Protein, Calorie Deficit 200 Kcal',
        checkpoints: [
          { week: 4, title: 'Đánh giá Form & InBody lần 1', description: 'Đo lại chỉ số và điều chỉnh tạ' },
          { week: 8, title: 'Đánh giá Hypertrophy lần 2', description: 'Kiểm tra độ tăng cơ và vòng ngực' },
        ],
      },
      phases: [
        {
          order: 1,
          name: 'Giai đoạn 1: Nền tảng & Thích nghi',
          durationWeeks: 4,
          goals: ['Chuẩn hóa kỹ thuật Squat, Bench, Deadlift', 'Tăng sức bền tim mạch'],
          weeks: [
            { week: 1, focus: 'Làm quen mức tạ cơ bản 60% 1RM', sessionTargets: 3 },
            { week: 2, focus: 'Tăng dần volume và cải thiện nhịp thở', sessionTargets: 4 },
          ],
        },
        {
          order: 2,
          name: 'Giai đoạn 2: Tăng tiến tải trọng (Progressive Overload)',
          durationWeeks: 4,
          goals: ['Tăng mức tạ 5-10%', 'Tối ưu kích thích phì đại cơ'],
          weeks: [{ week: 5, focus: 'Đẩy tạ 75% 1RM với RPE 8', sessionTargets: 4 }],
        },
      ],
      status: 'PUBLISHED',
      version: 1,
    },
  ],
  goals: [
    {
      _id: 'goal-01',
      type: 'FAT_LOSS',
      title: 'Giảm mỡ toàn thân xuống dưới 15%',
      targetValue: 15,
      targetUnit: '%',
      deadline: '2026-11-30',
      status: 'PUBLISHED',
      cardioNotes: 'Chạy bộ 3 buổi / tuần',
      evaluationNotes: 'Đang duy trì tốc độ giảm mỡ rất tốt',
    },
  ],
  inbodyRecords: [
    {
      _id: 'inbody-rec-01',
      measurementDate: '2026-08-20',
      weight: 72.5,
      muscleMass: 33.2,
      bodyFatMass: 12.8,
      bodyFatPercentage: 17.6,
      bmr: 1680,
      inbodyScore: 82,
      segmentalMuscle: {
        rightArm: 3.4,
        leftArm: 3.3,
        trunk: 24.1,
        rightLeg: 8.5,
        leftLeg: 8.4,
      },
      strengths: 'Khối lượng cơ thân trên phát triển đều',
      priorities: 'Tăng cường sức mạnh nhóm cơ đùi sau',
      consultationNotes: 'Cần bổ sung thêm 20g protein sau buổi tập để phục hồi cơ bắp.',
      status: 'PUBLISHED',
    },
  ],
  sessions: [
    {
      _id: 'sess-01',
      performedAt: '2026-08-28',
      attendance: 'PRESENT',
      planSnapshot: { title: 'Hypertrophy Day 1' },
      exerciseLogs: [
        {
          name: 'Barbell Bench Press',
          sets: [
            { reps: 10, weight: 65, rpe: 8, completed: true },
            { reps: 8, weight: 70, rpe: 8.5, completed: true },
          ],
          notes: 'Form chuẩn, khóa khớp vai tốt',
        },
      ],
      feeling: 'Sung sức',
      notes: 'Buổi tập rất hiệu quả, giữ vững phong độ!',
    },
  ],
  measurements: [
    {
      _id: 'm-01',
      measuredAt: '2026-08-20',
      weight: 72.5,
      bodyFatPercentage: 17.6,
      muscleMass: 33.2,
      measurements: {
        chest: 98,
        waist: 79,
        hips: 95,
        arm: 34,
        thigh: 56,
        calf: 36,
      },
    },
  ],
  calendar: [
    {
      _id: 'cal-01',
      title: 'Buổi tập Lưng & Tay trước với PT Kiệt',
      startsAt: '2026-09-02T18:00:00.000Z',
      location: 'Phòng Tập 3S Tầng 2',
      notes: 'Nhớ mang theo khăn tập và bình nước',
    },
  ],
  photos: [
    {
      _id: 'pho-01',
      photoUrl: 'https://example.com/progress-front.jpg',
      stage: 'MONTH_1',
      takenDate: '2026-08-20',
    },
  ],
  reports: [
    {
      _id: 'rep-01',
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      summary: 'Tháng 8 hoàn thành xuất sắc mục tiêu giảm 2.5kg mỡ và tăng khối lượng cơ ngực.',
      status: 'PUBLISHED',
      metrics: {
        weightDelta: -2.5,
        totalVolume: 8500,
      },
    },
  ],
  analytics: {
    totalSessions: 8,
    totalVolume: 8500,
    averageRpe: 8.2,
    attendance: { present: 8, late: 0, absent: 0, rate: 100 },
    streakWeeks: 3,
    tracking: {
      strength: { totalVolumeKg: 0, maxWeightKg: null, maxReps: null, estimated1RmKg: null },
      bodyweight: { totalReps: 0, maxReps: null, maxAddedWeightKg: null },
      cardio: { durationMinutes: 0, distanceKm: 0, bestPaceSecondsPerKm: null, averageHeartRate: null },
      interval: { totalRounds: 0, workSeconds: 0, restSeconds: 0 },
      mobility: { durationMinutes: 0, completedReps: 0, averageDiscomfort: null },
    },
    achievements: [
      {
        exerciseName: 'Barbell Bench Press',
        kind: 'MAX_WEIGHT',
        value: 70,
        achievedAt: '2026-08-28',
        sessionId: 'sess-01',
        isNewInPeriod: true,
      },
    ],
    dataQuality: { level: 'COMPLETE', reasons: [] },
  },
};

describe('Customer Portal Components', () => {
  it('CustomerOverview renders PT info, package progress, and analytics', () => {
    const onNavigateTab = vi.fn();
    render(<CustomerOverview journey={mockJourney} onNavigateTab={onNavigateTab} />);

    expect(screen.getByText(/Xin chào, Hoàng Anh!/i)).toBeInTheDocument();
    expect(screen.getByText('HLV Tuấn Kiệt')).toBeInTheDocument();
    expect(screen.getByText(/Gói PT 1-1 Chuyên Sâu 36 Buổi/i)).toBeInTheDocument();
    expect(screen.getByText(/Còn lại: 24 buổi/i)).toBeInTheDocument();
    expect(screen.getByText(/^8 buổi$/i)).toBeInTheDocument();
    expect(screen.getByText(/3 TUẦN LIÊN TỤC/i)).toBeInTheDocument();
  });

  it('CustomerWorkouts renders active workout plan details and days', async () => {
    const user = userEvent.setup();
    render(<CustomerWorkouts journey={mockJourney} />);

    expect(screen.getByText('Giáo Án Tăng Cơ Hypertrophy 4 Buổi')).toBeInTheDocument();
    expect(screen.getByText(/Khởi động kỹ khớp vai/i)).toBeInTheDocument();
    expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
    expect(screen.getByText('70 kg')).toBeInTheDocument();
    expect(screen.getByText('3-0-1-0')).toBeInTheDocument();

    // Switch day tab
    await user.click(screen.getByRole('button', { name: /Ngày 2: Lưng & Tay trước/i }));
    expect(screen.getByText('Lat Pulldown')).toBeInTheDocument();
  });

  it('CustomerNutrition renders calorie targets, macros and meal items', () => {
    render(<CustomerNutrition journey={mockJourney} />);

    expect(screen.getByText('Thực đơn Tăng Cơ Nạc 2200 Kcal')).toBeInTheDocument();
    expect(screen.getByText(/2.200/i)).toBeInTheDocument();
    expect(screen.getByText(/165/i)).toBeInTheDocument(); // Protein grams
    expect(screen.getByText('Ức gà áp chảo')).toBeInTheDocument();
    expect(screen.getByText('Yến mạch + Sữa hạt')).toBeInTheDocument();
    expect(screen.getByText(/Uống tối thiểu/i)).toBeInTheDocument();
  });

  it('CustomerRoadmap renders strategy, phases and checkpoints', async () => {
    const user = userEvent.setup();
    render(<CustomerRoadmap journey={mockJourney} />);

    expect(screen.getByText('Lộ Trình Toàn Diện 12 Tuần')).toBeInTheDocument();
    expect(screen.getByText('Hypertrophy & Progressive Overload')).toBeInTheDocument();
    expect(screen.getAllByText('Giai đoạn 1: Nền tảng & Thích nghi').length).toBeGreaterThan(0);

    // Click Phase 2
    await user.click(screen.getByText('Giai đoạn 2: Tăng tiến tải trọng (Progressive Overload)'));
    expect(screen.getByText(/Đẩy tạ 75% 1RM với RPE 8/i)).toBeInTheDocument();
  });

  it('CustomerInBodyGoals renders goals, InBody metrics and segmental breakdown', () => {
    render(<CustomerInBodyGoals journey={mockJourney} />);

    expect(screen.getByText('Giảm mỡ toàn thân xuống dưới 15%')).toBeInTheDocument();
    expect(screen.getByText('72.5')).toBeInTheDocument();
    expect(screen.getByText('33.2')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument(); // InBody Score
    expect(screen.getByText('Cần bổ sung thêm 20g protein sau buổi tập để phục hồi cơ bắp.')).toBeInTheDocument();
  });

  it('CustomerSessions renders schedule and workout exercise logs', () => {
    render(<CustomerSessions journey={mockJourney} />);

    expect(screen.getByText('Buổi tập Lưng & Tay trước với PT Kiệt')).toBeInTheDocument();
    expect(screen.getByText('Phòng Tập 3S Tầng 2')).toBeInTheDocument();
    expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Buổi tập rất hiệu quả, giữ vững phong độ!')).toBeInTheDocument();
  });

  it('CustomerReportsPhotos renders progress report, photos and PR badges', () => {
    render(<CustomerReportsPhotos journey={mockJourney} />);

    expect(screen.getByText(/Tháng 8 hoàn thành xuất sắc mục tiêu/i)).toBeInTheDocument();
    expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
    expect(screen.getByAltText('Ảnh tiến độ MONTH_1')).toBeInTheDocument();
  });
});
