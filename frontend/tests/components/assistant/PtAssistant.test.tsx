// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import SuggestionReview, { type Suggestion } from '../../../src/components/assistant/SuggestionReview';

vi.mock('../../../src/services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

it('hiển thị safety/citation và chỉ apply sau approve', async () => {
  const initialSuggestion: Suggestion = {
    _id: 's1',
    content: 'Đề xuất tập nhẹ',
    reviewStatus: 'PT_REVIEW_REQUIRED',
    appliedAt: null,
    citations: [{ documentId: 'd1', title: 'Hướng dẫn an toàn' }],
    safetyWarnings: ['PT phải kiểm tra trước khi sử dụng.'],
    requestType: 'WORKOUT',
    scenario: 'Tập nhẹ',
  };

  vi.mocked(api.patch).mockResolvedValue({ data: { ...initialSuggestion, reviewStatus: 'APPROVED' }, message: 'Đã duyệt.' });
  const user = userEvent.setup();
  render(
    <ToastProvider>
      <SuggestionReview initial={initialSuggestion} />
    </ToastProvider>
  );

  expect(await screen.findByText('PT_REVIEW_REQUIRED')).toBeVisible();
  expect(screen.getByRole('link', { name: 'Hướng dẫn an toàn' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Đánh dấu đã sử dụng' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Phê duyệt' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Đánh dấu đã sử dụng' })).toBeEnabled());
});
