// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import TrackingResultSummary from '../../../src/components/progress/tracking/TrackingResultSummary';
import type { WorkoutExerciseLog } from '../../../src/types';

const renderLog = (log: Partial<WorkoutExerciseLog> & Pick<WorkoutExerciseLog, 'name'>) => render(<TrackingResultSummary exercise={log as WorkoutExerciseLog} />);

it('renders strength sets, RPE and volume', () => {
  renderLog({ name: 'Squat', trackingType: 'STRENGTH', result: { sets: [{ weight: 60, reps: 10, rpe: 8, completed: true }] } });
  expect(screen.getByText('60 kg × 10 reps')).toBeVisible();
  expect(screen.getByText('RPE 8')).toBeVisible();
  expect(screen.getByText('600 kg volume')).toBeVisible();
});

it('renders bodyweight added load without a base weight field', () => {
  renderLog({ name: 'Pull-up', trackingType: 'BODYWEIGHT', result: { sets: [{ reps: 8, addedWeight: 10, completed: true }] } });
  expect(screen.getByText('8 reps')).toBeVisible();
  expect(screen.getByText('+10 kg')).toBeVisible();
  expect(screen.queryByText(/kg ×/)).not.toBeInTheDocument();
});

it('renders cardio metrics and preserves zero incline', () => {
  renderLog({ name: 'Treadmill Run', trackingType: 'CARDIO', result: { durationMinutes: 22, distanceKm: 3.4, paceSecondsPerKm: 330, averageHeartRate: 145, inclinePercent: 0, calories: 250, rpe: 7 } });
  for (const value of ['22 phút', '3,4 km', '5:30 /km', '145 bpm', 'Độ dốc 0%', '250 kcal', 'RPE 7']) expect(screen.getByText(value)).toBeVisible();
  expect(screen.queryByText(/Mức tạ/)).not.toBeInTheDocument();
});

it('renders interval metrics', () => {
  renderLog({ name: 'Bike Interval', trackingType: 'INTERVAL', result: { rounds: 6, workSeconds: 30, restSeconds: 30, distanceMetersPerRound: 200, repsPerRound: 12, rpe: 8 } });
  for (const value of ['6 vòng', '30 giây làm', '30 giây nghỉ', '200 m/vòng', '12 reps/vòng', 'RPE 8']) expect(screen.getByText(value)).toBeVisible();
});

it('renders mobility metrics and preserves zero discomfort', () => {
  renderLog({ name: 'Hip Flow', trackingType: 'MOBILITY', result: { durationMinutes: 5, reps: 10, side: 'BOTH', discomfort: 0 } });
  for (const value of ['5 phút', '10 reps', 'Hai bên', 'Khó chịu 0/10']) expect(screen.getByText(value)).toBeVisible();
});

it('normalizes old set logs as legacy strength without losing details', () => {
  renderLog({ name: 'Legacy Squat', sets: [{ weight: 50, reps: 10, rpe: 8, completed: true }] });
  expect(screen.getByText('Dữ liệu cũ')).toBeVisible();
  expect(screen.getByText('50 kg × 10 reps')).toBeVisible();
  expect(screen.getByText('RPE 8')).toBeVisible();
  expect(screen.getByText('500 kg volume')).toBeVisible();
});
