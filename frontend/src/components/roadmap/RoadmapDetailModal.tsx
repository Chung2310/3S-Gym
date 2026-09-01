import {
  Edit3,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import RoadmapDetailView from './RoadmapDetailView';
import type { Roadmap, Customer } from '../../types';

interface RoadmapDetailModalProps {
  open: boolean;
  roadmap: Roadmap | null;
  customer?: Customer | null;
  onClose: () => void;
  onEdit?: (roadmap: Roadmap) => void;
  onTogglePublish?: (roadmap: Roadmap) => void;
}

export default function RoadmapDetailModal({
  open,
  roadmap,
  customer,
  onClose,
  onEdit,
  onTogglePublish,
}: RoadmapDetailModalProps) {
  if (!open || !roadmap) return null;

  const customerName = customer?.fullName || 'Học viên';
  const customerPhone = customer?.phone || '';

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="roadmap-detail-title"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              <Sparkles size={20} color="#38bdf8" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <StatusBadge status={roadmap.status} />
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    color: '#475569',
                  }}
                >
                  v{roadmap.version || 1}
                </span>
                <span
                  style={{
                    fontSize: '0.78rem',
                    background: '#f0fdf4',
                    color: '#166534',
                    border: '1px solid #bbf7d0',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <User size={12} color="#16a34a" /> {customerName} {customerPhone ? `(${customerPhone})` : ''}
                </span>
              </div>
              <h2
                id="roadmap-detail-title"
                style={{
                  margin: '4px 0 0',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--primary-color)',
                  wordBreak: 'break-word',
                }}
              >
                {roadmap.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Đóng modal chi tiết"
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#64748b',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto' }}>
          <RoadmapDetailView roadmap={roadmap} />
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <button type="button" className="button button-secondary" onClick={onClose} style={{ fontSize: '0.85rem' }}>
            Đóng
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {onTogglePublish && (
              <button
                type="button"
                className={`button ${roadmap.status === 'PUBLISHED' ? 'button-secondary' : 'button-primary'}`}
                onClick={() => onTogglePublish(roadmap)}
                style={{ fontSize: '0.85rem' }}
              >
                {roadmap.status === 'PUBLISHED' ? 'Gỡ công bố' : 'Công bố roadmap'}
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => onEdit(roadmap)}
                style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit3 size={14} /> Chỉnh sửa
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
