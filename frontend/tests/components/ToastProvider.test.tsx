// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../../src/components/ui/ToastProvider';

function Demo() {
  const toast = useToast();
  return <button onClick={() => toast.success('Lưu khách hàng thành công.')}>Lưu</button>;
}

describe('ToastProvider', () => {
  it('hiển thị thông báo tiếng Việt sau thao tác thành công', async () => {
    const user = userEvent.setup();
    render(<ToastProvider><Demo /></ToastProvider>);
    await user.click(screen.getByRole('button', { name: 'Lưu' }));
    expect(screen.getByText('Lưu khách hàng thành công.')).toBeInTheDocument();
  });

  it('hiển thị Toast phía trên lớp phủ popup', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <div className="modal-backdrop" data-testid="popup-backdrop" />
        <Demo />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    const toastStack = screen.getByText('Lưu khách hàng thành công.').closest('.toast-stack');
    expect(toastStack).toHaveClass('z-[10000]');
  });
});
