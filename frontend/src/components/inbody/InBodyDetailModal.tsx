import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  Copy,
  Eye,
  EyeOff,
  Pencil,
  Phone,
  Sparkles,
  X,
} from 'lucide-react';
import { useToast } from '../ui/ToastProvider';
import { api } from '../../services/api';
import { errorMessage } from '../../types';
import type { CustomerGoalData, InBodyRecordData } from '../../types/inbody';
import { analyzeInBody } from '../../services/inbodyAnalytics';
import InBodyDetailView from './InBodyDetailView';

interface InBodyDetailModalProps {
  open: boolean;
  record: InBodyRecordData | null;
  previousRecord?: InBodyRecordData | null;
  historyRecords?: InBodyRecordData[];
  customerMeta?: { fullName?: string; gender?: string; height?: number; phone?: string };
  onClose: () => void;
  onEdit?: (record: InBodyRecordData) => void;
  onStatusChanged?: (updated: InBodyRecordData) => void;
}

export default function InBodyDetailModal({
  open,
  record,
  previousRecord,
  historyRecords,
  customerMeta,
  onClose,
  onEdit,
  onStatusChanged,
}: InBodyDetailModalProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [customerGoal, setCustomerGoal] = useState<CustomerGoalData | null>(null);

  useEffect(() => {
    if (!open || !record) {
      setCustomerGoal(null);
      return;
    }
    const cId =
      typeof record.customerId === 'object' && record.customerId !== null
        ? record.customerId._id
        : String(record.customerId || '');
    if (!cId) return;

    api
      .get<CustomerGoalData[]>(`/api/goals?customerId=${cId}&limit=1`)
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setCustomerGoal(res.data[0]);
        } else {
          setCustomerGoal(null);
        }
      })
      .catch(() => setCustomerGoal(null));
  }, [open, record]);

  const analysis = useMemo(() => {
    if (!record) return null;
    return analyzeInBody(record, previousRecord, customerMeta, customerGoal);
  }, [record, previousRecord, customerMeta, customerGoal]);

  if (!open || !record || !analysis) return null;

  const customerName =
    customerMeta?.fullName ||
    (typeof record.customerId === 'object' && record.customerId?.fullName) ||
    'Học viên';
  const customerPhone =
    customerMeta?.phone ||
    (typeof record.customerId === 'object' && record.customerId?.phone) ||
    '';
  const isPublished = record.status === 'PUBLISHED';

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(analysis.quickMessage);
      setCopied(true);
      toast.success('Đã sao chép kịch bản tư vấn InBody vào clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Không thể sao chép tự động. Vui lòng chọn và sao chép thủ công.');
    }
  };

  const handleTogglePublish = async () => {
    setToggling(true);
    const isPublishing = record.status !== 'PUBLISHED';
    try {
      const endpoint = isPublishing ? `/api/inbody/${record._id}/publish` : `/api/inbody/${record._id}/unpublish`;
      const res = await api.patch<InBodyRecordData>(endpoint, {});
      toast.success(res.message || (isPublishing ? 'Đã công bố InBody cho học viên!' : 'Đã chuyển về bản nháp!'));
      const updated: InBodyRecordData = {
        ...record,
        status: isPublishing ? 'PUBLISHED' : 'DRAFT',
        publishedAt: isPublishing ? new Date().toISOString() : null,
      };
      onStatusChanged?.(updated);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setToggling(false);
    }
  };



  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #003b70 0%, #0369a1 100%)',
            padding: '12px 20px',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2
                title={customerName}
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.2,
                  maxWidth: '320px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {customerName}
              </h2>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#e0f2fe',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={12} /> Phân Tích InBody & Tư Vấn PT
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: '#bae6fd', marginTop: '3px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> Ngày đo: {new Date(record.measurementDate).toLocaleDateString('vi-VN')}
              </span>
              {customerPhone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={12} /> {customerPhone}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleCopyMessage}
              style={{
                background: copied ? '#10b981' : 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
              title="Sao chép gợi ý tư vấn gửi khách qua Zalo/SMS"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              title="Đóng cửa sổ"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          <InBodyDetailView
            record={record}
            previousRecord={previousRecord}
            historyRecords={historyRecords}
            customerMeta={customerMeta}
            customerGoal={customerGoal}
          />
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            padding: '14px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onEdit && (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  onClose();
                  onEdit(record);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Pencil size={15} /> Sửa chỉ số
              </button>
            )}

            <button
              type="button"
              className={isPublished ? 'button button-secondary' : 'button button-primary'}
              onClick={handleTogglePublish}
              disabled={toggling}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
              {toggling ? 'Đang cập nhật...' : isPublished ? 'Thu hồi về bản nháp' : 'Công bố cho học viên'}
            </button>
          </div>

          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
            style={{ padding: '8px 18px', fontWeight: 600 }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
