import { describe, expect, it } from 'vitest';
import { analyzeProgress, estimatedOneRepMax } from '../services/progressAnalyticsService.js';

const sessions = [
  { _id: 's1', performedAt: '2026-08-03', attendance: 'PRESENT', exerciseLogs: [{ name: 'Squat', sets: [{ reps: 10, weight: 50, rpe: 7, completed: true }, { reps: 8, weight: 60, rpe: 8, completed: false }] }] },
  { _id: 's2', performedAt: '2026-08-10', attendance: 'LATE', exerciseLogs: [{ name: 'Squat', sets: [{ reps: 5, weight: 70, rpe: 9, completed: true }] }] },
  { _id: 's3', performedAt: '2026-08-18', attendance: 'ABSENT', exerciseLogs: [] },
];

const measurements = [
  { _id: 'm1', measuredAt: '2026-08-01', weight: 70, bodyFatPercentage: 25, measurements: { waist: 85 } },
  { _id: 'm2', measuredAt: '2026-08-31', weight: 68.5, muscleMass: 30, measurements: { waist: 82 } },
];

describe('progress analytics', () => {
  it('calculates workout totals, attendance, streak and records from completed sets only', () => {
    const result = analyzeProgress({ sessions, measurements, periodStart: '2026-08-01', periodEnd: '2026-08-31' });
    expect(result.totalVolume).toBe(850);
    expect(result.averageRpe).toBe(8);
    expect(result.attendance).toEqual({ present: 1, late: 1, absent: 1, rate: 66.7 });
    expect(result.streakWeeks).toBe(2);
    expect(result.achievements).toEqual(expect.arrayContaining([
      expect.objectContaining({ exerciseName: 'Squat', kind: 'MAX_WEIGHT', value: 70, sessionId: 's2' }),
      expect.objectContaining({ exerciseName: 'Squat', kind: 'MAX_REPS', value: 10, sessionId: 's1' }),
      expect.objectContaining({ exerciseName: 'Squat', kind: 'ESTIMATED_1RM', value: 81.7, sessionId: 's2' }),
    ]));
  });

  it('calculates each body delta independently and reports partial data quality', () => {
    const result = analyzeProgress({ sessions, measurements, periodStart: '2026-08-01', periodEnd: '2026-08-31' });
    expect(result.bodyDeltas).toMatchObject({ weight: -1.5, waist: -3 });
    expect(result.bodyDeltas).not.toHaveProperty('bodyFatPercentage');
    expect(result.dataQuality.level).toBe('PARTIAL');
    expect(result.dataQuality.reasons.length).toBeGreaterThan(0);
  });

  it('returns insufficient quality instead of zeroes when no usable data exists', () => {
    const result = analyzeProgress({ sessions: [], measurements: [] });
    expect(result.averageRpe).toBeNull();
    expect(result.attendance.rate).toBeNull();
    expect(result.bodyDeltas).toEqual({});
    expect(result.dataQuality.level).toBe('INSUFFICIENT');
  });

  it('uses the Epley formula and rounds to one decimal place', () => {
    expect(estimatedOneRepMax(70, 5)).toBe(81.7);
  });
});
