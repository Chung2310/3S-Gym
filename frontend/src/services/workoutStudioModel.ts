export interface StudioScheduleItem {
  id: string;
  weekNumber?: number;
  dayNumber: number;
  startMinute: number;
  durationMinutes: number;
}

export const SLOT_MINUTES = 15;
export const SLOT_HEIGHT = 20;
export const DAY_MINUTES = 1440;

export function snapMinute(value: number): number {
  return Math.max(0, Math.min(1425, Math.round(value / SLOT_MINUTES) * SLOT_MINUTES));
}

export function cardGeometry(startMinute: number, durationMinutes: number) {
  return { top: (startMinute / SLOT_MINUTES) * SLOT_HEIGHT, height: (durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT };
}

export function hasOverlap<T extends StudioScheduleItem>(items: T[], candidate: T): boolean {
  return items.some((item) => item.id !== candidate.id && (item.weekNumber || 1) === (candidate.weekNumber || 1) && item.dayNumber === candidate.dayNumber && candidate.startMinute < item.startMinute + item.durationMinutes && item.startMinute < candidate.startMinute + candidate.durationMinutes);
}

export function formatMinute(minute: number): string {
  const bounded = Math.max(0, Math.min(DAY_MINUTES, minute));
  return `${String(Math.floor(bounded / 60)).padStart(2, '0')}:${String(bounded % 60).padStart(2, '0')}`;
}
