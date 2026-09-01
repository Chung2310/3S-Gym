import { describe, expect, it } from 'vitest';
import {
  workoutGenerationRequestSchema,
  workoutProposalRequestSchema,
} from '../validators/aiWorkoutValidator.js';

const proposal = {
  durationWeeks: 8,
  sessionsPerWeek: 3,
  minutesPerSession: 60,
  level: 'BEGINNER',
  trainingMethod: 'Full body',
  trainingSplit: 'Full body',
  priorityMuscleGroups: [],
  restrictions: [],
};

const availabilitySlots = [
  { dayNumber: 1, startMinute: 1080, endMinute: 1200 },
  { dayNumber: 3, startMinute: 1080, endMinute: 1200 },
];

describe('AI workout availability request validation', () => {
  it('requires availability for proposal and generation requests', () => {
    expect(workoutProposalRequestSchema.body!.validate({
      customerId: '507f1f77bcf86cd799439011',
    }).error).toBeDefined();
    expect(workoutGenerationRequestSchema.body!.validate({
      customerId: '507f1f77bcf86cd799439011',
      proposal,
    }).error).toBeDefined();
  });

  it('accepts recurring non-overlapping 15-minute slots', () => {
    expect(workoutProposalRequestSchema.body!.validate({
      customerId: '507f1f77bcf86cd799439011',
      availabilitySlots,
    }).error).toBeUndefined();
  });

  it.each([
    { slots: [{ dayNumber: 0, startMinute: 1080, endMinute: 1200 }] },
    { slots: [{ dayNumber: 1, startMinute: 1081, endMinute: 1200 }] },
    { slots: [{ dayNumber: 1, startMinute: 1200, endMinute: 1080 }] },
    {
      slots: [
        { dayNumber: 1, startMinute: 1080, endMinute: 1200 },
        { dayNumber: 1, startMinute: 1140, endMinute: 1260 },
      ],
    },
  ])('rejects invalid availability %#', ({ slots }) => {
    expect(workoutProposalRequestSchema.body!.validate({
      customerId: '507f1f77bcf86cd799439011',
      availabilitySlots: slots,
    }, { abortEarly: false }).error).toBeDefined();
  });
});
