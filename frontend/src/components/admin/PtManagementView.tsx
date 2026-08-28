import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Plus,
  RefreshCw,
  Search,
  X,
  RotateCcw,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
  Eye,
  Award,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import DataList, { type DataColumn } from '../ui/DataList';
import Pagination from '../ui/Pagination';
import StatusBadge from '../ui/StatusBadge';
import ConfirmModal from '../ui/ConfirmModal';
import PtFormModal, { type PtRecord } from '../ui/PtFormModal';
import { useToast } from '../ui/ToastProvider';
import { api } from '../../services/api';
import type { PaginationMeta } from '../../types';
import { errorMessage } from '../../types';

export default function PtManagementView() {
  const toast = useToast();
  const [pts, setPts] = useState<PtRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 0 });
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [formPt, setFormPt] = useState<PtRecord | null | undefined>(undefined);
  const [detailPt, setDetailPt] = useState<PtRecord | null>(null);
  const [deletePt, setDeletePt] = useState<PtRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPts = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          limit: '18',
          role: 'PT',
        });
        if (keyword.trim()) params.set('keyword', keyword.trim());
        if (statusFilter) params.set('status', statusFilter);

        const result = await api.get<PtRecord[]>(`/api/users?${params.toString()}`);
        setPts(result.data || []);
        if (result.meta) setMeta(result.meta);
      } catch (error) {
        toast.error(errorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [keyword, statusFilter, toast],
  );

  useEffect(() => {
    void loadPts();
  }, [loadPts]);

  const handleDeletePt = async () => {
    if (!deletePt) return;
    const ptId = deletePt._id || deletePt.id;
    try {
      const result = await api.delete(`/api/users/${ptId}`);
      toast.success(result.message || 'Xóa huấn luyện viên thành công.');
      setDeletePt(null);
      void loadPts(meta.page || 1);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const handleResetFilters = () => {
    setKeyword('');
    setStatusFilter('');
  };

  const hasActiveFilters = Boolean(keyword || statusFilter);

  // Quick stats calculation
  const stats = useMemo(() => {
    const total = pts.length;
    const active = pts.filter((p) => p.status === 'ACTIVE').length;
    const locked = pts.filter((p) => p.status === 'LOCKED' || p.status === 'INACTIVE').length;
    const avgExp =
      total > 0
        ? (pts.reduce((acc, p) => acc + (Number(p.yearsOfExperience) || 0), 0) / total).toFixed(1)
        : '0';
    return { total, active, locked, avgExp };
  }, [pts]);

  const columns: DataColumn<PtRecord>[] = [
    {
      key: 'fullName',
      label: 'Huấn luyện viên',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
            {item.avatarUrl ? (
              <img src={item.avatarUrl} alt={item.fullName} className="w-full h-full object-cover" />
            ) : (
              <Users size={18} className="text-slate-400" />
            )}
          </div>
          <div>
            <div className="font-bold text-[#003b70] text-sm">{item.fullName || 'Chưa đặt tên'}</div>
            <div className="text-xs text-slate-500">@{item.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'specialization',
      label: 'Chuyên môn & Kinh nghiệm',
      render: (item) => (
        <div>
          <div className="font-medium text-slate-800 text-xs flex items-center gap-1.5">
            <Award size={13} className="text-sky-600 shrink-0" />
            <span>{item.specialization || 'Thể hình & Thể lực'}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {item.yearsOfExperience ? `${item.yearsOfExperience} năm kinh nghiệm` : 'Mới tham gia'}
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Liên hệ',
      render: (item) => (
        <div className="text-xs">
          <div className="text-slate-700 font-medium">{item.phone || '—'}</div>
          {item.email && <div className="text-slate-400 text-[11px]">{item.email}</div>}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <div className="pt-management-view">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#003b70] m-0 tracking-tight flex items-center gap-2">
            <Users size={22} className="text-sky-500" />
            Quản lý Huấn luyện viên (PT)
          </h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Hồ sơ chuyên môn, chứng chỉ đào tạo và trạng thái hoạt động của đội ngũ PT 3S Gym.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#003b70] to-[#00a4e4] text-white text-xs font-bold hover:opacity-95 shadow-sm transition-all cursor-pointer"
          type="button"
          onClick={() => setFormPt({ username: '', fullName: '', status: 'ACTIVE' })}
        >
          <Plus size={16} /> Thêm Huấn luyện viên
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tổng số PT</div>
            <div className="text-lg font-extrabold text-[#003b70] leading-none mt-1 font-['Oswald']">{stats.total}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Đang hoạt động</div>
            <div className="text-lg font-extrabold text-emerald-600 leading-none mt-1 font-['Oswald']">{stats.active}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Đã tạm khóa</div>
            <div className="text-lg font-extrabold text-rose-600 leading-none mt-1 font-['Oswald']">{stats.locked}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kinh nghiệm TB</div>
            <div className="text-lg font-extrabold text-[#003b70] leading-none mt-1 font-['Oswald']">{stats.avgExp} <span className="text-xs font-normal text-slate-500">năm</span></div>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        {/* Compact Filter Toolbar & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[220px] max-w-[340px] flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                aria-label="Tìm kiếm PT"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo tên, SĐT, email, chuyên môn..."
                className="w-full h-9 pl-9 pr-8 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-cyan-500 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500/15 transition-all text-slate-800"
                style={{ paddingLeft: '34px' }}
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Status Select */}
            <select
              aria-label="Lọc trạng thái PT"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none cursor-pointer focus:border-cyan-500 focus:bg-white transition-all"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="LOCKED">Đã khóa</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
            </select>

            <button
              className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              type="button"
              onClick={() => loadPts(1)}
              disabled={loading}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Đang tải...' : 'Lọc'}</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                className="h-9 px-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 text-xs inline-flex items-center gap-1 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={handleResetFilters}
                title="Xóa toàn bộ bộ lọc"
              >
                <RotateCcw size={12} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${viewMode === 'grid'
                ? 'bg-white text-[#003b70] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
                }`}
              onClick={() => setViewMode('grid')}
              title="Xem dạng thẻ huấn luyện viên"
            >
              <LayoutGrid size={14} />
              <span>Dạng thẻ</span>
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${viewMode === 'table'
                ? 'bg-white text-[#003b70] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
                }`}
              onClick={() => setViewMode('table')}
              title="Xem dạng danh sách bảng"
            >
              <List size={14} />
              <span>Dạng bảng</span>
            </button>
          </div>
        </div>

        {/* Content Display */}
        {pts.length === 0 && !loading ? (
          <div className="py-12 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
              <Users size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Chưa tìm thấy Huấn luyện viên nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {hasActiveFilters
                ? 'Không có PT nào khớp với điều kiện lọc hiện tại. Hãy thử tìm kiếm với từ khóa khác.'
                : 'Hệ thống chưa có hồ sơ Huấn luyện viên nào. Hãy thêm PT mới ngay bây giờ.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors"
                onClick={handleResetFilters}
              >
                <RotateCcw size={13} /> Xóa bộ lọc
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors"
                onClick={() => setFormPt({ username: '', fullName: '', status: 'ACTIVE' })}
              >
                <Plus size={15} /> Thêm PT đầu tiên
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Bento Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pts.map((pt) => {
              const certificatesList = Array.isArray(pt.certificates)
                ? pt.certificates
                : typeof pt.certificates === 'string' && pt.certificates
                  ? pt.certificates.split('\n').filter(Boolean)
                  : [];

              return (
                <article
                  key={pt._id || pt.id}
                  className="bg-white rounded-xl border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                >
                  {/* Card Header & Avatar */}
                  <div className="p-4 pb-3.5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                          {pt.avatarUrl ? (
                            <img src={pt.avatarUrl} alt={pt.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#003b70] to-[#00a4e4] text-white font-bold flex items-center justify-center text-base font-['Oswald']">
                              {(pt.fullName || pt.username || 'PT').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${pt.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            title={pt.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-[#003b70] text-[15px] group-hover:text-sky-600 transition-colors leading-tight">
                            {pt.fullName || 'Chưa đặt tên'}
                          </h3>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{pt.username}</div>
                        </div>
                      </div>
                      <StatusBadge status={pt.status} />
                    </div>

                    {/* Specialization & Experience Tags */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-100 text-sky-800 text-xs font-semibold">
                        <Award size={13} className="shrink-0 text-sky-600" />
                        <span>{pt.specialization || 'Huấn luyện tổng quát'}</span>
                      </span>
                      {pt.yearsOfExperience !== undefined && Number(pt.yearsOfExperience) > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-xs font-semibold">
                          <Clock size={12} className="shrink-0 text-amber-600" />
                          <span>{pt.yearsOfExperience} năm KN</span>
                        </span>
                      )}
                    </div>

                    {/* Bio Snippet */}
                    {pt.bio && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                        {pt.bio}
                      </p>
                    )}

                    {/* Certificates Chips */}
                    {certificatesList.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {certificatesList.slice(0, 2).map((cert, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium truncate max-w-[170px]"
                            title={cert}
                          >
                            {cert}
                          </span>
                        ))}
                        {certificatesList.length > 2 && (
                          <span className="text-xs font-semibold text-slate-400">
                            +{certificatesList.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="space-y-1.5 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
                      {pt.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          <a href={`tel:${pt.phone}`} className="hover:text-sky-600 font-medium transition-colors truncate">
                            {pt.phone}
                          </a>
                        </div>
                      )}
                      {pt.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <a href={`mailto:${pt.email}`} className="hover:text-sky-600 transition-colors truncate text-slate-500">
                            {pt.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="bg-slate-50/80 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors cursor-pointer"
                      onClick={() => setDetailPt(pt)}
                    >
                      <Eye size={13} />
                      <span>Chi tiết</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-[#003b70] hover:bg-sky-50 transition-colors cursor-pointer"
                        onClick={() => setFormPt(pt)}
                      >
                        <Pencil size={13} />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        onClick={() => setDeletePt(pt)}
                      >
                        <Trash2 size={13} />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* High-Density Table View */
          <>
            <DataList<PtRecord>
              items={pts}
              columns={columns}
              renderActions={(item) => (
                <div className="inline-actions">
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setDetailPt(item)}
                  >
                    <Eye size={15} /> Chi tiết
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setFormPt(item)}
                  >
                    <Pencil size={15} /> Sửa
                  </button>
                  <button
                    className="text-button text-danger"
                    type="button"
                    onClick={() => setDeletePt(item)}
                  >
                    <Trash2 size={15} /> Xóa
                  </button>
                </div>
              )}
            />
          </>
        )}

        <Pagination
          page={meta.page || 1}
          totalPages={meta.totalPages || 0}
          onPageChange={loadPts}
        />
      </div>

      {/* Form Modal (Create / Edit) */}
      <PtFormModal
        open={formPt !== undefined}
        pt={formPt}
        onClose={() => setFormPt(undefined)}
        onSaved={() => {
          setFormPt(undefined);
          void loadPts(meta.page || 1);
        }}
      />

      {/* PT Profile Detail Modal */}
      {detailPt && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setDetailPt(null)}>
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-[#003b70] to-[#00a4e4] p-5 text-white">
              <button
                type="button"
                className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                onClick={() => setDetailPt(null)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/20 border-2 border-white/40 shrink-0 flex items-center justify-center">
                  {detailPt.avatarUrl ? (
                    <img src={detailPt.avatarUrl} alt={detailPt.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <Users size={28} className="text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold m-0 leading-tight">{detailPt.fullName || 'Huấn luyện viên'}</h2>
                  <div className="text-xs text-white/80 mt-0.5">@{detailPt.username}</div>
                  <div className="inline-block mt-2">
                    <StatusBadge status={detailPt.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Specialization */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="font-bold text-[#003b70] text-sm mb-1 flex items-center gap-1.5">
                  <Award size={15} className="text-sky-600" />
                  <span>{detailPt.specialization || 'Chưa cập nhật chuyên môn'}</span>
                </div>
                <div className="text-slate-500">
                  {detailPt.yearsOfExperience ? `${detailPt.yearsOfExperience} năm kinh nghiệm thực chiến` : 'Huấn luyện viên mới'}
                </div>
              </div>

              {/* Bio */}
              {detailPt.bio && (
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-1.5 uppercase tracking-wider">Giới thiệu bản thân</h4>
                  <p className="text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    {detailPt.bio}
                  </p>
                </div>
              )}

              {/* Certificates */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs mb-1.5 uppercase tracking-wider">Bằng cấp & Chứng chỉ</h4>
                {detailPt.certificates && (Array.isArray(detailPt.certificates) ? detailPt.certificates.length > 0 : Boolean(detailPt.certificates)) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(detailPt.certificates) ? detailPt.certificates : String(detailPt.certificates).split('\n')).map(
                      (cert, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-sky-50 text-sky-800 border border-sky-200 font-medium"
                        >
                          {cert}
                        </span>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400 italic">Chưa có chứng chỉ được thêm.</div>
                )}
              </div>

              {/* Contact & Personal Info */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Phone size={12} /> SỐ ĐIỆN THOẠI
                  </div>
                  <div className="text-slate-700 font-medium">{detailPt.phone || '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Mail size={12} /> EMAIL
                  </div>
                  <div className="text-slate-700 font-medium truncate">{detailPt.email || '—'}</div>
                </div>
                {detailPt.address && (
                  <div className="col-span-2">
                    <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                      <MapPin size={12} /> ĐỊA CHỈ
                    </div>
                    <div className="text-slate-700">{detailPt.address}</div>
                  </div>
                )}
                {detailPt.dateOfBirth && (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                      <Calendar size={12} /> NGÀY SINH
                    </div>
                    <div className="text-slate-700">
                      {new Date(detailPt.dateOfBirth).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                onClick={() => setDetailPt(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-lg bg-[#003b70] hover:bg-sky-900 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                onClick={() => {
                  const pt = detailPt;
                  setDetailPt(null);
                  setFormPt(pt);
                }}
              >
                <Pencil size={13} /> Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deletePt)}
        title="Xóa tài khoản Huấn luyện viên?"
        description={`Bạn có chắc chắn muốn xóa tài khoản PT "${deletePt?.fullName || deletePt?.username}". PT chỉ nên xóa khi đã hoàn tất chuyển giao toàn bộ khách hàng sang PT khác.`}
        danger
        confirmLabel="Xóa PT vĩnh viễn"
        onClose={() => setDeletePt(null)}
        onConfirm={handleDeletePt}
      />
    </div>
  );
}
