// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import PtProgressWorkspace from '../../../src/components/progress/PtProgressWorkspace';
import type { CustomerJourneyDto } from '../../../src/types/progress';

const journey = { customer: { _id: 'c1', fullName: 'Nguyễn An' }, sessions: [], measurements: [], calendar: [], photos: [], plans: { active: null, history: [] }, reports: [], analytics: { totalVolume: 0, averageRpe: null, attendance: { present: 0, late: 0, absent: 0, rate: null }, streakWeeks: 0, achievements: [], dataQuality: { level: 'INSUFFICIENT', reasons: ['Chưa đủ dữ liệu'] } } } as unknown as CustomerJourneyDto;

it('provides all seven PT progress areas', async () => {
  const user = userEvent.setup();
  render(<ToastProvider><PtProgressWorkspace journey={journey} onRefresh={vi.fn()} /></ToastProvider>);
  for (const name of ['Tổng quan', 'Buổi tập', 'Chỉ số cơ thể', 'Thành tích', 'Ảnh tiến độ', 'Giáo án', 'Báo cáo']) expect(screen.getByRole('tab', { name })).toBeVisible();
  await user.click(screen.getByRole('tab', { name: 'Báo cáo' }));
  expect(screen.getByRole('button', { name: 'Tạo báo cáo tự động' })).toBeVisible();
});

it('opens the workout logger from the primary action', async () => {
  const user = userEvent.setup();
  const withPlan = { ...journey, plans: { active: { _id: 'plan-1', title: 'Giáo án tăng cơ', sessions: [{ name: 'Buổi 1', exercises: [] }] }, history: [] } };
  render(<ToastProvider><PtProgressWorkspace journey={withPlan} onRefresh={vi.fn()} /></ToastProvider>);
  await user.click(screen.getByRole('button', { name: 'Ghi nhận buổi tập' }));
  expect(screen.getByRole('heading', { name: 'Ghi nhận buổi tập' })).toBeVisible();
  expect(screen.getByLabelText('Ngày tập')).toBeVisible();
});
