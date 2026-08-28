import { useState, type FormEvent } from 'react';
import FormModal from '../ui/FormModal';
import CustomerSelect from '../ui/CustomerSelect';
import { useToast } from '../ui/ToastProvider';
import { api } from '../../services/api';
import { errorMessage } from '../../types';
import InBodyReviewForm, { type InBodyOcrDraft } from './InBodyReviewForm';

interface InBodyScanModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmed: (draft: InBodyOcrDraft) => void;
}

export default function InBodyScanModal({ open, onClose, onConfirmed }: InBodyScanModalProps) {
  const toast = useToast();
  const [customerId, setCustomerId] = useState('');
  const [measurementDate, setMeasurementDate] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState('');
  const [draft, setDraft] = useState<InBodyOcrDraft | null>(null);
  const [loading, setLoading] = useState(false);

  const scan = async (event: FormEvent) => {
    event.preventDefault();
    if (!customerId) {
      toast.error('Vui lòng chọn học viên cần quét phiếu InBody.');
      return;
    }
    if (!image) {
      setImageError('Vui lòng chọn ảnh phiếu InBody.');
      return;
    }
    setImageError('');
    const body = new FormData();
    body.set('customerId', customerId);
    body.set('measurementDate', measurementDate);
    body.set('image', image);
    setLoading(true);
    try {
      const result = await api.upload<InBodyOcrDraft>('/api/inbody/ocr', body);
      setDraft(result.data);
      toast.info(result.message);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmed = (confirmedDraft: InBodyOcrDraft) => {
    setDraft(null);
    setCustomerId('');
    setMeasurementDate('');
    setImage(null);
    setImageError('');
    onConfirmed(confirmedDraft);
  };

  const handleClose = () => {
    setDraft(null);
    setImage(null);
    setImageError('');
    onClose();
  };

  return (
    <FormModal
      open={open}
      size="lg"
      title={draft ? 'Kiểm tra và Xác nhận chỉ số InBody' : 'Quét phiếu InBody'}
      description={
        draft
          ? 'Vui lòng đối chiếu và chỉnh sửa các chỉ số từ bản quét trước khi lưu.'
          : 'Ảnh chỉ được gửi tới endpoint OCR và kết quả phải được PT kiểm tra.'
      }
      dirty={Boolean(customerId || measurementDate || image || draft)}
      loading={loading}
      submitLabel={draft ? '' : 'Quét InBody'}
      onClose={handleClose}
      onSubmit={!draft ? scan : undefined}
    >
      {!draft ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minHeight: '340px', padding: '4px 0 24px' }}>
          {/* Full-width Customer Search & Selection */}
          <div style={{ width: '100%' }}>
            <CustomerSelect
              label="Học viên / Khách hàng"
              name="customerId"
              ariaLabel="Mã khách hàng"
              value={customerId}
              onChange={(selectedId) => setCustomerId(selectedId)}
              required
              placeholder="Tìm và chọn học viên (theo họ tên, số điện thoại hoặc mã)..."
            />
          </div>

          {/* 2-column Grid for Date and Image File */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
            <label className="field" style={{ margin: 0 }}>
              <span style={{ fontWeight: 600, color: '#003b70', fontSize: '0.88rem' }}>Ngày đo <strong style={{ color: '#e11d48' }}>*</strong></span>
              <input
                aria-label="Ngày đo"
                type="date"
                value={measurementDate}
                onChange={(event) => setMeasurementDate(event.target.value)}
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
              />
            </label>

            <label className="field" style={{ margin: 0 }}>
              <span style={{ fontWeight: 600, color: '#003b70', fontSize: '0.88rem' }}>Ảnh phiếu InBody <strong style={{ color: '#e11d48' }}>*</strong></span>
              <input
                aria-label="Ảnh phiếu InBody"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  setImage(event.target.files?.[0] ?? null);
                  setImageError('');
                }}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              />
              {imageError && (
                <span className="field-error" role="alert" style={{ color: '#e11d48', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                  {imageError}
                </span>
              )}
            </label>
          </div>

          {image && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '10px 14px',
                borderRadius: '8px',
                color: '#166534',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>📄 <strong>File đã chọn:</strong> {image.name}</span>
            </div>
          )}
        </div>
      ) : (
        <InBodyReviewForm draft={draft} onConfirmed={onConfirmed} />
      )}
    </FormModal>
  );
}
