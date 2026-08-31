import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bot,
  CheckCircle2,
  Cpu,
  CreditCard,
  Dumbbell,
  History,
  LineChart,
  LoaderCircle,
  Lock,
  RefreshCw,
  Salad,
  ShieldCheck,
  Sparkles,
  Wallet,
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
import type { CreditLedgerEntry, CreditPackageResponse, PaymentGateway } from '../../types/credits';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

const AI_FEATURES = [
  {
    icon: Dumbbell,
    title: 'Giáo án AI cá nhân hóa',
    desc: 'Thiết kế lịch tập, bài tập, sets & reps tối ưu theo mục tiêu tăng cơ/giảm mỡ.',
    color: 'from-blue-500/10 to-sky-500/10 text-primary',
  },
  {
    icon: Salad,
    title: 'Dinh dưỡng & Macro',
    desc: 'Tính toán TDEE, Calo mục tiêu và gợi ý thực đơn chuẩn đa lượng mỗi ngày.',
    color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600',
  },
  {
    icon: LineChart,
    title: 'Phân tích InBody chuyên sâu',
    desc: 'Đánh giá tỷ lệ cơ/mỡ, xu hướng thể trạng và cảnh báo mất cân đối vóc dáng.',
    color: 'from-amber-500/10 to-orange-500/10 text-amber-600',
  },
  {
    icon: Bot,
    title: 'Trợ lý PT AI 24/7',
    desc: 'Giải đáp kỹ thuật tập luyện, mẹo phục hồi và tư vấn kiến thức thể hình tức thì.',
    color: 'from-purple-500/10 to-indigo-500/10 text-purple-600',
  },
];

