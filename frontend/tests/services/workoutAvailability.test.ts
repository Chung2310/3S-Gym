import { describe, expect, it } from 'vitest';
import {
  availabilityError,
  availabilityProposalDefaults,
  availabilitySummary,
  outsideAvailabilityWarnings,
} from '../../src/services/workoutAvailability';

describe('workout availability utilities', () => {
  it('requires at least one availability slot', () => {
    expect(availabilityError([])).toContain('ít nhất một');
  });

  it('rejects overlapping slots on the same day', () => {
    expect(availabilityError([
      { dayNumber: 1, startMinute: 1080, endMinute: 1200 },
      { dayNumber: 1, startMinute: 1140, endMinute: 1260 },
    ])).toContain('chồng');
  });

  it('summarizes unique days and total slots', () => {
    expect(availabilitySummary([
      { dayNumber: 1, startMinute: 1080, endMinute: 1200 },
      { dayNumber: 1, startMinute: 1200, endMinute: 1320 },
      { dayNumber: 3, startMinute: 1080, endMinute: 1200 },
    ])).toEqual({ dayCount: 2, slotCount: 3 });
  });

  it('derives sessions and duration from the longest slot of each available day', () => {
    expect(availabilityProposalDefaults([
      { dayNumber: 1, startMinute: 480, endMinute: 540 },
      { dayNumber: 1, startMinute: 600, endMinute: 720 },
      { dayNumber: 3, startMinute: 480, endMinute: 570 },
      { dayNumber: 5, startMinute: 480, endMinute: 780 },
    ])).toEqual({ sessionsPerWeek: 3, minutesPerSession: 90 });
  });

  it('caps the automatic session duration at four hours', () => {
    expect(availabilityProposalDefaults([
      { dayNumber: 1, startMinute: 0, endMinute: 1440 },
    ])).toEqual({ sessionsPerWeek: 1, minutesPerSession: 240 });
  });

  it('finds session envelopes outside recurring availability', () => {
    const warnings = outsideAvailabilityWarnings([
      { weekNumber: 1, dayNumber: 1, startMinute: 1080, durationMinutes: 30 },
      { weekNumber: 1, dayNumber: 1, startMinute: 1110, durationMinutes: 30 },
      { weekNumber: 2, dayNumber: 2, startMinute: 1080, durationMinutes: 60 },
    ], [{ dayNumber: 1, startMinute: 1080, endMinute: 1200 }]);

    expect(warnings).toEqual([
      expect.objectContaining({ weekNumber: 2, dayNumber: 2 }),
    ]);
  });
});
