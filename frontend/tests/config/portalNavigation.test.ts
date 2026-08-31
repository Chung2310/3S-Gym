import { describe, expect, it } from 'vitest';
import { visibleNavigation } from '../../src/config/portalNavigation';

describe('portalNavigation', () => {
  it('cấp ví cho mọi vai trò và chỉ admin thấy trang quản trị credit', () => {
    for (const role of ['ADMIN', 'PT', 'CUSTOMER'] as const) {
      expect(visibleNavigation({ username: role.toLowerCase(), role })).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: '/wallet' })]),
      );
    }

    expect(visibleNavigation({ username: 'admin', role: 'ADMIN' })).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: '/admin/credits' })]),
    );
    expect(visibleNavigation({ username: 'pt', role: 'PT' }).find((item) => item.path === '/admin/credits')).toBeUndefined();
  });

  it('chỉ hiển thị thư viện giáo án mẫu; giáo án khách nằm trong chi tiết khách hàng', () => {
    const items = visibleNavigation({ username: 'pt', role: 'PT' }, { EXERCISE_LIBRARY: true, PROGRESS: true });

    expect(items).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: '/pt/my-workout-plans', label: 'Giáo án của tôi', feature: 'EXERCISE_LIBRARY' }),
    ]));
    expect(items.find((item) => item.path === '/pt/exercises')).toBeUndefined();
    expect(items).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ path: '/pt/customer-workout-plans' }),
      expect.objectContaining({ path: '/pt/workout-plans' }),
      expect.objectContaining({ path: '/pt/workouts' }),
    ]));
  });
});
