import { ArrowDownLeft, Bot, Clock, Inbox, RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { CreditLedgerEntry } from '../../types/credits';

const typeConfig: Record<
  CreditLedgerEntry['type'],
  { label: string; bg: string; text: string; icon: typeof ArrowDownLeft }
> = {
  TOPUP: {
    label: 'Nạp credit',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    text: 'text-emerald-700',
    icon: ArrowDownLeft,
  },
  RESERVE: {
    label: 'Tạm giữ AI',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    text: 'text-amber-700',
    icon: Clock,
  },
  SETTLE: {
    label: 'Quyết toán AI',
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
    text: 'text-sky-700',
    icon: Bot,
  },
  RELEASE: {
    label: 'Hoàn credit',
    bg: 'bg-teal-50 text-teal-700 border-teal-200',
    text: 'text-teal-700',
    icon: RotateCcw,
  },
  ADJUSTMENT: {
    label: 'Điều chỉnh',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    text: 'text-purple-700',
    icon: SlidersHorizontal,
  },
};

export default function CreditLedgerTable({ entries }: { entries: CreditLedgerEntry[] }) {
  if (!entries.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
          <Inbox size={24} />
        </div>
        <h4 className="mt-3 text-sm font-bold text-slate-700">Chưa có giao dịch credit</h4>
        <p className="mt-1 max-w-sm text-xs text-slate-400">
          Mọi biến động nạp tiền, sử dụng trợ lý AI và hoàn credit sẽ được ghi nhận chi tiết tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Thời gian</th>
              <th className="px-5 py-3.5">Loại giao dịch</th>
              <th className="px-5 py-3.5 text-right">Biến động</th>
              <th className="px-5 py-3.5 text-right">Số dư sau GD</th>
              <th className="px-5 py-3.5">Nội dung / Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry) => {
              const conf = typeConfig[entry.type] || typeConfig.ADJUSTMENT;
              const Icon = conf.icon;
              const isPositive = entry.availableDelta > 0;
              const isNegative = entry.availableDelta < 0;

              return (
                <tr key={entry._id} className="transition-colors hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-500">
                    {new Date(entry.createdAt).toLocaleString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${conf.bg}`}>
                      <Icon size={12} />
                      {conf.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <span
                      className={`text-sm font-black ${
                        isPositive
                          ? 'text-emerald-600'
                          : isNegative
                          ? 'text-rose-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {entry.availableDelta.toLocaleString('vi-VN')}
                      <span className="ml-1 text-[11px] font-semibold text-slate-400">credit</span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-slate-700">
                    {entry.availableAfter.toLocaleString('vi-VN')}
                    <span className="ml-1 text-[11px] font-normal text-slate-400">cr</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    {entry.reason || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
