// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ToastProvider } from '../../components/ToastProvider';
import { api } from '../../services/api';
import CustomerWorkoutPlanModal from './CustomerWorkoutPlanModal';

vi.mock('../../services/api', () => ({ api: { post: vi.fn(), patch: vi.fn() } }));

it('lưu bản nháp khách hàng từ dữ liệu template điền sẵn', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { _id: 'p1' }, message: 'Đã tạo.' });
  const user = userEvent.setup();
  render(<ToastProvider><CustomerWorkoutPlanModal open initialDraft={{ customerId: '', title: 'Full body', startDate: '', endDate: '', sessions: [{ name: 'Buổi 1', exercises: [{ name: 'Squat', sets: 3, reps: '10', weight: '', rest: '60 giây', tempo: '', notes: '' }] }] }} onClose={vi.fn()} onSaved={vi.fn()} /></ToastProvider>);
  expect(screen.getByLabelText('Tên giáo án')).toHaveValue('Full body');
  await user.type(screen.getByLabelText('Mã khách hàng'), '507f1f77bcf86cd799439011');
  await user.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/workout-plans', expect.objectContaining({ customerId: '507f1f77bcf86cd799439011', title: 'Full body' })));
});
