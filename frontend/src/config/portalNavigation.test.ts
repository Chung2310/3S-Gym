import { describe, expect, it } from 'vitest';
import { visibleNavigation } from './portalNavigation';

describe('portalNavigation', () => {
  it('hiển thị module Giáo án riêng cho PT theo feature thư viện bài tập', () => {
    const items = visibleNavigation({ username: 'pt', role: 'PT' }, { EXERCISE_LIBRARY: true, PROGRESS: true });
    expect(items).toEqual(expect.arrayContaining([expect.objectContaining({ path: '/pt/workout-plans', label: 'Giáo án', feature: 'EXERCISE_LIBRARY' })]));
    expect(items).not.toEqual(expect.arrayContaining([expect.objectContaining({ path: '/pt/workouts' })]));
  });
});
