import { describe, expect, it } from 'vitest';
import { TRACKING_METRICS } from '../types/exerciseTracking.js';
import {
  assertCompatibleResult,
  normalizePlanExercise,
  normalizeSessionExerciseLog,
} from '../services/exerciseTrackingService.js';

describe('exercise tracking contract', () => {
  it('declares an explicit metric set for every tracking type', () => {
    expect(TRACKING_METRICS).toEqual({
      UNCLASSIFIED: [],
      STRENGTH: ['sets'],
      BODYWEIGHT: ['sets'],
      CARDIO: ['durationMinutes', 'distanceKm', 'paceSecondsPerKm', 'averageHeartRate', 'inclinePercent', 'calories', 'rpe'],
      INTERVAL: ['rounds', 'workSeconds', 'restSeconds', 'distanceMetersPerRound', 'repsPerRound', 'rpe'],
      MOBILITY: ['durationMinutes', 'reps', 'side', 'discomfort'],
    });
  });

  it('keeps an old plan exercise unclassified instead of guessing from its name', () => {
    expect(normalizePlanExercise({ name: 'Chạy bộ', sets: 3, reps: '10' })).toEqual({
      name: 'Chạy bộ',
      sets: 3,
      reps: '10',
      trackingType: 'UNCLASSIFIED',
      prescription: {},
    });
  });

  it('adapts an old completed set log to legacy strength without mutating it', () => {
    const legacy = { name: 'Squat', sets: [{ reps: 8, weight: 60, rpe: 0, completed: true }] };
    const normalized = normalizeSessionExerciseLog(legacy);

    expect(normalized).toMatchObject({
      name: 'Squat',
      trackingType: 'LEGACY_STRENGTH',
      result: { sets: [{ reps: 8, weight: 60, rpe: 0, completed: true }] },
    });
    expect(legacy).not.toHaveProperty('trackingType');
  });

  it('rejects metrics that do not belong to the tracking type', () => {
    expect(() => assertCompatibleResult('CARDIO', { durationMinutes: 20, weight: 40 })).toThrow(
      'CARDIO không hỗ trợ chỉ số weight.',
    );
  });

  it('preserves zero and removes empty optional values', () => {
    expect(assertCompatibleResult('CARDIO', {
      durationMinutes: 20,
      inclinePercent: 0,
      calories: undefined,
    })).toEqual({ durationMinutes: 20, inclinePercent: 0 });
  });
});
