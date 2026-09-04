import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  RotateCcw,
  RefreshCw,
  Plus,
  ArrowRightLeft,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import ConfirmModal from '../ui/ConfirmModal';
import AdminCustomerTable from './AdminCustomerTable';
import AdminQuickTransferModal from './AdminQuickTransferModal';
import AdminCustomerFormModal from './AdminCustomerFormModal';
import { errorMessage } from '../../types';
import type { PaginationMeta } from '../../types';

export interface CustomerAdminRecord {
  _id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  dateOfBirth?: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  height?: number | null;
  initialWeight?: number | null;
  initialGoal?: string;
  medicalNotes?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LEAD';
  assignedPtId?: {
    _id: string;
    fullName?: string;
    username?: string;
    email?: string;
    phone?: string;
  } | string;
  userId?: {
    _id: string;
    username: string;
    email?: string;
    status: string;
  } | null;
  createdAt: string;
}

export interface PtOption {
  _id: string;
  fullName?: string;
  username: string;
  phone?: string;
}

export default function AdminCustomersView({ onOpenTransferTab }: { onOpenTransferTab?: () => void }) {
  const toast = useToast();

  const [customers, setCustomers] = useState<CustomerAdminRecord[]>([]);
  const [pts, setPts] = useState<PtOption[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ptFilter, setPtFilter] = useState('');

  // Modals state
  const [transferCustomer, setTransferCustomer] = useState<CustomerAdminRecord | null>(null);
  const [formCustomer, setFormCustomer] = useState<CustomerAdminRecord | null | undefined>(undefined);
  const [deleteCustomer, setDeleteCustomer] = useState<CustomerAdminRecord | null>(null);

  const loadPts = useCallback(async () => {
    try {
      const res = await api.get<PtOption[]>('/api/users?role=PT&limit=100');
      setPts(res.data || []);
    } catch {
      // Ignored
    }
  }, []);

  const loadCustomers = useCallback(
    async (page = 1, kw = keyword, st = statusFilter, pt = ptFilter) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: '15' });
        if (kw.trim()) params.set('keyword', kw.trim());
        if (st) params.set('status', st);
        if (pt) params.set('ptId', pt);

        const res = await api.get<{ customers: CustomerAdminRecord[]; meta: PaginationMeta }>(
          `/api/customers?${params.toString()}`
        );
        const data = res.data;
        if (Array.isArray(data)) {
          setCustomers(data);
          setMeta(res.meta || { page, totalPages: 1, total: data.length });
        } else if (data && Array.isArray(data.customers)) {
          setCustomers(data.customers);
          setMeta(data.meta || { page, totalPages: 1, total: data.customers.length });
        } else {
          setCustomers([]);
        }
      } catch (err) {
        toast.error(errorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [keyword, statusFilter, ptFilter, toast]
  );

  useEffect(() => {
    void loadPts();
    void loadCustomers(1, '', '', '');
  }, []);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    void loadCustomers(1, keyword, statusFilter, ptFilter);
  };

  const handlePtChange = (newPt: string) => {
    setPtFilter(newPt);
    void loadCustomers(1, keyword, statusFilter, newPt);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    void loadCustomers(1, keyword, newStatus, ptFilter);
  };

  const handleResetFilter = () => {
    setKeyword('');
    setStatusFilter('');
    setPtFilter('');
    void loadCustomers(1, '', '', '');
  };

  const handleDeleteCustomer = async () => {
    if (!deleteCustomer) return;
    try {
      await api.delete(`/api/customers/${deleteCustomer._id}`);
      toast.success('Đã xóa hồ sơ khách hàng.');
      setDeleteCustomer(null);
      void loadCustomers(meta.page, keyword, statusFilter, ptFilter);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#003b70', margin: 0 }}>
          Quản lý toàn bộ khách hàng
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onOpenTransferTab && (
            <button
              type="button"
              onClick={onOpenTransferTab}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#003b70',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <ArrowRightLeft size={15} />
              <span>Lịch sử điều chuyển</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setFormCustomer(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: 0,
              background: '#003b70',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 59, 112, 0.2)',
            }}
          >
            <Plus size={15} />
            <span>Thêm khách hàng</span>
          </button>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <form
          onSubmit={handleApplyFilter}
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', flex: 1 }}
        >
          <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Tìm theo họ tên, SĐT, email..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: '100%', height: '38px', padding: '0 12px 0 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <select
            value={ptFilter}
            onChange={(e) => handlePtChange(e.target.value)}
            style={{ height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff', color: '#1e293b', outline: 'none' }}
          >
            <option value="">Tất cả Huấn luyện viên</option>
            {pts.map((p) => (
              <option key={p._id} value={p._id}>
                PT: {p.fullName || p.username}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{ height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff', color: '#1e293b', outline: 'none' }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
            <option value="INACTIVE">Tạm ngưng (INACTIVE)</option>
            <option value="LEAD">Tiềm năng (LEAD)</option>
          </select>

          <button
            type="submit"
            style={{ height: '38px', padding: '0 14px', borderRadius: '8px', border: 0, background: '#0284c7', color: '#ffffff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Tìm kiếm
          </button>

          {(Boolean(keyword.trim() || statusFilter || ptFilter)) && (
            <button
              type="button"
              onClick={handleResetFilter}
              style={{ height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <RotateCcw size={13} />
              <span>Xóa lọc</span>
            </button>
          )}
        </form>

        <button
          type="button"
          onClick={() => void loadCustomers(meta.page, keyword, statusFilter, ptFilter)}
          disabled={loading}
          style={{ height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#003b70', fontSize: '0.8rem', fontWeight: 650, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Tải lại</span>
        </button>
      </div>

      {/* Main Customers Table */}
      <AdminCustomerTable
        customers={customers}
        pts={pts}
        loading={loading}
        meta={meta}
        onPageChange={(page) => void loadCustomers(page, keyword, statusFilter, ptFilter)}
        onOpenTransfer={(c) => setTransferCustomer(c)}
        onOpenEdit={(c) => setFormCustomer(c)}
        onOpenDelete={(c) => setDeleteCustomer(c)}
      />

      {/* Modal Quick Transfer */}
      {transferCustomer && (
        <AdminQuickTransferModal
          customer={transferCustomer}
          pts={pts}
          onClose={() => setTransferCustomer(null)}
          onSuccess={() => void loadCustomers(meta.page, keyword, statusFilter, ptFilter)}
        />
      )}

      {/* Modal Form Create/Edit */}
      {formCustomer !== undefined && (
        <AdminCustomerFormModal
          customer={formCustomer}
          pts={pts}
          onClose={() => setFormCustomer(undefined)}
          onSuccess={() => void loadCustomers(meta.page, keyword, statusFilter, ptFilter)}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={Boolean(deleteCustomer)}
        title="Xác nhận xóa khách hàng"
        description={`Bạn có chắc chắn muốn xóa khách hàng "${deleteCustomer?.fullName}" khỏi hệ thống?`}
        confirmLabel="Xóa khách hàng"
        danger
        onConfirm={handleDeleteCustomer}
        onClose={() => setDeleteCustomer(null)}
      />
    </div>
  );
}
