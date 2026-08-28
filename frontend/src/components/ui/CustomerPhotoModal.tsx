import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowRight, Calendar, Camera, Check, Image as ImageIcon, Plus, Sliders, Trash2, Upload, Weight, X, ZoomIn } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import FormField from './FormField';
import Pagination from './Pagination';
import { useToast } from './ToastProvider';
import { api } from '../../services/api';
import type { PaginationMeta } from '../../types';
import { errorMessage } from '../../types';

interface CustomerSummary { _id?: string; fullName?: string }
export interface ProgressPhotoItem {
  _id: string;
  customerId: string;
  ptId: string;
  photoUrl: string;
  takenDate: string;
  stage: 'BEFORE' | 'AFTER' | 'PROGRESS';
  angle: 'FRONT' | 'SIDE' | 'BACK' | 'OTHER';
  weight?: number | null;
  bodyFat?: number | null;
  notes?: string;
  createdAt?: string;
}

interface CustomerPhotoModalProps {
  open: boolean;
  customer: CustomerSummary | null;
  onClose: () => void;
}

const STAGE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  BEFORE: { label: 'Trước khi tập (Before)', color: '#0369a1', bg: '#e0f2fe' },
  AFTER: { label: 'Sau khi tập (After)', color: '#15803d', bg: '#dcfce7' },
  PROGRESS: { label: 'Tiến độ định kỳ', color: '#7c3aed', bg: '#f3e8ff' },
};

const ANGLE_LABELS: Record<string, string> = {
  FRONT: 'Chính diện',
  SIDE: 'Nghiêng',
  BACK: 'Phía sau',
  OTHER: 'Khác',
};

