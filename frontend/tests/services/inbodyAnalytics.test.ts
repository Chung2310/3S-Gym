import { describe, expect, it } from 'vitest';
import {
  analyzeInBody,
  classifyBmi,
  classifyBodyFat,
  classifyInbodyScore,
  classifyVisceralFat,
} from '../../src/services/inbodyAnalytics';
import type { InBodyRecordData } from '../../src/types/inbody';

describe('inbodyAnalytics service', () => {
  describe('classification functions', () => {
    it('phân loại BMI chuẩn Châu Á', () => {
      expect(classifyBmi(17.5)?.status).toBe('UNDER');
      expect(classifyBmi(21.5)?.status).toBe('NORMAL');
      expect(classifyBmi(23.8)?.status).toBe('OVER');
      expect(classifyBmi(23.8)?.label).toBe('Tiền béo phì');
      expect(classifyBmi(26.5)?.status).toBe('OVER');
      expect(classifyBmi(26.5)?.label).toBe('Béo phì');
      expect(classifyBmi(null)).toBeUndefined();
    });

    it('phân loại % mỡ theo giới tính nam và nữ', () => {
      // Nam
      expect(classifyBodyFat(14, 'MALE')?.status).toBe('NORMAL');
      expect(classifyBodyFat(14, 'MALE')?.label).toBe('Lý tưởng');
      expect(classifyBodyFat(26, 'MALE')?.status).toBe('OVER');
      expect(classifyBodyFat(8, 'MALE')?.status).toBe('UNDER');

      // Nữ
      expect(classifyBodyFat(22, 'FEMALE')?.status).toBe('NORMAL');
      expect(classifyBodyFat(34, 'FEMALE')?.status).toBe('OVER');
      expect(classifyBodyFat(16, 'FEMALE')?.status).toBe('UNDER');
    });

    it('phân loại mỡ nội tạng với các mức cảnh báo', () => {
      expect(classifyVisceralFat(3)?.status).toBe('NORMAL');
      expect(classifyVisceralFat(3)?.label).toBe('An toàn & Lý tưởng');
      expect(classifyVisceralFat(8)?.status).toBe('NORMAL');
      expect(classifyVisceralFat(11)?.status).toBe('OVER');
      expect(classifyVisceralFat(11)?.label).toBe('Cảnh báo nguy cơ cao');
      expect(classifyVisceralFat(16)?.label).toBe('Nguy hiểm');
    });

    it('phân loại điểm InBody Score', () => {
      expect(classifyInbodyScore(85)?.label).toBe('Xuất sắc');
      expect(classifyInbodyScore(74)?.label).toBe('Khá tốt');
      expect(classifyInbodyScore(65)?.label).toBe('Trung bình');
      expect(classifyInbodyScore(50)?.label).toBe('Cần cải thiện');
    });
  });

  describe('analyzeInBody service engine', () => {
    const currentScan: InBodyRecordData = {
      _id: 'scan-current',
      customerId: 'cust-1',
      measurementDate: '2026-08-28',
      weight: 72.0,
      bmi: 23.5,
      bodyFatPercentage: 22.0,
      muscleMass: 33.5,
      bmr: 1650,
      visceralFatLevel: 10,
      inbodyScore: 76,
      segmentalMuscle: {
        rightArm: 3.5,
        leftArm: 3.0, // lệch > 10%
        trunk: 24.0,
        rightLeg: 9.0,
        leftLeg: 8.9,
      },
    };

    const previousScan: InBodyRecordData = {
      _id: 'scan-prev',
      customerId: 'cust-1',
      measurementDate: '2026-07-28',
      weight: 74.0,
      bmi: 24.1,
      bodyFatPercentage: 24.5,
      muscleMass: 32.5,
      bmr: 1620,
      visceralFatLevel: 11,
      inbodyScore: 72,
    };

    it('tự động phát hiện điểm mạnh, điểm cần cải thiện, vấn đề ưu tiên và cảnh báo nguy cơ', () => {
      const result = analyzeInBody(currentScan, null, { fullName: 'Nguyễn Văn A', gender: 'MALE' });

      // Điểm mạnh
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.strengths.some((s: string) => s.includes('BMR') || s.includes('cơ'))).toBe(true);

      // Điểm cần cải thiện
      expect(result.improvements.length).toBeGreaterThan(0);
      expect(result.improvements.some((i: string) => i.includes('Mỡ nội tạng') || i.includes('Lệch cơ'))).toBe(true);

      // Cảnh báo mỡ nội tạng >= 10
      expect(result.alerts.some((a) => a.id === 'alert-visceral-danger')).toBe(true);

      // Lệch cơ tay
      expect(result.segmentalAnalysis.muscleImbalanceArm.hasImbalance).toBe(true);

      // Kịch bản tư vấn PT & Tin nhắn mẫu
      expect(result.consultationGuide.talkingPoints.length).toBeGreaterThan(0);
      expect(result.consultationGuide.nutritionAdvice).toContain('kcal');
      expect(result.quickMessage).toContain('Nguyễn Văn A');
      expect(result.quickMessage).toContain('72 kg');
    });

    it('tự động tính toán Delta so sánh và đánh giá xu hướng tiến độ khi có lần đo trước', () => {
      const result = analyzeInBody(currentScan, previousScan, { fullName: 'Nguyễn Văn A', gender: 'MALE' });

      expect(result.comparison).toBeDefined();
      expect(result.comparison?.deltaWeight).toBe(-2.0); // giảm 2kg cân
      expect(result.comparison?.deltaMuscleMass).toBe(1.0); // tăng 1kg cơ
      expect(result.comparison?.deltaFatPercentage).toBe(-2.5); // giảm 2.5% mỡ
      expect(result.comparison?.deltaVisceralFat).toBe(-1); // giảm 1 level mỡ nội tạng
      expect(result.comparison?.trendType).toBe('EXCELLENT');
      expect(result.comparison?.trendSummary).toContain('Tăng 1 kg cơ và giảm 2.5% mỡ');
    });
  });
});
