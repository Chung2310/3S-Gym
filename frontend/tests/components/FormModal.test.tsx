// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import FormModal from '../../src/components/ui/FormModal';

it('FormModal render dialog và xác nhận khi đóng form bẩn', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(<FormModal open title="Tạo nội dung" dirty onClose={onClose}><input aria-label="Tên" /></FormModal>);
  expect(screen.getByRole('dialog', { name: 'Tạo nội dung' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Hủy' }));
  expect(screen.getByRole('dialog', { name: 'Bỏ các thay đổi?' })).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
});
