import { ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';

interface Props { days: number[]; activeDay: number; totalMinutes: number; onChange: (day: number) => void }

export default function StudioDayNavigator({ days, activeDay, totalMinutes, onChange }: Props) {
  return <div className="studio-day-navigation">
    <button type="button" className="studio-day-arrow" aria-label="Ngày trước" disabled={activeDay === 1} onClick={() => onChange(activeDay - 1)}><ChevronLeft size={19} aria-hidden="true" /></button>
    <div className="studio-day-list">{days.map((day) => <button type="button" aria-current={day === activeDay} key={day} onClick={() => onChange(day)}>Ngày {day}</button>)}</div>
    <span className="studio-day-summary"><Clock3 size={15} aria-hidden="true" /> {totalMinutes} phút</span>
    <button type="button" className="studio-day-arrow" aria-label="Ngày sau" disabled={activeDay === days.length} onClick={() => onChange(activeDay + 1)}><ChevronRight size={19} aria-hidden="true" /></button>
  </div>;
}
