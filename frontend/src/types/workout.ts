export interface WorkoutTemplateExercise {
  name: string;
  sets?: number;
  reps?: string;
  weight?: string;
  restSeconds?: number;
  tempo?: string;
  notes?: string;
  exerciseId?: string;
}

export interface WorkoutTemplateSession {
  name: string;
  exercises: WorkoutTemplateExercise[];
}

export interface WorkoutTemplate {
  _id: string;
  title: string;
  description?: string;
  level?: string;
  targetGoal?: string;
  sessions: WorkoutTemplateSession[];
  status?: string;
  version?: number;
}

export interface CustomerWorkoutPlanExercise {
  name: string;
  sets: number;
  reps: string;
  weight: string;
  rest: string;
  tempo: string;
  notes: string;
  exerciseId?: string;
}

export interface CustomerWorkoutPlanSession {
  name: string;
  exercises: CustomerWorkoutPlanExercise[];
}

export interface CustomerWorkoutPlanDraft {
  customerId: string;
  title: string;
  startDate: string;
  endDate: string;
  sessions: CustomerWorkoutPlanSession[];
}

export interface CustomerWorkoutPlan extends CustomerWorkoutPlanDraft {
  [key: string]: unknown;
  _id: string;
  status: 'DRAFT' | 'PUBLISHED';
  version?: number;
}
