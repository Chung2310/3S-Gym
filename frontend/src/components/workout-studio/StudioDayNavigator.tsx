import { ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';

interface Props { days: number[]; activeDay: number; totalMinutes: number; onChange: (day: number) => void }

export default function StudioDayNavigator({ days, activeDay, totalMinutes, onChange }: Props) {
  return <nav className="studio-days" aria-label="Ngày trong giáo án"><button aria-label="Ngày trước" disabled={activeDay === 1} onClick={() => onChange(activeDay - 1)}><ChevronLeft /></button><div>{days.map((day) => <button className={day === activeDay ? 'active' : ''} key={day} onClick={() => onChange(day)}>Ngày {day}</button>)}</div><button aria-label="Ngày sau" disabled={activeDay === days.length} onClick={() => onChange(activeDay + 1)}><ChevronRight /></button><span><Clock3 size={15} /> Tổng {totalMinutes} phút</span></nav>;
}
