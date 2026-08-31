import { CalendarCheck2, Dumbbell, Flame, Gauge, TriangleAlert } from 'lucide-react';
import { useId } from 'react';
import type { JourneyAnalytics } from '../../types/progress';
import ProgressMetricCard from './ProgressMetricCard';

export interface ProgressSnapshotProps {
  analytics: JourneyAnalytics;
  title?: string;
}

export default function ProgressSnapshot({
  analytics,
  title = 'Tổng quan tiến độ',
}: ProgressSnapshotProps) {
  const titleId = useId();
  const metrics = [
    {
      label: 'Tỷ lệ tham gia',
      value: analytics.attendance.rate === null ? '—' : `${analytics.attendance.rate}%`,
      hint: 'Số buổi có mặt và đi muộn',
      icon: CalendarCheck2,
      featured: true,
    },
    {
      label: 'Tổng buổi tập',
      value: `${analytics.totalSessions.toLocaleString('vi-VN')} buổi`,
      hint: 'Tổng số buổi trong giai đoạn đang xem',
      icon: Dumbbell,
    },
    {
      label: 'RPE trung bình',
      value: analytics.averageRpe === null
        ? '—'
        : `RPE ${analytics.averageRpe.toLocaleString('vi-VN')}`,
      hint: 'Cường độ cảm nhận khi tập',
      icon: Gauge,
    },
    {
      label: 'Chuỗi tập',
      value: `${analytics.streakWeeks.toLocaleString('vi-VN')} tuần`,
      hint: 'Số tuần duy trì tập liên tiếp',
      icon: Flame,
    },
  ];

  return (
    <section aria-labelledby={titleId} className="space-y-4 font-montserrat">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">Snapshot hiện tại</p>
          <h2 id={titleId} className="mt-1 font-oswald text-2xl font-bold uppercase tracking-tight text-primary sm:text-3xl">
            {title}
          </h2>
        </div>
        <p className="max-w-md text-xs leading-5 text-slate-500">
          Tổng hợp trực tiếp từ lịch sử tập luyện và dữ liệu cơ thể đã ghi nhận.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <ProgressMetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {analytics.dataQuality.reasons.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950" role="status">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 shrink-0 text-amber-600" size={17} aria-hidden="true" />
            <div>
              <p className="text-sm font-bold">Dữ liệu cần bổ sung</p>
              <ul className="mt-1 space-y-1 text-xs leading-5 text-amber-900">
                {analytics.dataQuality.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
