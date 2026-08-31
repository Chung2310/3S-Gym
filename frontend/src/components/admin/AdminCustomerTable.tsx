import {
  Users,
  RefreshCw,
  UserCheck,
  Phone,
  Mail,
  Target,
  ArrowRightLeft,
  Pencil,
  Trash2,
} from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import Pagination from '../ui/Pagination';
import type { PaginationMeta } from '../../types';
import type { CustomerAdminRecord, PtOption } from './AdminCustomersView';

interface AdminCustomerTableProps {
  customers: CustomerAdminRecord[];
  pts: PtOption[];
  loading: boolean;
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onOpenTransfer: (c: CustomerAdminRecord) => void;
  onOpenEdit: (c: CustomerAdminRecord) => void;
  onOpenDelete: (c: CustomerAdminRecord) => void;
}

export default function AdminCustomerTable({
  customers,
  pts,
  loading,
  meta,
  onPageChange,
  onOpenTransfer,
  onOpenEdit,
  onOpenDelete,
}: AdminCustomerTableProps) {
  const getPtName = (c: CustomerAdminRecord) => {
    if (!c.assignedPtId) return 'Chưa gán PT';
    if (typeof c.assignedPtId === 'object') {
      return c.assignedPtId.fullName || c.assignedPtId.username || 'PT';
    }
    const found = pts.find((p) => p._id === c.assignedPtId);
    return found ? found.fullName || found.username : 'PT phụ trách';
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0, 59, 112, 0.04)',
        overflow: 'hidden',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 16px', fontWeight: 750 }}>Khách hàng</th>
              <th style={{ padding: '12px 16px', fontWeight: 750 }}>PT Phụ Trách</th>
              <th style={{ padding: '12px 16px', fontWeight: 750 }}>Liên hệ</th>
              <th style={{ padding: '12px 16px', fontWeight: 750 }}>Mục tiêu & Thể trạng</th>
              <th style={{ padding: '12px 16px', fontWeight: 750 }}>Trạng thái</th>
              <th style={{ padding: '12px 16px', fontWeight: 750, textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && customers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#0284c7' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Đang tải danh sách khách hàng...</p>
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: '#64748b' }}>
                  <Users size={32} style={{ color: '#cbd5e1', margin: '0 auto 8px' }} />
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#1e293b' }}>Không tìm thấy khách hàng nào</p>
                  <p style={{ margin: 0, fontSize: '0.78rem' }}>Thử thay đổi bộ lọc hoặc thêm khách hàng mới.</p>
                </td>
              </tr>
            ) : (
              customers.map((c) => {
                const ptName = getPtName(c);
                return (
                  <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: '#e0f2fe',
                            color: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 750,
                            fontSize: '0.85rem',
                            flexShrink: 0,
                          }}
                        >
                          {c.fullName ? c.fullName.charAt(0).toUpperCase() : 'K'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 750, color: '#003b70' }}>{c.fullName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {c.gender === 'FEMALE' ? 'Nữ' : c.gender === 'MALE' ? 'Nam' : 'Khác'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '20px',
                          color: '#166534',
                          fontWeight: 700,
                          fontSize: '0.76rem',
                        }}
                      >
                        <UserCheck size={12} color="#16a34a" />
                        <span>{ptName}</span>
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={11} color="#64748b" />
                        <span>{c.phone}</span>
                      </div>
                      {c.email && (
                        <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Mail size={11} color="#94a3b8" />
                          <span>{c.email}</span>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#003b70', fontWeight: 650, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Target size={12} color="#0284c7" />
                        <span>{c.initialGoal || 'Cải thiện vóc dáng'}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        {c.height ? `${c.height} cm` : '—'} / {c.initialWeight ? `${c.initialWeight} kg` : '—'}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={c.status} />
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => onOpenTransfer(c)}
                          title="Điều chuyển sang PT khác"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #bae6fd',
                            background: '#f0f9ff',
                            color: '#0284c7',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <ArrowRightLeft size={12} />
                          <span>Chuyển PT</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenEdit(c)}
                          title="Chỉnh sửa hồ sơ"
                          style={{
                            padding: '5px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#475569',
                            cursor: 'pointer',
                          }}
                        >
                          <Pencil size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenDelete(c)}
                          title="Xóa khách hàng"
                          style={{
                            padding: '5px 8px',
                            borderRadius: '6px',
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#dc2626',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
