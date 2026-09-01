import { describe, expect, it } from 'vitest';
import {
  workoutGenerationRequestSchema,
  workoutProposalRequestSchema,
} from '../validators/aiWorkoutValidator.js';
import { scheduleWorkoutSessions } from '../services/workoutAvailabilityScheduler.js';

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

describe('AI workout availability scheduler', () => {
  const items = [
    { name: 'Squat', weekNumber: 1, dayNumber: 2, startMinute: 480, durationMinutes: 30 },
    { name: 'Row', weekNumber: 1, dayNumber: 2, startMinute: 510, durationMinutes: 30 },
    { name: 'Run', weekNumber: 1, dayNumber: 4, startMinute: 600, durationMinutes: 60 },
  ];

  it('moves whole sessions into fitting recurring slots and preserves offsets', () => {
    const result = scheduleWorkoutSessions(items, [
      { dayNumber: 1, startMinute: 1080, endMinute: 1140 },
      { dayNumber: 3, startMinute: 1080, endMinute: 1200 },
    ], 2);

    expect(result.scheduledExercises).toEqual([
      expect.objectContaining({ name: 'Squat', dayNumber: 1, startMinute: 1080 }),
      expect.objectContaining({ name: 'Row', dayNumber: 1, startMinute: 1110 }),
      expect.objectContaining({ name: 'Run', dayNumber: 3, startMinute: 1080 }),
    ]);
    expect(result.scheduleWarnings).toEqual([]);
  });

  it('uses at most one slot per day and warns for overflow sessions', () => {
    const result = scheduleWorkoutSessions(items, [
      { dayNumber: 1, startMinute: 1080, endMinute: 1200 },
      { dayNumber: 1, startMinute: 1200, endMinute: 1320 },
    ], 2);

    expect(new Set(result.scheduledExercises.map((item) => item.dayNumber)).size).toBe(2);
    expect(result.scheduleWarnings).toEqual([
      expect.objectContaining({ type: 'OUTSIDE_AVAILABILITY', weekNumber: 1 }),
    ]);
  });

  it('reuses recurring availability in every week', () => {
    const result = scheduleWorkoutSessions([
      { name: 'Week 1', weekNumber: 1, dayNumber: 2, startMinute: 480, durationMinutes: 60 },
      { name: 'Week 2', weekNumber: 2, dayNumber: 4, startMinute: 480, durationMinutes: 60 },
    ], [{ dayNumber: 1, startMinute: 1080, endMinute: 1140 }], 1);

    expect(result.scheduledExercises.map((item) => [
      item.weekNumber,
      item.dayNumber,
      item.startMinute,
    ])).toEqual([
      [1, 1, 1080],
      [2, 1, 1080],
    ]);
  });

  it('falls back when the only slot is too short', () => {
    const result = scheduleWorkoutSessions([
      { name: 'Long session', weekNumber: 1, dayNumber: 2, startMinute: 480, durationMinutes: 60 },
    ], [{ dayNumber: 1, startMinute: 1080, endMinute: 1110 }], 1);

    expect(result.scheduleWarnings).toHaveLength(1);
  });

  it('rejects more sessions than the approved weekly frequency', () => {
    expect(() => scheduleWorkoutSessions([
      { name: 'A', weekNumber: 1, dayNumber: 1, startMinute: 480, durationMinutes: 60 },
      { name: 'B', weekNumber: 1, dayNumber: 2, startMinute: 480, durationMinutes: 60 },
    ], [{ dayNumber: 1, startMinute: 1080, endMinute: 1200 }], 1)).toThrow(/số buổi/i);
  });

  it('rejects a session footprint that cannot fit inside 24 hours', () => {
    expect(() => scheduleWorkoutSessions([
      { name: 'A', weekNumber: 1, dayNumber: 1, startMinute: 1380, durationMinutes: 120 },
    ], [{ dayNumber: 1, startMinute: 1080, endMinute: 1200 }], 1)).toThrow(/24 giờ/i);
  });
});
