import { describe, expect, it } from 'vitest';
import { calculateSettledCredits } from '../services/creditPricingService.js';
import type { PricingSnapshot } from '../services/creditTypes.js';

const pricing: PricingSnapshot = {
  usdToVnd: 26_000,
  vndPerCredit: 1_000,
  markupBasisPoints: 12_500,
  fallbackCredits: 3,
  minBillableCredits: 1,
  maxReservationCredits: 20,
};

describe('calculateSettledCredits', () => {
  it('quy đổi micro-USD, áp dụng markup và làm tròn lên credit nguyên', () => {
    expect(calculateSettledCredits({ providerCostMicrousd: 100_000 }, pricing)).toBe(4);
  });

  it('dùng fallback khi provider không trả chi phí', () => {
    expect(calculateSettledCredits({}, pricing)).toBe(3);
  });

  it('áp dụng mức tối thiểu cho chi phí khác không', () => {
    expect(calculateSettledCredits({ providerCostMicrousd: 1 }, pricing)).toBe(1);
  });

  it('không tính phí khi provider xác nhận chi phí bằng không', () => {
    expect(calculateSettledCredits({ providerCostMicrousd: 0 }, pricing)).toBe(0);
  });

  it('từ chối metadata chi phí âm hoặc không nguyên', () => {
    expect(() => calculateSettledCredits({ providerCostMicrousd: -1 }, pricing)).toThrow('providerCostMicrousd');
    expect(() => calculateSettledCredits({ providerCostMicrousd: 1.5 }, pricing)).toThrow('providerCostMicrousd');
  });
});

