// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import ExerciseLibraryPage from '../../../src/pages/pt/ExerciseLibraryPage';

vi.mock('../../../src/services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), upload: vi.fn() },
}));

describe('ExerciseLibrary', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset().mockResolvedValue({
      data: [
        {
          _id: 'squat-1',
          name: 'Squat',
          muscleGroup: 'LEGS',
          level: 'BEGINNER',
          equipment: ['Barbell'],
          scope: 'PRIVATE',
          videos: [
            { title: 'Kỹ thuật chuẩn', url: 'https://example.com/squat.mp4', source: 'LINK' },
            { title: 'Góc quay bên hông', url: 'https://example.com/squat-side.mp4', source: 'UPLOAD' },
          ],
        },
      ],
      meta: { page: 1, totalPages: 1 },
      message: '',
    });
    vi.mocked(api.post).mockReset().mockResolvedValue({
      data: { _id: 'row-1' },
      message: 'Tạo bài tập thành công.',
    });
    vi.mocked(api.upload).mockReset().mockResolvedValue({
      data: { url: 'https://cdn.example.com/uploaded.mp4', publicId: 'video-1' },
      message: 'Tải video lên thành công.',
    });
  });

  it('lọc thư viện theo nhóm cơ và cấp độ canonical', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ExerciseLibraryPage />
      </ToastProvider>
    );
    expect(await screen.findAllByText('Squat')).not.toHaveLength(0);
    await user.type(screen.getByLabelText('Nhóm cơ'), 'LEGS');
    await user.selectOptions(screen.getByLabelText('Cấp độ'), 'BEGINNER');
    await user.click(screen.getByRole('button', { name: 'Lọc bài tập' }));
    await waitFor(() =>
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/exercises?page=1&limit=20&muscleGroup=LEGS&level=BEGINNER'
      )
    );
  });

  it('tạo bài tập private với form typed', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ExerciseLibraryPage />
      </ToastProvider>
    );
    await screen.findAllByText('Squat');
    await user.click(screen.getByRole('button', { name: 'Tạo bài tập' }));
    const dialog = screen.getByRole('dialog', { name: 'Tạo bài tập' });
    await user.type(within(dialog).getByLabelText('Tên bài tập'), 'Barbell Row');
    await user.type(within(dialog).getByLabelText('Nhóm cơ'), 'BACK');
    await user.selectOptions(within(dialog).getByLabelText('Cấp độ'), 'INTERMEDIATE');
    await user.click(within(dialog).getByRole('button', { name: 'Lưu bài tập' }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/api/exercises',
        expect.objectContaining({
          name: 'Barbell Row',
          muscleGroup: 'BACK',
          level: 'INTERMEDIATE',
          scope: 'PRIVATE',
        })
      )
    );
  });

  it('tạo bài tập với nhiều video từ link và file upload', async () => {
    const user = userEvent.setup();
    render(<ToastProvider><ExerciseLibraryPage /></ToastProvider>);
    await screen.findAllByText('Squat');
    await user.click(screen.getByRole('button', { name: 'Tạo bài tập' }));
    const dialog = screen.getByRole('dialog', { name: 'Tạo bài tập' });
    await user.type(within(dialog).getByLabelText('Tên bài tập'), 'Video Row');
    await user.type(within(dialog).getByLabelText('Nhóm cơ'), 'BACK');
    await user.click(within(dialog).getByRole('button', { name: 'Thêm video' }));
    await user.type(within(dialog).getByLabelText('Tiêu đề video 1'), 'Kỹ thuật chuẩn');
    await user.type(within(dialog).getByLabelText('Link video 1'), 'https://youtube.com/watch?v=row');
    await user.click(within(dialog).getByRole('button', { name: 'Thêm video' }));
    await user.type(within(dialog).getByLabelText('Tiêu đề video 2'), 'Góc quay bên hông');
    await user.selectOptions(within(dialog).getByLabelText('Nguồn video 2'), 'UPLOAD');
    await user.upload(within(dialog).getByLabelText('Tệp video 2'), new File(['video'], 'row.mp4', { type: 'video/mp4' }));
    await waitFor(() => expect(api.upload).toHaveBeenCalledWith('/api/upload/video', expect.any(FormData)));
    await user.click(within(dialog).getByRole('button', { name: 'Lưu bài tập' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/exercises', expect.objectContaining({
      videos: [
        { title: 'Kỹ thuật chuẩn', url: 'https://youtube.com/watch?v=row', source: 'LINK' },
        { title: 'Góc quay bên hông', url: 'https://cdn.example.com/uploaded.mp4', source: 'UPLOAD' },
      ],
    })));
  });

  it('hiển thị số lượng và tiêu đề video trong thư viện', async () => {
    render(<ToastProvider><ExerciseLibraryPage /></ToastProvider>);
    expect(await screen.findAllByText('2 video')).not.toHaveLength(0);
    const links = screen.getAllByRole('link', { name: 'Kỹ thuật chuẩn' });
    expect(links[0]).toHaveAttribute('href', 'https://example.com/squat.mp4');
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getAllByRole('link', { name: 'Góc quay bên hông' })).not.toHaveLength(0);
  });
});
