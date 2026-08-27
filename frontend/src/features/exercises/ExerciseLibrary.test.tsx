// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../components/ToastProvider';
import { api } from '../../services/api';
import ExerciseLibrary from './ExerciseLibrary';

vi.mock('../../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

describe('ExerciseLibrary', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset().mockResolvedValue({ data: [{ _id: 'squat-1', name: 'Squat', muscleGroup: 'LEGS', level: 'BEGINNER', equipment: ['Barbell'], scope: 'PRIVATE' }], meta: { page: 1, totalPages: 1 }, message: '' });
    vi.mocked(api.post).mockReset().mockResolvedValue({ data: { _id: 'row-1' }, message: 'Tạo bài tập thành công.' });
  });

  it('lọc thư viện theo nhóm cơ và cấp độ canonical', async () => {
    const user = userEvent.setup();
    render(<ToastProvider><ExerciseLibrary /></ToastProvider>);
    expect(await screen.findAllByText('Squat')).not.toHaveLength(0);
    await user.type(screen.getByLabelText('Nhóm cơ'), 'LEGS');
    await user.selectOptions(screen.getByLabelText('Cấp độ'), 'BEGINNER');
    await user.click(screen.getByRole('button', { name: 'Lọc bài tập' }));
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/api/exercises?page=1&limit=20&muscleGroup=LEGS&level=BEGINNER'));
  });

  it('tạo bài tập private với form typed', async () => {
    const user = userEvent.setup();
    render(<ToastProvider><ExerciseLibrary /></ToastProvider>);
    await screen.findAllByText('Squat');
    await user.click(screen.getByRole('button', { name: 'Tạo bài tập' }));
    const dialog = screen.getByRole('dialog', { name: 'Tạo bài tập' });
    await user.type(within(dialog).getByLabelText('Tên bài tập'), 'Barbell Row');
    await user.type(within(dialog).getByLabelText('Nhóm cơ'), 'BACK');
    await user.selectOptions(within(dialog).getByLabelText('Cấp độ'), 'INTERMEDIATE');
    await user.click(within(dialog).getByRole('button', { name: 'Lưu bài tập' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/exercises', expect.objectContaining({ name: 'Barbell Row', muscleGroup: 'BACK', level: 'INTERMEDIATE', scope: 'PRIVATE' })));
  });
});
