import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  QrCode,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { creditsService } from '../../services/credits';
import type { PaymentOrder } from '../../types/credits';

interface PayosCheckoutModalProps {
  open: boolean;
  order: PaymentOrder | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PayosCheckoutModal({
  open,
  order,
  onClose,
  onSuccess,
}: PayosCheckoutModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [status, setStatus] = useState<'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED'>('PENDING');
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);

  // Sync initial status when order changes
  useEffect(() => {
    if (!order) return;
    setStatus(order.status);
    const expiresMs = new Date(order.expiresAt).getTime() - Date.now();
    setTimeLeft(Math.max(0, Math.floor(expiresMs / 1000)));
  }, [order]);

  // Countdown timer
  useEffect(() => {
    if (!open || status !== 'PENDING' || timeLeft <= 0) return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus('EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open, status, timeLeft]);

  // Real-time polling
  useEffect(() => {
    if (!open || !order || status !== 'PENDING') return;

    let active = true;
    const checkStatus = async () => {
      try {
        const latest = await creditsService.order(order.id);
        if (!active) return;
        if (latest.status === 'PAID') {
          setStatus('PAID');
          onSuccess();
        } else if (latest.status === 'EXPIRED' || latest.status === 'FAILED') {
          setStatus(latest.status);
        }
      } catch {
        // Ignore background polling errors
      }
    };

    const interval = window.setInterval(checkStatus, 2500);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [open, order, status, onSuccess]);

  if (!open || !order) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const copyToClipboard = (text: string, field: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 2000);
  };

  const memoText = `Nap credit ${order.orderCode.slice(-10)}`;
  const qrRaw = order.qrCodeUrl || '';
  const qrImageUrl = qrRaw.startsWith('http') || qrRaw.startsWith('data:')
    ? qrRaw
    : qrRaw
      ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrRaw)}&margin=10`
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payos-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100/80 text-[#003b70]">
              <QrCode size={20} />
            </div>
            <div>
              <h2 id="payos-modal-title" className="text-base font-bold text-[#003b70]">
                Thanh toán
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Xác nhận tự động 24/7 qua Napas247
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Đóng modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'PAID' ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="mt-5 text-2xl font-bold text-slate-900 font-montserrat">
                Thanh toán thành công!
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Đã nạp thành công{' '}
                <strong className="text-emerald-600 font-oswald text-lg">
                  +{order.grantCredits.toLocaleString('vi-VN')}
                </strong>{' '}
                credit vào ví 3S Gym của bạn.
              </p>
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-[#003b70] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#00284d] transition-colors"
                >
                  Xong & Đóng
                </button>
              </div>
            </div>
          ) : status === 'EXPIRED' ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <AlertCircle size={36} />
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-800">
                Mã thanh toán đã hết hạn
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Vui lòng tạo mã QR mới để hoàn tất việc nạp credit.
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* Countdown & Status indicator */}
              <div className="flex w-full items-center justify-between rounded-xl bg-sky-50/70 border border-sky-100 px-4 py-2.5 text-xs text-slate-600 mb-4">
                <span className="flex items-center gap-1.5 font-medium">
                  <Loader2 size={14} className="animate-spin text-sky-600" />
                  Đang chờ chuyển khoản...
                </span>
                <span className="font-semibold text-sky-800">
                  Hiệu lực còn: <span className="font-oswald text-sm font-bold text-rose-600">{timeFormatted}</span>
                </span>
              </div>

              {/* QR Code Container */}
              <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sky-200 bg-white p-4 shadow-xs">
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="Mã VietQR thanh toán"
                    className="h-56 w-56 rounded-xl object-contain"
                  />
                ) : (
                  <div className="flex h-56 w-56 flex-col items-center justify-center text-slate-400 gap-2">
                    <QrCode size={48} className="text-sky-300" />
                    <span className="text-xs">Đang tải mã VietQR...</span>
                  </div>
                )}
                <div className="mt-2 text-center text-xs font-semibold text-slate-500">
                  Quét mã bằng App ngân hàng bất kỳ
                </div>
              </div>

              {/* Transfer Details Card */}
              <div className="w-full mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 border border-slate-200/70 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Số tiền cần chuyển:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-[#003b70] font-oswald">
                      {order.amountVnd.toLocaleString('vi-VN')} đ
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(String(order.amountVnd), 'amount')}
                      className="text-slate-400 hover:text-sky-600 transition-colors p-1"
                      title="Sao chép số tiền"
                    >
                      {copiedField === 'amount' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Nội dung chuyển khoản:</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                    <span className="bg-amber-100/70 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                      {memoText}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(memoText, 'memo')}
                      className="text-slate-400 hover:text-sky-600 transition-colors p-1"
                      title="Sao chép nội dung"
                    >
                      {copiedField === 'memo' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Số credit nhận được:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1 font-oswald text-sm">
                    <Sparkles size={13} />
                    +{order.grantCredits.toLocaleString('vi-VN')} credit
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex w-full gap-2.5">
                {order.redirectUrl && (
                  <a
                    href={order.redirectUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50/50 py-2.5 text-xs font-bold text-sky-700 hover:bg-sky-100/70 transition-colors"
                  >
                    <ExternalLink size={14} />
                    Mở trang thanh toán
                  </a>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Đóng
                </button>
              </div>

              {/* Secure footer badge */}
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>Thanh toán an toàn 24/7</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
