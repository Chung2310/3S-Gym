import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  History,
  LoaderCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Zap,
} from 'lucide-react';
import CreditLedgerTable from '../../components/credits/CreditLedgerTable';
import CreditPackageGrid from '../../components/credits/CreditPackageGrid';
import CustomTopupForm from '../../components/credits/CustomTopupForm';
import Pagination from '../../components/ui/Pagination';
import { useToast } from '../../components/ui/ToastProvider';
import { useCreditWallet } from '../../contexts/CreditWalletContext';
import { creditsService } from '../../services/credits';
import { errorMessage } from '../../types';
import type { CreditLedgerEntry, CreditPackageResponse } from '../../types/credits';

export default function WalletPage() {
  const { wallet, loading: walletLoading, refresh: refreshWallet } = useCreditWallet();
  const toast = useToast();
  const [catalog, setCatalog] = useState<CreditPackageResponse | null>(null);
  const [entries, setEntries] = useState<CreditLedgerEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [type, setType] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [custom, setCustom] = useState('');
  const [customSelected, setCustomSelected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadLedger = async (nextPage = page, nextType = type) => {
    try {
      const result = await creditsService.ledger(nextPage, nextType);
      setEntries(result.items);
      setTotalPages(result.meta?.totalPages || 1);
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshWallet?.(), loadLedger(1, type)]);
      toast.success('Đã đồng bộ số dư credit mới nhất.');
    } catch {
      toast.error('Không thể làm mới số dư.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([creditsService.packages(), creditsService.ledger(1)])
      .then(([nextCatalog, ledger]) => {
        if (!active) return;
        setCatalog(nextCatalog);
        setEntries(ledger.items);
        setTotalPages(ledger.meta?.totalPages || 1);
        if (nextCatalog.packages && nextCatalog.packages.length > 0) {
          setSelectedId(nextCatalog.packages[0].id);
          setCustomSelected(false);
        } else {
          setCustomSelected(true);
        }
      })
      .catch((cause) => active && setError(errorMessage(cause)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const customAmount = Number(custom);
  const customValid =
    Number.isInteger(customAmount) &&
    customAmount >= 10_000 &&
    customAmount <= 50_000_000 &&
    customAmount % 1_000 === 0;

  const currentPackage = useMemo(
    () => catalog?.packages.find((item) => item.id === selectedId),
    [catalog, selectedId],
  );

  const paymentAmountVnd = useMemo(() => {
    if (customSelected) return customValid ? customAmount : 0;
    return currentPackage?.amountVnd || 0;
  }, [customAmount, customSelected, customValid, currentPackage]);

  const estimated = useMemo(
    () =>
      customSelected && customValid
        ? Math.floor(customAmount / 1_000)
        : currentPackage?.grantCredits || 0,
    [currentPackage, customAmount, customSelected, customValid],
  );

  const canSubmit =
    (customSelected ? customValid : Boolean(selectedId)) &&
    paymentAmountVnd >= 10_000 &&
    !submitting;

  const checkout = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const order = await creditsService.createTopup(
        customSelected
          ? { gateway: 'PAYOS', customAmountVnd: customAmount }
          : { gateway: 'PAYOS', packageId: selectedId },
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
      <div
        role="alert"
        className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 font-medium max-w-6xl mx-auto"
      >
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Banner Ví AI 3S Gym */}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="wallet-reserved">
              <span className="wallet-reserved-label">Đang tạm giữ</span>
              <div className="wallet-reserved-amount">
                {wallet?.reservedCredits ?? 0} <span className="unit">credit</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshing || walletLoading}
              className="button button-secondary"
              style={{ minHeight: 36, height: 36, padding: '0 12px', fontSize: '0.78rem' }}
              title="Đồng bộ số dư ví"
            >
              <RefreshCw size={13} className={refreshing || walletLoading ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Đang tải...' : 'Làm mới'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Nạp credit — Thiết kế tối ưu hóa cho thanh toán Quét mã QR PayOS */}
      <div className="pt-card--static">
        <div className="pt-card-body">
          <div className="wallet-section-header">
            <h2 className="wallet-section-title">Nạp credit</h2>
            <p className="wallet-section-desc">
              1.000đ tương đương 1 credit cơ bản. Bonus được cộng thêm theo từng gói.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Gói nạp định sẵn */}
            <CreditPackageGrid
              packages={catalog?.packages || []}
              selectedId={customSelected ? '' : selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setCustomSelected(false);
              }}
            />

            {/* Nhập số tiền tùy chỉnh */}
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

            {/* Khối giới thiệu phương thức quét mã VietQR qua PayOS */}
            <div className="wallet-payos-card">
              <div className="wallet-payos-header">
                <div className="wallet-payos-title">
                  <QrCode size={20} className="text-sky-600 shrink-0" />
                  <span>Chuyển khoản VietQR tự động qua PayOS</span>
                </div>
                <span className="wallet-payos-badge">
                  <Zap size={13} />
                  <span>Xác nhận tự động 24/7</span>
                </span>
              </div>

              <p className="wallet-payos-desc">
                Hệ thống tự động tạo mã VietQR động chứa chính xác số tiền và nội dung chuyển khoản. Bạn chỉ cần mở app Ngân hàng hoặc Ví điện tử bất kỳ để quét mã. Credit được cộng vào ví ngay sau 3 giây.
              </p>

              <div className="wallet-payos-banks">
                <span>Hỗ trợ mọi ngân hàng:</span>
                <span className="wallet-payos-bank-tag">Vietcombank</span>
                <span className="wallet-payos-bank-tag">MB Bank</span>
                <span className="wallet-payos-bank-tag">Techcombank</span>
                <span className="wallet-payos-bank-tag">ACB</span>
                <span className="wallet-payos-bank-tag">VPBank</span>
                <span className="wallet-payos-bank-tag">MoMo / ZaloPay</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>và 40+ ngân hàng Napas247</span>
              </div>
            </div>

            {/* Khối Xác Nhận & Nút Tạo Mã QR */}
            <div className="wallet-confirm-strip">
              <div>
                <span className="wallet-confirm-label">
                  Số tiền thanh toán: {paymentAmountVnd.toLocaleString('vi-VN')} đ
                </span>
                <div className="wallet-confirm-amount">
                  {estimated.toLocaleString('vi-VN')} <span className="unit">credit nhận được</span>
                </div>
              </div>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={checkout}
                className="wallet-submit-btn"
                style={{ padding: '0 20px', minWidth: 220 }}
              >
                {submitting ? (
                  <LoaderCircle className="animate-spin" size={18} style={{ flexShrink: 0 }} />
                ) : (
                  <QrCode size={18} style={{ flexShrink: 0 }} />
                )}
                <span>{submitting ? 'Đang tạo mã QR...' : 'Tạo mã QR thanh toán PayOS'}</span>
              </button>
            </div>

            <p className="wallet-disclaimer">
              <ShieldCheck size={15} />
              <span>Giao dịch bảo mật qua PayOS / Napas247. Vui lòng quét đúng mã QR để hệ thống cộng credit tự động.</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Lịch sử credit */}
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
