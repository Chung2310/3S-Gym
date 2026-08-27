import { useCallback, useEffect, useState } from 'react';
import ConfirmModal from '../ui/ConfirmModal';
import DataList, { type DataColumn } from '../ui/DataList';
import Pagination from '../ui/Pagination';
import { useToast } from '../ui/ToastProvider';
import { api } from '../../services/api';
import type { PaginationMeta } from '../../types';
import { errorMessage } from '../../types';
import CustomerWorkoutPlanModal from './CustomerWorkoutPlanModal';
import type { CustomerWorkoutPlan, CustomerWorkoutPlanDraft } from './workoutPlanMapper';

interface Props { initialDraft?: CustomerWorkoutPlanDraft | null; onDraftConsumed?: () => void }
type Action = { kind: 'publish' | 'unpublish' | 'delete'; item: CustomerWorkoutPlan };

export default function CustomerWorkoutPlanPanel({ initialDraft = null, onDraftConsumed }: Props) {
  const toast = useToast();
  const [items, setItems] = useState<CustomerWorkoutPlan[]>([]); const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 0 });
  const [customerId, setCustomerId] = useState(''); const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editing, setEditing] = useState<CustomerWorkoutPlan | null>(null); const [draft, setDraft] = useState<CustomerWorkoutPlanDraft | null>(null); const [action, setAction] = useState<Action | null>(null); const [loading, setLoading] = useState(false);
  const load = useCallback(async (page = 1) => { try { const query = new URLSearchParams({ page: String(page), limit: '20' }); if (customerId) query.set('customerId', customerId); if (status) query.set('status', status); const result = await api.get<CustomerWorkoutPlan[]>(`/api/workout-plans?${query}`); setItems(result.data); if (result.meta) setMeta(result.meta); } catch (error) { toast.error(errorMessage(error)); } }, [customerId, status, toast]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (initialDraft) { setDraft(initialDraft); setEditing(null); setFormOpen(true); onDraftConsumed?.(); } }, [initialDraft, onDraftConsumed]);
  const confirm = async () => { if (!action) return; setLoading(true); try { const path = action.kind === 'delete' ? `/api/workout-plans/${action.item._id}` : `/api/workout-plans/${action.item._id}/${action.kind}`; const result = action.kind === 'delete' ? await api.delete(path) : await api.patch(path); toast.success(result.message); setAction(null); await load(meta.page); } catch (error) { toast.error(errorMessage(error)); } finally { setLoading(false); } };
  const columns: DataColumn<CustomerWorkoutPlan>[] = [{ key: 'title', label: 'Giáo án' }, { key: 'customerId', label: 'Khách hàng', render: (item) => String(item.customerId) }, { key: 'status', label: 'Trạng thái' }, { key: 'version', label: 'Phiên bản', render: (item) => `v${item.version || 1}` }];
  const openCreate = () => { setDraft(null); setEditing(null); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setDraft(null); setEditing(null); };
  return <section className="panel"><div className="section-header"><div><h2>Giáo án khách hàng</h2><p>Tạo bản nháp, cá nhân hóa và công bố cho từng khách hàng.</p></div><button className="button button-primary" onClick={openCreate}>Tạo giáo án khách hàng</button></div><div className="filter-bar"><label className="field"><span>Mã khách hàng</span><input aria-label="Lọc theo mã khách hàng" value={customerId} onChange={(event) => setCustomerId(event.target.value)} /></label><label className="field"><span>Trạng thái</span><select aria-label="Lọc theo trạng thái" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả</option><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Đã công bố</option></select></label><button className="button button-secondary" onClick={() => void load()}>Lọc</button></div><DataList items={items} columns={columns} renderActions={(item) => <div className="inline-actions"><button className="text-button" onClick={() => { setEditing(item); setDraft(null); setFormOpen(true); }}>Sửa</button><button className="text-button" onClick={() => setAction({ kind: item.status === 'PUBLISHED' ? 'unpublish' : 'publish', item })}>{item.status === 'PUBLISHED' ? 'Thu hồi' : 'Công bố'}</button><button className="text-button text-danger" onClick={() => setAction({ kind: 'delete', item })}>Xóa</button></div>} /><Pagination page={meta.page || 1} totalPages={meta.totalPages || 0} onPageChange={load} /><CustomerWorkoutPlanModal open={formOpen} item={editing} initialDraft={draft} onClose={closeForm} onSaved={() => { closeForm(); void load(meta.page); }} /><ConfirmModal open={Boolean(action)} title={action?.kind === 'delete' ? 'Xóa giáo án?' : action?.kind === 'unpublish' ? 'Thu hồi giáo án?' : 'Công bố giáo án?'} description={action?.kind === 'publish' ? 'Khách hàng sẽ nhìn thấy giáo án sau khi công bố.' : action?.kind === 'unpublish' ? 'Khách hàng sẽ không còn nhìn thấy giáo án này.' : 'Dữ liệu đã xóa không thể khôi phục.'} confirmLabel={action?.kind === 'publish' ? 'Xác nhận công bố' : action?.kind === 'unpublish' ? 'Xác nhận thu hồi' : 'Xác nhận xóa'} danger={action?.kind === 'delete'} loading={loading} onClose={() => setAction(null)} onConfirm={confirm} /></section>;
}
