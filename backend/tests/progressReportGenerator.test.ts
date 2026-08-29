import { expect, it } from 'vitest';
import { generateProgressReport } from '../services/progressReportGenerator.js';

it('generates deterministic Vietnamese facts and a stable metrics snapshot', () => {
  const result = generateProgressReport({ totalVolume: 8500, averageRpe: 7.5, attendance: { present: 8, late: 1, absent: 1, rate: 90 }, streakWeeks: 4, bodyDeltas: { weight: -1.2, waist: -3 }, achievements: [{ exerciseName: 'Squat', kind: 'MAX_WEIGHT', value: 80, isNewInPeriod: true }], dataQuality: { level: 'COMPLETE', reasons: [] } }, { periodStart: '2026-08-01', periodEnd: '2026-08-31' });
  expect(result.summary).toContain('hoàn thành 9/10 buổi');
  expect(result.summary).toContain('cân nặng giảm 1,2 kg');
  expect(result.summary).toContain('1 thành tích mới');
  expect(result.metrics).toMatchObject({ totalVolume: 8500, attendanceRate: 90, weightDelta: -1.2, achievementCount: 1 });
  expect(result.generatorVersion).toBe(1);
});

it('omits unavailable body facts and carries data quality warnings', () => {
  const result = generateProgressReport({ totalVolume: 0, averageRpe: null, attendance: { present: 0, late: 0, absent: 0, rate: null }, streakWeeks: 0, bodyDeltas: {}, achievements: [], dataQuality: { level: 'INSUFFICIENT', reasons: ['Chưa có dữ liệu buổi tập.'] } }, { periodStart: '2026-08-01', periodEnd: '2026-08-31' });
  expect(result.summary).not.toContain('cân nặng');
  expect(result.warnings).toEqual(['Chưa có dữ liệu buổi tập.']);
});
