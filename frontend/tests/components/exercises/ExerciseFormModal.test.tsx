// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExerciseFormModal from '../../../src/components/exercises/ExerciseFormModal';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';

vi.mock('../../../src/services/api', () => ({ api: { post: vi.fn(), patch: vi.fn(), upload: vi.fn() } }));

it('requires an explicit tracking type and posts the selected value', async () => {
  const user = userEvent.setup();
  vi.mocked(api.post).mockResolvedValue({ data: { _id: 'run-1' }, message: 'Đã tạo.' });
  render(<ToastProvider><ExerciseFormModal open exercise={null} onClose={vi.fn()} onSaved={vi.fn()} /></ToastProvider>);
  const dialog = screen.getByRole('dialog', { name: 'Tạo bài tập' });
  const tracking = within(dialog).getByLabelText('Cách ghi nhận');
  expect(tracking).toBeRequired();
  expect(tracking).toHaveValue('');
  expect(within(tracking).getByRole('option', { name: 'Cardio · quãng đường/thời gian' })).toBeVisible();

  await user.type(within(dialog).getByLabelText('Tên bài tập'), 'Treadmill Run');
  await user.type(within(dialog).getByLabelText('Nhóm cơ'), 'CARDIO');
  await user.selectOptions(tracking, 'CARDIO');
  await user.click(within(dialog).getByRole('button', { name: 'Lưu bài tập' }));

  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/exercises', expect.objectContaining({ defaultTrackingType: 'CARDIO' })));
});
