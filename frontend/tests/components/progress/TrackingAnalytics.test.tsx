// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TrackingAnalytics from '../../../src/components/progress/TrackingAnalytics';
import type { TrackingAnalyticsDto } from '../../../src/types/progress';

const emptyTracking: TrackingAnalyticsDto = {
  strength: { totalVolumeKg: 0, maxWeightKg: null, maxReps: null, estimated1RmKg: null },
  bodyweight: { totalReps: 0, maxReps: null, maxAddedWeightKg: null },
  cardio: { durationMinutes: 0, distanceKm: 0, bestPaceSecondsPerKm: null, averageHeartRate: null },
  interval: { totalRounds: 0, workSeconds: 0, restSeconds: 0 },
  mobility: { durationMinutes: 0, completedReps: 0, averageDiscomfort: null },
};

describe('TrackingAnalytics', () => {
  it('separates metrics and units for every populated tracking type', () => {
    render(<TrackingAnalytics analytics={{
      strength: { totalVolumeKg: 800, maxWeightKg: 60, maxReps: 10, estimated1RmKg: 70 },
      bodyweight: { totalReps: 22, maxReps: 12, maxAddedWeightKg: 5 },
      cardio: { durationMinutes: 45, distanceKm: 7, bestPaceSecondsPerKm: 330, averageHeartRate: 150 },
      interval: { totalRounds: 6, workSeconds: 180, restSeconds: 150 },
      mobility: { durationMinutes: 15, completedReps: 10, averageDiscomfort: 2 },
    }} />);

    expect(screen.getByRole('region', { name: 'Phân tích theo loại bài' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Sức mạnh' })).toBeVisible();
    expect(screen.getByText('800 kg')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Trọng lượng cơ thể' })).toBeVisible();
    expect(screen.getByText('22 reps')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Cardio' })).toBeVisible();
    expect(screen.getByText('7 km')).toBeVisible();
    expect(screen.getByText('05:30 /km')).toBeVisible();
    expect(screen.getByText('150 bpm')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Interval' })).toBeVisible();
    expect(screen.getByText('180 giây')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Mobility' })).toBeVisible();
    expect(screen.getByText('2/10')).toBeVisible();
  });

  it('hides tracking types that have no recorded data', () => {
    render(<TrackingAnalytics analytics={{
      ...emptyTracking,
      cardio: { ...emptyTracking.cardio, durationMinutes: 20, averageHeartRate: 0 },
    }} />);

    expect(screen.getByRole('heading', { name: 'Cardio' })).toBeVisible();
    expect(screen.getByText('0 bpm')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Sức mạnh' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Trọng lượng cơ thể' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Interval' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Mobility' })).not.toBeInTheDocument();
  });

  it('renders nothing when no type has recorded data', () => {
    const { container } = render(<TrackingAnalytics analytics={emptyTracking} />);
    expect(container).toBeEmptyDOMElement();
  });
});
