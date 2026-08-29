// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import CustomerFormModal from '../../src/components/ui/CustomerFormModal';
import { ToastProvider } from '../../src/components/ui/ToastProvider';
import { api } from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  api: { post: vi.fn(), patch: vi.fn() },
}));

function renderModal(props = {}) {
  const defaults = { open: true, onClose: vi.fn(), onSaved: vi.fn() };
  const merged = { ...defaults, ...props };
  render(<ToastProvider><CustomerFormModal {...merged} /></ToastProvider>);
  return merged;
}

describe('CustomerFormModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hiển thị đủ trường khách và ẩn trường PT, tài khoản', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Thêm khách hàng' })).toBeInTheDocument();
    for (const label of ['Họ tên', 'Ngày sinh', 'Giới tính', 'Số điện thoại', 'Email', 'Chiều cao (cm)', 'Cân nặng ban đầu (kg)', 'Lưu ý sức khỏe', 'Ghi chú nội bộ', 'Trạng thái']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByLabelText('Họ tên')).toBeRequired();
    expect(screen.getByLabelText('Số điện thoại')).toBeRequired();
    expect(screen.queryByLabelText('Ảnh đại diện')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Chuyên môn')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Chứng chỉ')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Tên đăng nhập')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Mật khẩu ban đầu')).not.toBeInTheDocument();
  });

  it('tạo khách với payload đã chuẩn hóa', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({ message: 'Tạo khách hàng thành công.', data: { _id: 'customer-1' } });
    const props = renderModal();

    await user.type(screen.getByLabelText('Họ tên'), '  Khách A  ');
    await user.type(screen.getByLabelText('Số điện thoại'), '0901234567');
    await user.type(screen.getByLabelText('Chiều cao (cm)'), '165.5');
    await user.click(screen.getByRole('button', { name: 'Tạo khách hàng' }));

    expect(api.post).toHaveBeenCalledWith('/api/customers', expect.objectContaining({
      fullName: 'Khách A', phone: '0901234567', height: 165.5,
      initialWeight: null, email: null, dateOfBirth: null,
    }));
    expect(props.onSaved).toHaveBeenCalledWith({ _id: 'customer-1' });
    expect(await screen.findByText('Tạo khách hàng thành công.')).toBeInTheDocument();
  });

  it('sửa khách bằng PATCH với dữ liệu điền sẵn', async () => {
    const user = userEvent.setup();
    vi.mocked(api.patch).mockResolvedValue({ message: 'Cập nhật khách hàng thành công.', data: { _id: 'customer-1', fullName: 'Khách B' } });
    const props = renderModal({ customer: { _id: 'customer-1', fullName: 'Khách A', phone: '0901234567', dateOfBirth: '1995-04-20T00:00:00.000Z', gender: 'FEMALE', status: 'ACTIVE' } });

    expect(screen.getByRole('dialog', { name: 'Sửa khách hàng' })).toBeInTheDocument();
    expect(screen.getByLabelText('Họ tên')).toHaveValue('Khách A');
    expect(screen.getByLabelText('Ngày sinh')).toHaveValue('1995-04-20');
    await user.clear(screen.getByLabelText('Họ tên'));
    await user.type(screen.getByLabelText('Họ tên'), 'Khách B');
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    expect(api.patch).toHaveBeenCalledWith('/api/customers/customer-1', expect.objectContaining({ fullName: 'Khách B' }));
    expect(props.onSaved).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'Khách B' }));
  });
});