export default function CustomerPhotoModal({ open, customer, onClose }: CustomerPhotoModalProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'gallery' | 'compare'>('gallery');
  const [items, setItems] = useState<ProgressPhotoItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 0 });
  const [stageFilter, setStageFilter] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [deleting, setDeleting] = useState<ProgressPhotoItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [form, setForm] = useState({
    takenDate: new Date().toISOString().slice(0, 10),
    stage: 'BEFORE',
    angle: 'FRONT',
    weight: '',
    bodyFat: '',
    notes: '',
  });

  // Compare Mode State
  const [beforePhotoId, setBeforePhotoId] = useState('');
  const [afterPhotoId, setAfterPhotoId] = useState('');
  const [zoomPhoto, setZoomPhoto] = useState<ProgressPhotoItem | null>(null);

  const load = async (page = 1) => {
    if (!customer?._id) return;
    try {
      setLoading(true);
      const url = `/api/customers/${customer._id}/photos?page=${page}&limit=50${stageFilter ? `&stage=${stageFilter}` : ''}`;
      const result = await api.get<ProgressPhotoItem[]>(url);
      const loaded = result.data || [];
      setItems(loaded);
      setMeta(result.meta || { page, totalPages: 0 });

      // Auto-assign default before/after if available
      if (loaded.length > 0) {
        const befores = loaded.filter((p) => p.stage === 'BEFORE');
        const afters = loaded.filter((p) => p.stage === 'AFTER' || p.stage === 'PROGRESS');
        if (befores.length > 0 && !beforePhotoId) {
          setBeforePhotoId(befores[befores.length - 1]._id);
        } else if (!beforePhotoId) {
          setBeforePhotoId(loaded[loaded.length - 1]._id);
        }
        if (afters.length > 0 && !afterPhotoId) {
          setAfterPhotoId(afters[0]._id);
        } else if (!afterPhotoId && loaded.length > 1) {
          setAfterPhotoId(loaded[0]._id);
        }
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setShowUploadForm(false);
    setSelectedFile(null);
    setPreviewUrl('');
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer?._id, stageFilter]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customer?._id) return;
    if (!selectedFile && !previewUrl) {
      toast.error('Vui lòng chọn ảnh cần tải lên.');
      return;
    }
    try {
      setUploading(true);
      let photoUrl = previewUrl;
      if (selectedFile) {
        const uploadForm = new FormData();
        uploadForm.append('file', selectedFile);
        const uploadRes = await api.upload<{ url: string }>('/api/upload/image', uploadForm);
        photoUrl = uploadRes.data?.url || '';
      }

      if (!photoUrl) {
        throw new Error('Tải ảnh thất bại, vui lòng thử lại.');
      }

      const payload = {
        photoUrl,
        takenDate: form.takenDate,
        stage: form.stage,
        angle: form.angle,
        weight: form.weight ? Number(form.weight) : null,
        bodyFat: form.bodyFat ? Number(form.bodyFat) : null,
        notes: form.notes.trim(),
      };

      const result = await api.post(`/api/customers/${customer._id}/photos`, payload);
      toast.success(result.message);
      setShowUploadForm(false);
      setSelectedFile(null);
      setPreviewUrl('');
      setForm({
        takenDate: new Date().toISOString().slice(0, 10),
        stage: 'PROGRESS',
        angle: 'FRONT',
        weight: '',
        bodyFat: '',
        notes: '',
      });
      load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!customer?._id || !deleting) return;
    try {
      const result = await api.delete(`/api/customers/${customer._id}/photos/${deleting._id}`);
      toast.success(result.message);
      setDeleting(null);
      load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const selectedBefore = useMemo(() => items.find((i) => i._id === beforePhotoId), [items, beforePhotoId]);
  const selectedAfter = useMemo(() => items.find((i) => i._id === afterPhotoId), [items, afterPhotoId]);

  if (!open || !customer) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="photo-modal-title">
      <div className="modal-content" style={{ maxWidth: '960px', width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#ffffff', color: '#0f172a', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 38, 77, 0.45)' }}>
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div>
            <h2 id="photo-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#003b70', margin: 0 }}>
              Ảnh Before / After: {customer.fullName}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#475569' }}>
              Theo dõi sự thay đổi vóc dáng qua các giai đoạn và đối chiếu ảnh trực quan.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
              <button
                type="button"
                className={`button ${activeTab === 'gallery' ? 'button-primary' : 'button-ghost'}`}
                style={{ padding: '6px 14px', fontSize: '0.84rem' }}
                onClick={() => setActiveTab('gallery')}
              >
                <ImageIcon size={15} style={{ marginRight: '6px' }} /> Thư viện ảnh ({items.length})
              </button>
              <button
                type="button"
                className={`button ${activeTab === 'compare' ? 'button-primary' : 'button-ghost'}`}
                style={{ padding: '6px 14px', fontSize: '0.84rem' }}
                onClick={() => setActiveTab('compare')}
              >
                <Sliders size={15} style={{ marginRight: '6px' }} /> So sánh Before/After
              </button>
            </div>
            <button type="button" className="icon-button" onClick={onClose} aria-label="Đóng">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'gallery' && (
            <div>
              {/* Top Filter & Upload Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    className="filter-select"
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    style={{ minWidth: '160px' }}
                    aria-label="Lọc theo giai đoạn"
                  >
                    <option value="">Tất cả giai đoạn</option>
                    <option value="BEFORE">Trước khi tập (Before)</option>
                    <option value="AFTER">Sau khi tập (After)</option>
                    <option value="PROGRESS">Tiến độ định kỳ</option>
                  </select>
                </div>
                {!showUploadForm && (
                  <button type="button" className="button button-primary" onClick={() => setShowUploadForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> Tải ảnh mới
                  </button>
                )}
              </div>

              {/* Upload Form */}
              {showUploadForm && (
                <form
                  onSubmit={handleUploadSubmit}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '18px 20px',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#003b70' }}>Tải ảnh tiến độ học viên</h3>
                    <button type="button" className="icon-button" onClick={() => setShowUploadForm(false)}>
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
                    {/* Image Preview Box */}
                    <div>
                      <label
                        htmlFor="photoUploadInput"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '200px',
                          border: '2px dashed #94a3b8',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          background: previewUrl ? '#000' : '#ffffff',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {previewUrl ? (
                          <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ textAlign: 'center', padding: '12px', color: '#64748b' }}>
                            <Camera size={32} style={{ margin: '0 auto 8px', color: '#0284c7' }} />
                            <span style={{ fontSize: '0.84rem', fontWeight: 600, display: 'block' }}>Chọn hoặc kéo ảnh</span>
                            <small style={{ fontSize: '0.72rem' }}>PNG, JPG tối đa 10MB</small>
                          </div>
                        )}
                        <input
                          id="photoUploadInput"
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                          required={!previewUrl}
                        />
                      </label>
                    </div>

                    {/* Inputs */}
                    <div className="profile-form-grid" style={{ alignContent: 'start' }}>
                      <FormField
                        label="Giai đoạn"
                        name="stage"
                        as="select"
                        value={form.stage}
                        onChange={(e) => setForm({ ...form, stage: e.target.value })}
                        required
                      >
                        <option value="BEFORE">Trước khi tập (Before)</option>
                        <option value="AFTER">Sau khi tập (After)</option>
                        <option value="PROGRESS">Tiến độ định kỳ</option>
                      </FormField>

                      <FormField
                        label="Góc chụp"
                        name="angle"
                        as="select"
                        value={form.angle}
                        onChange={(e) => setForm({ ...form, angle: e.target.value })}
                      >
                        <option value="FRONT">Chính diện</option>
                        <option value="SIDE">Nghiêng</option>
                        <option value="BACK">Phía sau</option>
                        <option value="OTHER">Khác</option>
                      </FormField>

                      <FormField
                        label="Ngày chụp"
                        name="takenDate"
                        type="date"
                        value={form.takenDate}
                        onChange={(e) => setForm({ ...form, takenDate: e.target.value })}
                        required
                      />

                      <FormField
                        label="Cân nặng lúc chụp (kg)"
                        name="weight"
                        type="number"
                        step="0.1"
                        placeholder="Ví dụ: 72.5"
                        value={form.weight}
                        onChange={(e) => setForm({ ...form, weight: e.target.value })}
                      />

                      <FormField
                        label="Tỷ lệ mỡ BodyFat (%)"
                        name="bodyFat"
                        type="number"
                        step="0.1"
                        placeholder="Ví dụ: 19.5"
                        value={form.bodyFat}
                        onChange={(e) => setForm({ ...form, bodyFat: e.target.value })}
                      />

                      <div className="grid-full-width">
                        <FormField
                          label="Ghi chú về ảnh"
                          name="notes"
                          placeholder="Ví dụ: Chụp vào buổi sáng trước khi ăn, tuần tập thứ 8..."
                          value={form.notes}
                          onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                    <button type="button" className="button button-secondary" onClick={() => setShowUploadForm(false)}>
                      Hủy
                    </button>
                    <button type="submit" className="button button-primary" disabled={uploading}>
                      {uploading ? 'Đang tải lên...' : 'Lưu ảnh'}
                    </button>
                  </div>
                </form>
              )}

              {/* Photo Grid */}
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <ImageIcon size={40} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
                  <h4 style={{ margin: '0 0 6px', color: '#334155' }}>Chưa có ảnh tiến độ</h4>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b' }}>
                    Hãy tải lên ảnh Before và After để theo dõi kết quả thay đổi hình thể của học viên.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {items.map((item) => {
                    const badge = STAGE_LABELS[item.stage] || STAGE_LABELS.PROGRESS;
                    return (
                      <div
                        key={item._id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            height: '220px',
                            background: '#0f172a',
                            position: 'relative',
                            cursor: 'pointer',
                          }}
                          onClick={() => setZoomPhoto(item)}
                        >
                          <img
                            src={item.photoUrl}
                            alt={item.stage}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              top: '8px',
                              left: '8px',
                              background: badge.bg,
                              color: badge.color,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            {badge.label}
                          </span>
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '8px',
                              left: '8px',
                              background: 'rgba(0,0,0,0.65)',
                              color: '#ffffff',
                              fontSize: '0.72rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {ANGLE_LABELS[item.angle] || item.angle}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleting(item);
                            }}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: 'rgba(225,29,72,0.85)',
                              border: 'none',
                              color: '#ffffff',
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                            title="Xóa ảnh"
                            aria-label="Xóa ảnh"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div style={{ padding: '12px 14px', fontSize: '0.82rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} />
                              {item.takenDate ? new Date(item.takenDate).toLocaleDateString('vi-VN') : '—'}
                            </span>
                            {item.weight && (
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                {item.weight} kg {item.bodyFat ? `• ${item.bodyFat}%` : ''}
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'compare' && (
            <div>
              {/* Selectors Bar */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  marginBottom: '20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#0369a1', marginBottom: '6px' }}>
                    1. Chọn ảnh Trước (Before):
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={beforePhotoId}
                    onChange={(e) => setBeforePhotoId(e.target.value)}
                    aria-label="Chọn ảnh Before"
                  >
                    <option value="">-- Chọn ảnh Trước --</option>
                    {items.map((p) => (
                      <option key={p._id} value={p._id}>
                        {new Date(p.takenDate).toLocaleDateString('vi-VN')} ({STAGE_LABELS[p.stage]?.label || p.stage}) - {p.weight ? `${p.weight}kg` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#15803d', marginBottom: '6px' }}>
                    2. Chọn ảnh Sau (After):
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={afterPhotoId}
                    onChange={(e) => setAfterPhotoId(e.target.value)}
                    aria-label="Chọn ảnh After"
                  >
                    <option value="">-- Chọn ảnh Sau --</option>
                    {items.map((p) => (
                      <option key={p._id} value={p._id}>
                        {new Date(p.takenDate).toLocaleDateString('vi-VN')} ({STAGE_LABELS[p.stage]?.label || p.stage}) - {p.weight ? `${p.weight}kg` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Side-by-Side Comparison Container */}
              {selectedBefore && selectedAfter ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Delta Stats Badge */}
                  {(selectedBefore.weight || selectedAfter.weight) && (
                    <div
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '10px',
                        padding: '12px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        fontSize: '0.9rem',
                      }}
                    >
                      <div>
                        <span style={{ color: '#64748b' }}>Cân nặng Trước: </span>
                        <strong>{selectedBefore.weight ? `${selectedBefore.weight} kg` : '—'}</strong>
                      </div>
                      <ArrowRight size={16} style={{ color: '#16a34a' }} />
                      <div>
                        <span style={{ color: '#64748b' }}>Cân nặng Sau: </span>
                        <strong>{selectedAfter.weight ? `${selectedAfter.weight} kg` : '—'}</strong>
                      </div>
                      {selectedBefore.weight && selectedAfter.weight && (
                        <div style={{ background: '#16a34a', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontWeight: 700, fontSize: '0.84rem' }}>
                          Thay đổi: {(selectedAfter.weight - selectedBefore.weight).toFixed(1)} kg
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Before Card */}
                    <div style={{ border: '2px solid #0284c7', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
                      <div style={{ background: '#0284c7', color: '#fff', padding: '8px 14px', fontWeight: 700, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>TRƯỚC (BEFORE)</span>
                        <span>{new Date(selectedBefore.takenDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div style={{ height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={selectedBefore.photoUrl} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ background: '#ffffff', padding: '10px 14px', fontSize: '0.84rem' }}>
                        <div><strong>Chỉ số:</strong> {selectedBefore.weight ? `${selectedBefore.weight} kg` : ''} {selectedBefore.bodyFat ? `• ${selectedBefore.bodyFat}% Fat` : ''}</div>
                        {selectedBefore.notes && <div style={{ color: '#64748b', marginTop: '2px' }}>{selectedBefore.notes}</div>}
                      </div>
                    </div>

                    {/* After Card */}
                    <div style={{ border: '2px solid #16a34a', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
                      <div style={{ background: '#16a34a', color: '#fff', padding: '8px 14px', fontWeight: 700, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>SAU (AFTER)</span>
                        <span>{new Date(selectedAfter.takenDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div style={{ height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={selectedAfter.photoUrl} alt="After" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ background: '#ffffff', padding: '10px 14px', fontSize: '0.84rem' }}>
                        <div><strong>Chỉ số:</strong> {selectedAfter.weight ? `${selectedAfter.weight} kg` : ''} {selectedAfter.bodyFat ? `• ${selectedAfter.bodyFat}% Fat` : ''}</div>
                        {selectedAfter.notes && <div style={{ color: '#64748b', marginTop: '2px' }}>{selectedAfter.notes}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Sliders size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
                  <h4 style={{ margin: '0 0 6px', color: '#334155' }}>Vui lòng chọn 2 ảnh để so sánh</h4>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b' }}>
                    Chọn 1 ảnh ở giai đoạn Trước (Before) và 1 ảnh ở giai đoạn Sau (After) để thấy sự khác biệt.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Zoom Modal */}
      {zoomPhoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setZoomPhoto(null)}
        >
          <img src={zoomPhoto.photoUrl} alt="Zoom" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        open={Boolean(deleting)}
        title="Xóa ảnh tiến độ"
        description="Bạn có chắc chắn muốn xóa ảnh này? Dữ liệu đã xóa không thể khôi phục."
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
