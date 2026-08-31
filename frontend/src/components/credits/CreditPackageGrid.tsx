import { CheckCircle2, Sparkles, Tag } from 'lucide-react';
import type { CreditPackage } from '../../types/credits';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

interface CreditPackageGridProps {
  packages: CreditPackage[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function CreditPackageGrid({ packages, selectedId, onSelect }: CreditPackageGridProps) {
  if (!packages.length) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-sm text-sky-900">
        <Sparkles className="h-5 w-5 shrink-0 text-sky-600" />
        <p>
          Các gói ưu đãi định kỳ đang được cập nhật. Bạn có thể chọn nhanh các mức nạp phổ biến hoặc nhập số tiền tùy chọn bên dưới.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((item) => {
        const isSelected = selectedId === item.id;
        const hasBonus = item.bonusCredits > 0;

        return (
          <label
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
              isSelected
                ? 'border-secondary bg-sky-50/80 shadow-md shadow-sky-500/10 ring-2 ring-secondary'
                : 'border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm'
            }`}
          >
            <input
              className="sr-only"
              type="radio"
              name="credit-package"
              value={item.id}
              checked={isSelected}
              onChange={() => onSelect(item.id)}
            />

            {/* Top row: Name & Selected indicator */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 group-hover:bg-sky-100 group-hover:text-primary">
                  <Tag size={12} className="text-secondary" />
                  {item.name}
                </span>
                <strong className="mt-2 block text-2xl font-black text-slate-900">
                  {item.grantCredits.toLocaleString('vi-VN')} <span className="text-sm font-bold text-slate-500">credit</span>
                </strong>
              </div>
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                  isSelected ? 'bg-secondary text-white' : 'border border-slate-300 bg-white text-transparent'
                }`}
              >
                <CheckCircle2 size={16} className="fill-current" />
              </div>
            </div>

            {/* Bonus badge if applicable */}
            {hasBonus && (
              <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <Sparkles size={13} className="text-emerald-600" />
                <span>Bao gồm +{item.bonusCredits.toLocaleString('vi-VN')} credit thưởng</span>
              </div>
            )}

            {/* Description if present */}
            {item.description && (
              <p className="mt-2 text-xs text-slate-500">{item.description}</p>
            )}

            {/* Bottom row: Price in VND */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Giá thanh toán</span>
              <span className="text-base font-black text-primary">
                {money.format(item.amountVnd)}
              </span>
            </div>
          </label>
        );
      })}
    </div>
  );
}
