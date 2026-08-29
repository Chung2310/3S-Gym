import type { WorkoutTemplate } from '../components/workouts/WorkoutTemplateList';

export interface ScheduledExercise {
  id: string;
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
  unscheduledExercises?: Omit<ScheduledExercise, 'id' | 'dayNumber' | 'startMinute'>[];
}

export interface MovePreview {
  id: string;
  startMinute: number;
  valid: boolean;
}
