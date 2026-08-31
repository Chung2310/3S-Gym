// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProgressDashboard from '../../../src/components/progress/ProgressDashboard';
import type { CustomerProgressOverview } from '../../../src/types/progress';

const items = [
  { customer: { _id: 'c1', fullName: 'Nguyễn An', phone: '0901', status: 'ACTIVE' }, sessionCount: 12, lastSessionAt: '2026-08-28', latestMeasurement: { weight: 68 }, analytics: { totalVolume: 12000, averageRpe: 7.8, attendance: { present: 10, late: 1, absent: 1, rate: 91.7 }, streakWeeks: 4, bodyDeltas: { weight: -2 }, achievements: [], dataQuality: { level: 'COMPLETE', reasons: [] } } },
  { customer: { _id: 'c2', fullName: 'Trần Bình', phone: '0902', status: 'ACTIVE' }, sessionCount: 3, lastSessionAt: null, latestMeasurement: null, analytics: { totalVolume: 2000, averageRpe: 6, attendance: { present: 3, late: 0, absent: 0, rate: 100 }, streakWeeks: 1, bodyDeltas: {}, achievements: [], dataQuality: { level: 'PARTIAL', reasons: [] } } },
] as unknown as CustomerProgressOverview[];

it('filters assigned customers and exposes separate detail and workout actions', async () => {
  const user = userEvent.setup(); const onView = vi.fn(); const onLog = vi.fn();
  render(<ProgressDashboard items={items} onView={onView} onLogWorkout={onLog} />);
  expect(screen.getByText('2 khách hàng')).toBeVisible();
  await user.type(screen.getByPlaceholderText('Tìm theo tên hoặc số điện thoại...'), '0901');
  expect(screen.getByText('Nguyễn An')).toBeVisible(); expect(screen.queryByText('Trần Bình')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Xem tiến độ Nguyễn An' }));
  await user.click(screen.getByRole('button', { name: 'Ghi nhận buổi tập Nguyễn An' }));
  expect(onView).toHaveBeenCalledWith(items[0]); expect(onLog).toHaveBeenCalledWith(items[0]);
});

it('uses the shared legacy progress groups for summary metrics and customer information', () => {
  render(<ProgressDashboard items={items} onView={vi.fn()} onLogWorkout={vi.fn()} />);

  const summary = screen.getByRole('region', { name: 'Tổng quan tiến độ' });
  expect(summary).toHaveClass('progress-metrics');
  expect(within(summary).getAllByRole('group')).toHaveLength(4);

  const customerInfo = screen.getByRole('group', { name: 'Thông tin tiến độ của Nguyễn An' });
  expect(customerInfo).toHaveClass('progress-customer-stats');
  expect(customerInfo.querySelectorAll('.progress-stat')).toHaveLength(4);
});
