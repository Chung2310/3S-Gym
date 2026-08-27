import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Search,
  X,
  TrendingUp,
  HeartPulse,
  Ruler,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { errorMessage } from '../../types';

interface CustomerRow {
  customerId: string;
  fullName: string;
  dataStatus: 'READY' | 'INSUFFICIENT_DATA' | string;
  rank: number | null;
  score: number | null;
  scoreBreakdown: { measurementTrend: number; careRisk: number } | null;
  sourcePath: string;
  latestMeasurement?: {
    measuredAt?: string;
    weight?: number;
    bodyFatPercentage?: number;
    muscleMass?: number;
  } | null;
}

interface PtDashboardData {
  totalCustomers: number;
  openAlerts: number;
  customers: CustomerRow[];
}

export default function PtDashboard() {
  const toast = useToast();
  const [data, setData] = useState<PtDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'INSUFFICIENT_DATA'>('ALL');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get<PtDashboardData>('/api/dashboard/pt');
      setData(res.data);
    } catch (error: unknown) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!data?.customers) return [];
    return data.customers.filter((c) => {
      const matchSearch =
        !search.trim() ||
        c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.customerId.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === 'ALL' || c.dataStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  const readyCount = useMemo(
    () => data?.customers.filter((c) => c.dataStatus === 'READY').length || 0,
    [data],
  );

  return (
    <div className="pt-dashboard-workspace max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#003b70] m-0 tracking-tight flex items-center gap-2">
            <Activity size={22} className="text-sky-500" />
            Bảng điều khiển Huấn luyện viên (PT)
          </h1>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Theo dõi điểm tiến độ InBody, cảnh báo chăm sóc và hiệu suất tập luyện của học viên.
          </p>
        </div>
        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Customers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Học viên phụ trách</span>
            <div className="text-2xl font-bold text-[#003b70] mt-1 font-['Oswald']">
              {data?.totalCustomers ?? '—'} <span className="text-xs font-normal text-slate-400">người</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Users size={22} />
          </div>
        </div>

        {/* Open Care Alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cảnh báo chăm sóc</span>
            <div className="text-2xl font-bold mt-1 font-['Oswald'] text-amber-600">
              {data?.openAlerts ?? '—'} <span className="text-xs font-normal text-slate-400">cần xử lý</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle size={22} />
          </div>
        </div>

        {/* Ready Data Count */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đủ dữ liệu phân tích</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1 font-['Oswald']">
              {readyCount} <span className="text-xs font-normal text-slate-400">/ {data?.totalCustomers || 0}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Main Customer Progress Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[220px] max-w-sm flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm học viên theo tên hoặc mã..."
                className="w-full h-9 pl-9 pr-8 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-cyan-500 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500/15 transition-all text-slate-800"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Xóa tìm kiếm"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-[#003b70] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => setStatusFilter('ALL')}
              >
                Tất cả ({data?.customers?.length || 0})
              </button>
              <button
                type="button"
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  statusFilter === 'READY'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => setStatusFilter('READY')}
              >
                Đủ dữ liệu ({readyCount})
              </button>
              <button
                type="button"
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  statusFilter === 'INSUFFICIENT_DATA'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => setStatusFilter('INSUFFICIENT_DATA')}
              >
                Cần đo thêm InBody
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-sky-500" />
            Đang tải dữ liệu học viên...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Users size={28} className="text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold">Chưa có dữ liệu học viên phù hợp</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Vui lòng kiểm tra lại bộ lọc tìm kiếm.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Học viên</th>
                  <th className="py-2.5 px-3">Trạng thái dữ liệu</th>
                  <th className="py-2.5 px-3">Điểm tổng hợp</th>
                  <th className="py-2.5 px-3">Chi tiết thành phần</th>
                  <th className="py-2.5 px-3 text-right">Hành động nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCustomers.map((c) => (
                  <tr key={c.customerId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Customer */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#003b70] text-sm">{c.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Mã: {c.customerId.slice(-6).toUpperCase()}</div>
                    </td>

                    {/* Data Status */}
                    <td className="py-3 px-3">
                      {c.dataStatus === 'READY' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                          <CheckCircle2 size={12} /> Đã sẵn sàng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[11px]">
                          <AlertTriangle size={12} /> Cần ≥ 2 lần InBody
                        </span>
                      )}
                    </td>

                    {/* Progress Score */}
                    <td className="py-3 px-3">
                      {c.score !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                c.score >= 70
                                  ? 'bg-emerald-500'
                                  : c.score >= 50
                                  ? 'bg-sky-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, c.score))}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800 text-xs font-['Oswald']">{c.score}/100</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">—</span>
                      )}
                    </td>

                    {/* Score Breakdown */}
                    <td className="py-3 px-3">
                      {c.scoreBreakdown ? (
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <TrendingUp size={12} className="text-sky-500" />
                            Xu hướng: <strong className="text-[#003b70]">{c.scoreBreakdown.measurementTrend}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <HeartPulse size={12} className="text-rose-500" />
                            Chăm sóc: <strong className="text-rose-600">{c.scoreBreakdown.careRisk}</strong>
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Chưa đủ dữ liệu InBody đối chiếu</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Link
                          to="/portal/pt/inbody"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-[#003b70] hover:bg-sky-50 border border-slate-200 transition-colors"
                          title="Xem kết quả InBody"
                        >
                          <Ruler size={13} />
                          <span>InBody</span>
                        </Link>
                        <Link
                          to="/portal/pt/care"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors"
                          title="Mở hồ sơ chăm sóc"
                        >
                          <HeartPulse size={13} />
                          <span>Chăm sóc</span>
                        </Link>
                        <Link
                          to="/portal/pt/customers"
                          className="inline-flex items-center p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Hồ sơ chi tiết"
                        >
                          <ChevronRight size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
