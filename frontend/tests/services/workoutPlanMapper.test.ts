import { expect, it } from 'vitest';
import { workoutTemplateToDraft } from '../../src/services/workoutPlanMapper';
import type { WorkoutTemplate } from '../../src/types/workout';

it('tạo bản nháp độc lập từ giáo án mẫu', () => {
  const template: WorkoutTemplate = {
    _id: 't1',
    title: 'Full body',
    targetGoal: 'FAT_LOSS',
    level: 'BEGINNER',
    version: 2,
    status: 'ACTIVE',
    sessions: [{ name: 'Buổi 1', exercises: [{ name: 'Squat', trackingType: 'STRENGTH', prescription: { sets: 3, reps: '10', restSeconds: 60 } }] }],
  };
  const draft = workoutTemplateToDraft(template);
  expect(draft).toEqual({
    customerId: '',
    title: 'Full body',
    startDate: '',
    endDate: '',
    sessions: [
      {
        name: 'Buổi 1',
        exercises: [{ name: 'Squat', trackingType: 'STRENGTH', prescription: { sets: 3, reps: '10', restSeconds: 60 } }],
      },
    ],
  });
  draft.sessions[0].exercises[0].name = 'Changed';
  expect(template.sessions[0].exercises[0].name).toBe('Squat');
});

it('giữ cấu hình cardio và không tự sinh trường sức mạnh khi gán giáo án', () => {
  const template: WorkoutTemplate = {
    _id: 'cardio',
    title: 'Cardio nền tảng',
    sessions: [{ name: 'Buổi chạy', exercises: [{ name: 'Treadmill Run', trackingType: 'CARDIO', prescription: { durationMinutes: 20, distanceKm: 3 } }] }],
  };
  const draft = workoutTemplateToDraft(template);

  expect(draft.sessions[0].exercises[0]).toEqual({
    name: 'Treadmill Run',
    trackingType: 'CARDIO',
    prescription: { durationMinutes: 20, distanceKm: 3 },
  });
  expect(draft.sessions[0].exercises[0]).not.toHaveProperty('sets');
  expect(draft.sessions[0].exercises[0]).not.toHaveProperty('reps');
  expect(draft.sessions[0].exercises[0].prescription).not.toBe(template.sessions[0].exercises[0].prescription);
});

it('đánh dấu bài trong giáo án cũ là chưa phân loại', () => {
  const draft = workoutTemplateToDraft({ _id: 'legacy', title: 'Legacy', sessions: [{ name: 'Buổi 1', exercises: [{ name: 'Row', sets: 3, reps: '10' }] }] });
  expect(draft.sessions[0].exercises[0]).toEqual({ name: 'Row', trackingType: 'UNCLASSIFIED', prescription: {} });
});
