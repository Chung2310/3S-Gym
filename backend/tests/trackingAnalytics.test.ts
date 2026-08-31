import { expect, it } from 'vitest';
import { analyzeProgress } from '../services/progressAnalyticsService.js';

it('aggregates each tracking type without mixing units and excludes absent sessions', () => {
  const sessions = [
    { _id: 'legacy', performedAt: '2026-08-01', attendance: 'PRESENT', exerciseLogs: [{ name: 'Legacy Squat', sets: [{ weight: 50, reps: 10, rpe: 8, completed: true }] }] },
    { _id: 'strength', performedAt: '2026-08-02', attendance: 'PRESENT', exerciseLogs: [{ name: 'Deadlift', trackingType: 'STRENGTH', result: { sets: [{ weight: 60, reps: 5, rpe: 0, completed: true }] } }] },
    { _id: 'bodyweight', performedAt: '2026-08-03', attendance: 'LATE', exerciseLogs: [{ name: 'Pull-up', trackingType: 'BODYWEIGHT', result: { sets: [{ reps: 10, addedWeight: 5, rpe: 7, completed: true }, { reps: 12, completed: true }] } }] },
    { _id: 'cardio-1', performedAt: '2026-08-04', attendance: 'PRESENT', exerciseLogs: [{ name: 'Run', trackingType: 'CARDIO', result: { durationMinutes: 20, distanceKm: 3, paceSecondsPerKm: 360, averageHeartRate: 0, rpe: 6 } }] },
    { _id: 'cardio-2', performedAt: '2026-08-05', attendance: 'PRESENT', exerciseLogs: [{ name: 'Run', trackingType: 'CARDIO', result: { durationMinutes: 25, distanceKm: 4, paceSecondsPerKm: 330, averageHeartRate: 150, rpe: 8 } }] },
    { _id: 'interval', performedAt: '2026-08-06', attendance: 'PRESENT', exerciseLogs: [{ name: 'Bike Interval', trackingType: 'INTERVAL', result: { rounds: 6, workSeconds: 30, restSeconds: 30 } }] },
    { _id: 'mobility-1', performedAt: '2026-08-07', attendance: 'PRESENT', exerciseLogs: [{ name: 'Hip Flow', trackingType: 'MOBILITY', result: { durationMinutes: 5, reps: 10, discomfort: 0 } }] },
    { _id: 'mobility-2', performedAt: '2026-08-08', attendance: 'PRESENT', exerciseLogs: [{ name: 'Hip Flow', trackingType: 'MOBILITY', result: { durationMinutes: 10, discomfort: 4 } }] },
    { _id: 'absent', performedAt: '2026-08-09', attendance: 'ABSENT', exerciseLogs: [{ name: 'Forged Run', trackingType: 'CARDIO', result: { durationMinutes: 999, distanceKm: 999, paceSecondsPerKm: 1 } }] },
  ];

  const result = analyzeProgress({ sessions: sessions as Parameters<typeof analyzeProgress>[0]['sessions'], measurements: [] });
  expect(result.totalSessions).toBe(9);
  expect(result.totalVolume).toBe(800);
  expect(result.tracking).toEqual({
    strength: { totalVolumeKg: 800, maxWeightKg: 60, maxReps: 10, estimated1RmKg: 70 },
    bodyweight: { totalReps: 22, maxReps: 12, maxAddedWeightKg: 5 },
    cardio: { durationMinutes: 45, distanceKm: 7, bestPaceSecondsPerKm: 330, averageHeartRate: 75 },
    interval: { totalRounds: 6, workSeconds: 30, restSeconds: 30 },
    mobility: { durationMinutes: 15, completedReps: 10, averageDiscomfort: 2 },
  });
  expect(result.achievements).toEqual(expect.arrayContaining([
    expect.objectContaining({ exerciseName: 'Run', kind: 'CARDIO_BEST_PACE', value: 330, trackingType: 'CARDIO', unit: 'sec/km' }),
    expect.objectContaining({ exerciseName: 'Pull-up', kind: 'BODYWEIGHT_MAX_REPS', value: 12, trackingType: 'BODYWEIGHT', unit: 'reps' }),
  ]));
  expect(result.achievements).not.toEqual(expect.arrayContaining([expect.objectContaining({ exerciseName: 'Forged Run' })]));
});
