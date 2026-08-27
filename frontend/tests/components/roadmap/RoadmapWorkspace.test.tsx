// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import RoadmapWorkspace from '../../../src/components/roadmap/RoadmapWorkspace';

vi.mock('../../../src/services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe('RoadmapWorkspace', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset().mockResolvedValue({ data: [], meta: { page: 1, totalPages: 0 }, message: '' });
    vi.mocked(api.post).mockReset().mockResolvedValue({ data: { _id: 'roadmap-1', status: 'DRAFT', version: 1 }, message: 'Tạo roadmap thành công.' });
    vi.mocked(api.patch).mockReset();
  });

  it('chặn phase order trùng trước khi gửi backend', async () => {
    const user = userEvent.setup();
    render(<ToastProvider><RoadmapWorkspace /></ToastProvider>);
    await user.click(screen.getByRole('button', { name: 'Tạo roadmap' }));
    await user.type(screen.getByLabelText('Mã khách hàng'), '507f1f77bcf86cd799439011');
    await user.type(screen.getByLabelText('Tên roadmap'), 'Lộ trình 12 tuần');
    await user.type(screen.getByLabelText('Tên phase 1'), 'Nền tảng');
    await user.click(screen.getByRole('button', { name: 'Thêm phase' }));
    await user.type(screen.getByLabelText('Tên phase 2'), 'Tăng tiến');
    await user.clear(screen.getByLabelText('Thứ tự phase 2'));
    await user.type(screen.getByLabelText('Thứ tự phase 2'), '1');
    await user.click(screen.getByRole('button', { name: 'Lưu roadmap' }));

    expect(screen.getByText('Thứ tự phase không được trùng.')).toBeVisible();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('tạo roadmap với tuần và payload phase có thứ tự', async () => {
    const user = userEvent.setup();
    render(<ToastProvider><RoadmapWorkspace /></ToastProvider>);
    await user.click(screen.getByRole('button', { name: 'Tạo roadmap' }));
    await user.type(screen.getByLabelText('Mã khách hàng'), '507f1f77bcf86cd799439011');
    await user.type(screen.getByLabelText('Tên roadmap'), 'Lộ trình 12 tuần');
    await user.type(screen.getByLabelText('Tên phase 1'), 'Nền tảng');
    await user.click(screen.getByRole('button', { name: 'Thêm tuần vào phase 1' }));
    await user.type(screen.getByLabelText('Trọng tâm tuần 1 phase 1'), 'Kỹ thuật squat');
    await user.click(screen.getByRole('button', { name: 'Lưu roadmap' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/roadmaps', expect.objectContaining({ phases: [expect.objectContaining({ order: 1, name: 'Nền tảng', weeks: [expect.objectContaining({ week: 1, focus: 'Kỹ thuật squat' })] })] })));
  });
});
