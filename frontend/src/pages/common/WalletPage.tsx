import { useEffect, useMemo, useState } from 'react';
import { CreditCard, History, LoaderCircle, ShieldCheck, WalletCards } from 'lucide-react';
import CreditLedgerTable from '../../components/credits/CreditLedgerTable';
import CreditPackageGrid from '../../components/credits/CreditPackageGrid';
import CustomTopupForm from '../../components/credits/CustomTopupForm';
import Pagination from '../../components/ui/Pagination';
import { useToast } from '../../components/ui/ToastProvider';
import { useCreditWallet } from '../../contexts/CreditWalletContext';
import { creditsService } from '../../services/credits';
import { errorMessage } from '../../types';
import type { CreditLedgerEntry, CreditPackageResponse, PaymentGateway } from '../../types/credits';

export default function WalletPage() {
  const { wallet, loading: walletLoading } = useCreditWallet();
  const toast = useToast();
  const [catalog, setCatalog] = useState<CreditPackageResponse | null>(null);
  const [entries, setEntries] = useState<CreditLedgerEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [type, setType] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [custom, setCustom] = useState('');
  const [customSelected, setCustomSelected] = useState(false);
  const [gateway, setGateway] = useState<PaymentGateway>('VNPAY');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadLedger = async (nextPage = page, nextType = type) => {
    const result = await creditsService.ledger(nextPage, nextType);
    setEntries(result.items);
    setTotalPages(result.meta?.totalPages || 1);
  };

  useEffect(() => {
    let active = true;
    Promise.all([creditsService.packages(), creditsService.ledger(1)])
      .then(([nextCatalog, ledger]) => {
        if (!active) return;
        setCatalog(nextCatalog);
        setEntries(ledger.items);
        setTotalPages(ledger.meta?.totalPages || 1);
        const first = (['VNPAY', 'MOMO'] as const).find((item) => nextCatalog.gateways[item]);
        if (first) setGateway(first);
      })
      .catch((cause) => active && setError(errorMessage(cause)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const customAmount = Number(custom);
  const customValid =
    Number.isInteger(customAmount) && customAmount >= 10_000 && customAmount <= 50_000_000 && customAmount % 1_000 === 0;

  const canSubmit =
    Boolean(catalog?.gateways[gateway]) && (customSelected ? customValid : Boolean(selectedId)) && !submitting;

  const estimated = useMemo(
    () =>
      customSelected && customValid
        ? Math.floor(customAmount / 1_000)
        : catalog?.packages.find((item) => item.id === selectedId)?.grantCredits || 0,
    [catalog, customAmount, customSelected, customValid, selectedId],
  );

  const checkout = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const order = await creditsService.createTopup(
        customSelected ? { gateway, customAmountVnd: customAmount } : { gateway, packageId: selectedId },
      );
      const url = new URL(order.redirectUrl || '', window.location.origin);
      const allowed =
        url.protocol === 'https:' ||
        (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname));
      if (!allowed) throw new Error('Liên kết thanh toán không an toàn.');
      window.sessionStorage.setItem('3s:pending-credit-order-id', order.id);
      window.location.assign(url.toString());
    } catch (cause) {
      toast.error(errorMessage(cause));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto" aria-label="Đang tải ví credit">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-44 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 font-medium max-w-6xl mx-auto">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Banner Ví AI 3S Gym — Dùng class wallet-banner từ index.css */}
      <section className="wallet-banner">
        <div className="wallet-banner-inner">
          <div>
            <span className="wallet-banner-label">
              <WalletCards size={18} />
              <span>Ví AI 3S Gym</span>
            </span>
            <p className="wallet-banner-sublabel">Credit khả dụng</p>
            <div className="wallet-banner-amount">
              <span className="value">
                {walletLoading ? '…' : (wallet?.availableCredits ?? 0).toLocaleString('vi-VN')}
              </span>
              <span className="unit">credit</span>
            </div>
          </div>

          <div className="wallet-reserved">
            <span className="wallet-reserved-label">Đang tạm giữ</span>
            <div className="wallet-reserved-amount">
              {wallet?.reservedCredits ?? 0} <span className="unit">credit</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Nạp credit — Dùng pt-card--static + pt-card-body từ index.css */}
      <div className="pt-card--static">
        <div className="pt-card-body">
          <div className="wallet-section-header">
            <h2 className="wallet-section-title">Nạp credit</h2>
            <p className="wallet-section-desc">
              1.000đ tương đương 1 credit cơ bản. Bonus được cộng thêm theo từng gói.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <CreditPackageGrid
              packages={catalog?.packages || []}
              selectedId={customSelected ? '' : selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setCustomSelected(false);
              }}
            />

            <CustomTopupForm
              value={custom}
              selected={customSelected}
              onSelect={() => {
                setCustomSelected(true);
                setSelectedId('');
              }}
              onChange={setCustom}
            />

            {customSelected && custom && !customValid && (
              <p role="alert" className="wallet-validation-error">
                Số tiền phải từ 10.000đ đến 50.000.000đ và chia hết cho 1.000đ.
              </p>
            )}

            {/* Cổng thanh toán */}
            <div style={{ paddingTop: 8 }}>
              <span className="wallet-field-label">Cổng thanh toán</span>
              <div className="wallet-radio-group">
                {(['VNPAY', 'MOMO'] as const).map((item) => {
                  const isAvailable = Boolean(catalog?.gateways[item]);
                  const isChecked = gateway === item;
                  return (
                    <label
                      key={item}
                      className={`wallet-radio-label${isChecked ? ' wallet-radio-label--selected' : ''}${!isAvailable ? ' wallet-radio-label--disabled' : ''}`}
                    >
                      <input
                        type="radio"
                        name="gateway"
                        value={item}
                        disabled={!isAvailable}
                        checked={isChecked}
                        onChange={() => setGateway(item)}
                      />
                      <span>{item === 'VNPAY' ? 'VNPay' : 'MoMo'}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Khối Xác Nhận Thanh Toán */}
            <div className="wallet-confirm-strip">
              <div>
                <span className="wallet-confirm-label">Bạn sẽ nhận được</span>
                <div className="wallet-confirm-amount">
                  {estimated.toLocaleString('vi-VN')} <span className="unit">credit</span>
                </div>
              </div>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={checkout}
                className="wallet-submit-btn"
              >
                {submitting ? (
                  <LoaderCircle className="animate-spin" size={16} style={{ flexShrink: 0 }} />
                ) : (
                  <CreditCard size={16} style={{ flexShrink: 0 }} />
                )}
                <span>{submitting ? 'Đang tạo thanh toán…' : 'Thanh toán an toàn'}</span>
              </button>
            </div>

            <p className="wallet-disclaimer">
              <ShieldCheck size={15} />
              <span>Credit chỉ được cộng sau khi xác nhận thanh toán hợp lệ từ cổng thanh toán.</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Lịch sử credit — Dùng pt-card--static + pt-card-body từ index.css */}
      <div className="pt-card--static">
        <div className="pt-card-body">
          <div className="wallet-history-header">
            <div className="wallet-history-title">
              <History size={18} />
              <span>Lịch sử giao dịch credit</span>
            </div>
            <select
              aria-label="Lọc loại giao dịch"
              value={type}
              onChange={(event) => {
                const next = event.target.value;
                setType(next);
                setPage(1);
                void loadLedger(1, next);
              }}
              className="wallet-filter-select"
            >
              <option value="">Tất cả giao dịch</option>
              <option value="TOPUP">Nạp credit</option>
              <option value="SETTLE">AI đã dùng</option>
              <option value="RELEASE">Hoàn credit</option>
              <option value="ADJUSTMENT">Điều chỉnh</option>
            </select>
          </div>

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <CreditLedgerTable entries={entries} />
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={async (next) => {
                setPage(next);
                await loadLedger(next);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
