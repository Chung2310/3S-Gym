// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import ProgressCharts from '../../../src/components/progress/ProgressCharts';

describe('ProgressCharts', () => {
  it('hiển thị empty state khi chưa đủ hai điểm dữ liệu', () => {
    render(<ProgressCharts measurements={[{ _id: 'm1', measuredAt: '2026-08-01', weight: 70 }]} />);
    expect(screen.getByRole('region', { name: 'Biểu đồ tiến độ' })).toBeVisible();
    expect(screen.getByLabelText('Biểu đồ cân nặng')).toHaveTextContent('Không đủ dữ liệu');
  });

  it('render SVG có accessible point labels', () => {
    render(<ProgressCharts measurements={[{ _id: 'm1', measuredAt: '2026-08-01', weight: 70 }, { _id: 'm2', measuredAt: '2026-09-01', weight: 69 }]} />);
    expect(screen.getByRole('img', { name: 'Biểu đồ cân nặng' })).toBeVisible();
    expect(screen.getByLabelText('01/09/2026: 69 kg')).toBeInTheDocument();
  });

  it('renders body fat, muscle and circumference charts when data is available', () => {
    render(<ProgressCharts measurements={[
      { _id: 'm1', measuredAt: '2026-08-01', weight: 70, bodyFatPercentage: 25, muscleMass: 29, measurements: { waist: 85 } },
      { _id: 'm2', measuredAt: '2026-09-01', weight: 69, bodyFatPercentage: 23, muscleMass: 30, measurements: { waist: 82 } },
    ]} />);
    expect(screen.getByRole('img', { name: 'Biểu đồ tỷ lệ mỡ' })).toBeVisible();
    expect(screen.getByRole('img', { name: 'Biểu đồ khối lượng cơ' })).toBeVisible();
    expect(screen.getByRole('img', { name: 'Biểu đồ vòng eo' })).toBeVisible();
  });
});
