export interface CircumferenceMeasurements { [key: string]: number | undefined; chest?: number; waist?: number; hips?: number; arm?: number; thigh?: number; calf?: number }
export interface WorkoutSetLog { reps?: number; weight?: number; rpe?: number; rir?: number; completed: boolean }
export interface WorkoutExerciseLog { exerciseId?: string; name: string; sets: WorkoutSetLog[]; notes?: string }
export interface WorkoutSessionDto { _id: string; performedAt: string; attendance: 'PRESENT' | 'ABSENT' | 'LATE'; absenceReason?: string; planSnapshot: { title?: string; session?: { name?: string } }; exerciseLogs: WorkoutExerciseLog[]; feeling?: string; notes?: string }
export interface BodyMeasurementDto { _id: string; measuredAt: string; weight?: number; bodyFatPercentage?: number; muscleMass?: number; measurements: CircumferenceMeasurements }
export type DataQualityLevel = 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
export interface DataQuality { level: DataQualityLevel; reasons: string[] }
export interface AchievementDto { exerciseName: string; kind: 'MAX_WEIGHT' | 'MAX_REPS' | 'MAX_SET_VOLUME' | 'ESTIMATED_1RM'; value: number; achievedAt: string; sessionId: string; isNewInPeriod: boolean }
export interface JourneyAnalytics { totalVolume: number; averageRpe: number | null; attendance: { present: number; late: number; absent: number; rate: number | null }; streakWeeks: number; achievements: AchievementDto[]; dataQuality: DataQuality }
export interface JourneyProgressReport { [key: string]: unknown; _id: string; periodStart: string; periodEnd: string; summary: string; status: 'DRAFT' | 'PUBLISHED'; metrics?: Record<string, unknown> }
export interface CustomerJourneyDto { customer: { _id: string; fullName: string }; sessions: WorkoutSessionDto[]; measurements: BodyMeasurementDto[]; calendar: Array<Record<string, unknown>>; photos: Array<Record<string, unknown>>; plans: { active: Record<string, unknown> | null; history: Array<Record<string, unknown>> }; reports: JourneyProgressReport[]; analytics: JourneyAnalytics }
