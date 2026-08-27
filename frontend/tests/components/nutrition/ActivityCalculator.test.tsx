// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import ActivityCalculator from '../../../src/components/nutrition/ActivityCalculator';

vi.mock('../../../src/services/api', () => ({ api: { post: vi.fn() } }));

it('hiển thị phiên bản công thức và calories/macros', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { formula: 'MIFFLIN_ST_JEOR', formulaVersion: 1, bmr: 1450, tdee: 2200, targetCalories: 1870, macros: { protein: 124, carbs: 190, fat: 50 } }, message: 'Đã tính.' });
  const user = userEvent.setup(); render(<ToastProvider><ActivityCalculator /></ToastProvider>);
  await user.type(screen.getByLabelText('Cân nặng (kg)'), '62'); await user.type(screen.getByLabelText('Chiều cao (cm)'), '165'); await user.type(screen.getByLabelText('Tuổi'), '32');
  await user.click(screen.getByRole('button', { name: 'Tính chỉ số' }));
  expect(await screen.findByText(/MIFFLIN_ST_JEOR v1/)).toBeVisible();
  expect(screen.getByText(/1870 kcal/)).toBeVisible();
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/nutrition/metrics', expect.objectContaining({ weightKg: 62 })));
});
