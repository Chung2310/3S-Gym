// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import ProgressDashboard from '../../../src/components/progress/ProgressDashboard';
import type { CustomerProgressOverview } from '../../../src/types';

function progressItem(index: number): CustomerProgressOverview {
  return {
    customer: { _id: `customer-${index}`, fullName: `Học viên ${index}`, phone: `09000000${index}`, status: 'ACTIVE' },
    sessionCount: index,
    lastSessionAt: null,
    latestMeasurement: null,
    analytics: {
      totalSessions: index,
      totalVolume: 0,
      averageRpe: null,
      attendance: { present: index, late: 0, absent: 0, rate: 100 },
      streakWeeks: 0,
      tracking: {
        strength: { totalVolumeKg: 0, maxWeightKg: null, maxReps: null, estimated1RmKg: null },
        bodyweight: { totalReps: 0, maxReps: null, maxAddedWeightKg: null },
        cardio: { durationMinutes: 0, distanceKm: 0, bestPaceSecondsPerKm: null, averageHeartRate: null },
        interval: { totalRounds: 0, workSeconds: 0, restSeconds: 0 },
        mobility: { durationMinutes: 0, completedReps: 0, averageDiscomfort: null },
      },
      achievements: [],
      dataQuality: { level: 'COMPLETE', reasons: [] },
    },
  };
}

it('paginates customer progress cards with twelve students per page', async () => {
  const user = userEvent.setup();
  render(
    <ProgressDashboard
      items={Array.from({ length: 13 }, (_, index) => progressItem(index + 1))}
      onView={vi.fn()}
      onLogWorkout={vi.fn()}
    />,
  );

  expect(screen.getByText('Hiển thị 1–12 trên 13 học viên')).toBeVisible();
  expect(screen.getByText('Học viên 1')).toBeVisible();
  expect(screen.queryByText('Học viên 13')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Trang 2' }));

  expect(screen.getByText('Hiển thị 13–13 trên 13 học viên')).toBeVisible();
  expect(screen.getByText('Học viên 13')).toBeVisible();
  expect(screen.queryByText('Học viên 1')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Trang 2' })).toHaveAttribute('aria-current', 'page');
});
