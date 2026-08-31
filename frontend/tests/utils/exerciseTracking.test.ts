import { describe, expect, it } from 'vitest';
import { changeTrackingType, defaultPrescriptionFor, planExerciseFromLibrary, normalizePlanExercise } from '../../src/utils/exerciseTracking';

describe('exercise tracking plan helpers', () => {
  it('creates type-specific defaults without strength fields on cardio', () => {
    expect(defaultPrescriptionFor('STRENGTH')).toEqual({ sets: 3, reps: '10', restSeconds: 60 });
    expect(defaultPrescriptionFor('CARDIO')).toEqual({ durationMinutes: 20 });
    expect(defaultPrescriptionFor('CARDIO')).not.toHaveProperty('sets');
    expect(defaultPrescriptionFor('CARDIO')).not.toHaveProperty('reps');
  });

  it('copies the library default into an independent plan snapshot', () => {
    const exercise = { _id: 'run-1', name: 'Treadmill Run', muscleGroup: 'CARDIO', level: 'BEGINNER' as const, scope: 'PRIVATE' as const, canManage: true, defaultTrackingType: 'CARDIO' as const };
    const item = planExerciseFromLibrary(exercise);
    expect(item).toMatchObject({ exerciseId: 'run-1', name: 'Treadmill Run', trackingType: 'CARDIO', prescription: { durationMinutes: 20 } });
    expect(item.prescription).not.toBe(defaultPrescriptionFor('CARDIO'));
  });

  it('keeps a legacy plan item unclassified', () => {
    expect(normalizePlanExercise({ name: 'Chạy bộ', sets: 3, reps: '10' })).toMatchObject({ trackingType: 'UNCLASSIFIED', prescription: {} });
  });

  it('discards incompatible prescription fields when changing type', () => {
    expect(changeTrackingType({ name: 'Squat', trackingType: 'STRENGTH', prescription: { sets: 5, reps: '5', targetWeight: 80 } }, 'CARDIO')).toMatchObject({
      trackingType: 'CARDIO', prescription: { durationMinutes: 20 },
    });
  });
});
