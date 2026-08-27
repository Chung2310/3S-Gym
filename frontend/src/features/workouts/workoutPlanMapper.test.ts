import { expect, it } from 'vitest';
import { workoutTemplateToDraft } from './workoutPlanMapper';
import type { WorkoutTemplate } from './WorkoutTemplateList';

it('tạo bản nháp độc lập từ giáo án mẫu', () => {
  const template: WorkoutTemplate = { _id: 't1', title: 'Full body', goal: 'FAT_LOSS', level: 'BEGINNER', version: 2, status: 'ACTIVE', sessions: [{ name: 'Buổi 1', exercises: [{ name: 'Squat', sets: 3, reps: '10', restSeconds: 60 }] }] };
  const draft = workoutTemplateToDraft(template);
  expect(draft).toEqual({ customerId: '', title: 'Full body', startDate: '', endDate: '', sessions: [{ name: 'Buổi 1', exercises: [{ name: 'Squat', sets: 3, reps: '10', weight: '', rest: '60 giây', tempo: '', notes: '' }] }] });
  draft.sessions[0].exercises[0].name = 'Changed';
  expect(template.sessions[0].exercises[0].name).toBe('Squat');
});
