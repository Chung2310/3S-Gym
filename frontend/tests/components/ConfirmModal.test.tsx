// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmModal from '../../src/components/ui/ConfirmModal';

describe('ConfirmModal', () => {
  it('chỉ gọi onConfirm sau khi người dùng xác nhận trong popup', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmModal
        open
        title="Công bố InBody?"
        description="Khách hàng sẽ nhìn thấy nội dung này."
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    expect(onConfirm).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
