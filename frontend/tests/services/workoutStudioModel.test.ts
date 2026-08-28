import { describe, expect, it } from 'vitest';
import { cardGeometry, hasOverlap, snapMinute } from '../../src/services/workoutStudioModel';

describe('workoutStudioModel', () => {
  it('snaps to 15 minutes and scales card height proportionally', () => {
    expect(snapMinute(487)).toBe(480);
    expect(cardGeometry(480, 60)).toEqual({ top: 640, height: 80 });
  });

  it('detects overlap only within the same day', () => {
    const items = [{ id: 'a', dayNumber: 1, startMinute: 480, durationMinutes: 60 }];
    expect(hasOverlap(items, { id: 'b', dayNumber: 1, startMinute: 525, durationMinutes: 30 })).toBe(true);
    expect(hasOverlap(items, { id: 'b', dayNumber: 1, startMinute: 540, durationMinutes: 30 })).toBe(false);
    expect(hasOverlap(items, { id: 'b', dayNumber: 2, startMinute: 480, durationMinutes: 30 })).toBe(false);
  });
});