export default function WalletPage() {
  const { wallet, loading: walletLoading, refresh: refreshWallet } = useCreditWallet();
  const toast = useToast();

  const [catalog, setCatalog] = useState<CreditPackageResponse | null>(null);
  const [entries, setEntries] = useState<CreditLedgerEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [type, setType] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [custom, setCustom] = useState('100000');
  const [customSelected, setCustomSelected] = useState(true);
  const [gateway, setGateway] = useState<PaymentGateway>('VNPAY');
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

  useEffect(() => {
    let active = true;
    Promise.all([creditsService.packages(), creditsService.ledger(1)])
      .then(([nextCatalog, ledger]) => {
        if (!active) return;
        setCatalog(nextCatalog);
        setEntries(ledger.items);
        setTotalPages(ledger.meta?.totalPages || 1);

        // If packages exist, select the first one by default, else keep custom amount
        if (nextCatalog.packages && nextCatalog.packages.length > 0) {
          setSelectedId(nextCatalog.packages[0].id);
          setCustomSelected(false);
        } else {
          setCustomSelected(true);
        }

        const first = (['VNPAY', 'MOMO'] as const).find((item) => nextCatalog.gateways[item]);
        if (first) setGateway(first);
      })
      .catch((cause) => active && setError(errorMessage(cause)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshWallet(), loadLedger(1, type)]);
      toast.success('Đã đồng bộ số dư credit mới nhất.');
    } catch {
      toast.error('Không thể làm mới số dư.');
    } finally {
      setRefreshing(false);
    }
  };

  const customAmount = Number(custom);
  const customValid =
    Number.isInteger(customAmount) &&
    customAmount >= 10_000 &&
    customAmount <= 50_000_000 &&
    customAmount % 1_000 === 0;

  const canSubmit =
    Boolean(catalog?.gateways[gateway]) &&
    (customSelected ? customValid : Boolean(selectedId)) &&
    !submitting;

  const estimated = useMemo(() => {
    if (customSelected && customValid) {
      return Math.floor(customAmount / 1_000);
    }
    return catalog?.packages.find((item) => item.id === selectedId)?.grantCredits || 0;
  }, [catalog, customAmount, customSelected, customValid, selectedId]);

  const checkoutAmountVnd = useMemo(() => {
    if (customSelected) {
      return customValid ? customAmount : 0;
    }
    return catalog?.packages.find((item) => item.id === selectedId)?.amountVnd || 0;
  }, [catalog, customAmount, customSelected, customValid, selectedId]);

  const checkout = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const order = await creditsService.createTopup(
        customSelected
          ? { gateway, customAmountVnd: customAmount }
          : { gateway, packageId: selectedId }
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
      <div className="space-y-6" aria-label="Đang tải ví credit">
        <div className="h-52 animate-pulse rounded-3xl bg-slate-200" />
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
      <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-xs">
        <h3 className="font-bold">Không thể tải thông tin ví</h3>
        <p className="mt-1 text-sm">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
        >
          <RefreshCw size={14} /> Thử lại
        </button>
      </div>
    );
  }

  const availableCredits = wallet?.availableCredits ?? 0;
  const reservedCredits = wallet?.reservedCredits ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 font-montserrat pb-10">
      {/* Top Header & Refresh */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="font-oswald text-3xl font-bold uppercase tracking-wide text-primary">
            Ví AI & Nạp Credit
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Quản lý số dư credit thông minh, nạp tiền tự động và theo dõi lịch sử sử dụng tính năng AI.
          </p>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={refreshing || walletLoading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-primary disabled:opacity-50 sm:self-auto"
          title="Đồng bộ số dư ví từ server"
        >
          <RefreshCw size={14} className={refreshing || walletLoading ? 'animate-spin text-secondary' : ''} />
          <span>{refreshing ? 'Đang đồng bộ...' : 'Làm mới số dư'}</span>
        </button>
      </div>

      {/* Hero Section: VIP Card & Metric Bento */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* VIP AI Credit Virtual Card */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#001f3f] via-[#003b70] to-[#0a192f] p-6 text-white shadow-xl shadow-blue-950/20 lg:col-span-2 sm:p-8">
          {/* Subtle Ambient Background Orbs */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between gap-6">
            {/* Top row: Brand & Status Pill */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-sky-300">
                  <WalletCards size={20} />
                </div>
                <div>
                  <span className="block text-xs font-black uppercase tracking-[0.25em] text-sky-200">
                    3S Gym AI Wallet
                  </span>
                  <span className="text-[10px] text-sky-300/80 font-medium">Hệ thống thanh toán trí tuệ nhân tạo</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-[11px] font-bold text-emerald-300 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ví hoạt động</span>
              </div>
            </div>

            {/* Middle row: Big Balance Counter */}
            <div className="py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-200/90">
                Số dư khả dụng
              </span>
              <div className="mt-1 flex items-baseline gap-3">
                <strong className="text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-sm font-oswald">
                  {walletLoading ? '…' : availableCredits.toLocaleString('vi-VN')}
                </strong>
                <span className="text-xl font-bold uppercase tracking-wider text-sky-300">
                  Credit
                </span>
              </div>
            </div>

            {/* Bottom row: Card Details & Security Note */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-sky-200/80">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-amber-300" />
                <span>1 Credit = 1.000 VNĐ chi tiêu AI</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-sky-300">
                <Lock size={12} />
                <span>Encrypted • 256-Bit SSL</span>
              </div>
            </div>
          </div>
        </section>

        {/* Side Metric Bento Card */}
        <div className="flex flex-col justify-between gap-4">
          {/* Reserved Credits Card */}
          <div className="flex-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Activity size={14} className="text-amber-500" />
                  Đang tạm giữ (Hold)
                </span>
                <strong className="mt-2 block text-3xl font-black text-slate-800 font-oswald">
                  {walletLoading ? '…' : reservedCredits.toLocaleString('vi-VN')}{' '}
                  <span className="text-sm font-semibold text-slate-500 font-montserrat">credit</span>
                </strong>
              </div>
              <div className="rounded-2xl bg-amber-50 p-2.5 text-amber-600">
                <Cpu size={20} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              Credit được giữ tạm thời khi bạn gửi yêu cầu AI (tạo giáo án, meal plan) và tự động hoàn lại nếu có lỗi.
            </p>
          </div>

          {/* Quick Info / Security Seal Card */}
          <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50/40 p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <ShieldCheck size={16} className="text-secondary" />
              Nạp tiền tự động 24/7
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Hệ thống kết nối trực tiếp với cổng thanh toán VNPay & MoMo. Credit được cộng vào ví ngay sau khi hoàn tất.
            </p>
          </div>
        </div>
      </div>

      {/* Top-up Studio Section (Nạp Credit) */}
      <section className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2.5 text-2xl font-black text-slate-900 font-oswald uppercase">
              <Wallet size={24} className="text-secondary" />
              Nạp Thêm Credit
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Chọn gói có sẵn hoặc nhập số tiền tùy chọn để nạp credit vào tài khoản ngay lập tức.
            </p>
          </div>
        </div>

        {/* 1. Credit Packages Grid (if available) */}
        {catalog?.packages && catalog.packages.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Gói nạp ưu đãi
            </h3>
            <CreditPackageGrid
              packages={catalog.packages}
              selectedId={customSelected ? '' : selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setCustomSelected(false);
              }}
            />
          </div>
        )}

        {/* 2. Custom Topup Form */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {catalog?.packages && catalog.packages.length > 0 ? '2. Hoặc tùy chọn số tiền' : 'Chọn số tiền nạp'}
          </h3>
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
            <p role="alert" className="text-xs font-bold text-rose-600">
              Số tiền phải từ 10.000đ đến 50.000.000đ và chia hết cho 1.000đ.
            </p>
          )}
        </div>

        {/* 3. Payment Gateway Selection */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Cổng thanh toán
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* VNPay Card */}
            <label
              className={`relative flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all ${
                gateway === 'VNPAY'
                  ? 'border-secondary bg-sky-50/70 shadow-md shadow-sky-500/10 ring-2 ring-secondary'
                  : 'border-slate-200 bg-white hover:border-sky-300'
              } ${catalog?.gateways.VNPAY ? '' : 'cursor-not-allowed opacity-40'}`}
            >
              <div className="flex items-center gap-3.5">
                <input
                  type="radio"
                  name="gateway"
                  value="VNPAY"
                  aria-label="VNPay"
                  disabled={!catalog?.gateways.VNPAY}
                  checked={gateway === 'VNPAY'}
                  onChange={() => setGateway('VNPAY')}
                  className="h-4 w-4 text-secondary focus:ring-secondary"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">VNPay</span>
                    <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                      VNPAY-QR
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Quét mã QR, Thẻ ATM 40+ ngân hàng, Visa, Mastercard, JCB
                  </p>
                </div>
              </div>
              {gateway === 'VNPAY' && <CheckCircle2 size={18} className="text-secondary shrink-0" />}
            </label>

            {/* MoMo Card */}
            <label
              className={`relative flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all ${
                gateway === 'MOMO'
                  ? 'border-[#a50064] bg-pink-50/70 shadow-md shadow-pink-500/10 ring-2 ring-[#a50064]'
                  : 'border-slate-200 bg-white hover:border-pink-300'
              } ${catalog?.gateways.MOMO ? '' : 'cursor-not-allowed opacity-40'}`}
            >
              <div className="flex items-center gap-3.5">
                <input
                  type="radio"
                  name="gateway"
                  value="MOMO"
                  aria-label="MoMo"
                  disabled={!catalog?.gateways.MOMO}
                  checked={gateway === 'MOMO'}
                  onChange={() => setGateway('MOMO')}
                  className="h-4 w-4 text-[#a50064] focus:ring-[#a50064]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">MoMo</span>
                    <span className="rounded-md bg-[#a50064] px-1.5 py-0.5 text-[10px] font-black text-white">
                      MoMo QR
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Thanh toán tiện lợi qua ứng dụng Ví điện tử MoMo
                  </p>
                </div>
              </div>
              {gateway === 'MOMO' && <CheckCircle2 size={18} className="text-[#a50064] shrink-0" />}
            </label>
          </div>
        </fieldset>

        {/* 4. Checkout Summary & Action CTA */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50/30 p-5 shadow-xs">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Số tiền thanh toán
                </span>
                <strong className="block text-xl font-bold text-slate-900">
                  {money.format(checkoutAmountVnd)}
                </strong>
              </div>

              <div className="h-8 w-px bg-slate-200 hidden sm:block" />

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Bạn sẽ nhận
                </span>
                <strong className="block text-2xl font-black text-primary font-oswald">
                  {estimated.toLocaleString('vi-VN')} <span className="text-sm font-bold text-secondary font-montserrat">credit</span>
                </strong>
              </div>
            </div>

            <button
              type="button"
              aria-label={submitting ? 'Đang tạo thanh toán…' : 'Thanh toán an toàn'}
              disabled={!canSubmit}
              onClick={checkout}
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/15 transition-all hover:opacity-95 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="animate-spin" size={18} />
                  <span>Đang tạo thanh toán…</span>
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  <span>Thanh toán an toàn</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>
            Credit chỉ được cộng sau khi xác thực chữ ký bảo mật thành công từ cổng thanh toán. Hoàn tiền tự động nếu xảy ra lỗi.
          </span>
        </div>
      </section>

      {/* AI Features Value Showcase */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-amber-500" />
          <h2 className="text-xl font-black text-slate-900 font-oswald uppercase tracking-wide">
            Tiện ích mở khóa với AI Credit
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AI_FEATURES.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${feat.color}`}>
                  <Icon size={20} />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">{feat.title}</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transaction History Section */}
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 font-oswald uppercase tracking-wide">
              <History size={20} className="text-primary" />
              Lịch sử biến động Credit
            </h2>
            <p className="text-xs text-slate-500">
              Chi tiết các giao dịch nạp tiền, sử dụng tính năng và hoàn trả credit
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Lọc loại giao dịch"
              value={type}
              onChange={(event) => {
                const next = event.target.value;
                setType(next);
                setPage(1);
                void loadLedger(1, next);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            >
              <option value="">Tất cả giao dịch</option>
              <option value="TOPUP">Nạp credit</option>
              <option value="SETTLE">AI đã dùng</option>
              <option value="RELEASE">Hoàn credit</option>
              <option value="ADJUSTMENT">Điều chỉnh</option>
            </select>
          </div>
        </div>

        <CreditLedgerTable entries={entries} />

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={async (next) => {
            setPage(next);
            await loadLedger(next);
          }}
        />
      </section>
    </div>
  );
}
