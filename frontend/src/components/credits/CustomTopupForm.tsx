import { Coins, Sparkles, Zap } from 'lucide-react';

interface CustomTopupFormProps {
  value: string;
  selected: boolean;
  onChange: (value: string) => void;
  onSelect: () => void;
}

const PRESETS = [
  { amount: 50_000, label: '50.000đ' },
  { amount: 100_000, label: '100.000đ', popular: true },
  { amount: 200_000, label: '200.000đ' },
  { amount: 500_000, label: '500.000đ' },
  { amount: 1_000_000, label: '1.000.000đ' },
  { amount: 2_000_000, label: '2.000.000đ' },
];

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function CustomTopupForm({ value, selected, onChange, onSelect }: CustomTopupFormProps) {
  const numericVal = Number(value) || 0;
  const convertedCredits = Math.floor(numericVal / 1_000);

  const handlePresetClick = (amount: number) => {
    onSelect();
    onChange(amount.toString());
  };

  return (
    <div
      onClick={onSelect}
      className={`wallet-custom-topup${selected ? ' wallet-custom-topup--selected' : ''}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="radio"
            name="credit-package"
            checked={selected}
            onChange={onSelect}
          />
          <div>
            <span className="flex items-center gap-2 font-bold">
              <Coins size={16} className="text-secondary" />
              Số tiền tùy chọn
            </span>
            <span className="hint">
              Từ 10.000đ đến 50.000.000đ (bội số của 1.000đ).
            </span>
          </div>
        </label>

        {selected && numericVal > 0 && (
          <div className="flex items-center gap-2 self-start rounded-xl bg-sky-100/70 px-3 py-1.5 text-xs font-bold text-primary sm:self-auto">
            <Zap size={14} className="text-amber-500 fill-amber-500" />
            <span>Quy đổi: <strong className="text-secondary">{convertedCredits.toLocaleString('vi-VN')}</strong> credit</span>
          </div>
        )}
      </div>

      {/* Quick Amount Presets */}
      <div className="mt-3.5">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Mức nạp nhanh phổ biến:
        </span>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {PRESETS.map((preset) => {
            const isPresetActive = selected && Number(value) === preset.amount;
            return (
              <button
                key={preset.amount}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePresetClick(preset.amount);
                }}
                className={`relative flex flex-col items-center justify-center rounded-xl border py-2.5 px-2 text-center transition-all cursor-pointer ${
                  isPresetActive
                    ? 'border-secondary bg-sky-600 text-white font-bold shadow-xs'
                    : 'border-slate-200 bg-slate-50/80 text-slate-700 font-semibold hover:border-sky-300 hover:bg-white'
                }`}
              >
                {preset.popular && (
                  <span className={`absolute -top-2 rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                    isPresetActive ? 'bg-amber-400 text-slate-900' : 'bg-sky-500 text-white'
                  }`}>
                    Hot
                  </span>
                )}
                <span className="text-xs">{preset.label}</span>
                <span className={`text-[10px] ${isPresetActive ? 'text-sky-100' : 'text-slate-400'}`}>
                  {(preset.amount / 1000).toLocaleString('vi-VN')} cr
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Input field */}
      <div className="mt-3.5">
        <input
          aria-label="Số tiền nạp tùy chọn"
          type="number"
          min={10000}
          max={50000000}
          step={1000}
          value={value}
          onFocus={onSelect}
          onChange={(event) => {
            onSelect();
            onChange(event.target.value);
          }}
          placeholder="Ví dụ: 100000"
        />

        {numericVal > 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles size={13} className="text-secondary" />
            Số tiền đã chọn: <strong className="text-slate-800">{money.format(numericVal)}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
