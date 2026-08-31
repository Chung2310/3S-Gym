import { useEffect, useState } from 'react';
import { ArrowRightLeft, RefreshCw, User, Sparkles, Check, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { errorMessage } from '../../types';
import type { CustomerOption, PtOption } from './AdminTransfersView';

interface AdminTransferDirectFormProps {
  customers: CustomerOption[];
  pts: PtOption[];
  preSelectedCustomerId?: string;
  onSuccess: () => void;
}

const QUICK_REASONS = [
  'Đổi ca tập theo nguyện vọng học viên',
  'PT cũ nghỉ phép / chuyển cơ sở',
  'Điều phối lại khối lượng công việc giữa các PT',
  'Học viên yêu cầu đổi Huấn luyện viên mới',
];

export default function AdminTransferDirectForm({
  customers,
  pts,
  preSelectedCustomerId,
  onSuccess,
}: AdminTransferDirectFormProps) {
  const toast = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState(preSelectedCustomerId || '');
  const [selectedToPtId, setSelectedToPtId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchCustomerText, setSearchCustomerText] = useState('');

  useEffect(() => {
    if (preSelectedCustomerId) {
      setSelectedCustomerId(preSelectedCustomerId);
    }
  }, [preSelectedCustomerId]);

  const selectedCustomer = customers.find((c) => c._id === selectedCustomerId);

  const getSelectedCustomerPtName = () => {
    if (!selectedCustomer?.assignedPtId) return 'Chưa có PT phụ trách';
    if (typeof selectedCustomer.assignedPtId === 'object') {
      return selectedCustomer.assignedPtId.fullName || selectedCustomer.assignedPtId.username || 'PT';
    }
    const found = pts.find((p) => p._id === selectedCustomer.assignedPtId);
    return found ? found.fullName || found.username : 'PT hiện tại';
  };

  const getSelectedCustomerPtId = (): string => {
    if (!selectedCustomer?.assignedPtId) return '';
    if (typeof selectedCustomer.assignedPtId === 'object') return selectedCustomer.assignedPtId._id;
    return String(selectedCustomer.assignedPtId);
  };

  // Lọc danh sách khách hàng theo ô tìm kiếm
  const filteredCustomers = customers.filter((c) => {
    if (!searchCustomerText.trim()) return true;
    const term = searchCustomerText.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term))
    );
  });

  const availablePts = pts.filter((p) => String(p._id) !== String(getSelectedCustomerPtId()));

  const handleDirectTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('Vui lòng chọn khách hàng cần điều chuyển.');
      return;
    }
    if (!selectedToPtId) {
      toast.error('Vui lòng chọn Huấn luyện viên (PT) tiếp nhận.');
      return;
    }
    if (!transferReason.trim()) {
      toast.error('Vui lòng nhập lý do điều chuyển.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/transfers/admin-force', {
        customerId: selectedCustomerId,
        toPtId: selectedToPtId,
        reason: transferReason.trim(),
      });

      toast.success(`Đã điều chuyển học viên ${selectedCustomer?.fullName || ''} thành công!`);
      setSelectedCustomerId('');
      setSelectedToPtId('');
      setTransferReason('');
      setSearchCustomerText('');
      onSuccess();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(0, 59, 112, 0.06)',
        padding: '20px 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#003b70',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ArrowRightLeft size={18} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 750, color: '#003b70' }}>
            Tạo lệnh điều chuyển trực tiếp (Admin Force)
          </h3>
          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
            Quyền Quản trị viên cho phép đổi Huấn luyện viên phụ trách ngay lập tức và lưu nhật ký hệ thống.
          </span>
        </div>
      </div>

      <form onSubmit={handleDirectTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* 1. Chọn khách hàng */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              1. Chọn Khách hàng cần chuyển <span style={{ color: '#dc2626' }}>*</span>
            </label>

            {customers.length > 8 && (
              <input
                type="text"
                placeholder="Gõ tên hoặc SĐT để lọc nhanh..."
                value={searchCustomerText}
                onChange={(e) => setSearchCustomerText(e.target.value)}
                style={{
                  width: '100%',
                  height: '34px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.78rem',
                  marginBottom: '6px',
                  boxSizing: 'border-box',
                }}
              />
            )}

            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setSelectedToPtId('');
              }}
              required
              style={{
                width: '100%',
                height: '42px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.84rem',
                background: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">-- Bấm chọn khách hàng ({filteredCustomers.length} khách) --</option>
              {filteredCustomers.map((c) => {
                const ptName =
                  typeof c.assignedPtId === 'object' && c.assignedPtId
                    ? c.assignedPtId.fullName || c.assignedPtId.username
                    : 'Chưa có PT';
                return (
                  <option key={c._id} value={c._id}>
                    {c.fullName} ({c.phone}) — [PT: {ptName}]
                  </option>
                );
              })}
            </select>

            {/* Thông tin PT hiện tại của học viên */}
            {selectedCustomer && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  color: '#0369a1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <User size={14} color="#0284c7" />
                <span>
                  Học viên: <strong>{selectedCustomer.fullName}</strong> | PT hiện tại:{' '}
                  <strong>{getSelectedCustomerPtName()}</strong>
                </span>
              </div>
            )}
          </div>

          {/* 2. Chọn PT nhận mới */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              2. Chọn Huấn luyện viên (PT) tiếp nhận <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              value={selectedToPtId}
              onChange={(e) => setSelectedToPtId(e.target.value)}
              required
              style={{
                width: '100%',
                height: '42px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.84rem',
                background: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">-- Chọn PT nhận bàn giao ({availablePts.length} PT) --</option>
              {availablePts.map((p) => (
                <option key={p._id} value={p._id}>
                  PT: {p.fullName || p.username} ({p.phone || 'Chưa có SĐT'})
                </option>
              ))}
            </select>

            {pts.length <= 1 && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertCircle size={14} />
                <span>Hệ thống cần ít nhất 2 Huấn luyện viên (PT) để thực hiện điều chuyển.</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Lý do điều chuyển */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
              3. Lý do điều chuyển khách hàng <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Chọn mẫu hoặc tự nhập</span>
          </div>

          {/* Gợi ý lý do nhanh */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTransferReason(r)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: transferReason === r ? '1px solid #003b70' : '1px solid #e2e8f0',
                  background: transferReason === r ? '#f0f9ff' : '#f8fafc',
                  color: transferReason === r ? '#003b70' : '#475569',
                  fontSize: '0.73rem',
                  fontWeight: transferReason === r ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {transferReason === r && <Check size={11} />}
                <span>{r}</span>
              </button>
            ))}
          </div>

          <input
            type="text"
            required
            placeholder="Nhập lý do điều chuyển học viên..."
            value={transferReason}
            onChange={(e) => setTransferReason(e.target.value)}
            style={{
              width: '100%',
              height: '40px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              fontSize: '0.82rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Submit Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
          <button
            type="submit"
            disabled={submitting || !selectedCustomerId || !selectedToPtId || !transferReason.trim()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: '8px',
              border: 0,
              background: !selectedCustomerId || !selectedToPtId || !transferReason.trim() ? '#94a3b8' : '#003b70',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 750,
              cursor: !selectedCustomerId || !selectedToPtId || !transferReason.trim() ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(0, 59, 112, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            {submitting ? <RefreshCw size={15} className="animate-spin" /> : <ArrowRightLeft size={15} />}
            <span>Xác nhận điều chuyển ngay</span>
          </button>
        </div>
      </form>
    </div>
  );
}
