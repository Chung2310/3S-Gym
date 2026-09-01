import type { ClassifiedTrackingType, TrackingType } from './exerciseTracking';

export interface Exercise {
  [key: string]: unknown;
  _id: string;
  name: string;
  muscleGroup: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  defaultTrackingType?: TrackingType;
  equipment?: string[];
  technique?: string;
  videos?: Array<{ title: string; url: string; source: 'UPLOAD' | 'LINK' }>;
  scope: 'GLOBAL' | 'PRIVATE';
  canManage: boolean;
}

export type AiExerciseGenerationMode = 'SINGLE' | 'BATCH';

export interface AiExerciseDraft {
  name: string;
  muscleGroup: string;
  level: Exercise['level'];
  defaultTrackingType: ClassifiedTrackingType;
  equipment: string[];
  description: string;
  technique: string;
  commonMistakes: string[];
  contraindications: string[];
  variants: string[];
}

export interface AiExerciseGenerationRequest {
  mode: AiExerciseGenerationMode;
  muscleGroup: string;
  level: Exercise['level'];
  defaultTrackingType: ClassifiedTrackingType;
  equipment: string[];
  quantity: number;
  additionalRequest: string;
}
