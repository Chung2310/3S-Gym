// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import PortalPage from './PortalPage';
import { ToastProvider } from '../components/ToastProvider';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: { get: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, totalPages: 0 } }), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe('PortalPage', () => {
  it('Admin thêm PT bằng popup có đầy đủ thông tin', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'admin', role: 'ADMIN' } }} /></ToastProvider></MemoryRouter>);

    await user.click(await screen.findByRole('button', { name: 'Tạo PT' }));

    expect(screen.getByRole('dialog', { name: 'Thêm PT' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tải ảnh lên')).toBeInTheDocument();
    expect(screen.getByLabelText('Họ tên')).toBeRequired();
    expect(screen.getByLabelText('Ngày sinh')).toBeInTheDocument();
    expect(screen.getByLabelText('Giới tính')).toBeInTheDocument();
    expect(screen.getByLabelText('Số điện thoại')).toBeRequired();
    expect(screen.getByLabelText('Địa chỉ')).toBeInTheDocument();
    expect(screen.getByLabelText('Chuyên môn')).toBeInTheDocument();
    expect(screen.getByLabelText('Số năm kinh nghiệm')).toBeInTheDocument();
    expect(screen.getByLabelText('Chứng chỉ')).toBeInTheDocument();
    expect(screen.getByLabelText('Giới thiệu')).toBeInTheDocument();
    expect(screen.getByLabelText('Tên đăng nhập')).toBeRequired();
    expect(screen.getByLabelText('Mật khẩu ban đầu')).toBeRequired();
    expect(screen.getByLabelText('Trạng thái')).toBeInTheDocument();
  });

  it('Admin sửa PT trong popup với dữ liệu điền sẵn', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: [{ _id: 'pt-1', username: 'pt-lan', fullName: 'PT Lan', phone: '0901234567', email: 'lan@example.com', specialization: 'Yoga', certificates: ['RYT 200'], status: 'ACTIVE' }], meta: { page: 1, totalPages: 1 } });
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'admin', role: 'ADMIN' } }} /></ToastProvider></MemoryRouter>);

    const editButtons = await screen.findAllByRole('button', { name: 'Sửa' });
    await user.click(editButtons[0]);

    expect(screen.getByRole('dialog', { name: 'Sửa PT' })).toBeInTheDocument();
    expect(screen.getByLabelText('Họ tên')).toHaveValue('PT Lan');
    expect(screen.getByLabelText('Tên đăng nhập')).toHaveValue('pt-lan');
    expect(screen.getByLabelText('Tên đăng nhập')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Mật khẩu mới')).not.toBeRequired();
    expect(screen.getByLabelText('Chứng chỉ')).toHaveValue('RYT 200');
  });

  it.each([
    ['ADMIN', 'Quản lý tài khoản PT'],
    ['PT', 'Khách hàng của tôi'],
    ['CUSTOMER', 'Hành trình của tôi'],
  ])('hiển thị màn hình phù hợp vai trò %s', async (role, heading) => {
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: role.toLowerCase(), role } }} /></ToastProvider></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it('PT có thao tác cấp tài khoản cho khách chưa có user', async () => {
    api.get.mockResolvedValueOnce({ data: [{ _id: 'customer-1', fullName: 'Khách A', phone: '0901', status: 'ACTIVE' }], meta: { page: 1, totalPages: 1 } });
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);
    const user = userEvent.setup();
    const buttons = await screen.findAllByRole('button', { name: 'Cấp tài khoản' });
    expect(buttons).toHaveLength(2);
    await user.click(buttons[0]);
    expect(screen.getByRole('dialog', { name: 'Cấp tài khoản cho Khách A' })).toBeInTheDocument();
  });

  it('PT tạo khách bằng popup thay vì form nội tuyến', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);

    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));

    expect(screen.getByRole('dialog', { name: 'Thêm khách hàng' })).toBeInTheDocument();
  });

  it('PT sửa khách bằng popup và vẫn có thao tác cấp tài khoản riêng', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: [{ _id: 'customer-edit-1', fullName: 'Khách A', phone: '0901234567', status: 'ACTIVE' }], meta: { page: 1, totalPages: 1 } });
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);

    const editButtons = await screen.findAllByRole('button', { name: 'Sửa' });
    expect(screen.getAllByRole('button', { name: 'Cấp tài khoản' })).toHaveLength(2);
    await user.click(editButtons[0]);

    expect(screen.getByRole('dialog', { name: 'Sửa khách hàng' })).toBeInTheDocument();
    expect(screen.getByLabelText('Họ tên')).toHaveValue('Khách A');
    expect(screen.queryByLabelText('Tên đăng nhập')).not.toBeInTheDocument();
  });

  it('PT quản lý gói tập của khách trong popup', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: [{ _id: 'customer-package-1', fullName: 'Khách Gói', phone: '0901234567', status: 'ACTIVE' }], meta: { page: 1, totalPages: 1 } });
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);
    const buttons = await screen.findAllByRole('button', { name: 'Gói PT' });
    await user.click(buttons[0]);
    expect(screen.getByRole('dialog', { name: 'Gói PT của Khách Gói' })).toBeInTheDocument();
  });

  it('PT mở được form tạo yêu cầu chuyển khách', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'Chuyển PT' }));
    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));
    expect(screen.getByRole('dialog', { name: 'Tạo yêu cầu chuyển PT' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Mã khách hàng' })).toBeInTheDocument();
    expect(screen.getByLabelText('Mã PT nhận')).toBeInTheDocument();
  });

  it('PT lọc danh sách nội dung theo trạng thái và khách hàng', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'Mục tiêu' }));
    await user.selectOptions(screen.getByLabelText('Lọc theo trạng thái'), 'DRAFT');
    await user.type(screen.getByLabelText('Lọc theo mã khách hàng'), '507f1f77bcf86cd799439011');
    await user.click(screen.getByRole('button', { name: 'Lọc' }));
    expect(api.get).toHaveBeenLastCalledWith(expect.stringContaining('status=DRAFT'));
    expect(api.get).toHaveBeenLastCalledWith(expect.stringContaining('customerId=507f1f77bcf86cd799439011'));
  });

  it('PT tạo nội dung bằng popup', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'InBody' }));
    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));
    expect(screen.getByRole('dialog', { name: 'Tạo InBody' })).toBeInTheDocument();
  });

  it('PT thêm buổi và bài tập trực tiếp trong popup giáo án', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'Giáo án' }));
    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));
    await user.click(screen.getByRole('button', { name: 'Thêm buổi tập' }));
    await user.click(screen.getByRole('button', { name: 'Thêm bài tập' }));
    expect(screen.getByLabelText('Tên buổi 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Tên bài tập')).toBeInTheDocument();
    expect(screen.queryByLabelText(/JSON/)).not.toBeInTheDocument();
  });

  it('PT thêm bữa ăn trực tiếp trong popup dinh dưỡng', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'Dinh dưỡng' }));
    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));
    await user.click(screen.getByRole('button', { name: 'Thêm bữa ăn' }));
    expect(screen.getByLabelText('Tên bữa')).toBeInTheDocument();
    expect(screen.getByLabelText('Món ăn')).toBeInTheDocument();
  });
});
