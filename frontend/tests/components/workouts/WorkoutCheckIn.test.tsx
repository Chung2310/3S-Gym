// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import WorkoutCheckIn from '../../../src/components/workouts/WorkoutCheckIn';

vi.mock('../../../src/services/api', () => ({ api: { post: vi.fn() } }));

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Học viên / Khách hàng'), '507f1f77bcf86cd799439011');
  await user.type(screen.getByLabelText('Mã giáo án'), '507f191e810c19729de860ea');
  await user.type(screen.getByLabelText('Ngày tập'), '2026-09-02');
}

describe('WorkoutCheckIn', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it('chặn double-submit khi hoàn tất buổi tập', async () => {
    let resolveRequest!: (value: { data: object; message: string }) => void;
    vi.mocked(api.post).mockImplementation(() => new Promise((resolve) => { resolveRequest = resolve; }));
    const user = userEvent.setup();
    render(<ToastProvider><WorkoutCheckIn onCompleted={vi.fn()} /></ToastProvider>);
    await fillRequired(user);
    const button = screen.getByRole('button', { name: 'Hoàn tất buổi tập' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(api.post).toHaveBeenCalledTimes(1);
    act(() => { resolveRequest({ data: {}, message: 'Ghi nhận buổi tập thành công.' }); });
    expect(await screen.findByText('Ghi nhận buổi tập thành công.')).toBeVisible();
  });

  it('giữ nguyên idempotency key khi PT retry sau lỗi', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Mất kết nối')).mockResolvedValueOnce({ data: {}, message: 'Ghi nhận buổi tập thành công.' });
    const user = userEvent.setup();
    render(<ToastProvider><WorkoutCheckIn onCompleted={vi.fn()} /></ToastProvider>);
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: 'Hoàn tất buổi tập' }));
    expect(await screen.findByText('Mất kết nối')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Thử lại check-in' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
    const firstKey = vi.mocked(api.post).mock.calls[0][1] as { idempotencyKey: string };
    const secondKey = vi.mocked(api.post).mock.calls[1][1] as { idempotencyKey: string };
    expect(firstKey.idempotencyKey).toBe(secondKey.idempotencyKey);
  });
});
