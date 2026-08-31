import { ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';

interface Props { days: number[]; activeDay: number; totalMinutes: number; onChange: (day: number) => void }

export default function StudioDayNavigator({ days, activeDay, totalMinutes, onChange }: Props) {
  const arrowClass = 'grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary';
  return <nav className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2.5 font-montserrat shadow-[0_5px_18px_rgba(0,59,112,0.04)]" aria-label="Ngày trong giáo án">
    <button type="button" className={arrowClass} aria-label="Ngày trước" disabled={activeDay === 1} onClick={() => onChange(activeDay - 1)}><ChevronLeft size={19} /></button>
    <div className="flex min-w-0 flex-1 snap-x gap-1.5 overflow-x-auto py-0.5">{days.map((day) => <button type="button" className={day === activeDay ? 'min-h-10 shrink-0 snap-start rounded-lg bg-primary px-3.5 text-xs font-bold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary' : 'min-h-10 shrink-0 snap-start rounded-lg px-3.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary'} key={day} onClick={() => onChange(day)}>Ngày {day}</button>)}</div>
    <span className="hidden shrink-0 items-center gap-1.5 border-l border-slate-100 px-2 text-xs font-bold text-slate-500 sm:inline-flex"><Clock3 size={15} className="text-secondary" /> {totalMinutes} phút</span>
    <button type="button" className={arrowClass} aria-label="Ngày sau" disabled={activeDay === days.length} onClick={() => onChange(activeDay + 1)}><ChevronRight size={19} /></button>
  </nav>;
}
