// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter as RouterMemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import RawPortalRoutes from '../../src/routes/PortalRoutes';
import { ToastProvider } from '../../src/components/ui/ToastProvider';
import { api } from '../../src/services/api';
import type { UserRole } from '../../src/types';

function MemoryRouter({ children, initialEntries = ['/portal'] }: React.ComponentProps<typeof RouterMemoryRouter>) {
  return <RouterMemoryRouter initialEntries={initialEntries}>{children}</RouterMemoryRouter>;
}

function PortalPage(props: React.ComponentProps<typeof RawPortalRoutes>) {
  return <Routes><Route path="/*" element={<RawPortalRoutes {...props} />} /><Route path="/portal/*" element={<RawPortalRoutes {...props} />} /></Routes>;
}

vi.mock('../../src/services/api', () => ({
  api: {
    get: vi.fn().mockImplementation(async (path: string) => path === '/api/features/me'
      ? { data: { EXERCISE_LIBRARY: true }, message: '' }
      : path.startsWith('/api/dashboard/admin')
      ? { data: { totalPts: 0, totalCustomers: 0, openAlerts: 0, activePackages: 0, filters: {}, sourcePaths: ['/api/users', '/api/customers', '/api/care/alerts', '/api/pt-packages'] }, message: '' }
      : { data: [], meta: { page: 1, totalPages: 0 }, message: '' }), post: vi.fn(), patch: vi.fn(), delete: vi.fn()
  },
}));

const defaultGet = async (path: string) => path === '/api/features/me'
  ? { data: { EXERCISE_LIBRARY: true }, message: '' }
  : path.startsWith('/api/dashboard/admin')
  ? { data: { totalPts: 0, totalCustomers: 0, openAlerts: 0, activePackages: 0, filters: {}, sourcePaths: ['/api/users', '/api/customers', '/api/care/alerts', '/api/pt-packages'] }, message: '' }
  : { data: [], meta: { page: 1, totalPages: 0 }, message: '' };

