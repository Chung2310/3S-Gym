import { useMemo, useState } from 'react';
import { Activity, CalendarDays, Dumbbell, Search, TrendingDown, Users } from 'lucide-react';
import type { CustomerProgressOverview } from '../../types/progress';

const number = (value: number) => value.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
const date = (value: string | null) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có';

export default function ProgressDashboard({ items, onView, onLogWorkout }: { items: CustomerProgressOverview[]; onView: (item: CustomerProgressOverview) => void; onLogWorkout: (item: CustomerProgressOverview) => void }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    return keyword ? items.filter((item) => item.customer.fullName.toLocaleLowerCase().includes(keyword) || item.customer.phone.includes(keyword)) : items;
  }, [items, search]);

  const totalSessions = items.reduce((sum, item) => sum + item.sessionCount, 0);
  const activeCustomers = items.filter((item) => item.sessionCount > 0).length;
  const averageAttendance = items.map((item) => item.analytics.attendance.rate).filter((value): value is number => value !== null).reduce((sum, value, _, values) => sum + value / values.length, 0);

  const metrics = [
    { label: 'Khách được quản lý', value: `${items.length} khách hàng`, icon: Users, color: 'progress-metric-icon-blue' },
    { label: 'Khách có hoạt động', value: `${activeCustomers}`, icon: Activity, color: 'progress-metric-icon-green' },
    { label: 'Tổng buổi đã ghi nhận', value: number(totalSessions), icon: CalendarDays, color: 'progress-metric-icon-purple' },
    { label: 'Tham gia trung bình', value: items.length ? `${number(averageAttendance)}%` : '—', icon: TrendingDown, color: 'progress-metric-icon-amber' },
  ];

  return (
    <section className="progress-dashboard">
      {/* Overview Metrics Cards - structured with dummy classes for test compatibility */}
      <section
        aria-label="Tổng quan tiến độ"
        className="progress-metrics"
      >
        {metrics.map((metric) => (
          <article
            role="group"
            className="progress-metric-card"
            key={metric.label}
          >
            <div className="progress-metric-copy">
              <p className="progress-metric-label">{metric.label}</p>
              <p className="progress-metric-value">{metric.value}</p>
            </div>
            <div className={`progress-metric-icon ${metric.color}`}>
              <metric.icon size={20} />
            </div>
          </article>
        ))}
      </section>

      {/* Search Bar */}
      <div className="panel progress-search-panel">
        <label className="progress-search">
          <Search className="progress-search-icon" size={16} />
          <span className="progress-visually-hidden">Tìm khách hàng</span>
          <input
            className="progress-search-input"
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      {/* Customer Cards Grid */}
      {filtered.length ? (
        <div className="progress-customer-grid">
          {filtered.map((item) => {
            const weightDelta = item.analytics.bodyDeltas?.weight;
            return (
              <article
                className="progress-customer-card"
                key={item.customer._id}
              >
                <div>
                  <div className="progress-customer-header">
                    <div className="progress-customer-identity">
                      <h2 className="progress-customer-name">
                        {item.customer.fullName}
                      </h2>
                      <p className="progress-customer-phone">{item.customer.phone}</p>
                    </div>
                    <span className="progress-customer-status">
                      {item.customer.status === 'ACTIVE' ? 'Đang tập' : item.customer.status}
                    </span>
                  </div>

                  <dl
                    role="group"
                    aria-label={`Thông tin tiến độ của ${item.customer.fullName}`}
                    className="progress-customer-stats"
                  >
                    <div className="progress-stat">
                      <dt className="progress-stat-label">Buổi đã tập</dt>
                      <dd className="progress-stat-value">{item.sessionCount}</dd>
                    </div>
                    <div className="progress-stat">
                      <dt className="progress-stat-label">Tỷ lệ tham gia</dt>
                      <dd className="progress-stat-value">
                        {item.analytics.attendance.rate === null ? '—' : `${number(item.analytics.attendance.rate)}%`}
                      </dd>
                    </div>
                    <div className="progress-stat">
                      <dt className="progress-stat-label">Cân nặng</dt>
                      <dd className="progress-stat-value">
                        {item.latestMeasurement?.weight ? `${number(item.latestMeasurement.weight)} kg` : '—'}
                        {typeof weightDelta === 'number' && (
                          <span className={`progress-delta ${weightDelta > 0 ? 'progress-delta-up' : 'progress-delta-down'}`}>
                            ({weightDelta > 0 ? '+' : ''}{number(weightDelta)})
                          </span>
                        )}
                      </dd>
                    </div>
                    <div className="progress-stat">
                      <dt className="progress-stat-label">Buổi gần nhất</dt>
                      <dd className="progress-stat-value">{date(item.lastSessionAt)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="progress-card-actions">
                  <button
                    type="button"
                    className="button button-secondary progress-card-action"
                    aria-label={`Xem tiến độ ${item.customer.fullName}`}
                    onClick={() => onView(item)}
                  >
                    Xem tiến độ
                  </button>
                  <button
                    type="button"
                    className="button button-primary progress-card-action"
                    aria-label={`Ghi nhận buổi tập ${item.customer.fullName}`}
                    onClick={() => onLogWorkout(item)}
                  >
                    <Dumbbell size={14} /> Ghi nhận
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state progress-empty">
          Không tìm thấy khách hàng phù hợp.
        </div>
      )}
    </section>
  );
}
