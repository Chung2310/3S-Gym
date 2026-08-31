// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../src/components/ui/ToastProvider';
import WalletPage from '../../src/pages/common/WalletPage';
import { creditsService } from '../../src/services/credits';

describe('WalletPage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('hiển thị gói, vô hiệu cổng chưa cấu hình và kiểm tra số tiền tùy chỉnh', async () => {
    vi.spyOn(creditsService, 'packages').mockResolvedValue({
      packages: [{ id: 'p1', name: 'Starter', description: 'Bắt đầu', amountVnd: 100000, baseCredits: 100, bonusCredits: 10, grantCredits: 110 }],
      gateways: { VNPAY: true, MOMO: false },
    });
    vi.spyOn(creditsService, 'ledger').mockResolvedValue({ items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } });
    render(<MemoryRouter><ToastProvider><WalletPage /></ToastProvider></MemoryRouter>);

    expect(await screen.findByText('Starter')).toBeInTheDocument();
    const topupSection = screen.getByText('Starter').closest('section');
    const ledgerSection = screen.getByRole('combobox').closest('section');
    expect(topupSection).toHaveClass('rounded-3xl', 'border', 'p-5', 'sm:p-7');
    expect(ledgerSection).toHaveClass('rounded-3xl', 'border', 'p-5', 'sm:p-7');
    expect(screen.getByRole('radio', { name: 'MoMo' })).toBeDisabled();
    await userEvent.click(screen.getByText('Số tiền tùy chọn'));
    await userEvent.type(screen.getByLabelText('Số tiền nạp tùy chọn'), '10500');

    expect(screen.getByRole('alert')).toHaveTextContent('chia hết cho 1.000đ');
    expect(screen.getByRole('button', { name: 'Thanh toán an toàn' })).toBeDisabled();
    await waitFor(() => expect(creditsService.ledger).toHaveBeenCalled());
  });
});
