import { useEffect, useMemo, useState } from 'react';
import {
  Coins,
  Gift,
  LoaderCircle,
  Mail,
  MinusCircle,
  Phone,
  PlusCircle,
  Search,
  Shield,
  Sparkles,
  User as UserIcon,
  X,
  Zap,
} from 'lucide-react';
import ConfirmModal from '../ui/ConfirmModal';
import { useToast } from '../ui/ToastProvider';
import { api } from '../../services/api';
import { creditsService } from '../../services/credits';
import { errorMessage } from '../../types';

export interface TargetCreditUser {
  id?: string;
  _id?: string;
  fullName?: string;
  username?: string;
  role?: string;
  phone?: string;
  email?: string;
  availableCredits?: number;
  reservedCredits?: number;
}

interface CreditAdjustmentModalProps {
  open?: boolean;
  onClose?: () => void;
  targetUser?: TargetCreditUser | null;
  mode?: 'GRANT' | 'DEDUCT';
  onSubmit?: (input: { userId: string; credits: number; reason: string }) => Promise<void>;
  onSuccess?: () => void;
  triggerButton?: React.ReactNode;
}

const PRESET_AMOUNTS = [10, 20, 50, 100, 200, 500, 1000];

const GRANT_REASON_SUGGESTIONS = [
  '🎁 Khuyến mãi chào mừng hội viên mới',
  '🏆 Thưởng đạt mục tiêu InBody xuất sắc',
  '💎 Tặng theo gói Hội viên VIP',
  '⚡ Cấp credit trải nghiệm Trợ lý AI 3S',
  '🛠️ Bù credit do lỗi hệ thống',
];

const DEDUCT_REASON_SUGGESTIONS = [
  '🔻 Thu hồi credit cấp nhầm',
  '🔻 Khấu trừ theo yêu cầu khách hàng',
  '🔻 Điều chỉnh giảm số dư credit',
  '🔻 Hết hạn thời gian khuyến mãi',
];

