import type { Roadmap } from './roadmap';
import type { InBodyRecordData, CustomerGoalData } from './inbody';
import type { MacroNutrients } from './nutrition';
import type { SessionTrackingType, TrackingPrescription, TrackingResult } from './exerciseTracking';

export interface CircumferenceMeasurements { [key: string]: number | undefined; chest?: number; waist?: number; hips?: number; arm?: number; thigh?: number; calf?: number }
export interface WorkoutSetLog { reps?: number; weight?: number; rpe?: number; rir?: number; completed: boolean }
export interface WorkoutExerciseLog { exerciseId?: string; name: string; trackingType?: SessionTrackingType; prescribedSnapshot?: TrackingPrescription; result?: TrackingResult; sets?: WorkoutSetLog[]; notes?: string }
export interface WorkoutSessionDto { _id: string; performedAt: string; attendance: 'PRESENT' | 'ABSENT' | 'LATE'; absenceReason?: string; workoutPlanId?: string; workoutPlanVersion?: number; planSnapshot: { title?: string; session?: { name?: string } }; exerciseLogs: WorkoutExerciseLog[]; feeling?: string; notes?: string }
export interface BodyMeasurementDto { _id: string; measuredAt: string; weight?: number; bodyFatPercentage?: number; muscleMass?: number; measurements: CircumferenceMeasurements }
export type DataQualityLevel = 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
export interface DataQuality { level: DataQualityLevel; reasons: string[] }
export interface AchievementDto { exerciseName: string; kind: 'MAX_WEIGHT' | 'MAX_REPS' | 'MAX_SET_VOLUME' | 'ESTIMATED_1RM'; value: number; achievedAt: string; sessionId: string; isNewInPeriod: boolean }
export interface JourneyAnalytics { totalVolume: number; averageRpe: number | null; attendance: { present: number; late: number; absent: number; rate: number | null }; streakWeeks: number; bodyDeltas?: Record<string, number>; achievements: AchievementDto[]; dataQuality: DataQuality }
export interface JourneyProgressReport { [key: string]: unknown; _id: string; periodStart: string; periodEnd: string; summary: string; status: 'DRAFT' | 'PUBLISHED'; metrics?: Record<string, unknown> }
export interface PtPackageDto {
  _id?: string;
  name: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'COMPLETED' | 'CANCELLED';
}

export interface AssignedPtDto {
  _id: string;
  fullName: string;
  username: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
}

export interface CustomerProfileDto {
  _id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  gender?: string;
  height?: number | null;
  initialWeight?: number | null;
  initialGoal?: string;
  status?: string;
  assignedPt?: AssignedPtDto | null;
  packages?: PtPackageDto[];
  activePackage?: PtPackageDto | null;
}

export interface NutritionPlanMenuItem {
  meal?: string;
  time?: string;
  calories?: number;
  items?: Array<{
    name: string;
    weightGrams?: number;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    unit?: string;
    notes?: string;
  }>;
  [key: string]: unknown;
}

export interface CustomerNutritionPlanDto {
  _id: string;
  title: string;
  bmr?: number | null;
  tdee?: number | null;
  targetCalories: number;
  macros: MacroNutrients;
  menu?: NutritionPlanMenuItem[] | unknown[];
  notes?: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt?: string | null;
  createdAt?: string;
}

export interface CustomerJourneyDto {
  customer: CustomerProfileDto;
  sessions: WorkoutSessionDto[];
  measurements: BodyMeasurementDto[];
  calendar: Array<{
    _id?: string;
    title?: string;
    startsAt?: string;
    endsAt?: string;
    notes?: string;
    location?: string;
    [key: string]: unknown;
  }>;
  photos: Array<{
    _id?: string;
    photoUrl?: string;
    stage?: string;
    angle?: string;
    takenDate?: string;
    [key: string]: unknown;
  }>;
  plans: {
    active: Record<string, unknown> | null;
    history: Array<Record<string, unknown>>;
    published?: Array<Record<string, unknown>>;
  };
  roadmaps?: Roadmap[];
  nutritionPlans?: CustomerNutritionPlanDto[];
  goals?: CustomerGoalData[];
  inbodyRecords?: InBodyRecordData[];
  reports: JourneyProgressReport[];
  analytics: JourneyAnalytics;
}

export interface CustomerProgressOverview { customer: { _id: string; fullName: string; phone: string; status: string }; sessionCount: number; lastSessionAt: string | null; latestMeasurement: Partial<BodyMeasurementDto> | null; analytics: JourneyAnalytics }
