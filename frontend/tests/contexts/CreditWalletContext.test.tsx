// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CreditWalletProvider, useCreditWallet } from '../../src/contexts/CreditWalletContext';
import { CREDIT_WALLET_MUTATED_EVENT } from '../../src/services/api';
import { creditsService } from '../../src/services/credits';

function Probe() {
  const { wallet, loading } = useCreditWallet();
  return <span>{loading ? 'loading' : `${wallet?.availableCredits ?? 0}`}</span>;
}

describe('CreditWalletProvider', () => {
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it('tải số dư và làm mới sau sự kiện thay đổi ví', async () => {
    const wallet = vi.spyOn(creditsService, 'wallet')
      .mockResolvedValueOnce({ id: 'w1', availableCredits: 10, reservedCredits: 0 })
      .mockResolvedValueOnce({ id: 'w1', availableCredits: 25, reservedCredits: 0 });
    render(<CreditWalletProvider><Probe /></CreditWalletProvider>);
    await waitFor(() => expect(screen.getByText('10')).toBeInTheDocument());

    vi.useFakeTimers();
    act(() => window.dispatchEvent(new Event(CREDIT_WALLET_MUTATED_EVENT)));
    await act(async () => { await vi.advanceTimersByTimeAsync(120); });

    expect(wallet).toHaveBeenCalledTimes(2);
    expect(screen.getByText('25')).toBeInTheDocument();
  });
});
