// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { Activity } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import ProgressEmptyState from '../../../src/components/progress/ProgressEmptyState';
import ProgressSection from '../../../src/components/progress/ProgressSection';
import ProgressSkeleton from '../../../src/components/progress/ProgressSkeleton';
import ProgressSnapshot from '../../../src/components/progress/ProgressSnapshot';
import type { JourneyAnalytics } from '../../../src/types/progress';

const completeAnalytics: JourneyAnalytics = {
  totalSessions: 8,
  totalVolume: 8500,
  averageRpe: 8.2,
  attendance: { present: 8, late: 0, absent: 0, rate: 100 },
  streakWeeks: 3,
  tracking: {
    strength: { totalVolumeKg: 8500, maxWeightKg: 100, maxReps: 12, estimated1RmKg: 120 },
    bodyweight: { totalReps: 0, maxReps: null, maxAddedWeightKg: null },
    cardio: { durationMinutes: 0, distanceKm: 0, bestPaceSecondsPerKm: null, averageHeartRate: null },
    interval: { totalRounds: 0, workSeconds: 0, restSeconds: 0 },
    mobility: { durationMinutes: 0, completedReps: 0, averageDiscomfort: null },
  },
  achievements: [],
  dataQuality: { level: 'COMPLETE', reasons: [] },
};

describe('ProgressSnapshot', () => {
  it('renders the four journey KPIs with Vietnamese number formatting', () => {
    render(<ProgressSnapshot analytics={completeAnalytics} />);

    expect(screen.getByRole('region', { name: 'Tổng quan tiến độ' })).toBeVisible();
    expect(screen.getByText('Tỷ lệ tham gia')).toBeVisible();
    expect(screen.getByText('100%')).toBeVisible();
    expect(screen.getByText('8 buổi')).toBeVisible();
    expect(screen.queryByText('8.500 kg')).not.toBeInTheDocument();
    expect(screen.getByText('RPE 8,2')).toBeVisible();
    expect(screen.getByText('3 tuần')).toBeVisible();
  });

  it('keeps missing values unknown and exposes data-quality reasons', () => {
    const analytics: JourneyAnalytics = {
      ...completeAnalytics,
      averageRpe: null,
      attendance: { present: 0, late: 0, absent: 0, rate: null },
      dataQuality: {
        level: 'INSUFFICIENT',
        reasons: ['Cần thêm dữ liệu buổi tập để tính xu hướng.'],
      },
    };

    render(<ProgressSnapshot analytics={analytics} />);

    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.getByText('Cần thêm dữ liệu buổi tập để tính xu hướng.')).toBeVisible();
  });
});

describe('progress presentation states', () => {
  it('provides a named semantic section with an optional action', () => {
    render(
      <ProgressSection
        title="Ảnh tiến độ"
        description="Đối chiếu thay đổi vóc dáng theo thời gian."
        count={2}
        action={<button type="button">Thêm ảnh</button>}
      >
        <p>Nội dung gallery</p>
      </ProgressSection>
    );

    expect(screen.getByRole('region', { name: 'Ảnh tiến độ' })).toBeVisible();
    expect(screen.getByText('2 mục')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Thêm ảnh' })).toBeVisible();
  });

  it('renders a role-neutral empty state and calls its CTA', async () => {
    const onAction = vi.fn();
    render(
      <ProgressEmptyState
        icon={Activity}
        title="Chưa có dữ liệu tiến độ"
        description="Chọn học viên để bắt đầu theo dõi."
        action={<button type="button" onClick={onAction}>Chọn học viên</button>}
      />
    );

    screen.getByRole('button', { name: 'Chọn học viên' }).click();
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('announces the loading skeleton without forcing motion', () => {
    render(<ProgressSkeleton />);

    const status = screen.getByRole('status', { name: 'Đang tải dữ liệu tiến độ' });
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status.querySelector('.motion-reduce\\:animate-none')).toBeInTheDocument();
  });
});
