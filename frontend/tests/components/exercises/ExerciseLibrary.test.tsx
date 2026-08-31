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
          canManage: true,
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
    vi.mocked(api.delete).mockReset().mockResolvedValue({
      data: null,
      message: 'Xóa bài tập thành công.',
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
    const page = screen.getByRole('region', { name: 'Thư viện bài tập' });
    expect(page).toHaveClass('module-page', 'exercise-page');
    expect(within(page).getByRole('search', { name: 'Bộ lọc bài tập' })).toBeVisible();
    expect(within(page).getByRole('list', { name: 'Danh sách bài tập' })).toBeVisible();
    expect(within(page).getByRole('article', { name: 'Squat' })).toHaveClass('exercise-card');
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

  it('tạo bài tập global theo phạm vi PT đã chọn', async () => {
    const user = userEvent.setup();
    render(<ToastProvider><ExerciseLibraryPage /></ToastProvider>);
    await screen.findAllByText('Squat');
    await user.click(screen.getByRole('button', { name: 'Tạo bài tập' }));
    const dialog = screen.getByRole('dialog', { name: 'Tạo bài tập' });
    await user.type(within(dialog).getByLabelText('Tên bài tập'), 'Global Row');
    await user.type(within(dialog).getByLabelText('Nhóm cơ'), 'BACK');
    await user.selectOptions(within(dialog).getByLabelText('Phạm vi'), 'GLOBAL');
    await user.click(within(dialog).getByRole('button', { name: 'Lưu bài tập' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/exercises', expect.objectContaining({ scope: 'GLOBAL' })));
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
    const card = await screen.findByRole('article', { name: 'Squat' });
    expect(card).toBeVisible();
    expect(card).toHaveClass('module-card', 'exercise-card');
    expect(await screen.findAllByText('2 video')).not.toHaveLength(0);
    const links = screen.getAllByRole('link', { name: 'Kỹ thuật chuẩn' });
    expect(links[0]).toHaveAttribute('href', 'https://example.com/squat.mp4');
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getAllByRole('link', { name: 'Góc quay bên hông' })).not.toHaveLength(0);
  });

  it('chỉ xóa bài có quyền quản lý sau khi xác nhận', async () => {
    const user = userEvent.setup();
    render(<ToastProvider><ExerciseLibraryPage /></ToastProvider>);
    await screen.findAllByText('Squat');
    const deleteButtons = screen.getAllByRole('button', { name: 'Xóa Squat' });
    await user.click(deleteButtons[0]);
    expect(api.delete).not.toHaveBeenCalled();
    const dialog = screen.getByRole('dialog', { name: 'Xóa bài tập' });
    expect(within(dialog).getByText(/Squat/)).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Xóa bài tập' }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/api/exercises/squat-1'));
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/api/exercises?page=1&limit=20'));
  });

  it('hiển thị nút sửa và xóa cùng kích thước action', async () => {
    render(<ToastProvider><ExerciseLibraryPage /></ToastProvider>);
    await screen.findAllByText('Squat');
    const editButton = screen.getAllByRole('button', { name: 'Sửa Squat' })[0];
    const deleteButton = screen.getAllByRole('button', { name: 'Xóa Squat' })[0];
    for (const button of [editButton, deleteButton]) {
      expect(button).toHaveClass('exercise-card-action');
    }
  });

  it('hủy xác nhận không gọi API xóa', async () => {
    const user = userEvent.setup();
    render(<ToastProvider><ExerciseLibraryPage /></ToastProvider>);
    await screen.findAllByText('Squat');
    await user.click(screen.getAllByRole('button', { name: 'Xóa Squat' })[0]);
    await user.click(within(screen.getByRole('dialog', { name: 'Xóa bài tập' })).getByRole('button', { name: 'Hủy' }));
    expect(api.delete).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Xóa bài tập' })).not.toBeInTheDocument();
  });

  it('không hiển thị thao tác quản lý cho bài global của PT khác', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [{ _id: 'global-1', name: 'Shared Row', muscleGroup: 'BACK', level: 'BEGINNER', scope: 'GLOBAL', canManage: false }],
      meta: { page: 1, totalPages: 1 },
      message: '',
    });
    render(<ToastProvider><ExerciseLibraryPage /></ToastProvider>);
    await screen.findAllByText('Shared Row');
    expect(screen.queryByRole('button', { name: 'Xóa Shared Row' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sửa' })).not.toBeInTheDocument();
  });

  it('quay về trang trước khi xóa mục cuối cùng của trang hiện tại', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation(async (url: string) => ({
      data: [{ _id: 'page-item', name: 'Page Item', muscleGroup: 'BACK', level: 'BEGINNER', scope: 'PRIVATE', canManage: true }],
      meta: { page: url.includes('page=2') ? 2 : 1, totalPages: 2 },
      message: '',
    }));
    render(<ToastProvider><ExerciseLibraryPage /></ToastProvider>);
    await screen.findAllByText('Page Item');
    await user.click(screen.getByRole('button', { name: 'Trang sau' }));
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/api/exercises?page=2&limit=20'));
    await user.click(screen.getAllByRole('button', { name: 'Xóa Page Item' })[0]);
    await user.click(within(screen.getByRole('dialog', { name: 'Xóa bài tập' })).getByRole('button', { name: 'Xóa bài tập' }));
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/api/exercises?page=1&limit=20'));
  });
});
