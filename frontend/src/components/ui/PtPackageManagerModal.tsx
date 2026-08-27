import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import ConfirmModal from './ConfirmModal';
import FormField from './FormField';
import FormModal from './FormModal';
import Pagination from './Pagination';
import StatusBadge from './StatusBadge';
import { useToast } from './ToastProvider';
import { api } from '../../services/api';
import type { PaginationMeta } from '../../types';
import { errorMessage } from '../../types';

interface CustomerSummary { _id?: string; fullName?: string }
interface PtPackage { _id: string; name: string; totalSessions: number; remainingSessions: number; startDate: string; endDate: string; status: string }
interface PackageForm { name: string; totalSessions: string; startDate: string; endDate: string; status: string }
interface PtPackageManagerModalProps { open: boolean; customer: CustomerSummary | null; onClose: () => void }

const emptyForm = { name: '', totalSessions: '', startDate: '', endDate: '', status: 'ACTIVE' };
const dateValue = (value?: string): string => value ? new Date(value).toISOString().slice(0, 10) : '';

export default function PtPackageManagerModal({ open, customer, onClose }: PtPackageManagerModalProps) {
  const toast = useToast();
  const [items, setItems] = useState<PtPackage[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 0 });
  const [form, setForm] = useState<PackageForm>(emptyForm);
  const [editing, setEditing] = useState<PtPackage | null>(null);
  const [deleting, setDeleting] = useState<PtPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async (page = 1) => {
    if (!customer?._id) return;
    try {
      const result = await api.get<PtPackage[]>(`/api/customers/${customer._id}/packages?page=${page}&limit=20${statusFilter ? `&status=${statusFilter}` : ''}`);
      setItems(result.data || []);
      setMeta(result.meta || { page, totalPages: 0 });
    } catch (error) { toast.error(errorMessage(error)); }
  };

  useEffect(() => {
    if (!open) return;
    setEditing(null);
    setForm(emptyForm);
    setStatusFilter('');
    load();
    // The customer id identifies each modal session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer?._id]);

  const change = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const reset = () => { setEditing(null); setForm(emptyForm); };
  const edit = (item: PtPackage) => {
    setEditing(item);
    setForm({ name: item.name, totalSessions: String(item.totalSessions), startDate: dateValue(item.startDate), endDate: dateValue(item.endDate), status: item.status });
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true);
    try {
      const body = { ...form, totalSessions: Number(form.totalSessions) };
      if (!customer?._id) return;
      const result = editing ? await api.patch(`/api/customers/${customer._id}/packages/${editing._id}`, body) : await api.post(`/api/customers/${customer._id}/packages`, body);
      toast.success(result.message); reset(); await load(meta.page || 1);
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setLoading(false); }
  };
  const remove = async () => {
    if (!customer?._id || !deleting) return;
    setLoading(true);
    try {
      const result = await api.delete(`/api/customers/${customer._id}/packages/${deleting._id}`);
      toast.success(result.message); setDeleting(null); await load(meta.page || 1);
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setLoading(false); }
  };

  return <>
    <FormModal open={open} title={`Gói PT của ${customer?.fullName || 'khách hàng'}`} description="Tạo và quản lý số buổi tập của khách hàng." dirty={Boolean(form.name || form.totalSessions || form.startDate || form.endDate)} loading={loading} submitLabel={editing ? 'Lưu thay đổi' : 'Thêm gói PT'} onClose={onClose} onSubmit={submit}>
      <div className="form-grid">
        <FormField label="Tên gói" name="name" value={form.name} onChange={change} required />
        <FormField label="Tổng số buổi" name="totalSessions" type="number" min="1" value={form.totalSessions} onChange={change} required />
        <FormField label="Ngày bắt đầu" name="startDate" type="date" value={form.startDate} onChange={change} required />
        <FormField label="Ngày kết thúc" name="endDate" type="date" value={form.endDate} onChange={change} required />
        <FormField label="Trạng thái" name="status" as="select" value={form.status} onChange={change}><option value="ACTIVE">Đang hoạt động</option><option value="EXPIRED">Hết hạn</option><option value="COMPLETED">Hoàn thành</option><option value="CANCELLED">Đã hủy</option></FormField>
        {editing && <button type="button" className="button button-secondary" onClick={reset}>Hủy sửa gói</button>}
      </div>
      <div className="package-list"><h3>Các gói đã tạo</h3>
        <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <select
            className="filter-select"
            aria-label="Lọc trạng thái gói PT"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="EXPIRED">Hết hạn</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <button type="button" className="button button-secondary" onClick={() => load(1)}>
            Lọc gói
          </button>
        </div>
        {items.length ? items.map((item) => <article className="published-card" key={item._id}><div><strong>{item.name}</strong> <StatusBadge status={item.status} /></div><p>{item.remainingSessions}/{item.totalSessions} buổi còn lại</p><div className="inline-actions"><button type="button" className="text-button" onClick={() => edit(item)}>Sửa gói</button><button type="button" className="text-button text-danger" onClick={() => setDeleting(item)}>Xóa gói</button></div></article>) : <div className="empty-state">Khách hàng chưa có gói PT.</div>}
        <Pagination page={meta.page || 1} totalPages={meta.totalPages || 0} onPageChange={load} />
      </div>
    </FormModal>
    <ConfirmModal open={Boolean(deleting)} title="Xóa gói PT vĩnh viễn?" description="Gói PT đã xóa không thể khôi phục." danger confirmLabel="Xóa gói" loading={loading} onClose={() => setDeleting(null)} onConfirm={remove} />
  </>;
}