export default function CreditAdjustmentModal({
  open: controlledOpen,
  onClose: controlledOnClose,
  targetUser,
  mode = 'GRANT',
  onSubmit,
  onSuccess,
  triggerButton,
}: CreditAdjustmentModalProps) {
  const toast = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof controlledOpen === 'boolean';
  const open = isControlled ? controlledOpen : internalOpen;

  const [isDeduct, setIsDeduct] = useState(mode === 'DEDUCT');
  const [selectedUser, setSelectedUser] = useState<TargetCreditUser | null>(targetUser || null);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<TargetCreditUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [rawAmount, setRawAmount] = useState<string>('50');
  const [reason, setReason] = useState<string>(
    mode === 'DEDUCT' ? '🔻 Thu hồi credit cấp nhầm' : '⚡ Cấp credit trải nghiệm Trợ lý AI 3S'
  );
  const [loading, setLoading] = useState(false);

  // Sync selected user when targetUser prop or mode changes
  useEffect(() => {
    if (targetUser) {
      setSelectedUser(targetUser);
    }
  }, [targetUser]);

  useEffect(() => {
    setIsDeduct(mode === 'DEDUCT');
    setReason(
      mode === 'DEDUCT'
        ? '🔻 Thu hồi credit cấp nhầm'
        : '⚡ Cấp credit trải nghiệm Trợ lý AI 3S'
    );
  }, [mode, open]);

  // Debounced search for users
  useEffect(() => {
    if (!open || selectedUser || !userSearch.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get<TargetCreditUser[]>(
          `/api/users?keyword=${encodeURIComponent(userSearch.trim())}&limit=8`
        );
        setSearchResults(res.data || []);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearch, open, selectedUser]);

  const handleClose = () => {
    if (isControlled) {
      controlledOnClose?.();
    } else {
      setInternalOpen(false);
    }
    if (!targetUser) {
      setSelectedUser(null);
      setUserSearch('');
    }
  };

  const handleOpen = () => {
    if (targetUser) {
      setSelectedUser(targetUser);
    }
    if (!isControlled) {
      setInternalOpen(true);
    }
  };

  const userId = selectedUser?._id || selectedUser?.id || '';
  const parsedAmt = Math.abs(Number(rawAmount) || 0);
  const numCredits = isDeduct ? -parsedAmt : parsedAmt;
  const validCredits = Number.isInteger(parsedAmt) && parsedAmt > 0;
  const validReason = reason.trim().length >= 3;
  const valid = Boolean(userId) && validCredits && validReason;

  const handleConfirm = async () => {
    if (!valid) return;
    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit({
          userId,
          credits: numCredits,
          reason: reason.trim(),
        });
      } else {
        await creditsService.adjust({
          userId,
          credits: numCredits,
          reason: reason.trim(),
        });
        toast.success(
          `Đã ${numCredits > 0 ? 'cấp' : 'khấu trừ'} ${Math.abs(numCredits)} credit cho tài khoản ${selectedUser?.fullName || selectedUser?.username} thành công!`
        );
      }
      onSuccess?.();
      handleClose();
      setRawAmount('50');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'PT':
        return 'Huấn luyện viên PT';
      case 'CUSTOMER':
        return 'Hội viên';
      default:
        return 'Người dùng';
    }
  };

  return (
    <>
      {!isControlled && (
        triggerButton ? (
          <span onClick={handleOpen}>{triggerButton}</span>
        ) : (
          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-sky-600 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs sm:text-sm transition-colors shadow-2xs cursor-pointer"
          >
            <Coins size={15} />
            <span>Cấp credit cho tài khoản</span>
          </button>
        )
      )}

      <ConfirmModal
        open={open}
        title={isDeduct ? 'Khấu trừ Credit tài khoản' : 'Cấp Credit cho tài khoản'}
        description="Số credit được cập nhật trực tiếp vào số dư ví người dùng và lưu vào lịch sử đối soát (Audit Ledger)."
        confirmLabel={
          loading
            ? 'Đang thực hiện...'
            : isDeduct
            ? `Khấu trừ -${parsedAmt || 0} Credit`
            : `Cấp +${parsedAmt || 0} Credit`
        }
        danger={isDeduct}
        loading={loading}
        onClose={handleClose}
        onConfirm={handleConfirm}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14, textAlign: 'left' }}>
          {/* Chọn Loại thao tác: Cấp (+) hoặc Trừ (-) */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setIsDeduct(false);
                setReason('⚡ Cấp credit trải nghiệm Trợ lý AI 3S');
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 10,
                border: !isDeduct ? '2px solid #0284c7' : '1px solid #cbd5e1',
                background: !isDeduct ? '#f0f9ff' : '#ffffff',
                color: !isDeduct ? '#0369a1' : '#64748b',
                fontWeight: 750,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <PlusCircle size={15} />
              <span>Cấp thêm credit (+)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsDeduct(true);
                setReason('🔻 Thu hồi credit cấp nhầm');
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 10,
                border: isDeduct ? '2px solid #e11d48' : '1px solid #cbd5e1',
                background: isDeduct ? '#fff1f2' : '#ffffff',
                color: isDeduct ? '#be123c' : '#64748b',
                fontWeight: 750,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <MinusCircle size={15} />
              <span>Trừ credit (-)</span>
            </button>
          </div>

          {/* 1. Chọn tài khoản người nhận */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 750, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Tài khoản thao tác <span style={{ color: '#e11d48' }}>*</span>
            </label>

            {selectedUser ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 14px',
                  background: isDeduct ? '#fff1f2' : '#f0f9ff',
                  border: isDeduct ? '1.5px solid #fecdd3' : '1.5px solid #bae6fd',
                  borderRadius: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: isDeduct ? '#e11d48' : '#0284c7',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 750,
                      fontSize: '0.88rem',
                      flexShrink: 0,
                    }}
                  >
                    {selectedUser.fullName
                      ? selectedUser.fullName.charAt(0).toUpperCase()
                      : (selectedUser.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 750, color: '#003b70', fontSize: '0.88rem' }}>
                      {selectedUser.fullName || selectedUser.username}
                      <span style={{ marginLeft: 6, fontSize: '0.72rem', color: '#0369a1', background: '#e0f2fe', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>
                        {roleLabel(selectedUser.role)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      @{selectedUser.username} {selectedUser.phone ? `· ${selectedUser.phone}` : ''}
                      {selectedUser.availableCredits !== undefined && (
                        <span style={{ marginLeft: 6, color: '#0284c7', fontWeight: 700 }}>
                          (Số dư hiện tại: {selectedUser.availableCredits} credit)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!targetUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setUserSearch('');
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                    title="Chọn tài khoản khác"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={15}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Tìm theo họ tên, @username, SĐT hoặc email..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 36px',
                      borderRadius: 10,
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.84rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {searching && (
                    <LoaderCircle
                      size={15}
                      className="animate-spin"
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#0284c7',
                      }}
                    />
                  )}
                </div>

                {/* Dropdown search results */}
                {showDropdown && searchResults.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: 4,
                      background: '#ffffff',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      maxHeight: 220,
                      overflowY: 'auto',
                      zIndex: 50,
                    }}
                  >
                    {searchResults.map((u) => (
                      <div
                        key={u._id || u.id}
                        onClick={() => {
                          setSelectedUser(u);
                          setShowDropdown(false);
                          setUserSearch('');
                        }}
                        style={{
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: '#e0f2fe',
                              color: '#0284c7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 750,
                              fontSize: '0.76rem',
                            }}
                          >
                            {(u.fullName || u.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}>
                              {u.fullName || u.username}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              @{u.username} {u.phone ? `· ${u.phone}` : ''}
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: 6,
                            background: '#f1f5f9',
                            color: '#475569',
                            fontWeight: 700,
                          }}
                        >
                          {roleLabel(u.role)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Số lượng Credit */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 750, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Số credit {isDeduct ? 'khấu trừ' : 'cấp'} <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <span style={{ fontSize: '0.74rem', color: isDeduct ? '#be123c' : '#0369a1', fontWeight: 600 }}>
                Quy đổi: {(parsedAmt * 1000).toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                min="1"
                placeholder="Ví dụ: 50, 100, 500"
                value={rawAmount}
                onChange={(e) => setRawAmount(e.target.value)}
                style={{
                  flex: 1,
                  height: 40,
                  padding: '0 14px',
                  borderRadius: 10,
                  border: isDeduct ? '1.5px solid #fecdd3' : '1.5px solid #cbd5e1',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: isDeduct ? '#e11d48' : '#0284c7',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'Montserrat, sans-serif',
                }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 750, color: '#64748b' }}>credit</span>
            </div>

            {/* Quick preset chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setRawAmount(String(amt))}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 8,
                    border: Number(rawAmount) === amt ? (isDeduct ? '1.5px solid #e11d48' : '1.5px solid #0284c7') : '1px solid #e2e8f0',
                    background: Number(rawAmount) === amt ? (isDeduct ? '#fff1f2' : '#e0f2fe') : '#ffffff',
                    color: Number(rawAmount) === amt ? (isDeduct ? '#be123c' : '#0369a1') : '#475569',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isDeduct ? `-${amt}` : `+${amt}`}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Lý do thao tác */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 750, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Lý do (Bắt buộc) <span style={{ color: '#e11d48' }}>*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Nhập lý do cụ thể (tối thiểu 3 ký tự)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 10,
                border: '1.5px solid #cbd5e1',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'none',
              }}
            />

            {/* Gợi ý lý do */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
              {(isDeduct ? DEDUCT_REASON_SUGGESTIONS : GRANT_REASON_SUGGESTIONS).map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setReason(sug)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {!valid && (userId || rawAmount || reason) && (
            <p style={{ margin: 0, fontSize: '0.74rem', color: '#e11d48', fontWeight: 600 }}>
              Vui lòng chọn tài khoản, nhập số credit lớn hơn 0 và lý do tối thiểu 3 ký tự.
            </p>
          )}
        </div>
      </ConfirmModal>
    </>
  );
}
