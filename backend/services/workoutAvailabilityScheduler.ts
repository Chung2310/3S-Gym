import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type {
  WorkoutAvailabilitySlot,
  WorkoutScheduleWarning,
} from '../types/workoutAvailability.js';

export interface SchedulableExercise {
  weekNumber: number;
  dayNumber: number;
  startMinute: number;
  durationMinutes: number;
}

interface WorkoutSession<T extends SchedulableExercise> {
  weekNumber: number;
  originalDayNumber: number;
  startMinute: number;
  endMinute: number;
  durationMinutes: number;
  items: T[];
}

const externalScheduleError = (message: string) => new AppError({
  status: 502,
  code: ERROR_CODES.EXTERNAL,
  message,
});

export function availabilityProposalDefaults(slots: WorkoutAvailabilitySlot[]): {
  sessionsPerWeek: number;
  minutesPerSession: number;
} {
  const longestSlotByDay = new Map<number, number>();

  for (const slot of slots) {
    const duration = slot.endMinute - slot.startMinute;
    if (duration <= 0) continue;
    longestSlotByDay.set(
      slot.dayNumber,
      Math.max(longestSlotByDay.get(slot.dayNumber) ?? 0, duration),
    );
  }

  return {
    sessionsPerWeek: longestSlotByDay.size,
    minutesPerSession: longestSlotByDay.size === 0
      ? 0
      : Math.min(240, ...longestSlotByDay.values()),
  };
}

function groupSessions<T extends SchedulableExercise>(items: T[]): WorkoutSession<T>[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = `${item.weekNumber}:${item.dayNumber}`;
    groups.set(key, [...(groups.get(key) || []), item]);
  }

  return [...groups.values()].map((groupItems) => {
    const sorted = [...groupItems].sort((left, right) => left.startMinute - right.startMinute);
    const startMinute = sorted[0].startMinute;
    const endMinute = Math.max(...sorted.map((item) => item.startMinute + item.durationMinutes));
    if (startMinute < 0 || endMinute > 1440 || endMinute <= startMinute) {
      throw externalScheduleError('AI trả về một buổi tập vượt quá giới hạn 24 giờ.');
    }

    return {
      weekNumber: sorted[0].weekNumber,
      originalDayNumber: sorted[0].dayNumber,
      startMinute,
      endMinute,
      durationMinutes: endMinute - startMinute,
      items: sorted,
    };
  }).sort((left, right) => (
    left.weekNumber - right.weekNumber
    || left.originalDayNumber - right.originalDayNumber
    || left.startMinute - right.startMinute
  ));
}

function fallbackDay(originalDayNumber: number, usedDays: Set<number>): number {
  if (!usedDays.has(originalDayNumber)) return originalDayNumber;
  const availableDay = [1, 2, 3, 4, 5, 6, 7].find((dayNumber) => !usedDays.has(dayNumber));
  if (!availableDay) {
    throw externalScheduleError('AI trả về quá nhiều buổi tập trong cùng một tuần.');
  }
  return availableDay;
}

function legalFallbackStart(startMinute: number, durationMinutes: number): number {
  const snapped = Math.round(startMinute / 15) * 15;
  return Math.max(0, Math.min(snapped, 1440 - durationMinutes));
}

export function scheduleWorkoutSessions<T extends SchedulableExercise>(
  items: T[],
  availabilitySlots: WorkoutAvailabilitySlot[],
  sessionsPerWeek: number,
): { scheduledExercises: T[]; scheduleWarnings: WorkoutScheduleWarning[] } {
  const sessions = groupSessions(items);
  const slots = [...availabilitySlots].sort((left, right) => (
    left.dayNumber - right.dayNumber || left.startMinute - right.startMinute
  ));
  const sessionsByWeek = new Map<number, WorkoutSession<T>[]>();

  for (const session of sessions) {
    sessionsByWeek.set(session.weekNumber, [
      ...(sessionsByWeek.get(session.weekNumber) || []),
      session,
    ]);
  }

  const scheduledExercises: T[] = [];
  const scheduleWarnings: WorkoutScheduleWarning[] = [];

  for (const [weekNumber, weekSessions] of sessionsByWeek) {
    if (weekSessions.length > sessionsPerWeek) {
      throw externalScheduleError('AI trả về số buổi tập vượt quá tần suất đã duyệt.');
    }

    const usedDays = new Set<number>();
    for (const session of weekSessions) {
      const matchingSlot = slots.find((slot) => (
        !usedDays.has(slot.dayNumber)
        && slot.endMinute - slot.startMinute >= session.durationMinutes
      ));
      const dayNumber = matchingSlot?.dayNumber
        ?? fallbackDay(session.originalDayNumber, usedDays);
      const startMinute = matchingSlot?.startMinute
        ?? legalFallbackStart(session.startMinute, session.durationMinutes);
      usedDays.add(dayNumber);

      for (const item of session.items) {
        scheduledExercises.push({
          ...item,
          dayNumber,
          startMinute: startMinute + item.startMinute - session.startMinute,
        });
      }

      if (!matchingSlot) {
        scheduleWarnings.push({
          type: 'OUTSIDE_AVAILABILITY',
          weekNumber,
          dayNumber,
          startMinute,
          endMinute: startMinute + session.durationMinutes,
        });
      }
    }
  }

  return {
    scheduledExercises: scheduledExercises.sort((left, right) => (
      left.weekNumber - right.weekNumber
      || left.dayNumber - right.dayNumber
      || left.startMinute - right.startMinute
    )),
    scheduleWarnings: scheduleWarnings.sort((left, right) => (
      left.weekNumber - right.weekNumber
      || left.dayNumber - right.dayNumber
      || left.startMinute - right.startMinute
    )),
  };
}
