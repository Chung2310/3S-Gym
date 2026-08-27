// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../components/ToastProvider';
import { api } from '../../services/api';
import AiNutritionDraftModal from './AiNutritionDraftModal';

vi.mock('../../services/api', () => ({ api: { post: vi.fn() } }));

it('bắt buộc PT review rồi submit plan riêng, không tự động công bố', async () => {
  vi.mocked(api.post).mockResolvedValueOnce({ data: { title: 'Thực đơn AI', targetCalories: 1800, macros: { protein: 120, carbs: 190, fat: 62 }, menu: [], reviewStatus: 'PT_REVIEW_REQUIRED' }, message: 'Đã tạo draft.' }).mockResolvedValueOnce({ data: { _id: 'plan-1', status: 'DRAFT' }, message: 'Đã lưu kế hoạch.' });
  const user = userEvent.setup(); render(<ToastProvider><AiNutritionDraftModal open customerId="customer-1" onClose={vi.fn()} onSaved={vi.fn()} /></ToastProvider>);
  await user.type(screen.getByLabelText('Yêu cầu cho AI'), 'Tạo thực đơn giảm mỡ an toàn'); await user.click(screen.getByRole('button', { name: 'Tạo bản nháp AI' }));
  expect(await screen.findByText('PT_REVIEW_REQUIRED')).toBeVisible(); expect(screen.queryByRole('button', { name: 'Tự động công bố' })).not.toBeInTheDocument();
  await user.clear(screen.getByLabelText('Tên kế hoạch')); await user.type(screen.getByLabelText('Tên kế hoạch'), 'PT đã chỉnh sửa'); await user.click(screen.getByRole('button', { name: 'Lưu kế hoạch đã review' }));
  await waitFor(() => expect(api.post).toHaveBeenLastCalledWith('/api/nutrition-plans', expect.objectContaining({ title: 'PT đã chỉnh sửa' })));
});
