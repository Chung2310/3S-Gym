// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import WorkoutSessionLogger from '../../../src/components/progress/WorkoutSessionLogger';
import WorkoutSessionDetail from '../../../src/components/progress/WorkoutSessionDetail';
import { api } from '../../../src/services/api';

vi.mock('../../../src/services/api', () => ({ api: { post: vi.fn(), patch: vi.fn() } }));

const activePlan = { _id: 'plan-1', sourceTemplateId: 'template-1', title: 'Strength', sessions: [{ name: 'Ngày 1', exercises: [{ name: 'Squat', sets: 2 }] }] };

it('shows an explicit empty state without an active plan', () => {
  render(<ToastProvider><WorkoutSessionLogger customerId="customer-1" activePlan={null} onSaved={vi.fn()} /></ToastProvider>);
  expect(screen.getByRole('heading', { name: 'Chưa có giáo án đang áp dụng' })).toBeVisible();
});

it('renders complete set details, volume, RPE, feeling and notes', () => {
  render(<WorkoutSessionDetail session={{ _id: 's1', performedAt: '2026-08-29', attendance: 'PRESENT', planSnapshot: { title: 'Strength', session: { name: 'Ngày 1' } }, exerciseLogs: [{ name: 'Squat', sets: [{ reps: 10, weight: 60, rpe: 8, completed: true }], notes: '' }], feeling: 'Khỏe', notes: 'Kỹ thuật ổn' }} />);
  expect(screen.getByText('Strength · Ngày 1')).toBeVisible();
  expect(screen.getByText('600 kg')).toBeVisible();
  expect(screen.getByText('RPE 8')).toBeVisible();
  expect(screen.getByText('Khỏe')).toBeVisible();
  expect(screen.getByText('Kỹ thuật ổn')).toBeVisible();
});

it('materializes planned sets and posts detailed workout logs', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { _id: 'session-1' }, message: 'Đã lưu.' });
  const user = userEvent.setup(); const onSaved = vi.fn();
  render(<ToastProvider><WorkoutSessionLogger customerId="customer-1" activePlan={activePlan} onSaved={onSaved} /></ToastProvider>);
  expect(screen.getByRole('form', { name: 'Ghi nhận buổi tập' })).toBeVisible();
  await user.type(screen.getByLabelText('Ngày tập'), '2026-08-29');
  await user.clear(screen.getByLabelText('Squat set 1 mức tạ'));
  await user.type(screen.getByLabelText('Squat set 1 mức tạ'), '60');
  await user.type(screen.getByLabelText('Squat set 1 REPS'), '10');
  await user.type(screen.getByLabelText('Squat set 1 RPE'), '8');
  await user.type(screen.getByLabelText('Cảm nhận sau buổi tập'), 'Khỏe');
  await user.click(screen.getByRole('button', { name: 'Hoàn tất buổi tập' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/workout-sessions', expect.objectContaining({
    customerId: 'customer-1', templateId: 'template-1', sessionIndex: 0, feeling: 'Khỏe',
    exerciseLogs: [expect.objectContaining({ name: 'Squat', sets: expect.arrayContaining([expect.objectContaining({ weight: 60, reps: 10, rpe: 8, completed: true })]) })],
  })));
  expect(onSaved).toHaveBeenCalled();
});
