import { useCallback } from 'react';
import { RefreshCw, Users, UserCheck, AlertTriangle, Package, Database } from 'lucide-react';
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

export default function AdminDashboardPage() {
  const loader = useCallback(() => api.get<AdminDashboard>('/api/dashboard/admin').then(({ data }) => data), []);
  const resource = useAsyncResource(loader);

  const metricCards = resource.data ? [
    { 
      label: 'PT đang hoạt động', 
      value: resource.data.totalPts, 
      icon: Users, 
      color: 'from-blue-600 to-cyan-500', 
      lightBg: 'bg-blue-50/50', 
      iconColor: 'text-blue-600',
      shadow: 'shadow-blue-500/20'
    },
    { 
      label: 'Khách hàng', 
      value: resource.data.totalCustomers, 
      icon: UserCheck, 
      color: 'from-emerald-500 to-teal-400', 
      lightBg: 'bg-emerald-50/50', 
      iconColor: 'text-emerald-600',
      shadow: 'shadow-emerald-500/20'
    },
    { 
      label: 'Cảnh báo đang mở', 
      value: resource.data.openAlerts, 
      icon: AlertTriangle, 
      color: 'from-rose-500 to-orange-400', 
      lightBg: 'bg-rose-50/50', 
      iconColor: 'text-rose-600',
      shadow: 'shadow-rose-500/20'
    },
    { 
      label: 'Gói tập đang hoạt động', 
      value: resource.data.activePackages, 
      icon: Package, 
      color: 'from-indigo-600 to-purple-500', 
      lightBg: 'bg-indigo-50/50', 
      iconColor: 'text-indigo-600',
      shadow: 'shadow-indigo-500/20'
    },
  ] as const : [];

  return (
    <section aria-labelledby="admin-dashboard-title" className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 id="admin-dashboard-title" className="text-xl font-extrabold text-slate-900 tracking-tight">
            Tổng quan hệ thống
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Theo dõi số liệu vận hành và trạng thái trực tiếp của nền tảng.
          </p>
        </div>
        <button
          className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 shadow-sm transition-all active:scale-95"
          onClick={() => void resource.refresh()}
          type="button"
          aria-label="Làm mới dữ liệu"
          title="Làm mới dữ liệu"
        >
          <RefreshCw size={14} className={resource.status === 'loading' ? 'animate-spin text-blue-600' : ''} />
        </button>
      </div>

      {/* Loading State */}
      {resource.status === 'loading' && !resource.data && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-12 flex flex-col items-center justify-center text-slate-500">
          <RefreshCw size={24} className="animate-spin text-blue-500 mb-3" />
          <span className="text-xs font-semibold tracking-wide">Đang đồng bộ số liệu...</span>
        </div>
      )}

      {/* Error State */}
      {resource.status === 'error' && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-rose-800">
            <div className="bg-white p-2 rounded-lg shadow-sm border border-rose-100 shrink-0">
              <AlertTriangle size={18} className="text-rose-500" />
            </div>
            <div>
              <h3 className="text-xs font-bold">Mất kết nối dữ liệu</h3>
              <p className="text-[11px] font-medium text-rose-700/80 mt-0.5">Không thể tải số liệu thống kê. Vui lòng thử lại sau.</p>
            </div>
          </div>
          <button
            className="px-4 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg font-bold text-xs transition-all shadow-sm shrink-0 active:scale-95"
            type="button"
            onClick={() => void resource.refresh()}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      {resource.data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map(({ label, value, icon: Icon, color, lightBg, iconColor }) => (
            <div 
              key={label}
              className="relative bg-white rounded-2xl p-4 lg:p-5 border border-slate-200/60 hover:border-slate-300 shadow-[0_2px_12px_rgb(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.04)] transition-all duration-300 group overflow-hidden flex items-center gap-4"
            >
              {/* Decorative Background Blob */}
              <div className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full ${color} opacity-[0.03] group-hover:scale-150 transition-transform duration-700 ease-out`} />
              
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lightBg} border border-white/60 shadow-inner group-hover:scale-110 transition-transform duration-300 ease-out shrink-0`}>
                <Icon size={22} className={iconColor} strokeWidth={2.5} />
              </div>

              <div className="relative z-10 flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  {label}
                </p>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-0.5 leading-none">
                  {value}
                </h3>
              </div>

              {/* Bottom decorative line */}
              <div className={`absolute bottom-0 left-0 h-[3px] w-0 bg-gradient-to-r ${color} group-hover:w-full transition-all duration-500 ease-out`} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
