import type {
  CustomerWorkoutPlanDraft,
  WorkoutTemplate,
} from '../types/workout';

export function workoutTemplateToDraft(template: WorkoutTemplate): CustomerWorkoutPlanDraft {
  return {
    customerId: '',
    title: template.title,
    startDate: '',
    endDate: '',
    sessions: template.sessions.map((session) => ({
      name: session.name,
      exercises: session.exercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets || 3,
        reps: exercise.reps || '',
        weight: '',
        rest: exercise.restSeconds ? `${exercise.restSeconds} giây` : '',
        tempo: '',
        notes: '',
        exerciseId: exercise.exerciseId,
      })),
    })),
  };
}
