// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import ProgressReportEditor from '../../../src/components/progress/ProgressReportEditor';
import ProgressReportGenerator from '../../../src/components/progress/ProgressReportGenerator';

vi.mock('../../../src/services/api', () => ({ api: { post: vi.fn(), patch: vi.fn() } }));

it('lưu draft rồi công bố bằng thao tác riêng', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { _id: 'report-1', status: 'DRAFT' }, message: 'Đã lưu bản nháp.' });
  vi.mocked(api.patch).mockResolvedValue({ data: { _id: 'report-1', status: 'PUBLISHED' }, message: 'Đã công bố.' });
  const user = userEvent.setup();
  render(<ToastProvider><ProgressReportEditor customerId="customer-1" onSaved={vi.fn()} /></ToastProvider>);
  await user.type(screen.getByLabelText('Từ ngày'), '2026-08-01');
  await user.type(screen.getByLabelText('Đến ngày'), '2026-08-31');
  await user.type(screen.getByLabelText('Tóm tắt tiến độ'), 'Tiến độ tốt.');
  await user.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
  await user.click(await screen.findByRole('button', { name: 'Công bố báo cáo' }));
  await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/api/progress-reports/report-1/publish'));
  expect(screen.getByText('Đã công bố')).toBeVisible();
});

it('generates, edits and publishes an automatic report draft', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { _id: 'generated-1', summary: 'Báo cáo tự động.', warnings: ['Thiếu Body Fat.'], metrics: { weightDelta: -1.2 } }, message: 'Đã tạo.' });
  vi.mocked(api.patch).mockResolvedValue({ data: { _id: 'generated-1' }, message: 'Thành công.' });
  const user = userEvent.setup();
  render(<ToastProvider><ProgressReportGenerator customerId="customer-1" onSaved={vi.fn()} /></ToastProvider>);
  await user.type(screen.getByLabelText('Từ ngày'), '2026-08-01'); await user.type(screen.getByLabelText('Đến ngày'), '2026-08-31');
  await user.click(screen.getByRole('button', { name: 'Tạo báo cáo tự động' }));
  expect(await screen.findByDisplayValue('Báo cáo tự động.')).toBeVisible(); expect(screen.getByText('Thiếu Body Fat.')).toBeVisible();
  await user.clear(screen.getByLabelText('Nội dung báo cáo')); await user.type(screen.getByLabelText('Nội dung báo cáo'), 'PT đã duyệt.');
  await user.click(screen.getByRole('button', { name: 'Lưu chỉnh sửa' })); await user.click(screen.getByRole('button', { name: 'Công bố báo cáo' }));
  await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/api/progress-reports/generated-1', { summary: 'PT đã duyệt.' }));
  expect(api.patch).toHaveBeenCalledWith('/api/progress-reports/generated-1/publish');
});
