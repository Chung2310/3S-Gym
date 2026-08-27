// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { ApiError, api } from '../../../src/services/api';
import { PtView } from '../../../src/components/portal/PortalViews';

vi.mock('../../../src/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/services/api')>();
  return { ...actual, api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } };
});

const transfer = { _id: 'transfer-1', customerId: 'customer-1', fromPtId: 'pt-old', toPtId: 'pt-current', reason: 'Đổi lịch tập', status: 'PENDING' };

describe('Transfer workspace', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset().mockImplementation(async (path) => ({ data: path.startsWith('/api/transfers') ? [transfer] : [], meta: { page: 1, totalPages: 1 }, message: '' }));
    vi.mocked(api.patch).mockReset();
  });

  it('xác nhận nhận khách và refresh danh sách', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { ...transfer, status: 'ACCEPTED' }, message: 'Chuyển PT thành công' });
    const user = userEvent.setup();
    render(<MemoryRouter><ToastProvider><PtView /></ToastProvider></MemoryRouter>);

    await user.click(screen.getByRole('tab', { name: 'Chuyển PT' }));
    await user.click((await screen.findAllByRole('button', { name: 'Xác nhận nhận khách' }))[0]);
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/api/transfers/transfer-1/accept'));
    expect(await screen.findByText('Chuyển PT thành công')).toBeVisible();
    expect(vi.mocked(api.get).mock.calls.filter(([path]) => String(path).startsWith('/api/transfers'))).toHaveLength(2);
  });

  it('giữ bản ghi hiện tại khi backend trả 403 ownership', async () => {
    vi.mocked(api.patch).mockRejectedValue(new ApiError('Bạn không có quyền quản lý khách hàng này.', 403, 'AUTHORIZATION_ERROR', 'req-403'));
    const user = userEvent.setup();
    render(<MemoryRouter><ToastProvider><PtView /></ToastProvider></MemoryRouter>);

    await user.click(screen.getByRole('tab', { name: 'Chuyển PT' }));
    await user.click((await screen.findAllByRole('button', { name: 'Xác nhận nhận khách' }))[0]);
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));

    expect(await screen.findByText('Bạn không có quyền quản lý khách hàng này.')).toBeVisible();
    expect(screen.getAllByText('Đổi lịch tập').length).toBeGreaterThan(0);
    expect(vi.mocked(api.get).mock.calls.filter(([path]) => String(path).startsWith('/api/transfers'))).toHaveLength(1);
  });
});
