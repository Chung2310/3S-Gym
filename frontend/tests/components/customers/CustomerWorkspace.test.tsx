// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import { PtView } from '../../../src/components/portal/PortalViews';

vi.mock('../../../src/services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe('Customer workspace', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset().mockResolvedValue({ data: [], meta: { page: 1, totalPages: 0 }, message: '' });
  });

  it('tìm khách hàng bằng query keyword và giữ pagination contract', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ToastProvider><PtView /></ToastProvider></MemoryRouter>);

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/customers?page=1&limit=20'));
    await user.type(screen.getByLabelText('Tìm khách hàng'), 'An');
    await user.click(screen.getByRole('button', { name: 'Lọc' }));

    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/api/customers?page=1&limit=20&keyword=An'));
  });

  it('mở chi tiết gói tập từ đúng khách hàng', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [{ _id: 'customer-an', fullName: 'Nguyễn An', phone: '0901000000', status: 'ACTIVE' }], meta: { page: 1, totalPages: 1 }, message: '' });
    const user = userEvent.setup();
    render(<MemoryRouter><ToastProvider><PtView /></ToastProvider></MemoryRouter>);

    await user.click((await screen.findAllByRole('button', { name: 'Gói PT' }))[0]);
    expect(screen.getByRole('dialog', { name: 'Gói PT của Nguyễn An' })).toBeVisible();
    expect(api.get).toHaveBeenCalledWith('/api/customers/customer-an/packages?page=1&limit=20');
  });
});
