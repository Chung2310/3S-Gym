import { useEffect, useMemo, useState } from 'react';
import {
  Coins,
  Gift,
  LoaderCircle,
  Mail,
  Phone,
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
}

interface CreditAdjustmentModalProps {
  open?: boolean;
  onClose?: () => void;
  targetUser?: TargetCreditUser | null;
  onSubmit?: (input: { userId: string; credits: number; reason: string }) => Promise<void>;
  onSuccess?: () => void;
  triggerButton?: React.ReactNode;
}

const PRESET_AMOUNTS = [20, 50, 100, 200, 500, 1000];

const REASON_SUGGESTIONS = [
  '🎁 Khuyến mãi chào mừng hội viên mới',
  '🏆 Thưởng đạt mục tiêu InBody xuất sắc',
  '💎 Tặng theo gói Hội viên VIP',
  '⚡ Cấp credit trải nghiệm Trợ lý AI 3S',
  '🛠️ Bù credit do lỗi hệ thống',
];

export default function CreditAdjustmentModal({
  open: controlledOpen,
  onClose: controlledOnClose,
  targetUser,
  onSubmit,
  onSuccess,
  triggerButton,
}: CreditAdjustmentModalProps) {
  const toast = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof controlledOpen === 'boolean';
  const open = isControlled ? controlledOpen : internalOpen;

  const [selectedUser, setSelectedUser] = useState<TargetCreditUser | null>(targetUser || null);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<TargetCreditUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [credits, setCredits] = useState<string>('50');
  const [reason, setReason] = useState<string>('⚡ Cấp credit trải nghiệm Trợ lý AI 3S');
  const [loading, setLoading] = useState(false);

  // Sync selected user when targetUser prop changes
  useEffect(() => {
    if (targetUser) {
      setSelectedUser(targetUser);
    }
  }, [targetUser]);

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
    if (isControlled) {
      // controlled open
    } else {
      setInternalOpen(true);
    }
  };

  const userId = selectedUser?._id || selectedUser?.id || '';
  const numCredits = Number(credits);
  const validCredits = Number.isInteger(numCredits) && numCredits !== 0;
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
      setCredits('50');
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
        title="Cấp & Điều chỉnh Credit cho tài khoản"
        description="Số credit được cộng/trừ trực tiếp vào ví người dùng và lưu vào lịch sử đối soát (Audit Ledger)."
        confirmLabel={loading ? 'Đang thực hiện...' : numCredits >= 0 ? `Cấp +${numCredits || 0} Credit` : `Khấu trừ ${numCredits} Credit`}
        loading={loading}
        onClose={handleClose}
        onConfirm={handleConfirm}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14, textAlign: 'left' }}>
          {/* 1. Chọn tài khoản người nhận */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 750, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Tài khoản nhận credit <span style={{ color: '#e11d48' }}>*</span>
            </label>

            {selectedUser ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 14px',
                  background: '#f0f9ff',
                  border: '1.5px solid #bae6fd',
                  borderRadius: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: '#0284c7',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 750,
                      fontSize: '0.85rem',
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
                Số credit cấp / điều chỉnh <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <span style={{ fontSize: '0.74rem', color: '#0369a1', fontWeight: 600 }}>
                Quy đổi: {(Math.abs(numCredits || 0) * 1000).toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                placeholder="Ví dụ: 50, 100, 500"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                style={{
                  flex: 1,
                  height: 40,
                  padding: '0 14px',
                  borderRadius: 10,
                  border: '1.5px solid #cbd5e1',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: numCredits >= 0 ? '#0284c7' : '#e11d48',
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
                  onClick={() => setCredits(String(amt))}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 8,
                    border: Number(credits) === amt ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                    background: Number(credits) === amt ? '#e0f2fe' : '#ffffff',
                    color: Number(credits) === amt ? '#0369a1' : '#475569',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Lý do cấp credit */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 750, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Lý do cấp credit (Bắt buộc) <span style={{ color: '#e11d48' }}>*</span>
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
              {REASON_SUGGESTIONS.map((sug) => (
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

          {!valid && (userId || credits || reason) && (
            <p style={{ margin: 0, fontSize: '0.74rem', color: '#e11d48', fontWeight: 600 }}>
              Vui lòng chọn tài khoản nhận, nhập số credit khác 0 và lý do tối thiểu 3 ký tự.
            </p>
          )}
        </div>
      </ConfirmModal>
    </>
  );
}
