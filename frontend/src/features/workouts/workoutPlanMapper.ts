import type { WorkoutTemplate } from './WorkoutTemplateList';

export interface CustomerWorkoutPlanExercise { name: string; sets: number; reps: string; weight: string; rest: string; tempo: string; notes: string }
export interface CustomerWorkoutPlanSession { name: string; exercises: CustomerWorkoutPlanExercise[] }
export interface CustomerWorkoutPlanDraft { customerId: string; title: string; startDate: string; endDate: string; sessions: CustomerWorkoutPlanSession[] }
export interface CustomerWorkoutPlan extends CustomerWorkoutPlanDraft { [key: string]: unknown; _id: string; status: 'DRAFT' | 'PUBLISHED'; version?: number }

export function workoutTemplateToDraft(template: WorkoutTemplate): CustomerWorkoutPlanDraft {
  return { customerId: '', title: template.title, startDate: '', endDate: '', sessions: template.sessions.map((session) => ({ name: session.name, exercises: session.exercises.map((exercise) => ({ name: exercise.name, sets: exercise.sets || 3, reps: exercise.reps || '', weight: '', rest: exercise.restSeconds ? `${exercise.restSeconds} giây` : '', tempo: '', notes: '' })) })) };
}