describe('PortalPage', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset().mockImplementation(defaultGet);
  });
  it('Admin thêm PT bằng popup có đầy đủ thông tin', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'admin', role: 'ADMIN' } }} /></ToastProvider></MemoryRouter>);

    await user.click(await screen.findByRole('tab', { name: 'Huấn luyện viên (PT)' }));
    await user.click(await screen.findByRole('button', { name: 'Thêm Huấn luyện viên' }));

    expect(screen.getByRole('dialog', { name: 'Thêm Huấn luyện viên mới' })).toBeInTheDocument();
    expect(screen.getByLabelText('Chọn ảnh tải lên')).toBeInTheDocument();
    expect(screen.getByLabelText('Họ và tên')).toBeRequired();
    expect(screen.getByLabelText('Ngày sinh')).toBeInTheDocument();
    expect(screen.getByLabelText('Giới tính')).toBeInTheDocument();
    expect(screen.getByLabelText('Số điện thoại')).toBeRequired();
    expect(screen.getByLabelText('Địa chỉ')).toBeInTheDocument();
    expect(screen.getByLabelText('Chuyên môn huấn luyện')).toBeInTheDocument();
    expect(screen.getByLabelText('Số năm kinh nghiệm')).toBeInTheDocument();
    expect(screen.getByLabelText('Chứng chỉ & Bằng cấp (mỗi dòng một chứng chỉ)')).toBeInTheDocument();
    expect(screen.getByLabelText('Giới thiệu bản thân & Triết lý huấn luyện')).toBeInTheDocument();
    expect(screen.getByLabelText('Tên đăng nhập')).toBeRequired();
    expect(screen.getByLabelText('Mật khẩu ban đầu')).toBeRequired();
    expect(screen.getByLabelText('Trạng thái tài khoản')).toBeInTheDocument();
  });

  it('Admin sửa PT trong popup với dữ liệu điền sẵn', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation(async (path: string) => path.startsWith('/api/dashboard/admin')
      ? { data: { totalPts: 1, totalCustomers: 0, openAlerts: 0, activePackages: 0, filters: {}, sourcePaths: ['/api/users', '/api/customers'] }, message: '' }
      : { data: [{ _id: 'pt-1', username: 'pt-lan', fullName: 'PT Lan', phone: '0901234567', email: 'lan@example.com', specialization: 'Yoga', certificates: ['RYT 200'], status: 'ACTIVE' }], meta: { page: 1, totalPages: 1 }, message: '' });
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'admin', role: 'ADMIN' } }} /></ToastProvider></MemoryRouter>);

    await user.click(await screen.findByRole('tab', { name: 'Huấn luyện viên (PT)' }));
    const editButtons = await screen.findAllByRole('button', { name: 'Sửa' });
    await user.click(editButtons[0]);

    expect(screen.getByRole('dialog', { name: 'Cập nhật hồ sơ Huấn luyện viên' })).toBeInTheDocument();
    expect(screen.getByLabelText('Họ và tên')).toHaveValue('PT Lan');
    expect(screen.getByLabelText('Tên đăng nhập')).toHaveValue('pt-lan');
    expect(screen.getByLabelText('Tên đăng nhập')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Mật khẩu mới (để trống nếu không đổi)')).not.toBeRequired();
    expect(screen.getByLabelText('Chứng chỉ & Bằng cấp (mỗi dòng một chứng chỉ)')).toHaveValue('RYT 200');
  });

  it.each<[UserRole, string]>([
    ['ADMIN', 'Tổng quan hệ thống'],
    ['PT', 'Khách hàng của tôi'],
    ['CUSTOMER', 'Hành trình của tôi'],
  ])('hiển thị màn hình phù hợp vai trò %s', async (role, heading) => {
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: role.toLowerCase(), role } }} /></ToastProvider></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it.each<[UserRole, string]>([
    ['ADMIN', '/admin'],
    ['PT', '/pt/customers'],
    ['CUSTOMER', '/me'],
  ])('điều hướng vai trò %s tới route riêng', async (role, expectedPath) => {
    function Location() {
      const { pathname } = useLocation();
      return <span data-testid="route-path">{pathname}</span>;
    }
    render(<MemoryRouter initialEntries={['/portal']}><ToastProvider><PortalPage session={{ token: 'abc', user: { username: role.toLowerCase(), role } }} /><Location /></ToastProvider></MemoryRouter>);
    expect(await screen.findByTestId('route-path')).toHaveTextContent(expectedPath);
  });

  it('PT có thao tác cấp tài khoản cho khách chưa có user', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => path.startsWith('/api/customers')
      ? { data: [{ _id: 'customer-1', fullName: 'Khách A', phone: '0901', status: 'ACTIVE' }], meta: { page: 1, totalPages: 1 }, message: '' }
      : defaultGet(path));
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

  it('hiển thị nhóm chức năng khách hàng như tab trình duyệt', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);

    expect(screen.getByRole('tablist', { name: 'Nội dung khách hàng' })).toBeVisible();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: 'Khách hàng' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('tab', { name: 'Mục tiêu' }));

    expect(screen.getByRole('tab', { name: 'Mục tiêu' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Khách hàng' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'customer-tab-goals');
  });

  it('PT sửa khách bằng popup và vẫn có thao tác cấp tài khoản riêng', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation(async (path: string) => path.startsWith('/api/customers')
      ? { data: [{ _id: 'customer-edit-1', fullName: 'Khách A', phone: '0901234567', status: 'ACTIVE' }], meta: { page: 1, totalPages: 1 }, message: '' }
      : defaultGet(path));
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
    vi.mocked(api.get).mockImplementation(async (path: string) => path.startsWith('/api/customers')
      ? { data: [{ _id: 'customer-package-1', fullName: 'Khách Gói', phone: '0901234567', status: 'ACTIVE' }], meta: { page: 1, totalPages: 1 }, message: '' }
      : defaultGet(path));
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);
    const buttons = await screen.findAllByRole('button', { name: 'Gói PT' });
    await user.click(buttons[0]);
    expect(screen.getByRole('dialog', { name: 'Gói PT của Khách Gói' })).toBeInTheDocument();
  });

  it('PT mở được form tạo khách hàng mới', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));
    expect(screen.getByRole('dialog', { name: 'Thêm khách hàng' })).toBeInTheDocument();
    expect(screen.getByLabelText('Họ tên')).toBeInTheDocument();
    expect(screen.getByLabelText('Số điện thoại')).toBeInTheDocument();
  });

  it('PT lọc danh sách nội dung theo trạng thái và khách hàng', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);
    await user.click(screen.getByRole('tab', { name: 'Mục tiêu' }));
    await user.selectOptions(screen.getByLabelText('Lọc theo trạng thái'), 'DRAFT');
    await user.type(screen.getByLabelText('Lọc theo mã khách hàng'), '507f1f77bcf86cd799439011');
    await user.click(screen.getByRole('button', { name: 'Lọc' }));
    expect(api.get).toHaveBeenLastCalledWith(expect.stringContaining('status=DRAFT'));
    expect(api.get).toHaveBeenLastCalledWith(expect.stringContaining('customerId=507f1f77bcf86cd799439011'));
  });

  it('PT tạo nội dung bằng popup', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);
    await user.click(screen.getByRole('tab', { name: 'Mục tiêu' }));
    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));
    expect(screen.getByRole('dialog', { name: 'Tạo mục tiêu' })).toBeInTheDocument();
  });

  it('PT không còn thấy tab giáo án cũ ở menu khách hàng', async () => {
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);
    expect(screen.queryByRole('tab', { name: 'Giáo án' })).not.toBeInTheDocument();
  });

  it('route portal không tồn tại hiển thị trang khôi phục đúng vai trò', async () => {
    function Location() { return <span data-testid="invalid-route">{useLocation().pathname}</span>; }
    render(<MemoryRouter initialEntries={['/portal/khong-ton-tai']}><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /><Location /></ToastProvider></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Quay về trang dành cho PT' })).toHaveAttribute('href', '/pt/customers');
    expect(screen.getByTestId('invalid-route')).toHaveTextContent('/portal/khong-ton-tai');
  });

  it('điều hướng đúng khi PortalPage nằm dưới route cha /portal/* như ứng dụng thật', async () => {
    render(<MemoryRouter initialEntries={['/portal/pt/customers']}><ToastProvider><Routes><Route path="/portal/*" element={<RawPortalRoutes session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} />} /></Routes></ToastProvider></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: 'Khách hàng của tôi' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Không tìm thấy trang' })).not.toBeInTheDocument();
  });

  it('PT thêm bữa ăn trực tiếp trong popup dinh dưỡng', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);
    await user.click(screen.getByRole('tab', { name: 'Dinh dưỡng' }));
    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));
    await user.click(screen.getByRole('button', { name: 'Thêm bữa ăn' }));
    expect(screen.getByLabelText('Tên bữa')).toBeInTheDocument();
    expect(screen.getByLabelText('Món ăn')).toBeInTheDocument();
  });

  it('route module giáo án khách hàng cũ chuyển về khách hàng', async () => {
    const { unmount } = render(<MemoryRouter initialEntries={['/pt/my-workout-plans']}><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Giáo án của tôi' })).toBeVisible();
    unmount();

    render(<MemoryRouter initialEntries={['/pt/customer-workout-plans']}><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /></ToastProvider></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: /Khách hàng/i })).toBeVisible();
  });

  it.each(['/pt/workout-plans', '/pt/workouts'])('chuyển route giáo án cũ %s sang Giáo án của tôi', async (legacyPath) => {
    function Location() { return <output data-testid="workout-route">{useLocation().pathname}</output>; }
    render(<MemoryRouter initialEntries={[legacyPath]}><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /><Location /></ToastProvider></MemoryRouter>);

    expect(await screen.findByTestId('workout-route')).toHaveTextContent('/pt/my-workout-plans');
    expect(await screen.findByRole('heading', { name: 'Giáo án của tôi' })).toBeVisible();
  });

  it('chuyển route thư viện bài tập cũ sang tab trong Giáo án của tôi', async () => {
    function Location() {
      const location = useLocation();
      return <output data-testid="exercise-route">{`${location.pathname}${location.search}`}</output>;
    }

    render(<MemoryRouter initialEntries={['/pt/exercises']}><ToastProvider><PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} /><Location /></ToastProvider></MemoryRouter>);

    expect(await screen.findByTestId('exercise-route')).toHaveTextContent('/pt/my-workout-plans?tab=exercises');
  });
});
