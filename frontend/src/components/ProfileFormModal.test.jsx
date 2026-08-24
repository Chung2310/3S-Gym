// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ProfileFormModal from './ProfileFormModal';

describe('ProfileFormModal', () => {
  it('không render khi đóng và có tên truy cập khi mở', () => {
    const { rerender } = render(<ProfileFormModal open={false} title="Thêm hồ sơ" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<ProfileFormModal open title="Thêm hồ sơ"><input aria-label="Họ tên" /></ProfileFormModal>);
    expect(screen.getByRole('dialog', { name: 'Thêm hồ sơ' })).toBeInTheDocument();
  });

  it('gửi form và khóa nút khi đang lưu', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event) => event.preventDefault());
    const { rerender } = render(<ProfileFormModal open title="Thêm hồ sơ" onSubmit={onSubmit} submitLabel="Tạo hồ sơ" />);

    await user.click(screen.getByRole('button', { name: 'Tạo hồ sơ' }));
    expect(onSubmit).toHaveBeenCalledOnce();

    rerender(<ProfileFormModal open title="Thêm hồ sơ" onSubmit={onSubmit} loading submitLabel="Tạo hồ sơ" />);
    expect(screen.getByRole('button', { name: 'Đang lưu...' })).toBeDisabled();
  });

  it('đóng ngay khi form sạch', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProfileFormModal open title="Thêm hồ sơ" onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('yêu cầu xác nhận trước khi bỏ form đã thay đổi', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProfileFormModal open title="Thêm hồ sơ" dirty onClose={onClose}><input aria-label="Họ tên" /></ProfileFormModal>);

    await user.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(screen.getByRole('dialog', { name: 'Bỏ các thay đổi?' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Bỏ thay đổi' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
