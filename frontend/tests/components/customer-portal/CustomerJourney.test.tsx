// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import CustomerJourney from '../../../src/components/customer-portal/CustomerJourney';
import type { CustomerJourneyDto } from '../../../src/types/progress';

const journey = { customer: { _id: 'c1', fullName: 'Nguyễn An' }, sessions: [{ _id: 's1', performedAt: '2026-08-29', attendance: 'PRESENT', planSnapshot: { title: 'Strength', session: { name: 'Ngày 1' } }, exerciseLogs: [{ name: 'Squat', sets: [{ reps: 10, weight: 60, rpe: 8, completed: true }] }], feeling: 'Khỏe', notes: 'Ghi chú cho khách' }], measurements: [], calendar: [{ _id: 'e1', title: 'Tập chân', startsAt: '2026-09-01' }], photos: [{ _id: 'p1', photoUrl: 'https://example.com/photo.jpg', stage: 'BEFORE', takenDate: '2026-08-01' }], plans: { active: { _id: 'plan1', title: 'Giáo án hiện tại' }, history: [{ _id: 'plan0', title: 'Giáo án cũ' }] }, reports: [{ _id: 'r1', summary: 'Tiến bộ tốt', periodStart: '2026-08-01', periodEnd: '2026-08-31', status: 'PUBLISHED' }], analytics: { totalVolume: 600, averageRpe: 8, attendance: { present: 1, late: 0, absent: 0, rate: 100 }, streakWeeks: 1, achievements: [{ exerciseName: 'Squat', kind: 'MAX_WEIGHT', value: 60, achievedAt: '2026-08-29', sessionId: 's1', isNewInPeriod: true }], dataQuality: { level: 'PARTIAL', reasons: [] } } } as unknown as CustomerJourneyDto;

it('renders the complete read-only customer journey', () => {
  render(<CustomerJourney journey={journey} />);
  for (const value of ['Tập chân', 'Strength · Ngày 1', 'Giáo án hiện tại', 'Giáo án cũ', 'Tiến bộ tốt']) expect(screen.getByText(value)).toBeVisible();
  expect(screen.getAllByText('600 kg')).toHaveLength(2);
  expect(screen.getAllByText('Squat')).toHaveLength(2);
  expect(screen.getByAltText('Ảnh tiến độ BEFORE')).toBeVisible();
});
