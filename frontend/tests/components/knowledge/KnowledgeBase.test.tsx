// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import AdminKnowledgePage from '../../../src/pages/admin/AdminKnowledgePage';

vi.mock('../../../src/services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

it('chỉ cho index tài liệu published và search hiển thị score/citation', async () => {
  vi.mocked(api.get).mockImplementation(async (path) =>
    path.startsWith('/api/knowledge/search')
      ? {
          data: [
            {
              documentId: 'd1',
              title: 'Hướng dẫn squat',
              content: 'Giữ lưng trung lập',
              score: 0.92,
            },
          ],
          message: '',
        }
      : {
          data: [
            {
              _id: 'draft-1',
              title: 'Draft',
              topic: 'Training',
              content: '...',
              status: 'DRAFT',
              version: 1,
            },
            {
              _id: 'pub-1',
              title: 'Published',
              topic: 'Training',
              content: '...',
              status: 'PUBLISHED',
              version: 1,
            },
          ],
          meta: { page: 1, totalPages: 1 },
          message: '',
        }
  );
  const user = userEvent.setup();
  render(
    <ToastProvider>
      <AdminKnowledgePage />
    </ToastProvider>
  );
  expect(await screen.findByRole('button', { name: 'Index Draft' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Index Published' })).toBeEnabled();
  await user.type(screen.getByLabelText('Tìm tri thức'), 'squat');
  await user.click(screen.getByRole('button', { name: 'Tìm kiếm' }));
  expect(await screen.findByRole('link', { name: 'Hướng dẫn squat' })).toBeVisible();
  expect(screen.getByText(/92%/)).toBeVisible();
});
