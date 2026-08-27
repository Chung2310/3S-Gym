// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import CustomerProgress from './CustomerProgress';

it('chỉ render progressReports do backend trả về', () => {
  render(<CustomerProgress reports={[{ _id: 'published-1', status: 'PUBLISHED', summary: 'Tháng này tiến bộ tốt.', periodStart: '2026-08-01', periodEnd: '2026-08-31' }]} />);
  expect(screen.getByText('Tháng này tiến bộ tốt.')).toBeVisible();
  expect(screen.queryByText('Bản nháp')).not.toBeInTheDocument();
});
