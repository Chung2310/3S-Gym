import { describe, expect, it } from 'vitest';
import { visibleNavigation } from './portalNavigation';

describe('portalNavigation', () => {
  it('chỉ hiển thị thư viện giáo án mẫu theo feature thư viện bài tập', () => {
    const items = visibleNavigation({ username: 'pt', role: 'PT' }, { EXERCISE_LIBRARY: true, PROGRESS: true });
    expect(items).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: '/pt/my-workout-plans', label: 'Giáo án của tôi', feature: 'EXERCISE_LIBRARY' }),
    ]));
    expect(items).not.toEqual(expect.arrayContaining([expect.objectContaining({ path: '/pt/customer-workout-plans' }), expect.objectContaining({ path: '/pt/workout-plans' }), expect.objectContaining({ path: '/pt/workouts' })]));
  });
});
