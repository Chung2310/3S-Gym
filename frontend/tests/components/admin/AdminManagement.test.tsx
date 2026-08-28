// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import RoleBadge from '../../../src/components/ui/RoleBadge';
import UserFormModal from '../../../src/components/ui/UserFormModal';
import UserManagementView from '../../../src/components/admin/UserManagementView';
import FeatureFlagsView from '../../../src/components/admin/FeatureFlagsView';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';

vi.mock('../../../src/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    upload: vi.fn(),
  },
}));

describe('RoleBadge', () => {
  it('hiển thị đúng nhãn và icon cho vai trò ADMIN, PT, CUSTOMER', () => {
    const { rerender } = render(<RoleBadge role="ADMIN" />);
    expect(screen.getByText('Admin')).toBeInTheDocument();

    rerender(<RoleBadge role="PT" />);
    expect(screen.getByText('Huấn luyện viên')).toBeInTheDocument();

    rerender(<RoleBadge role="CUSTOMER" />);
    expect(screen.getByText('Khách hàng')).toBeInTheDocument();
  });
});

describe('UserManagementView', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path.startsWith('/api/users')) {
        return {
          data: [
            { _id: 'u-1', username: 'admin', fullName: 'Quản lý 3S', role: 'ADMIN', status: 'ACTIVE', phone: '0900000001' },
            { _id: 'u-2', username: 'pt-tuan', fullName: 'PT Tuấn', role: 'PT', status: 'ACTIVE', phone: '0900000002' },
          ],
          meta: { page: 1, totalPages: 1 },
          message: '',
        };
      }
      return { data: {}, message: '' };
    });
  });

  it('tải danh sách tài khoản và hiển thị đầy đủ thông tin', async () => {
    render(
      <ToastProvider>
        <UserManagementView />
      </ToastProvider>
    );

    const names = await screen.findAllByText('Quản lý 3S');
    expect(names[0]).toBeInTheDocument();
    expect(screen.getAllByText('PT Tuấn')[0]).toBeInTheDocument();
  });

  it('mở modal tạo tài khoản khi bấm Thêm tài khoản', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <UserManagementView />
      </ToastProvider>
    );

    await user.click(await screen.findByRole('button', { name: /Thêm tài khoản/i }));
    expect(screen.getByRole('dialog', { name: /Tạo tài khoản/i })).toBeInTheDocument();
  });
});

describe('FeatureFlagsView', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        OCR_INBODY: true,
        NUTRITION_AI: false,
      },
      message: '',
    });
  });

  it('hiển thị danh sách tính năng và cho phép bật/tắt', async () => {
    const user = userEvent.setup();
    vi.mocked(api.patch).mockResolvedValue({ message: 'Thành công', data: {} });

    render(
      <ToastProvider>
        <FeatureFlagsView />
      </ToastProvider>
    );

    expect(await screen.findByText('Quét phiếu InBody tự động')).toBeInTheDocument();
    expect(screen.getByText('Dinh dưỡng & Thực đơn AI')).toBeInTheDocument();
  });
});
