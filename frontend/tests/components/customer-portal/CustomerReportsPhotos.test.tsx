// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerReportsPhotos from '../../../src/components/customer-portal/CustomerReportsPhotos';
import type { CustomerJourneyDto } from '../../../src/types/progress';

const journey = {
  customer: { _id: 'c1', fullName: 'Nguyễn An', phone: '0909000000' },
  sessions: [],
  measurements: [],
  calendar: [],
  photos: [{ _id: 'p1', photoUrl: '/month-1.jpg', stage: 'MONTH_1', takenDate: '2026-08-25' }],
  plans: { active: null, history: [] },
  reports: [
    { _id: 'r1', periodStart: '2026-07-01', periodEnd: '2026-07-31', summary: 'Báo cáo tháng 7', status: 'PUBLISHED', metrics: { totalVolume: 3200 } },
    { _id: 'r2', periodStart: '2026-08-01', periodEnd: '2026-08-31', summary: 'Báo cáo tháng 8', status: 'PUBLISHED', metrics: { totalVolume: 4200 } },
  ],
  analytics: {
    totalSessions: 10,
    totalVolume: 4200,
    averageRpe: 7.8,
    attendance: { present: 8, late: 1, absent: 1, rate: 80 },
    streakWeeks: 4,
    tracking: {
      strength: { totalVolumeKg: 0, maxWeightKg: null, maxReps: null, estimated1RmKg: null },
      bodyweight: { totalReps: 0, maxReps: null, maxAddedWeightKg: null },
      cardio: { durationMinutes: 0, distanceKm: 0, bestPaceSecondsPerKm: null, averageHeartRate: null },
      interval: { totalRounds: 0, workSeconds: 0, restSeconds: 0 },
      mobility: { durationMinutes: 0, completedReps: 0, averageDiscomfort: null },
    },
    achievements: [{ exerciseName: 'Squat', kind: 'MAX_WEIGHT', value: 100, achievedAt: '2026-08-20', sessionId: 's1', isNewInPeriod: true }],
    dataQuality: { level: 'COMPLETE', reasons: [] },
  },
} as CustomerJourneyDto;

describe('CustomerReportsPhotos', () => {
  it('shows the KPI snapshot, newest report first and read-only filtered sections', async () => {
    const user = userEvent.setup();
    render(<CustomerReportsPhotos journey={journey} />);

    expect(screen.getByText('Tỷ lệ tham gia')).toBeVisible();
    const featured = screen.getByRole('region', { name: 'Báo cáo mới nhất' });
    expect(within(featured).getByText('Báo cáo tháng 8')).toBeVisible();
    expect(screen.queryByRole('button', { name: /Ghi nhận buổi tập|Nhập số đo|Tạo báo cáo tự động/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Ảnh (1)' }));
    expect(screen.getByAltText('Ảnh tiến độ MONTH_1')).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Thành tích cá nhân' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Thành tích (1)' }));
    expect(screen.getByText('Squat')).toBeVisible();
    expect(screen.queryByAltText('Ảnh tiến độ MONTH_1')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Báo cáo (2)' }));
    expect(screen.getByText('Báo cáo tháng 7')).toBeVisible();
    expect(screen.queryByText('Squat')).not.toBeInTheDocument();
  });

  it('opens an accessible photo dialog, closes with Escape and restores focus', async () => {
    const user = userEvent.setup();
    render(<CustomerReportsPhotos journey={journey} />);
    await user.click(screen.getByRole('tab', { name: 'Ảnh (1)' }));

    const trigger = screen.getByRole('button', { name: 'Mở ảnh tiến độ MONTH_1' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Ảnh tiến độ MONTH_1' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Đóng ảnh' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('shows a specific empty state for every read-only area', async () => {
    const user = userEvent.setup();
    const emptyJourney = {
      ...journey,
      photos: [],
      reports: [],
      analytics: { ...journey.analytics, achievements: [] },
    };
    render(<CustomerReportsPhotos journey={emptyJourney} />);

    expect(screen.getByRole('heading', { name: 'Chưa có báo cáo tiến độ' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Chưa có ảnh tiến độ' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Chưa có thành tích' })).toBeVisible();

    await user.click(screen.getByRole('tab', { name: 'Ảnh (0)' }));
    expect(screen.getByRole('heading', { name: 'Chưa có ảnh tiến độ' })).toBeVisible();
    await user.click(screen.getByRole('tab', { name: 'Thành tích (0)' }));
    expect(screen.getByRole('heading', { name: 'Chưa có thành tích' })).toBeVisible();
    await user.click(screen.getByRole('tab', { name: 'Báo cáo (0)' }));
    expect(screen.getByRole('heading', { name: 'Chưa có báo cáo tiến độ' })).toBeVisible();
  });
});
