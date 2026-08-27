import { useState, type FormEvent } from 'react';
import FormModal from '../ui/FormModal';
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

  return <FormModal open={open} title="Quét phiếu InBody" description="Ảnh chỉ được gửi tới endpoint OCR và kết quả phải được PT kiểm tra." dirty={Boolean(customerId || measurementDate || image)} loading={loading} submitLabel="Quét InBody" onClose={onClose} onSubmit={scan}>
    {!draft ? <div className="form-grid">
      <label className="field"><span>Mã khách hàng</span><input aria-label="Mã khách hàng" value={customerId} onChange={(event) => setCustomerId(event.target.value)} required /></label>
      <label className="field"><span>Ngày đo</span><input aria-label="Ngày đo" type="date" value={measurementDate} onChange={(event) => setMeasurementDate(event.target.value)} required /></label>
      <label className="field"><span>Ảnh phiếu InBody</span><input aria-label="Ảnh phiếu InBody" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setImage(event.target.files?.[0] ?? null); setImageError(''); }} />{imageError && <span className="field-error" role="alert">{imageError}</span>}</label>
      {image && <p>Ảnh đã chọn: {image.name}</p>}
    </div> : <InBodyReviewForm draft={draft} onConfirmed={onConfirmed} />}
  </FormModal>;
}
