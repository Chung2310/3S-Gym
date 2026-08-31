// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../src/components/ui/ToastProvider';
import CreditAdminPage from '../../src/pages/admin/CreditAdminPage';
import { creditsService } from '../../src/services/credits';
import { api } from '../../src/services/api';

describe('CreditAdminPage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('tải cấu hình, gói nạp và các tab đối soát', async () => {
    vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
      if (path === '/api/admin/credit-pricing') {
        return {
          data: {
            vndPerCredit: 1000,
            usdToVnd: 25000,
            policies: [{ taskType: 'TEXT', enabled: true, maxReservationCredits: 10, fallbackCredits: 2, markupBasisPoints: 0, minBillableCredits: 1 }],
          },
          message: '',
        };
      }
      if (path === '/api/admin/credit-packages') {
        return {
          data: [{ id: 'p1', name: 'Pro', description: '', amountVnd: 200000, baseCredits: 200, bonusCredits: 20, grantCredits: 220 }],
          message: '',
        };
      }
      return { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 }, message: '' };
    });
    vi.spyOn(creditsService, 'adminPricing').mockResolvedValue({ vndPerCredit: 1000, usdToVnd: 25000, policies: [{ taskType: 'TEXT', enabled: true, maxReservationCredits: 10, fallbackCredits: 2, markupBasisPoints: 0, minBillableCredits: 1 }] });
    vi.spyOn(creditsService, 'adminPackages').mockResolvedValue([{ id: 'p1', name: 'Pro', description: '', amountVnd: 200000, baseCredits: 200, bonusCredits: 20, grantCredits: 220 }]);
    vi.spyOn(creditsService, 'adminList').mockResolvedValue({ items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } });
    render(<ToastProvider><CreditAdminPage /></ToastProvider>);

    expect(await screen.findByRole('heading', { name: 'Quản trị credit' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Thanh toán' })).toHaveAttribute('aria-selected', 'true');
  });
});
