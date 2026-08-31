// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PaymentResultPage from '../../src/pages/common/PaymentResultPage';
import { creditsService } from '../../src/services/credits';

const refresh = vi.fn();
vi.mock('../../src/contexts/CreditWalletContext', () => ({ useCreditWallet: () => ({ refresh }) }));

describe('PaymentResultPage', () => {
  afterEach(() => { sessionStorage.clear(); refresh.mockReset(); vi.restoreAllMocks(); });

  it('dùng mã đơn cục bộ và chỉ tin trạng thái trả về từ server', async () => {
    sessionStorage.setItem('3s:pending-credit-order-id', 'order-local');
    vi.spyOn(creditsService, 'order').mockResolvedValue({ id: 'order-local', orderCode: 'CR-01', gateway: 'VNPAY', status: 'PAID', source: 'CUSTOM', amountVnd: 10000, baseCredits: 10, bonusCredits: 0, grantCredits: 10, expiresAt: new Date().toISOString() });
    render(<MemoryRouter initialEntries={['/wallet/payment-result?vnp_ResponseCode=00']}><PaymentResultPage /></MemoryRouter>);

    expect(await screen.findByText('Nạp credit thành công')).toBeInTheDocument();
    expect(creditsService.order).toHaveBeenCalledWith('order-local');
    expect(refresh).toHaveBeenCalled();
    expect(sessionStorage.getItem('3s:pending-credit-order-id')).toBeNull();
  });
});
