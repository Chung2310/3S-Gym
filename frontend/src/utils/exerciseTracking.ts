import type { Exercise, TrackingPrescription, TrackingType } from '../types';

export function defaultPrescriptionFor(type: TrackingType): TrackingPrescription {
  switch (type) {
    case 'STRENGTH':
    case 'BODYWEIGHT': return { sets: 3, reps: '10', restSeconds: 60 };
    case 'CARDIO': return { durationMinutes: 20 };
    case 'INTERVAL': return { rounds: 6, workSeconds: 30, restSeconds: 30 };
    case 'MOBILITY': return { durationMinutes: 5, side: 'BOTH' };
    default: return {};
  }
}

export function planExerciseFromLibrary(exercise: Exercise) {
  const trackingType = exercise.defaultTrackingType ?? 'UNCLASSIFIED';
  return { exerciseId: exercise._id, name: exercise.name, trackingType, prescription: { ...defaultPrescriptionFor(trackingType) } };
}

export function normalizePlanExercise<T extends object>(exercise: T): T & { trackingType: TrackingType; prescription: TrackingPrescription } {
  const source = exercise as Record<string, unknown>;
  const trackingType = typeof source.trackingType === 'string' && ['UNCLASSIFIED', 'STRENGTH', 'BODYWEIGHT', 'CARDIO', 'INTERVAL', 'MOBILITY'].includes(source.trackingType)
    ? source.trackingType as TrackingType
    : 'UNCLASSIFIED';
  const prescription = typeof source.prescription === 'object' && source.prescription !== null && !Array.isArray(source.prescription)
    ? { ...source.prescription } as TrackingPrescription
    : {};
  return { ...exercise, trackingType, prescription };
}

export function changeTrackingType<T extends object>(exercise: T, trackingType: TrackingType): T & { trackingType: TrackingType; prescription: TrackingPrescription } {
  return { ...exercise, trackingType, prescription: { ...defaultPrescriptionFor(trackingType) } };
}
