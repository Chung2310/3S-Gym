export default function CustomTopupForm({ value, selected, onChange, onSelect }: { value: string; selected: boolean; onChange: (value: string) => void; onSelect: () => void }) {
  return <label className={`block rounded-2xl border p-5 ${selected ? 'border-secondary bg-sky-50 ring-2 ring-sky-100' : 'border-slate-200 bg-white'}`}>
    <span className="flex items-center gap-2 text-sm font-bold text-slate-800"><input type="radio" name="credit-package" checked={selected} onChange={onSelect} /> Số tiền tùy chọn</span>
    <span className="mt-3 block text-xs text-slate-500">Từ 10.000đ đến 50.000.000đ, theo bước 1.000đ.</span>
    <input aria-label="Số tiền nạp tùy chọn" className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold outline-none focus:border-secondary focus:ring-2 focus:ring-sky-100" type="number" min={10000} max={50000000} step={1000} value={value} onFocus={onSelect} onChange={(event) => { onSelect(); onChange(event.target.value); }} placeholder="Ví dụ: 100000" />
  </label>;
}
