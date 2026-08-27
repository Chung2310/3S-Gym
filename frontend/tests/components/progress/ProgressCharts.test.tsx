// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import ProgressCharts from '../../../src/components/progress/ProgressCharts';

describe('ProgressCharts', () => {
  it('hiển thị empty state khi chưa đủ hai điểm dữ liệu', () => {
    render(<ProgressCharts measurements={[{ _id: 'm1', measuredAt: '2026-08-01', weight: 70 }]} />);
    expect(screen.getByLabelText('Biểu đồ cân nặng')).toHaveTextContent('Không đủ dữ liệu');
  });

  it('render SVG có accessible point labels', () => {
    render(<ProgressCharts measurements={[{ _id: 'm1', measuredAt: '2026-08-01', weight: 70 }, { _id: 'm2', measuredAt: '2026-09-01', weight: 69 }]} />);
    expect(screen.getByRole('img', { name: 'Biểu đồ cân nặng' })).toBeVisible();
    expect(screen.getByLabelText('01/09/2026: 69 kg')).toBeInTheDocument();
  });
});
