// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerJourney from '../../../src/components/customer-portal/CustomerJourney';
import type { CustomerJourneyDto } from '../../../src/types/progress';

const journey = { customer: { _id: 'c1', fullName: 'Nguyễn An' }, sessions: [{ _id: 's1', performedAt: '2026-08-29', attendance: 'PRESENT', planSnapshot: { title: 'Strength', session: { name: 'Ngày 1' } }, exerciseLogs: [{ name: 'Squat', sets: [{ reps: 10, weight: 60, rpe: 8, completed: true }] }], feeling: 'Khỏe', notes: 'Ghi chú cho khách' }], measurements: [], calendar: [{ _id: 'e1', title: 'Tập chân', startsAt: '2026-09-01' }], photos: [{ _id: 'p1', photoUrl: 'https://example.com/photo.jpg', stage: 'BEFORE', takenDate: '2026-08-01' }], plans: { active: { _id: 'plan1', title: 'Giáo án hiện tại' }, history: [{ _id: 'plan0', title: 'Giáo án cũ' }] }, reports: [{ _id: 'r1', summary: 'Tiến bộ tốt', periodStart: '2026-08-01', periodEnd: '2026-08-31', status: 'PUBLISHED' }], analytics: { totalVolume: 600, averageRpe: 8, attendance: { present: 1, late: 0, absent: 0, rate: 100 }, streakWeeks: 1, achievements: [{ exerciseName: 'Squat', kind: 'MAX_WEIGHT', value: 60, achievedAt: '2026-08-29', sessionId: 's1', isNewInPeriod: true }], dataQuality: { level: 'PARTIAL', reasons: [] } } } as unknown as CustomerJourneyDto;

it('shows one clearly separated journey tab panel at a time', async () => {
  const user = userEvent.setup();
  render(<CustomerJourney journey={journey} />);

  for (const name of [
    'Tổng quan',
    'Lịch & buổi tập',
    'Chỉ số cơ thể',
    'Thành tích',
    'Ảnh tiến độ',
    'Giáo án',
    'Báo cáo',
  ]) {
    expect(screen.getByRole('tab', { name })).toBeVisible();
  }

  expect(screen.getByRole('tab', { name: 'Tổng quan' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tabpanel', { name: 'Tổng quan' })).toBeVisible();
  expect(screen.queryByText('Tập chân')).not.toBeInTheDocument();

  await user.click(screen.getByRole('tab', { name: 'Lịch & buổi tập' }));
  expect(screen.getByRole('tab', { name: 'Lịch & buổi tập' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tabpanel', { name: 'Lịch & buổi tập' })).toBeVisible();
  expect(screen.getByText('Tập chân')).toBeVisible();
  expect(screen.getByText('Strength · Ngày 1')).toBeVisible();

  await user.click(screen.getByRole('tab', { name: 'Ảnh tiến độ' }));
  expect(screen.getByAltText('Ảnh tiến độ BEFORE')).toBeVisible();

  await user.click(screen.getByRole('tab', { name: 'Giáo án' }));
  expect(screen.getByText('Giáo án hiện tại')).toBeVisible();
  expect(screen.getByText('Giáo án cũ')).toBeVisible();

  await user.click(screen.getByRole('tab', { name: 'Báo cáo' }));
  expect(screen.getByText('Tiến bộ tốt')).toBeVisible();
});

it('shows contextual empty cards inside collection tabs', async () => {
  const user = userEvent.setup();
  const emptyJourney = {
    ...journey,
    sessions: [],
    calendar: [],
    photos: [],
    plans: { active: null, history: [] },
    reports: [],
  } as unknown as CustomerJourneyDto;

  render(<CustomerJourney journey={emptyJourney} />);

  await user.click(screen.getByRole('tab', { name: 'Lịch & buổi tập' }));
  expect(screen.getByRole('heading', { name: 'Chưa có lịch tập' })).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Chưa có buổi tập' })).toBeVisible();

  await user.click(screen.getByRole('tab', { name: 'Ảnh tiến độ' }));
  expect(screen.getByRole('heading', { name: 'Chưa có ảnh tiến độ' })).toBeVisible();

  await user.click(screen.getByRole('tab', { name: 'Giáo án' }));
  expect(screen.getByRole('heading', { name: 'Chưa có giáo án' })).toBeVisible();
});
