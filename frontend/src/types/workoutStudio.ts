import type { WorkoutTemplate } from '../components/workouts/WorkoutTemplateList';
import type { TrackingPrescription, TrackingType } from './exerciseTracking';

export interface ScheduledExercise {
  id: string;
  weekNumber?: number;
  dayNumber: number;
  startMinute: number;
  durationMinutes: number;
  exerciseId?: string;
  name: string;
  sets?: number;
  reps?: string;
  weight?: string;
  rpe?: number;
  rir?: number;
  tempo?: string;
  restSeconds?: number;
  notes?: string;
  trackingType?: TrackingType;
  prescription?: TrackingPrescription;
}

export interface TemplateMetadata {
  muscleGroups: string[];
  defaultSets?: number;
  defaultReps: string;
  defaultWeight: string;
  defaultTempo: string;
  technicalNotes: string;
}

export interface StudioTemplate extends WorkoutTemplate {
  muscleGroups?: string[];
  defaultSets?: number;
  defaultReps?: string;
  defaultWeight?: string;
  defaultTempo?: string;
  technicalNotes?: string;
  durationDays?: number;
  scheduledExercises?: Omit<ScheduledExercise, 'id'>[];
  unscheduledExercises?: Omit<ScheduledExercise, 'id' | 'weekNumber' | 'dayNumber' | 'startMinute'>[];
}

export interface MovePreview {
  id: string;
  startMinute: number;
  valid: boolean;
}
