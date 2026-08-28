// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { useState } from 'react';
import ProfileFormModal from '../../src/components/ui/ProfileFormModal';

it('đóng bằng Escape và trả focus về nút mở modal', async () => {
  const user = userEvent.setup();
  function Harness() { const [open, setOpen] = useState(false); return <><button onClick={() => setOpen(true)}>Mở form</button><ProfileFormModal open={open} title="Form test" onClose={() => setOpen(false)}><input aria-label="Trường đầu" /></ProfileFormModal></>; }
  render(<Harness />);
  const opener = screen.getByRole('button', { name: 'Mở form' }); await user.click(opener); expect(screen.getByRole('dialog')).toBeVisible(); await user.keyboard('{Escape}'); expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(opener).toHaveFocus();
});

describe('ProfileFormModal', () => {
  it('không render khi đóng và có tên truy cập khi mở', () => {
    const { rerender } = render(<ProfileFormModal open={false} title="Thêm hồ sơ" onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<ProfileFormModal open title="Thêm hồ sơ" onClose={vi.fn()}><input aria-label="Họ tên" /></ProfileFormModal>);
    expect(screen.getByRole('dialog', { name: 'Thêm hồ sơ' })).toBeInTheDocument();
  });

  it('gửi form và khóa nút khi đang lưu', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event) => event.preventDefault());
    const { rerender } = render(<ProfileFormModal open title="Thêm hồ sơ" onClose={vi.fn()} onSubmit={onSubmit} submitLabel="Tạo hồ sơ" />);

    await user.click(screen.getByRole('button', { name: 'Tạo hồ sơ' }));
    expect(onSubmit).toHaveBeenCalledOnce();

    rerender(<ProfileFormModal open title="Thêm hồ sơ" onClose={vi.fn()} onSubmit={onSubmit} loading submitLabel="Tạo hồ sơ" />);
    expect(screen.getByRole('button', { name: 'Đang lưu...' })).toBeDisabled();
  });

  it('đóng ngay khi form sạch', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProfileFormModal open title="Thêm hồ sơ" onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('đóng ngay khi bấm Hủy kể cả khi form có thay đổi', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProfileFormModal open title="Thêm hồ sơ" dirty onClose={onClose}><input aria-label="Họ tên" /></ProfileFormModal>);

    await user.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
