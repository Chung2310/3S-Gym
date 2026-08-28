import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  Eye,
  FileText,
  HeartPulse,
  Image as ImageIcon,
  MessageSquare,
  Package,
  Pencil,
  Phone,
  Plus,
  Ruler,
  Sliders,
  Sparkles,
  Target,
  Trash2,
  User,
  X,
} from 'lucide-react';
import FormField from './FormField';
import StatusBadge from './StatusBadge';
import { useToast } from './ToastProvider';
import { api } from '../../services/api';
import { errorMessage } from '../../types';
import CustomerConsultationModal from './CustomerConsultationModal';
import CustomerPhotoModal from './CustomerPhotoModal';
import PtPackageManagerModal from './PtPackageManagerModal';

export interface CustomerFullDetail {
  _id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  dateOfBirth?: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  height?: number | null;
  initialWeight?: number | null;
  medicalNotes?: string;
  initialGoal?: string;
  internalNotes?: string;
  status: string;
  userId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface CustomerDetailModalProps {
  open: boolean;
  customer: { _id?: string; fullName?: string } | null;
  onClose: () => void;
  onEditCustomer?: (customer: CustomerFullDetail) => void;
  onGrantAccount?: (customer: CustomerFullDetail) => void;
}

type DetailTab = 'overview' | 'packages' | 'consultations' | 'photos' | 'workouts' | 'inbody';

export default function CustomerDetailModal({
  open,
  customer,
  onClose,
  onEditCustomer,
  onGrantAccount,
}: CustomerDetailModalProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [detail, setDetail] = useState<CustomerFullDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Sub-modal triggers
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Summary counts
  const [packages, setPackages] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [inbodies, setInbodies] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  const loadAll = async () => {
    if (!customer?._id) return;
    try {
      setLoading(true);
      const [resCustomer, resPackages, resConsultations, resPhotos, resInbody, resSessions] = await Promise.allSettled([
        api.get<CustomerFullDetail>(`/api/customers/${customer._id}`),
        api.get<any[]>(`/api/customers/${customer._id}/packages?limit=50`),
        api.get<any[]>(`/api/customers/${customer._id}/consultations?limit=50`),
        api.get<any[]>(`/api/customers/${customer._id}/photos?limit=50`),
        api.get<any[]>(`/api/inbody?customerId=${customer._id}&limit=50`),
        api.get<any>(`/api/workouts/sessions?customerId=${customer._id}&limit=50`),
      ]);

      if (resCustomer.status === 'fulfilled' && resCustomer.value.data) {
        setDetail(resCustomer.value.data);
      }
      if (resPackages.status === 'fulfilled' && resPackages.value.data) {
        setPackages(resPackages.value.data);
      }
      if (resConsultations.status === 'fulfilled' && resConsultations.value.data) {
        setConsultations(resConsultations.value.data);
      }
      if (resPhotos.status === 'fulfilled' && resPhotos.value.data) {
        setPhotos(resPhotos.value.data);
      }
      if (resInbody.status === 'fulfilled' && resInbody.value.data) {
        setInbodies(resInbody.value.data);
      }
      if (resSessions.status === 'fulfilled' && resSessions.value.data) {
        setSessions(Array.isArray(resSessions.value.data) ? resSessions.value.data : resSessions.value.data?.items || []);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setActiveTab('overview');
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer?._id]);

  const activePackage = useMemo(() => packages.find((p) => p.status === 'ACTIVE'), [packages]);

  if (!open || !customer) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="customer-detail-title">
      <div
        className="modal-content"
        style={{
          maxWidth: '1020px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px',
        }}
      >
        {/* Header Profile Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #003b70 0%, #002347 100%)',
            color: '#ffffff',
            padding: '24px 28px',
            position: 'relative',
          }}
        >
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Đóng"
            style={{ position: 'absolute', top: '16px', right: '16px', color: '#94a3b8' }}
          >
            <X size={22} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00a4e4 0%, #0284c7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  border: '2px solid rgba(255,255,255,0.2)',
                }}
              >
                {detail?.fullName ? detail.fullName.charAt(0).toUpperCase() : customer.fullName?.charAt(0).toUpperCase() || 'K'}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h1 id="customer-detail-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                    {detail?.fullName || customer.fullName}
                  </h1>
                  {detail?.status && <StatusBadge status={detail.status} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '0.86rem', color: '#cbd5e1' }}>
                  {detail?.phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={13} style={{ color: '#38bdf8' }} /> {detail.phone}
                    </span>
                  )}
                  {detail?.email && (
                    <span>{detail.email}</span>
                  )}
                  {detail?.gender && (
                    <span>
                      {detail.gender === 'MALE' ? 'Nam' : detail.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {detail && onEditCustomer && (
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.84rem' }}
                  onClick={() => {
                    onClose();
                    onEditCustomer(detail);
                  }}
                >
                  <Pencil size={14} style={{ marginRight: '5px' }} /> Sửa thông tin
                </button>
              )}
              {detail && !detail.userId && onGrantAccount && (
                <button
                  type="button"
                  className="button button-primary"
                  style={{ fontSize: '0.84rem', background: '#00a4e4' }}
                  onClick={() => {
                    onClose();
                    onGrantAccount(detail);
                  }}
                >
                  Cấp tài khoản
                </button>
              )}
            </div>
          </div>

          {/* Sub-tabs Navigation */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              marginTop: '20px',
              borderBottom: '1px solid rgba(255,255,255,0.15)',
              overflowX: 'auto',
              paddingBottom: '2px',
            }}
          >
            {[
              { id: 'overview', label: 'Tổng quan & Hồ sơ', icon: User, count: null },
              { id: 'packages', label: 'Gói tập PT', icon: Package, count: packages.length },
              { id: 'consultations', label: 'Lịch sử tư vấn', icon: MessageSquare, count: consultations.length },
              { id: 'photos', label: 'Ảnh Before / After', icon: Camera, count: photos.length },
              { id: 'workouts', label: 'Lịch sử tập luyện', icon: Dumbbell, count: sessions.length },
              { id: 'inbody', label: 'InBody & Số đo', icon: Ruler, count: inbodies.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as DetailTab)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    fontSize: '0.84rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? '#ffffff' : '#94a3b8',
                    background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px 8px 0 0',
                    borderBottom: active ? '3px solid #38bdf8' : '3px solid transparent',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={15} style={{ color: active ? '#38bdf8' : 'currentColor' }} />
                  <span>{tab.label}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span
                      style={{
                        background: active ? '#38bdf8' : 'rgba(255,255,255,0.15)',
                        color: active ? '#003b70' : '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '10px',
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && detail && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Quick Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Gói tập hiện tại</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#003b70', marginTop: '4px' }}>
                    {activePackage ? activePackage.name : 'Chưa có gói hoạt động'}
                  </div>
                  {activePackage && (
                    <small style={{ color: '#16a34a', fontWeight: 600 }}>
                      Còn {activePackage.remainingSessions}/{activePackage.totalSessions} buổi
                    </small>
                  )}
                </div>

                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Chiều cao & Cân nặng</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#003b70', marginTop: '4px' }}>
                    {detail.height ? `${detail.height} cm` : '—'} • {detail.initialWeight ? `${detail.initialWeight} kg` : '—'}
                  </div>
                  {detail.height && detail.initialWeight && (
                    <small style={{ color: '#64748b' }}>
                      BMI ban đầu: {(detail.initialWeight / Math.pow(detail.height / 100, 2)).toFixed(1)}
                    </small>
                  )}
                </div>

                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Tổng buổi đã tập</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#003b70', marginTop: '4px' }}>
                    {sessions.length} buổi tập
                  </div>
                  <small style={{ color: '#0284c7' }}>Lần gần nhất: {sessions[0]?.performedAt ? new Date(sessions[0].performedAt).toLocaleDateString('vi-VN') : '—'}</small>
                </div>
              </div>

              {/* Goal & Notes Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#003b70' }}>
                    <Target size={18} style={{ color: '#0284c7' }} />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Mục tiêu tập luyện</h3>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {detail.initialGoal || 'Chưa thiết lập mục tiêu ban đầu.'}
                  </p>
                </div>

                <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#e11d48' }}>
                    <HeartPulse size={18} />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Lưu ý sức khỏe & Bệnh lý</h3>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {detail.medicalNotes || 'Không có tiền sử bệnh lý hoặc chấn thương đặc biệt.'}
                  </p>
                </div>
              </div>

              {/* Internal PT Notes */}
              <div style={{ background: '#fefce8', padding: '18px 20px', borderRadius: '12px', border: '1px solid #fef08a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#854d0e' }}>
                  <FileText size={17} />
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Ghi chú nội bộ của PT</h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#713f12', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {detail.internalNotes || 'Chưa có ghi chú nội bộ.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PACKAGES */}
          {activeTab === 'packages' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#003b70' }}>Quản lý gói tập PT</h3>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setShowPackageModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Mở trình quản lý gói PT
                </button>
              </div>

              {packages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Package size={36} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
                  <p style={{ color: '#64748b', margin: 0 }}>Khách hàng chưa có gói tập PT nào.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {packages.map((pkg) => (
                    <div
                      key={pkg._id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '18px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <strong style={{ fontSize: '1.05rem', color: '#003b70' }}>{pkg.name}</strong>
                        <StatusBadge status={pkg.status} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.86rem', color: '#475569' }}>
                        <div>Tổng số buổi: <strong>{pkg.totalSessions}</strong></div>
                        <div>Đã sử dụng: <strong style={{ color: '#e11d48' }}>{pkg.usedSessions || (pkg.totalSessions - pkg.remainingSessions)}</strong> buổi</div>
                        <div>Còn lại: <strong style={{ color: '#16a34a', fontSize: '1rem' }}>{pkg.remainingSessions}</strong> buổi</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                          Thời hạn: {pkg.startDate ? new Date(pkg.startDate).toLocaleDateString('vi-VN') : ''} - {pkg.endDate ? new Date(pkg.endDate).toLocaleDateString('vi-VN') : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONSULTATIONS */}
          {activeTab === 'consultations' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#003b70' }}>Lịch sử tư vấn ({consultations.length})</h3>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setShowConsultationModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Thêm / Quản lý tư vấn
                </button>
              </div>

              {consultations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <MessageSquare size={36} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
                  <p style={{ color: '#64748b', margin: 0 }}>Chưa có buổi tư vấn nào được ghi nhận.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {consultations.map((item) => (
                    <div key={item._id} style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '1rem', color: '#003b70' }}>{item.topic}</strong>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} /> {item.consultationDate ? new Date(item.consultationDate).toLocaleDateString('vi-VN') : '—'}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.86rem' }}>
                        <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>
                          <span style={{ fontWeight: 600, color: '#475569', display: 'block' }}>Thể trạng:</span>
                          <p style={{ margin: '4px 0 0', color: '#1e293b' }}>{item.currentCondition}</p>
                        </div>
                        <div style={{ background: '#f0fdf4', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #16a34a' }}>
                          <span style={{ fontWeight: 600, color: '#15803d', display: 'block' }}>Lời khuyên PT:</span>
                          <p style={{ margin: '4px 0 0', color: '#1e293b' }}>{item.advice}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PHOTOS BEFORE / AFTER */}
          {activeTab === 'photos' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#003b70' }}>Ảnh Before / After ({photos.length})</h3>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setShowPhotoModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Camera size={16} /> Quản lý & So sánh Before/After
                </button>
              </div>

              {photos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Camera size={36} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
                  <p style={{ color: '#64748b', margin: 0 }}>Chưa có ảnh tiến độ Before / After.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
                  {photos.map((item) => (
                    <div key={item._id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ height: '180px', background: '#000', position: 'relative' }}>
                        <img src={item.photoUrl} alt={item.stage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', top: '6px', left: '6px', background: item.stage === 'BEFORE' ? '#e0f2fe' : item.stage === 'AFTER' ? '#dcfce7' : '#f3e8ff', color: item.stage === 'BEFORE' ? '#0369a1' : item.stage === 'AFTER' ? '#15803d' : '#7c3aed', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                          {item.stage}
                        </span>
                      </div>
                      <div style={{ padding: '8px 10px', fontSize: '0.8rem', color: '#64748b' }}>
                        <div>{item.takenDate ? new Date(item.takenDate).toLocaleDateString('vi-VN') : ''}</div>
                        {item.weight && <strong style={{ color: '#0f172a' }}>{item.weight} kg</strong>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: WORKOUTS */}
          {activeTab === 'workouts' && (
            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 700, color: '#003b70' }}>Lịch sử tập luyện ({sessions.length} buổi)</h3>
              {sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Dumbbell size={36} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
                  <p style={{ color: '#64748b', margin: 0 }}>Chưa có buổi tập nào được check-in.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {sessions.map((s, idx) => (
                    <div key={s._id || idx} style={{ background: '#fff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#003b70', fontSize: '0.95rem' }}>{s.planSnapshot?.title || `Buổi tập #${s.sessionIndex + 1 || idx + 1}`}</strong>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                          Ngày tập: {s.performedAt ? new Date(s.performedAt).toLocaleDateString('vi-VN') : '—'}
                          {s.notes && ` • Ghi chú: ${s.notes}`}
                        </div>
                      </div>
                      <StatusBadge status={s.attendance || 'COMPLETED'} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: INBODY */}
          {activeTab === 'inbody' && (
            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 700, color: '#003b70' }}>Lịch sử đo InBody & Chỉ số ({inbodies.length})</h3>
              {inbodies.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Ruler size={36} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
                  <p style={{ color: '#64748b', margin: 0 }}>Chưa có bản ghi InBody nào.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                  {inbodies.map((record) => (
                    <div key={record._id} style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <strong style={{ color: '#003b70' }}>
                          {record.measurementDate ? new Date(record.measurementDate).toLocaleDateString('vi-VN') : '—'}
                        </strong>
                        <StatusBadge status={record.status} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.86rem', color: '#475569' }}>
                        <div>Cân nặng: <strong>{record.weight} kg</strong></div>
                        <div>% Mỡ (BodyFat): <strong>{record.bodyFatPercentage}%</strong></div>
                        <div>Khối lượng cơ: <strong>{record.muscleMass} kg</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sub-modals */}
      <PtPackageManagerModal
        open={showPackageModal}
        customer={detail || customer}
        onClose={() => {
          setShowPackageModal(false);
          loadAll();
        }}
      />

      <CustomerConsultationModal
        open={showConsultationModal}
        customer={detail || customer}
        onClose={() => {
          setShowConsultationModal(false);
          loadAll();
        }}
      />

      <CustomerPhotoModal
        open={showPhotoModal}
        customer={detail || customer}
        onClose={() => {
          setShowPhotoModal(false);
          loadAll();
        }}
      />
    </div>
  );
}
