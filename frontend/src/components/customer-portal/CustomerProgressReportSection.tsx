import { CheckCircle2, FileText } from 'lucide-react';
import type { JourneyProgressReport } from '../../types';
import ProgressEmptyState from '../progress/ProgressEmptyState';
import ProgressSection from '../progress/ProgressSection';

export interface CustomerProgressReportSectionProps {
  reports: JourneyProgressReport[];
  featured?: boolean;
}

function ReportMetrics({ metrics }: { metrics?: Record<string, unknown> }) {
  if (!metrics) return null;
  const weightDelta = typeof metrics.weightDelta === 'number' ? metrics.weightDelta : null;
  const totalVolume = typeof metrics.totalVolume === 'number' ? metrics.totalVolume : null;
  if (weightDelta === null && totalVolume === null) return null;

  return (
    <dl className="mt-4 flex flex-wrap gap-2">
      {weightDelta !== null && (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <dt className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">Cân nặng</dt>
          <dd className="mt-0.5 text-sm font-bold text-slate-900">{weightDelta > 0 ? '+' : ''}{weightDelta} kg</dd>
        </div>
      )}
      {totalVolume !== null && (
        <div className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2">
          <dt className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">Volume</dt>
          <dd className="mt-0.5 text-sm font-bold text-primary">{totalVolume.toLocaleString('vi-VN')} kg</dd>
        </div>
      )}
    </dl>
  );
}

function ReportCard({ report, featured }: { report: JourneyProgressReport; featured: boolean }) {
  return (
    <article className={featured
      ? 'rounded-2xl border border-sky-200 bg-sky-50/60 p-5 sm:p-6'
      : 'rounded-xl border border-slate-200 bg-slate-50/60 p-4'}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 size={13} aria-hidden="true" />
          Đã công bố
        </span>
        <time className="text-xs font-semibold text-slate-500" dateTime={report.periodEnd}>
          {new Date(report.periodStart).toLocaleDateString('vi-VN')} – {new Date(report.periodEnd).toLocaleDateString('vi-VN')}
        </time>
      </div>
      <h3 className={featured
        ? 'mt-4 font-oswald text-2xl font-bold uppercase leading-tight text-primary'
        : 'mt-3 text-base font-bold leading-6 text-slate-900'}
      >
        {report.summary}
      </h3>
      <ReportMetrics metrics={report.metrics} />
      <p className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500">
        Tổng hợp và xác nhận bởi huấn luyện viên phụ trách
      </p>
    </article>
  );
}

export default function CustomerProgressReportSection({ reports, featured = false }: CustomerProgressReportSectionProps) {
  const orderedReports = [...reports].sort(
    (left, right) => new Date(right.periodEnd).getTime() - new Date(left.periodEnd).getTime(),
  );

  if (orderedReports.length === 0) {
    return (
      <ProgressEmptyState
        icon={FileText}
        title="Chưa có báo cáo tiến độ"
        description="Báo cáo từ huấn luyện viên sẽ xuất hiện sau mỗi chu kỳ luyện tập."
      />
    );
  }

  if (featured) {
    return (
      <ProgressSection
        title="Báo cáo mới nhất"
        description="Đánh giá gần nhất từ huấn luyện viên phụ trách."
      >
        <ReportCard report={orderedReports[0]} featured />
      </ProgressSection>
    );
  }

  return (
    <ProgressSection
      title="Báo cáo trước đây"
      description="Xem lại các đánh giá trong những chu kỳ trước."
      count={orderedReports.length}
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {orderedReports.map((report) => <ReportCard report={report} featured={false} key={report._id} />)}
      </div>
    </ProgressSection>
  );
}
