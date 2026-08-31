import type { CreditPackage } from '../../types/credits';
const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
export default function CreditPackageGrid({ packages, selectedId, onSelect }: { packages: CreditPackage[]; selectedId: string; onSelect: (id: string) => void }) {
  if (!packages.length) return <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">Chưa có gói credit đang mở bán. Bạn vẫn có thể nhập số tiền tùy chọn.</p>;
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{packages.map((item) => <label key={item.id} className={`cursor-pointer rounded-2xl border p-5 transition ${selectedId === item.id ? 'border-secondary bg-sky-50 ring-2 ring-sky-100' : 'border-slate-200 bg-white hover:border-sky-300'}`}>
    <input className="sr-only" type="radio" name="credit-package" value={item.id} checked={selectedId === item.id} onChange={() => onSelect(item.id)} />
    <span className="block text-xs font-bold uppercase tracking-[0.18em] text-sky-600">{money.format(item.amountVnd)}</span><strong className="mt-2 block text-lg text-slate-900">{item.name}</strong>
    <span className="mt-3 block text-3xl font-black text-primary">{item.grantCredits} credit</span>{item.bonusCredits > 0 && <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Tặng {item.bonusCredits} credit</span>}
    {item.description && <span className="mt-3 block text-sm text-slate-500">{item.description}</span>}
  </label>)}</div>;
}
