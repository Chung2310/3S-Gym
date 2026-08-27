// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import WorkoutBuilder from '../../../src/components/workouts/WorkoutBuilder';

vi.mock('../../../src/services/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

describe('WorkoutBuilder', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset().mockResolvedValue({ data: [{ _id: 'squat-1', name: 'Squat', muscleGroup: 'LEGS', level: 'BEGINNER' }], meta: { page: 1, totalPages: 1 }, message: '' });
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

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/workout-templates', expect.objectContaining({ sessions: [expect.objectContaining({ exercises: [expect.objectContaining({ exerciseId: 'squat-1', name: 'Squat' })] })] })));
  });
});
