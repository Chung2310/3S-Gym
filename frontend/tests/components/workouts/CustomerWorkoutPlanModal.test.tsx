// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import CustomerWorkoutPlanModal from '../../../src/components/workouts/CustomerWorkoutPlanModal';

vi.mock('../../../src/services/api', () => ({ api: { post: vi.fn(), patch: vi.fn() } }));

it('lưu bản nháp khách hàng từ dữ liệu template điền sẵn', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { _id: 'p1' }, message: 'Đã tạo.' });
  const user = userEvent.setup();
  render(
    <ToastProvider>
      <CustomerWorkoutPlanModal
        open
        initialDraft={{
          customerId: '',
          title: 'Full body',
          startDate: '',
          endDate: '',
          sessions: [
            {
              name: 'Buổi 1',
              exercises: [{ name: 'Treadmill Run', trackingType: 'CARDIO', prescription: { durationMinutes: 20, distanceKm: 3 } }],
            },
          ],
        }}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    </ToastProvider>
  );
  expect(screen.getByLabelText('Tên giáo án')).toHaveValue('Full body');
  expect(screen.getByLabelText('Cách ghi nhận cho Treadmill Run')).toHaveValue('CARDIO');
  expect(screen.getByLabelText('Thời lượng mục tiêu cho Treadmill Run')).toHaveValue(20);
  expect(screen.queryByLabelText('Số hiệp cho Treadmill Run')).not.toBeInTheDocument();
  await user.type(screen.getByLabelText('Học viên / Khách hàng'), '507f1f77bcf86cd799439011');
  await user.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith(
      '/api/workout-plans',
      expect.objectContaining({ customerId: '507f1f77bcf86cd799439011', title: 'Full body', sessions: [expect.objectContaining({ exercises: [expect.objectContaining({ trackingType: 'CARDIO', prescription: { durationMinutes: 20, distanceKm: 3 } })] })] })
    )
  );
});
