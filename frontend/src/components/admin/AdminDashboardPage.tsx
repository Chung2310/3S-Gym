import { useCallback, useState, type FormEvent } from 'react';
import { RefreshCw, Users, UserCheck, AlertTriangle, Package, Database, RotateCcw, Calendar, User, X } from 'lucide-react';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { api } from '../../services/api';

interface AdminDashboard {
  totalPts: number;
  totalCustomers: number;
  openAlerts: number;
  activePackages: number;
  filters: Record<string, string>;
  sourcePaths: string[];
}

interface DashboardFilters {
  ptId: string;
  customerStatus: string;
  fromDate: string;
  toDate: string;
}

const emptyFilters: DashboardFilters = { ptId: '', customerStatus: '', fromDate: '', toDate: '' };

function dashboardPath(filters: DashboardFilters): string {
  const query = new URLSearchParams();
  if (filters.ptId) query.set('ptId', filters.ptId);
  if (filters.customerStatus) query.set('customerStatus', filters.customerStatus);
  if (filters.fromDate) query.set('fromDate', filters.fromDate);
  if (filters.toDate) query.set('toDate', filters.toDate);
  const suffix = query.toString();
  return `/api/dashboard/admin${suffix ? `?${suffix}` : ''}`;
}

export default function AdminDashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<DashboardFilters>(emptyFilters);
  const loader = useCallback(() => api.get<AdminDashboard>(dashboardPath(appliedFilters)).then(({ data }) => data), [appliedFilters]);
  const resource = useAsyncResource(loader);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setAppliedFilters({ ...filters });
  };

  const handleReset = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const hasActiveFilters = Boolean(
    filters.ptId || filters.customerStatus || filters.fromDate || filters.toDate ||
    appliedFilters.ptId || appliedFilters.customerStatus || appliedFilters.fromDate || appliedFilters.toDate
  );

  const activeFilterCount = [
    appliedFilters.ptId,
    appliedFilters.customerStatus,
    appliedFilters.fromDate,
    appliedFilters.toDate,
  ].filter(Boolean).length;

  const metricCards = resource.data ? [
    { label: 'PT đang hoạt động', value: resource.data.totalPts, icon: Users, iconClass: 'pts' },
    { label: 'Khách hàng', value: resource.data.totalCustomers, icon: UserCheck, iconClass: 'customers' },
    { label: 'Cảnh báo đang mở', value: resource.data.openAlerts, icon: AlertTriangle, iconClass: 'alerts' },
    { label: 'Gói tập đang hoạt động', value: resource.data.activePackages, icon: Package, iconClass: 'packages' },
  ] as const : [];

  return (
    <section aria-labelledby="admin-dashboard-title">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h1 id="admin-dashboard-title" className="text-lg font-bold text-[#003b70] m-0 tracking-tight">
            Dashboard quản trị
          </h1>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Tổng hợp dữ liệu vận hành theo bộ lọc thời gian và huấn luyện viên.
          </p>
        </div>
      </div>

      {/* Modern Compact Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs mb-3.5">
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2.5">
          {/* Mã PT */}
          <div className="flex-1 min-w-[150px] relative">
            <label className="sr-only">Mã PT</label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:border-cyan-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
              <User size={14} className="text-slate-400 mr-2 shrink-0" aria-hidden="true" />
              <input
                aria-label="Mã PT"
                placeholder="Nhập mã PT..."
                value={filters.ptId}
                onChange={(event) => setFilters((current) => ({ ...current, ptId: event.target.value }))}
                className="w-full bg-transparent text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400"
              />
              {filters.ptId && (
                <button
                  type="button"
                  onClick={() => setFilters((current) => ({ ...current, ptId: '' }))}
                  className="text-slate-400 hover:text-slate-600 ml-1"
                  aria-label="Xóa mã PT"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Trạng thái khách hàng */}
          <div className="min-w-[160px]">
            <label className="sr-only">Trạng thái khách hàng</label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:border-cyan-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
              <Users size={14} className="text-slate-400 mr-2 shrink-0" aria-hidden="true" />
              <select
                aria-label="Trạng thái khách hàng"
                value={filters.customerStatus}
                onChange={(event) => setFilters((current) => ({ ...current, customerStatus: event.target.value }))}
                className="w-full bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
                <option value="LEAD">Tiềm năng</option>
              </select>
            </div>
          </div>

          {/* Khoảng ngày (Từ ngày → Đến ngày) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:border-cyan-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
            <Calendar size={14} className="text-slate-400 shrink-0" aria-hidden="true" />
            <label className="sr-only">Từ ngày</label>
            <input
              aria-label="Từ ngày"
              type="date"
              value={filters.fromDate}
              onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))}
              className="bg-transparent text-xs font-medium text-slate-700 outline-none w-[112px]"
              title="Từ ngày"
            />
            <span className="text-slate-400 text-xs">→</span>
            <label className="sr-only">Đến ngày</label>
            <input
              aria-label="Đến ngày"
              type="date"
              value={filters.toDate}
              onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))}
              className="bg-transparent text-xs font-medium text-slate-700 outline-none w-[112px]"
              title="Đến ngày"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#003b70] to-[#00a4e4] text-white text-xs font-semibold hover:opacity-95 shadow-xs transition-all cursor-pointer h-[34px]"
              type="submit"
            >
              <RefreshCw size={13} className="shrink-0" />
              <span>Áp dụng bộ lọc</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-medium transition-all cursor-pointer h-[34px]"
                title="Đặt lại toàn bộ lọc"
              >
                <RotateCcw size={12} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </form>

        {/* Quick presets row */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lọc nhanh:</span>
          <button
            type="button"
            onClick={() => {
              const today = new Date().toISOString().slice(0, 10);
              setFilters((current) => ({ ...current, fromDate: today, toDate: today }));
            }}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              const to = new Date().toISOString().slice(0, 10);
              now.setDate(now.getDate() - 7);
              const from = now.toISOString().slice(0, 10);
              setFilters((current) => ({ ...current, fromDate: from, toDate: to }));
            }}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer"
          >
            7 ngày qua
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              const to = new Date().toISOString().slice(0, 10);
              now.setDate(now.getDate() - 30);
              const from = now.toISOString().slice(0, 10);
              setFilters((current) => ({ ...current, fromDate: from, toDate: to }));
            }}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer"
          >
            30 ngày qua
          </button>
          {activeFilterCount > 0 && (
            <span className="ml-auto text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/50">
              {activeFilterCount} bộ lọc đang áp dụng
            </span>
          )}
        </div>
      </div>

      {resource.status === 'loading' && (
        <div className="panel flex items-center justify-center p-6 text-slate-500 text-xs" role="status">
          <RefreshCw size={16} className="animate-spin mr-2 text-cyan-600" />
          <span>Đang tải số liệu dashboard...</span>
        </div>
      )}

      {resource.status === 'error' && (
        <div className="flex items-center justify-between p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 mb-3.5 text-xs shadow-2xs" role="alert">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-600 shrink-0" />
            <span>Không thể tải dữ liệu dashboard (chưa có kết nối hoặc phiên đăng nhập hết hạn).</span>
          </div>
          <button
            className="px-3 py-1 bg-amber-200/70 hover:bg-amber-200 text-amber-900 rounded-lg font-semibold text-xs transition-all cursor-pointer"
            type="button"
            onClick={() => void resource.refresh()}
          >
            Thử lại
          </button>
        </div>
      )}

      {resource.data && (
        <>
          <div className="admin-metrics-grid">
            {metricCards.map(({ label, value, icon: Icon, iconClass }) => (
              <article className="admin-stat-card" key={label}>
                <div className={`admin-stat-icon ${iconClass}`}>
                  <Icon size={24} aria-hidden="true" />
                </div>
                <div className="admin-stat-info">
                  <span className="admin-stat-label">{label}</span>
                  <strong className="admin-stat-value">{value}</strong>
                </div>
              </article>
            ))}
          </div>

          <section className="panel">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
              <Database size={16} color="var(--secondary-color)" /> Nguồn dữ liệu backend
            </h2>
            <ul style={{ display: 'grid', gap: '6px', paddingLeft: '1.2rem', color: '#475569', fontSize: '0.82rem' }}>
              {resource.data.sourcePaths.map((path) => (
                <li key={path}>
                  <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#003b70', fontSize: '0.78rem' }}>
                    {path}
                  </code>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </section>
  );
}
