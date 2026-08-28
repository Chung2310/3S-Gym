import { describe, expect, it } from 'vitest';
import { generateSmartRoadmap } from '../../src/services/roadmapGenerator';
import type { InBodyRecordData } from '../../src/types/inbody';

describe('Roadmap & Goal Intelligence Engine (roadmapGenerator)', () => {
  const mockCustomer = {
    _id: 'cust-1',
    fullName: 'Nguyễn Văn Nam',
    gender: 'MALE',
    height: 175,
    initialWeight: 80,
    medicalNotes: 'Khớp gối trái từng chấn thương nhẹ',
  };

  const mockInbody: InBodyRecordData = {
    _id: 'inbody-1',
    customerId: 'cust-1',
    measurementDate: '2026-08-28T00:00:00.000Z',
    weight: 80,
    bmi: 26.1,
    bodyFatPercentage: 24.5,
    bodyFatMass: 19.6,
    muscleMass: 33.2,
    bmr: 1720,
    visceralFatLevel: 9,
    inbodyScore: 72,
    status: 'PUBLISHED',
  };

  it('sinh lộ trình Giảm mỡ 12 tuần với 4 phase và thâm hụt calo chuẩn khoa học', () => {
    const proposal = generateSmartRoadmap(mockCustomer, mockInbody, {
      type: 'FAT_LOSS',
      targetValue: 5,
      targetUnit: 'kg',
      durationWeeks: 12,
      sessionsPerWeek: 4,
      customNotes: 'Ưu tiên siết mỡ bụng',
    });

    expect(proposal.title).toContain('Giảm mỡ & Giảm 5kg 12 tuần');
    expect(proposal.strategy.estimatedWeeks).toBe(12);
    expect(proposal.strategy.sessionsPerWeek).toBe(4);
    expect(proposal.strategy.trainingMethod).toContain('Hypertrophy');
    expect(proposal.strategy.cardioProtocol).toContain('Zone 2');
    expect(proposal.strategy.nutrition.calorieDeficitOrSurplus).toBe(-450);
    expect(proposal.strategy.nutrition.proteinGrams).toBe(160); // 80kg * 2.0g
    expect(proposal.strategy.checkpoints.length).toBeGreaterThanOrEqual(3);

    // Kiểm tra cấu trúc Phases -> Weeks -> Sessions
    expect(proposal.phases.length).toBe(4); // 12 tuần = 4 phases (mỗi phase 3 tuần)
    expect(proposal.phases[0].weeks.length).toBe(3);
    expect(proposal.phases[0].weeks[0].sessions?.length).toBe(4);
    expect(proposal.phases[0].weeks[0].sessions?.[0].exercises.length).toBeGreaterThan(0);
  });

  it('sinh lộ trình Tăng cơ nạc với thặng dư calo và mức protein 2.2g/kg', () => {
    const proposal = generateSmartRoadmap(mockCustomer, mockInbody, {
      type: 'MUSCLE_GAIN',
      targetValue: 3,
      targetUnit: 'kg',
      durationWeeks: 16,
      sessionsPerWeek: 4,
    });

    expect(proposal.title).toContain('Tăng cơ nạc & Tăng 3kg 16 tuần');
    expect(proposal.strategy.estimatedWeeks).toBe(16);
    expect(proposal.strategy.nutrition.calorieDeficitOrSurplus).toBe(300);
    expect(proposal.strategy.nutrition.proteinGrams).toBe(176); // 80kg * 2.2g
    expect(proposal.phases.length).toBe(4); // 16 tuần = 4 phases
  });

  it('hỗ trợ trường hợp học viên nữ chưa có InBody (sử dụng baseline fallback)', () => {
    const femaleCustomer = {
      _id: 'cust-2',
      fullName: 'Trần Thị Mai',
      gender: 'FEMALE',
      height: 160,
      initialWeight: 58,
    };

    const proposal = generateSmartRoadmap(femaleCustomer, null, {
      type: 'RECOMPOSITION',
      targetValue: 4,
      targetUnit: '% mỡ',
      durationWeeks: 8,
      sessionsPerWeek: 3,
    });

    expect(proposal.title).toContain('Trần Thị Mai');
    expect(proposal.strategy.estimatedWeeks).toBe(8);
    expect(proposal.strategy.sessionsPerWeek).toBe(3);
    expect(proposal.phases.length).toBe(3);
    expect(proposal.phases[0].weeks[0].sessions?.length).toBe(3);
  });
});
