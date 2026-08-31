// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import WorkoutSessionLogger from '../../../src/components/progress/WorkoutSessionLogger';
import WorkoutSessionDetail from '../../../src/components/progress/WorkoutSessionDetail';
import { api } from '../../../src/services/api';

vi.mock('../../../src/services/api', () => ({ api: { post: vi.fn(), patch: vi.fn() } }));

const activePlan = { _id: 'plan-1', version: 2, title: 'Kết hợp', sessions: [{ name: 'Ngày 1', exercises: [{ exerciseId: 'exercise-1', name: 'Squat', trackingType: 'STRENGTH' as const, prescription: { sets: 2, reps: '10', restSeconds: 60 } }, { exerciseId: 'exercise-2', name: 'Treadmill Run', trackingType: 'CARDIO' as const, prescription: { durationMinutes: 20, distanceKm: 3 } }] }] };

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

it('materializes typed results and posts only result data against the assigned plan', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { _id: 'session-1' }, message: 'Đã lưu.' });
  const user = userEvent.setup(); const onSaved = vi.fn();
  render(<ToastProvider><WorkoutSessionLogger customerId="customer-1" activePlan={activePlan} onSaved={onSaved} /></ToastProvider>);
  expect(screen.getByRole('form', { name: 'Ghi nhận buổi tập' })).toBeVisible();
  await user.type(screen.getByLabelText('Ngày tập'), '2026-08-29');
  await user.clear(screen.getByLabelText('Squat set 1 mức tạ'));
  await user.type(screen.getByLabelText('Squat set 1 mức tạ'), '60');
  await user.type(screen.getByLabelText('Squat set 1 REPS'), '10');
  await user.type(screen.getByLabelText('Squat set 1 RPE'), '8');
  await user.type(screen.getByLabelText('Treadmill Run thời lượng (phút)'), '22');
  await user.type(screen.getByLabelText('Cảm nhận sau buổi tập'), 'Khỏe');
  await user.click(screen.getByRole('button', { name: 'Hoàn tất buổi tập' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/workout-sessions', expect.objectContaining({
    customerId: 'customer-1', workoutPlanId: 'plan-1', workoutPlanVersion: 2, sessionIndex: 0, feeling: 'Khỏe',
    exerciseResults: [expect.objectContaining({ exerciseId: 'exercise-1', exerciseIndex: 0, result: { sets: expect.arrayContaining([expect.objectContaining({ weight: 60, reps: 10, rpe: 8, completed: true })]) } }), expect.objectContaining({ exerciseId: 'exercise-2', exerciseIndex: 1, result: { durationMinutes: 22 } })],
  })));
  const payload = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>;
  expect(payload).not.toHaveProperty('templateId');
  expect(payload).not.toHaveProperty('planSnapshot');
  expect(payload).not.toHaveProperty('exerciseLogs');
  expect(JSON.stringify(payload)).not.toContain('"id"');
  expect(onSaved).toHaveBeenCalled();
});

it('hides result editors and sends no exercise results for an absent customer', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { _id: 'session-absent' }, message: 'Đã lưu.' });
  const user = userEvent.setup();
  render(<ToastProvider><WorkoutSessionLogger customerId="customer-1" activePlan={activePlan} onSaved={vi.fn()} /></ToastProvider>);
  await user.selectOptions(screen.getByLabelText('Điểm danh'), 'ABSENT');
  expect(screen.queryByLabelText('Squat set 1 mức tạ')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Treadmill Run thời lượng (phút)')).not.toBeInTheDocument();
  await user.type(screen.getByLabelText('Ngày tập'), '2026-08-30');
  await user.click(screen.getByRole('button', { name: 'Hoàn tất buổi tập' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/workout-sessions', expect.objectContaining({ attendance: 'ABSENT', exerciseResults: [] })));
});

it('blocks logging when a legacy plan exercise is unclassified', () => {
  const legacyPlan = { _id: 'legacy-plan', version: 1, title: 'Legacy', sessions: [{ name: 'Ngày 1', exercises: [{ name: 'Chạy bộ', trackingType: 'UNCLASSIFIED' as const, prescription: {} }] }] };
  render(<ToastProvider><WorkoutSessionLogger customerId="customer-1" activePlan={legacyPlan} onSaved={vi.fn()} /></ToastProvider>);
  expect(screen.getByText('Bài tập này chưa có cách ghi nhận. Hãy cập nhật giáo án trước khi ghi buổi tập.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Hoàn tất buổi tập' })).toBeDisabled();
});
