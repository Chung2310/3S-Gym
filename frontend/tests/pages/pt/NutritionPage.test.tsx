// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import NutritionPage from '../../../src/pages/pt/NutritionPage';

vi.mock('../../../src/services/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

it('giữ manual fallback khi AI lỗi', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [], message: '' });
  vi.mocked(api.post).mockRejectedValue(new Error('AI tạm thời không khả dụng'));
  const user = userEvent.setup();
  render(
    <ToastProvider>
      <NutritionPage />
    </ToastProvider>
  );
  await user.type(screen.getByLabelText('Mã khách hàng dinh dưỡng'), 'customer-1');
  await user.click(screen.getByRole('button', { name: 'Mở trợ lý AI' }));
  await user.type(screen.getByLabelText('Yêu cầu cho AI'), 'Tạo thực đơn giảm mỡ an toàn');
  await user.click(screen.getByRole('button', { name: 'Tạo bản nháp AI' }));
  expect(await screen.findByText('AI tạm thời không khả dụng')).toBeVisible();
  await user.click(screen.getByRole('button', { name: /4\. Nhật Ký/i }));
  expect(screen.getByRole('button', { name: 'Lưu nhật ký' })).toBeVisible();
});
