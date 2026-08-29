import { useState } from 'react';
import {
  Award,
  Calendar,
  Camera,
  CheckCircle2,
  FileCheck,
  Flame,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import type { CustomerJourneyDto } from '../../types';

interface CustomerReportsPhotosProps {
  journey: CustomerJourneyDto;
}

const prKindLabels: Record<string, string> = {
  MAX_WEIGHT: 'Mức tạ cao nhất',
  MAX_REPS: 'Số reps cao nhất',
  MAX_SET_VOLUME: 'Volume set cao nhất',
  ESTIMATED_1RM: 'Estimated 1RM',
};

export default function CustomerReportsPhotos({ journey }: CustomerReportsPhotosProps) {
  const { reports = [], photos = [], analytics } = journey;
  const achievements = analytics?.achievements || [];

  // Selected photo for lightbox modal viewer
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  // Active filter tab: 'ALL' | 'PHOTOS' | 'REPORTS' | 'ACHIEVEMENTS'
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PHOTOS' | 'REPORTS' | 'ACHIEVEMENTS'>('ALL');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Top Summary Header ── */}
      <div
        style={{
          background: 'linear-gradient(90deg, #003b70 0%, #0369a1 100%)',
          borderRadius: '14px',
          padding: '16px 20px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={20} color="#38bdf8" />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#bae6fd', letterSpacing: '0.5px' }}>
              Nhật ký tiến độ & Thành tích
            </span>
            <h2 style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
              Tiến Độ Thể Chất & Báo Cáo Định Kỳ
            </h2>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '4px 6px',
            borderRadius: '10px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            style={{
              padding: '4px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: activeFilter === 'ALL' ? '#ffffff' : 'transparent',
              color: activeFilter === 'ALL' ? '#003b70' : 'rgba(255, 255, 255, 0.8)',
              transition: 'all 0.15s ease',
            }}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('PHOTOS')}
            style={{
              padding: '4px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: activeFilter === 'PHOTOS' ? '#ffffff' : 'transparent',
              color: activeFilter === 'PHOTOS' ? '#003b70' : 'rgba(255, 255, 255, 0.8)',
              transition: 'all 0.15s ease',
            }}
          >
            Ảnh ({photos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('REPORTS')}
            style={{
              padding: '4px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: activeFilter === 'REPORTS' ? '#ffffff' : 'transparent',
              color: activeFilter === 'REPORTS' ? '#003b70' : 'rgba(255, 255, 255, 0.8)',
              transition: 'all 0.15s ease',
            }}
          >
            Báo cáo ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ACHIEVEMENTS')}
            style={{
              padding: '4px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: activeFilter === 'ACHIEVEMENTS' ? '#ffffff' : 'transparent',
              color: activeFilter === 'ACHIEVEMENTS' ? '#003b70' : 'rgba(255, 255, 255, 0.8)',
              transition: 'all 0.15s ease',
            }}
          >
            Kỷ lục ({achievements.length})
          </button>
        </div>
      </div>

      {/* ── SECTION 1: PHOTO GALLERY ── */}
      {(activeFilter === 'ALL' || activeFilter === 'PHOTOS') && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#003b70', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={18} color="#0284c7" /> Bộ Sưu Tập Ảnh Tiến Độ Cơ Thể
            </h3>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
              {photos.length} ảnh lưu trữ
            </span>
          </div>

          {photos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {photos.map((photo) => {
                const photoUrl = String(photo.photoUrl || '');
                return (
                  <div
                    key={String(photo._id)}
                    onClick={() => setSelectedPhotoUrl(photoUrl)}
                    style={{
                      position: 'relative',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      aspectRatio: '3 / 4',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)';
                    }}
                  >
                    <img
                      src={photoUrl}
                      alt={`Ảnh tiến độ ${String(photo.stage || '')}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(15, 23, 42, 0.75) 0%, transparent 60%)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        right: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: '#ffffff',
                      }}
                    >
                      <span
                        style={{
                          background: 'rgba(2, 132, 199, 0.9)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {String(photo.stage || 'Tiến độ')}
                      </span>
                      {photo.takenDate && (
                        <span style={{ fontSize: '0.72rem', color: '#e2e8f0' }}>
                          {new Date(String(photo.takenDate)).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                Chưa có ảnh tiến độ lưu trong hồ sơ. Hãy cùng PT chụp ảnh định kỳ để thấy sự thay đổi vóc dáng nhé!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 2: PUBLISHED PROGRESS REPORTS ── */}
      {(activeFilter === 'ALL' || activeFilter === 'REPORTS') && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#003b70', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCheck size={18} color="#16a34a" /> Báo Cáo Tổng Kết Tiến Độ Từ Huấn Luyện Viên
            </h3>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
              {reports.length} báo cáo
            </span>
          </div>

          {reports.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {reports.map((report) => (
                <div
                  key={report._id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span
                        style={{
                          background: '#f0fdf4',
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 size={11} /> Đã công bố
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(report.periodStart).toLocaleDateString('vi-VN')} – {new Date(report.periodEnd).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 8px', fontSize: '0.94rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.45 }}>
                      {report.summary}
                    </h4>

                    {/* Metrics tags */}
                    {report.metrics && typeof report.metrics === 'object' && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                        {typeof (report.metrics as Record<string, unknown>).weightDelta === 'number' && (
                          <span style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                            Cân nặng: {(report.metrics as Record<string, number>).weightDelta > 0 ? '+' : ''}{(report.metrics as Record<string, number>).weightDelta} kg
                          </span>
                        )}
                        {typeof (report.metrics as Record<string, unknown>).totalVolume === 'number' && (
                          <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>
                            Volume: {(report.metrics as Record<string, number>).totalVolume.toLocaleString('vi-VN')} kg
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                    Tổng hợp & xác nhận bởi Huấn luyện viên phụ trách
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                Huấn luyện viên chưa công bố báo cáo tổng kết định kỳ. Báo cáo sẽ được gửi sau mỗi chu kỳ luyện tập!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 3: PERSONAL RECORDS (PRs) & ACHIEVEMENTS ── */}
      {(activeFilter === 'ALL' || activeFilter === 'ACHIEVEMENTS') && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#003b70', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="#d97706" /> Bảng Vàng Thành Tích & Kỷ Lục Cá Nhân (PRs)
            </h3>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
              {achievements.length} kỷ lục đã lập
            </span>
          </div>

          {achievements.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {achievements.map((item) => (
                <div
                  key={`${item.exerciseName}-${item.kind}`}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '14px 16px',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#d97706', letterSpacing: '0.5px' }}>
                    {prKindLabels[item.kind] || item.kind}
                  </span>
                  <h4 style={{ margin: '4px 0 6px', fontSize: '1rem', fontWeight: 800, color: '#003b70' }}>
                    {item.exerciseName}
                  </h4>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                    {item.value.toLocaleString('vi-VN')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                Chưa có kỷ lục cá nhân được ghi nhận. Hãy tiếp tục bứt phá trong các buổi tập sắp tới nhé!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Lightbox Modal for Photo Viewing ── */}
      {selectedPhotoUrl && (
        <div
          onClick={() => setSelectedPhotoUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedPhotoUrl(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 10,
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.6)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
            <img
              src={selectedPhotoUrl}
              alt="Ảnh tiến độ phóng to"
              style={{ maxHeight: '85vh', maxWidth: '85vw', objectFit: 'contain', display: 'block' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
