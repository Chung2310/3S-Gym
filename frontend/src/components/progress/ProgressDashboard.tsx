import { useMemo, useState } from 'react';
import { Activity, CalendarDays, Dumbbell, Search, SearchX, TrendingDown, Users } from 'lucide-react';
import type { CustomerProgressOverview } from '../../types/progress';
import ProgressEmptyState from './ProgressEmptyState';
import ProgressMetricCard from './ProgressMetricCard';
import ProgressSection from './ProgressSection';

const number = (value: number) => value.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
const date = (value: string | null) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có';
const primaryActionClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 motion-reduce:transition-none';
const secondaryActionClass = 'inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-primary transition hover:border-secondary/40 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 motion-reduce:transition-none';

export default function ProgressDashboard({
  items,
  onView,
  onLogWorkout,
}: {
  items: CustomerProgressOverview[];
  onView: (item: CustomerProgressOverview) => void;
  onLogWorkout: (item: CustomerProgressOverview) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi-VN');
    return keyword
      ? items.filter((item) => item.customer.fullName.toLocaleLowerCase('vi-VN').includes(keyword) || item.customer.phone.includes(keyword))
      : items;
  }, [items, search]);

  const totalSessions = items.reduce((sum, item) => sum + item.sessionCount, 0);
  const activeCustomers = items.filter((item) => item.sessionCount > 0).length;
  const attendanceRates = items
    .map((item) => item.analytics.attendance.rate)
    .filter((value): value is number => value !== null);
  const averageAttendance = attendanceRates.length
    ? attendanceRates.reduce((sum, value) => sum + value, 0) / attendanceRates.length
    : null;
  const metrics = [
    { label: 'Khách được quản lý', value: `${items.length} khách hàng`, hint: 'Học viên đang được phân công', icon: Users },
    { label: 'Khách có hoạt động', value: number(activeCustomers), hint: 'Đã có dữ liệu buổi tập', icon: Activity },
    { label: 'Tổng buổi đã ghi nhận', value: number(totalSessions), hint: 'Tổng hợp trên toàn bộ học viên', icon: CalendarDays },
    { label: 'Tham gia trung bình', value: averageAttendance === null ? '—' : `${number(averageAttendance)}%`, hint: 'Tỷ lệ tham gia các buổi tập', icon: TrendingDown },
  ];

  return (
    <div className="space-y-6 font-montserrat">
      <section aria-label="Tổng quan tiến độ" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <ProgressMetricCard {...metric} featured={index === 0} key={metric.label} />
        ))}
      </section>

      <ProgressSection
        title="Danh sách học viên"
        description="Tìm nhanh học viên, xem hành trình chi tiết hoặc ghi nhận buổi tập."
        count={filtered.length}
        action={(
          <label className="relative block w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden="true" />
            <span className="sr-only">Tìm khách hàng</span>
            <input
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/20"
              placeholder="Tìm theo tên hoặc số điện thoại..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        )}
      >
        {filtered.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((item) => {
              const weightDelta = item.analytics.bodyDeltas?.weight;
              return (
                <article
                  className="flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_6px_20px_rgba(0,59,112,0.05)] transition hover:-translate-y-0.5 hover:border-secondary/35 hover:shadow-[0_12px_30px_rgba(0,59,112,0.09)] motion-reduce:transform-none motion-reduce:transition-none"
                  key={item.customer._id}
                >
                  <div>
                    <header className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-oswald text-xl font-bold uppercase text-primary">{item.customer.fullName}</h3>
                        <p className="mt-1 text-xs text-slate-500">{item.customer.phone}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        {item.customer.status === 'ACTIVE' ? 'Đang tập' : item.customer.status}
                      </span>
                    </header>

                    <dl role="group" aria-label={`Thông tin tiến độ của ${item.customer.fullName}`} className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <dt className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-500">Buổi đã tập</dt>
                        <dd className="mt-1 text-sm font-bold text-slate-900">{item.sessionCount}</dd>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <dt className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-500">Tỷ lệ tham gia</dt>
                        <dd className="mt-1 text-sm font-bold text-slate-900">{item.analytics.attendance.rate === null ? '—' : `${number(item.analytics.attendance.rate)}%`}</dd>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <dt className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-500">Cân nặng</dt>
                        <dd className="mt-1 text-sm font-bold text-slate-900">
                          {item.latestMeasurement?.weight ? `${number(item.latestMeasurement.weight)} kg` : '—'}
                          {typeof weightDelta === 'number' && (
                            <span className={weightDelta > 0 ? 'ml-1 text-xs text-rose-600' : 'ml-1 text-xs text-emerald-600'}>
                              ({weightDelta > 0 ? '+' : ''}{number(weightDelta)})
                            </span>
                          )}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <dt className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-500">Buổi gần nhất</dt>
                        <dd className="mt-1 text-sm font-bold text-slate-900">{date(item.lastSessionAt)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <button type="button" className={secondaryActionClass} aria-label={`Xem tiến độ ${item.customer.fullName}`} onClick={() => onView(item)}>
                      Xem tiến độ
                    </button>
                    <button type="button" className={primaryActionClass} aria-label={`Ghi nhận buổi tập ${item.customer.fullName}`} onClick={() => onLogWorkout(item)}>
                      <Dumbbell size={15} aria-hidden="true" />
                      Ghi nhận
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <ProgressEmptyState
            icon={SearchX}
            title="Không tìm thấy học viên"
            description="Thử tìm lại bằng tên hoặc số điện thoại khác."
          />
        )}
      </ProgressSection>
    </div>
  );
}
