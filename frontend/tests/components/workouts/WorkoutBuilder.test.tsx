// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import WorkoutBuilder from '../../../src/components/workouts/WorkoutBuilder';

vi.mock('../../../src/services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

describe('WorkoutBuilder', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset().mockResolvedValue({ data: [{ _id: 'squat-1', name: 'Squat', muscleGroup: 'LEGS', level: 'BEGINNER', defaultTrackingType: 'STRENGTH' }, { _id: 'run-1', name: 'Treadmill Run', muscleGroup: 'CARDIO', level: 'BEGINNER', defaultTrackingType: 'CARDIO' }], meta: { page: 1, totalPages: 1 }, message: '' });
    vi.mocked(api.post).mockReset().mockResolvedValue({ data: { _id: 'template-1', version: 1, status: 'ACTIVE' }, message: 'Tạo giáo án mẫu thành công.' });
  });

  it('giữ exerciseId khi thêm bài từ thư viện vào buổi tập', async () => {
    const user = userEvent.setup();
    render(<ToastProvider><WorkoutBuilder onSaved={vi.fn()} /></ToastProvider>);
    await user.type(screen.getByLabelText('Tên giáo án'), 'Full body A');
    await user.type(screen.getByLabelText('Mục tiêu'), 'FAT_LOSS');
    await user.selectOptions(screen.getByLabelText('Cấp độ giáo án'), 'BEGINNER');
    await user.type(screen.getByLabelText('Tên buổi 1'), 'Buổi 1');
    await user.click(await screen.findByRole('button', { name: 'Thêm bài Squat' }));
    await user.click(screen.getByRole('button', { name: 'Lưu giáo án' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/workout-templates', expect.objectContaining({ sessions: [expect.objectContaining({ exercises: [expect.objectContaining({ exerciseId: 'squat-1', name: 'Squat', trackingType: 'STRENGTH', prescription: { sets: 3, reps: '10', restSeconds: 60 } })] })] })));
  });

  it('uses cardio prescription fields without creating strength sets', async () => {
    const user = userEvent.setup();
    render(<ToastProvider><WorkoutBuilder onSaved={vi.fn()} /></ToastProvider>);
    await user.type(screen.getByLabelText('Tên giáo án'), 'Cardio A');
    await user.type(screen.getByLabelText('Mục tiêu'), 'Sức bền');
    await user.type(screen.getByLabelText('Tên buổi 1'), 'Buổi chạy');
    await user.click(await screen.findByRole('button', { name: 'Thêm bài Treadmill Run' }));

    expect(screen.getByLabelText('Thời lượng mục tiêu cho Treadmill Run')).toHaveValue(20);
    expect(screen.queryByLabelText('Số hiệp cho Treadmill Run')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Lưu giáo án' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/workout-templates', expect.objectContaining({ sessions: [expect.objectContaining({ exercises: [expect.objectContaining({ trackingType: 'CARDIO', prescription: { durationMinutes: 20 } })] })] })));
  });

  it('blocks saving a loaded legacy exercise until the PT classifies it', async () => {
    const legacyTemplate = { _id: 'legacy-1', title: 'Legacy', goal: 'Fitness', level: 'BEGINNER', version: 1, status: 'ACTIVE', sessions: [{ name: 'Ngày 1', exercises: [{ name: 'Chạy bộ', sets: 3, reps: '10' }] }] } as never;
    render(<ToastProvider><WorkoutBuilder template={legacyTemplate} onSaved={vi.fn()} /></ToastProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Lưu giáo án' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Chạy bộ.*chưa có cách ghi nhận/i);
    expect(api.patch).not.toHaveBeenCalled();
  });
});
