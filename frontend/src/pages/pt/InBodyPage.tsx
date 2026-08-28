import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal';
import CustomerSelect from '../../components/ui/CustomerSelect';
import Pagination from '../../components/ui/Pagination';
import { useToast } from '../../components/ui/ToastProvider';
import InBodyScanModal from '../../components/inbody/InBodyScanModal';
import InBodyManualModal from '../../components/inbody/InBodyManualModal';
import InBodyDetailModal from '../../components/inbody/InBodyDetailModal';
import InBodyEvolutionChart from '../../components/inbody/InBodyEvolutionChart';
import { api } from '../../services/api';
import { analyzeInBody, classifyBodyFat, classifyVisceralFat } from '../../services/inbodyAnalytics';
import type { PaginationMeta } from '../../types';
import { errorMessage } from '../../types';
import type { InBodyRecordData } from '../../types/inbody';

export type InBodyItem = InBodyRecordData;

export default function InBodyPage() {
  const toast = useToast();

  // Modals state
  const [openScanModal, setOpenScanModal] = useState(false);
  const [openManualModal, setOpenManualModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InBodyItem | null>(null);
  const [detailItem, setDetailItem] = useState<InBodyItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InBodyItem | null>(null);

  // List & Filter State
  const [items, setItems] = useState<InBodyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadRecords = async (page = 1) => {
    setLoading(true);
    try {
      let url = `/api/inbody?page=${page}&limit=15`;
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      if (selectedCustomerId) url += `&customerId=${selectedCustomerId}`;

      const res = await api.get<InBodyItem[]>(url);
      setItems(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords(1);
  }, [statusFilter, selectedCustomerId]);

  const handleTogglePublish = async (item: InBodyItem) => {
    setTogglingId(item._id || '');
    const isPublishing = item.status !== 'PUBLISHED';
    try {
      const endpoint = isPublishing ? `/api/inbody/${item._id}/publish` : `/api/inbody/${item._id}/unpublish`;
      const res = await api.patch<InBodyItem>(endpoint, {});
      toast.success(res.message || (isPublishing ? 'Đã công bố InBody cho học viên!' : 'Đã chuyển về bản nháp!'));
      setItems((prev) =>
        prev.map((i) =>
          i._id === item._id
            ? {
                ...i,
                status: isPublishing ? 'PUBLISHED' : 'DRAFT',
                publishedAt: isPublishing ? new Date().toISOString() : null,
              }
            : i
        )
      );
      if (detailItem?._id === item._id) {
        setDetailItem((prev) =>
          prev
            ? {
                ...prev,
                status: isPublishing ? 'PUBLISHED' : 'DRAFT',
                publishedAt: isPublishing ? new Date().toISOString() : null,
              }
            : null
        );
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await api.delete(`/api/inbody/${deletingItem._id}`);
      toast.success('Đã xóa phiếu InBody.');
      setItems((prev) => prev.filter((i) => i._id !== deletingItem._id));
      setDeletingItem(null);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  // Find previous record for detail modal analysis comparison
  const previousRecordForDetail = useMemo(() => {
    if (!detailItem) return null;
    const cId =
      typeof detailItem.customerId === 'object' && detailItem.customerId !== null
        ? detailItem.customerId._id
        : String(detailItem.customerId || '');
    const sameCustomerRecords = items
      .filter((i) => {
        const itemCId =
          typeof i.customerId === 'object' && i.customerId !== null ? i.customerId._id : String(i.customerId || '');
        return itemCId === cId && i._id !== detailItem._id;
      })
      .sort((a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime());

    const targetTime = new Date(detailItem.measurementDate).getTime();
    return sameCustomerRecords.find((r) => new Date(r.measurementDate).getTime() < targetTime) || sameCustomerRecords[0] || null;
  }, [detailItem, items]);

  // If a single customer is filtered, calculate overall progress delta
  const customerProgressSummary = useMemo(() => {
    if (!selectedCustomerId || items.length < 2) return null;
    const sorted = [...items].sort((a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime());
    const latest = sorted[0];
    const previous = sorted[1];
    return analyzeInBody(latest, previous);
  }, [selectedCustomerId, items]);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header & Main Action Buttons */}
      <div className="section-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity color="#0284c7" size={28} /> InBody & Quét Chỉ Số AI
          </h1>
          <p>
            Đọc dữ liệu InBody tự động (AI OCR) hoặc nhập thủ công, tự động phân tích điểm mạnh/yếu, so sánh tiến độ và sinh kịch bản tư vấn cho PT.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              setEditingItem(null);
              setOpenManualModal(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontWeight: 700 }}
          >
            <Plus size={18} /> Nhập Thủ Công
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={() => setOpenScanModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 700 }}
          >
            <Sparkles size={18} /> Quét Phiếu InBody (AI)
          </button>
        </div>
      </div>

      {/* 2. Filters Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        {/* Customer Selector */}
        <div style={{ minWidth: '280px', flex: '1 1 300px' }}>
          <CustomerSelect
            label=""
            name="filterCustomerId"
            value={selectedCustomerId}
            onChange={(id) => setSelectedCustomerId(id)}
            placeholder="Lọc theo học viên..."
          />
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          {(
            [
              { id: 'ALL', label: 'Tất cả' },
              { id: 'PUBLISHED', label: 'Đã công bố' },
              { id: 'DRAFT', label: 'Bản nháp' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              style={{
                border: 'none',
                background: statusFilter === tab.id ? '#ffffff' : 'transparent',
                color: statusFilter === tab.id ? '#003b70' : '#64748b',
                fontWeight: statusFilter === tab.id ? 700 : 500,
                fontSize: '0.84rem',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: statusFilter === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          className="button button-secondary"
          onClick={() => void loadRecords(meta.page || 1)}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.84rem' }}
          title="Tải lại danh sách"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      {/* 3. When a specific customer is selected: Show Delta Progress & Evolution Chart */}
      {selectedCustomerId && items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {customerProgressSummary?.comparison && (
            <div
              style={{
                background: customerProgressSummary.comparison.trendType === 'EXCELLENT' ? '#f0fdf4' : '#f0f9ff',
                border: `1px solid ${customerProgressSummary.comparison.trendType === 'EXCELLENT' ? '#bbf7d0' : '#bae6fd'}`,
                borderRadius: '14px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <TrendingUp size={20} color="#0284c7" />
                  <strong style={{ color: '#003b70', fontSize: '0.96rem' }}>
                    Tiến độ so với lần đo trước (cách {customerProgressSummary.comparison.daysBetween} ngày):
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b', fontWeight: 600 }}>
                  {customerProgressSummary.comparison.trendSummary}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    padding: '5px 12px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: customerProgressSummary.comparison.deltaWeight > 0 ? '#b45309' : '#15803d',
                  }}
                >
                  Δ Cân: {customerProgressSummary.comparison.deltaWeight > 0 ? `+${customerProgressSummary.comparison.deltaWeight}` : customerProgressSummary.comparison.deltaWeight} kg
                </span>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    padding: '5px 12px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: customerProgressSummary.comparison.deltaFatPercentage < 0 ? '#15803d' : '#e11d48',
                  }}
                >
                  Δ % Mỡ: {customerProgressSummary.comparison.deltaFatPercentage > 0 ? `+${customerProgressSummary.comparison.deltaFatPercentage}` : customerProgressSummary.comparison.deltaFatPercentage}%
                </span>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    padding: '5px 12px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: customerProgressSummary.comparison.deltaMuscleMass > 0 ? '#15803d' : '#b45309',
                  }}
                >
                  Δ Cơ: {customerProgressSummary.comparison.deltaMuscleMass > 0 ? `+${customerProgressSummary.comparison.deltaMuscleMass}` : customerProgressSummary.comparison.deltaMuscleMass} kg
                </span>
              </div>
            </div>
          )}

          <InBodyEvolutionChart records={items} />
        </div>
      )}

      {/* 4. InBody Records Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        {loading && items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#0284c7' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Đang tải danh sách chỉ số InBody...</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Activity size={48} style={{ color: '#94a3b8', margin: '0 auto 14px' }} />
            <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '1.1rem' }}>Chưa có phiếu InBody nào</h3>
            <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '0.88rem' }}>
              {selectedCustomerId
                ? 'Học viên này chưa có kết quả đo InBody nào.'
                : 'Bấm nút bên dưới để quét phiếu bằng AI hoặc nhập thủ công!'}
            </p>
            <div style={{ display: 'inline-flex', gap: '10px' }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setEditingItem(null);
                  setOpenManualModal(true);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
              >
                <Plus size={16} /> Nhập Thủ Công
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setOpenScanModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
              >
                <Sparkles size={16} /> Quét Phiếu InBody (AI)
              </button>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '1080px', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left', whiteSpace: 'nowrap' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 700, minWidth: '190px' }}>Học viên</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, minWidth: '110px' }}>Ngày đo</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, minWidth: '105px' }}>Cân nặng</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, minWidth: '120px' }}>% Mỡ (Fat)</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, minWidth: '125px' }}>Khối lượng cơ</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, minWidth: '130px' }}>Mỡ nội tạng</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, minWidth: '130px' }}>BMI & BMR</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, minWidth: '100px' }}>Nguồn</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, minWidth: '120px' }}>Trạng thái</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'center', minWidth: '150px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const customerName =
                    typeof item.customerId === 'object' && item.customerId !== null ? item.customerId.fullName : 'Học viên';
                  const customerPhone =
                    typeof item.customerId === 'object' && item.customerId !== null ? item.customerId.phone : '';
                  const isPublished = item.status === 'PUBLISHED';
                  const isToggling = togglingId === item._id;

                  const fatCls = classifyBodyFat(item.bodyFatPercentage);
                  const visCls = classifyVisceralFat(item.visceralFatLevel);

                  return (
                    <tr
                      key={item._id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Customer Info */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: '#e0f2fe',
                              color: '#0369a1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.86rem',
                              flexShrink: 0,
                            }}
                          >
                            {customerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.9rem' }}>{customerName}</strong>
                            {customerPhone && <span style={{ fontSize: '0.76rem', color: '#64748b' }}>{customerPhone}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Measurement Date */}
                      <td style={{ padding: '14px 18px', color: '#334155', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="#0284c7" />
                          <span>{item.measurementDate ? new Date(item.measurementDate).toLocaleDateString('vi-VN') : '—'}</span>
                        </div>
                      </td>

                      {/* Weight */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        {item.weight ? (
                          <span
                            style={{
                              fontWeight: 800,
                              color: '#003b70',
                              fontSize: '0.92rem',
                              background: '#f0f9ff',
                              padding: '5px 12px',
                              borderRadius: '8px',
                              border: '1px solid #bae6fd',
                              display: 'inline-block',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.weight} kg
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Body Fat */}
                      <td style={{ padding: '14px 18px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                        {item.bodyFatPercentage != null ? (
                          <div>
                            <strong style={{ fontSize: '0.9rem' }}>{item.bodyFatPercentage}%</strong>
                            {fatCls && (
                              <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: fatCls.color }}>
                                {fatCls.label}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* Muscle Mass */}
                      <td style={{ padding: '14px 18px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                        {item.muscleMass != null ? (
                          <div>
                            <strong style={{ color: '#15803d', fontSize: '0.9rem' }}>{item.muscleMass} kg</strong>
                            {item.weight && (
                              <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>
                                ~{((item.muscleMass / item.weight) * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* Visceral Fat & InBody Score */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        {item.visceralFatLevel != null ? (
                          <div>
                            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: visCls?.color || '#0f172a' }}>
                              Level {item.visceralFatLevel}
                            </span>
                            {item.inbodyScore != null && (
                              <span style={{ display: 'block', fontSize: '0.74rem', color: '#15803d', fontWeight: 700 }}>
                                Score: {item.inbodyScore}/100
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* BMI & BMR */}
                      <td style={{ padding: '14px 18px', color: '#475569', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        <div>BMI: <strong style={{ color: '#0f172a' }}>{item.bmi || '—'}</strong></div>
                        <div style={{ marginTop: '2px' }}>BMR: <strong style={{ color: '#0f172a' }}>{item.bmr ? `${item.bmr} kcal` : '—'}</strong></div>
                      </td>

                      {/* Source */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        {item.source === 'AI_SCAN' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: '#f3e8ff',
                              color: '#7c3aed',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Sparkles size={11} /> AI OCR
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: '#f1f5f9',
                              color: '#475569',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Thủ công
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        {isPublished ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              background: '#dcfce7',
                              color: '#15803d',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Check size={12} /> Đã công bố
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              background: '#fef3c7',
                              color: '#b45309',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Bản nháp
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setDetailItem(item)}
                            aria-label="Xem phân tích & tư vấn PT"
                            title="Xem phân tích chi tiết & gợi ý tư vấn PT"
                            style={{
                              height: '34px',
                              padding: '0 10px',
                              borderRadius: '8px',
                              border: '1px solid #bae6fd',
                              background: '#f0f9ff',
                              color: '#0284c7',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Sparkles size={14} /> Phân Tích
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(item);
                              setOpenManualModal(true);
                            }}
                            aria-label="Sửa kết quả InBody"
                            title="Sửa phiếu InBody"
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleTogglePublish(item)}
                            disabled={isToggling}
                            aria-label={isPublished ? 'Thu hồi về bản nháp' : 'Công bố cho học viên'}
                            title={isPublished ? 'Thu hồi về bản nháp' : 'Công bố cho học viên xem'}
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              border: isPublished ? '1px solid #fecdd3' : '1px solid #bbf7d0',
                              background: isPublished ? '#fff1f2' : '#f0fdf4',
                              color: isPublished ? '#e11d48' : '#15803d',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              padding: 0,
                            }}
                          >
                            {isToggling ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : isPublished ? (
                              <EyeOff size={15} />
                            ) : (
                              <Eye size={15} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingItem(item)}
                            aria-label="Xóa kết quả InBody"
                            title="Xóa phiếu InBody"
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              padding: 0,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#e11d48';
                              e.currentTarget.style.borderColor = '#fecdd3';
                              e.currentTarget.style.background = '#fff1f2';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#64748b';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.background = '#ffffff';
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9' }}>
            <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={(p) => void loadRecords(p)} />
          </div>
        )}
      </div>

      {/* 5. InBody OCR Scan Modal */}
      <InBodyScanModal
        open={openScanModal}
        onClose={() => setOpenScanModal(false)}
        onConfirmed={(confirmedDraft) => {
          setOpenScanModal(false);
          toast.success('Đã lưu kết quả InBody thành công!');
          void loadRecords(1);
        }}
      />

      {/* 6. InBody Manual Input / Edit Modal */}
      <InBodyManualModal
        open={openManualModal}
        editingItem={editingItem}
        defaultCustomerId={selectedCustomerId}
        onClose={() => {
          setOpenManualModal(false);
          setEditingItem(null);
        }}
        onSaved={(saved) => {
          setOpenManualModal(false);
          setEditingItem(null);
          void loadRecords(meta.page || 1);
        }}
      />

      {/* 7. InBody Deep Analysis & PT Consultation Modal */}
      <InBodyDetailModal
        open={Boolean(detailItem)}
        record={detailItem}
        previousRecord={previousRecordForDetail}
        onClose={() => setDetailItem(null)}
        onEdit={(rec) => {
          setDetailItem(null);
          setEditingItem(rec);
          setOpenManualModal(true);
        }}
        onStatusChanged={(updated) => {
          setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
          setDetailItem(updated);
        }}
      />

      {/* 8. Delete Confirm Modal */}
      <ConfirmModal
        open={Boolean(deletingItem)}
        title="Xóa kết quả InBody?"
        description={`Bạn có chắc chắn muốn xóa bản ghi InBody ngày ${
          deletingItem?.measurementDate ? new Date(deletingItem.measurementDate).toLocaleDateString('vi-VN') : ''
        }? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa bản ghi"
        danger
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
}
