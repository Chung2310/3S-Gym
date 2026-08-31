import { TRACKING_METRICS, TRACKING_TYPES, type SessionTrackingType, type TrackingResult, type TrackingType } from '../types/exerciseTracking.js';

type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null && !Array.isArray(value);

export function isTrackingType(value: unknown): value is TrackingType {
  return typeof value === 'string' && TRACKING_TYPES.includes(value as TrackingType);
}

export function normalizePlanExercise<T extends UnknownRecord>(value: T): T & { trackingType: TrackingType; prescription: UnknownRecord } {
  const trackingType = isTrackingType(value.trackingType) ? value.trackingType : 'UNCLASSIFIED';
  return { ...value, trackingType, prescription: isRecord(value.prescription) ? { ...value.prescription } : {} };
}

export function normalizeSessionExerciseLog<T extends UnknownRecord>(value: T): T & { trackingType: SessionTrackingType; result: UnknownRecord } {
  const explicitType = value.trackingType;
  const trackingType: SessionTrackingType = explicitType === 'LEGACY_STRENGTH' || isTrackingType(explicitType)
    ? explicitType
    : Array.isArray(value.sets) ? 'LEGACY_STRENGTH' : 'UNCLASSIFIED';
  const result = isRecord(value.result)
    ? { ...value.result }
    : trackingType === 'LEGACY_STRENGTH' ? { sets: structuredClone(value.sets) } : {};
  return { ...value, trackingType, result };
}

export function assertCompatibleResult(trackingType: Exclude<SessionTrackingType, 'LEGACY_STRENGTH'>, result: UnknownRecord): TrackingResult {
  if (trackingType === 'UNCLASSIFIED') throw new Error('Bài tập chưa được phân loại cách ghi nhận.');
  const allowed = TRACKING_METRICS[trackingType] as readonly string[];
  const cleaned: UnknownRecord = {};
  for (const [key, value] of Object.entries(result)) {
    if (!allowed.includes(key)) throw new Error(`${trackingType} không hỗ trợ chỉ số ${key}.`);
    if (value !== undefined && value !== null && value !== '') cleaned[key] = value;
  }
  return cleaned as unknown as TrackingResult;
}
