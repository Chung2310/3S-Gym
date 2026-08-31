// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '../../src/services/api';
import { creditErrorAction, creditsService } from '../../src/services/credits';

describe('creditsService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('ánh xạ riêng lỗi không đủ credit sang CTA ví', () => {
    expect(creditErrorAction(new ApiError('Thiếu 3 credit', 402, 'INSUFFICIENT_CREDITS'))).toEqual({
      message: 'Thiếu 3 credit', href: '/wallet', label: 'Nạp credit',
    });
    expect(creditErrorAction(new ApiError('Lỗi khác', 400, 'VALIDATION_ERROR'))).toBeNull();
  });

  it('gọi đúng API ví, ledger và tạo đơn nạp', async () => {
    const get = vi.spyOn(api, 'get')
      .mockResolvedValueOnce({ data: { id: 'wallet-1', availableCredits: 20, reservedCredits: 2 }, message: '' })
      .mockResolvedValueOnce({ data: [], meta: { page: 2, limit: 20, total: 0, totalPages: 1 }, message: '' });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { id: 'order-1' }, message: '' });

    await expect(creditsService.wallet()).resolves.toMatchObject({ availableCredits: 20 });
    await creditsService.ledger(2, 'TOPUP');
    await creditsService.createTopup({ gateway: 'VNPAY', customAmountVnd: 10000 });

    expect(get).toHaveBeenNthCalledWith(2, '/api/credits/me/ledger?page=2&limit=20&type=TOPUP');
    expect(post).toHaveBeenCalledWith('/api/credits/topups', { gateway: 'VNPAY', customAmountVnd: 10000 });
  });
});
