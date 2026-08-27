import { useCallback, useState, type FormEvent } from 'react';
import { RefreshCw } from 'lucide-react';
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
  const metrics = resource.data ? [
    ['PT đang hoạt động', resource.data.totalPts],
    ['Khách hàng', resource.data.totalCustomers],
    ['Cảnh báo đang mở', resource.data.openAlerts],
    ['Gói tập đang hoạt động', resource.data.activePackages],
  ] as const : [];

  return <section aria-labelledby="admin-dashboard-title">
    <div className="section-header"><div><h1 id="admin-dashboard-title">Dashboard quản trị</h1><p>Tổng hợp dữ liệu vận hành theo bộ lọc backend.</p></div></div>
    <form className="filter-bar panel" onSubmit={submit}>
      <label className="field"><span>Mã PT</span><input aria-label="Mã PT" value={filters.ptId} onChange={(event) => setFilters((current) => ({ ...current, ptId: event.target.value }))} /></label>
      <label className="field"><span>Trạng thái khách hàng</span><select aria-label="Trạng thái khách hàng" value={filters.customerStatus} onChange={(event) => setFilters((current) => ({ ...current, customerStatus: event.target.value }))}><option value="">Tất cả</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Ngừng hoạt động</option><option value="LEAD">Tiềm năng</option></select></label>
      <label className="field"><span>Từ ngày</span><input aria-label="Từ ngày" type="date" value={filters.fromDate} onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))} /></label>
      <label className="field"><span>Đến ngày</span><input aria-label="Đến ngày" type="date" value={filters.toDate} onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))} /></label>
      <button className="button button-secondary" type="submit"><RefreshCw size={17} /> Áp dụng bộ lọc</button>
    </form>
    {resource.status === 'loading' && <div className="panel" role="status">Đang tải dashboard...</div>}
    {resource.status === 'error' && <div className="panel error-state" role="alert"><p>Không thể tải dashboard.</p><button className="button button-secondary" type="button" onClick={() => void resource.refresh()}>Thử lại</button></div>}
    {resource.data && <>
      <div className="customer-content-grid">{metrics.map(([label, value]) => <article className="panel" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
      <section className="panel"><h2>Nguồn dữ liệu</h2><ul>{resource.data.sourcePaths.map((path) => <li key={path}><code>{path}</code></li>)}</ul></section>
    </>}
  </section>;
}
