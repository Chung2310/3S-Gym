import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Check, Pencil, Plus, RefreshCw, Send, X } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import ContentFormModal from '../../components/ContentFormModal';
import CustomerAccountModal from '../../components/CustomerAccountModal';
import CustomerFormModal from '../../components/CustomerFormModal';
import DataList from '../../components/DataList';
import type { DataColumn } from '../../components/DataList';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import PtPackageManagerModal from '../../components/PtPackageManagerModal';
import PtFormModal from '../../components/PtFormModal';
import StatusBadge from '../../components/StatusBadge';
import TransferFormModal from '../../components/TransferFormModal';
import { useToast } from '../../components/ToastProvider';
import { api } from '../../services/api';
import type { PaginationMeta } from '../../types';
import { errorMessage } from '../../types';
import type { ContentItem, Resource } from '../../components/ContentFormModal';

interface PortalItem { _id?: string; id?: string; title?: string; status?: string; customerId?: string; measurementDate?: string; weight?: number; targetCalories?: number; fullName?: string; username?: string; phone?: string; email?: string; initialGoal?: string; packages?: unknown; userId?: string; fromPtId?: string; toPtId?: string; reason?: string; [key: string]: unknown }
interface SectionHeaderProps { title: string; description: string; action?: ReactNode }
interface TransferDecision { item: PortalItem; action: 'accept' | 'reject' }
interface CustomerContent { inbody: PortalItem[]; goals: PortalItem[]; workoutPlans: PortalItem[]; nutritionPlans: PortalItem[] }

function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return <div className="section-header"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

export function AdminView() {
  const toast = useToast();
  const [items, setItems] = useState<PortalItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 0 });
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [formPt, setFormPt] = useState<PortalItem | null>(null);
  const [deletePt, setDeletePt] = useState<PortalItem | null>(null);
  const load = useCallback(async (page = 1) => {
    try {
      const result = await api.get<PortalItem[]>(`/api/users?page=${page}&limit=20&role=PT&keyword=${encodeURIComponent(keyword)}${status ? `&status=${status}` : ''}`);
      setItems(result.data); if (result.meta) setMeta(result.meta);
    } catch (error) { toast.error(errorMessage(error)); }
  }, [keyword, status, toast]);
  useEffect(() => { load(); }, [load]);
  const deleteSelectedPt = async () => {
    if (!deletePt) return;
    try { const result = await api.delete(`/api/users/${deletePt._id}`); toast.success(result.message); setDeletePt(null); load(); }
    catch (error) { toast.error(errorMessage(error)); }
  };
  return <>
    <SectionHeader title="Quản lý tài khoản PT" description="Tạo và theo dõi tài khoản huấn luyện viên trong hệ thống." action={<button className="button button-primary" onClick={() => setFormPt({})}><Plus size={18} /> Tạo PT</button>} />
    <div className="filter-bar panel"><label className="field"><span>Trạng thái PT</span><select aria-label="Lọc trạng thái PT" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Ngừng hoạt động</option></select></label></div>
    <div className="panel"><FilterBar keyword={keyword} onKeywordChange={setKeyword}><button className="button button-secondary" onClick={() => load()}><RefreshCw size={17} /> Tải lại</button></FilterBar><DataList items={items} columns={[{ key: 'fullName', label: 'Họ tên' }, { key: 'username', label: 'Tên đăng nhập' }, { key: 'phone', label: 'Số điện thoại' }, { key: 'email', label: 'Email' }, { key: 'status', label: 'Trạng thái', render: (item) => <StatusBadge status={item.status} /> }]} renderActions={(item) => <div className="inline-actions"><button className="text-button" onClick={() => setFormPt(item)}><Pencil size={16} /> Sửa</button><button className="text-button text-danger" onClick={() => setDeletePt(item)}>Xóa</button></div>} /><Pagination page={meta.page || 1} totalPages={meta.totalPages || 0} onPageChange={load} /></div>
    <PtFormModal open={Boolean(formPt)} pt={formPt?._id ? formPt : null} onClose={() => setFormPt(null)} onSaved={() => { setFormPt(null); load(); }} />
    <ConfirmModal open={Boolean(deletePt)} title="Xóa PT vĩnh viễn?" description="PT chỉ được xóa sau khi đã chuyển hết khách sang PT khác." danger confirmLabel="Xóa vĩnh viễn" onClose={() => setDeletePt(null)} onConfirm={deleteSelectedPt} />
  </>;
}

const ptTabs: Array<['customers' | 'transfers' | Resource, string]> = [
  ['customers', 'Khách hàng'], ['inbody', 'InBody'], ['goals', 'Mục tiêu'], ['workout-plans', 'Giáo án'], ['nutrition-plans', 'Dinh dưỡng'], ['transfers', 'Chuyển PT'],
];

export function PtView() {
  const toast = useToast();
  const [tab, setTab] = useState<'customers' | 'transfers' | Resource>('customers');
  const [items, setItems] = useState<PortalItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 0 });
  const [keyword, setKeyword] = useState('');
  const [customerStatus, setCustomerStatus] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formItem, setFormItem] = useState<PortalItem | null>(null);
  const [customerForm, setCustomerForm] = useState<{ open: boolean; customer: PortalItem | null }>({ open: false, customer: null });
  const [confirm, setConfirm] = useState<PortalItem | null>(null);
  const [transferDecision, setTransferDecision] = useState<TransferDecision | null>(null);
  const [accountCustomer, setAccountCustomer] = useState<PortalItem | null>(null);
  const [packageCustomer, setPackageCustomer] = useState<PortalItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortalItem | null>(null);
  const load = useCallback(async (page = 1) => { try { const params = new URLSearchParams({ page: String(page), limit: '20' }); if (tab === 'customers' && keyword) params.set('keyword', keyword); if (tab === 'customers' && customerStatus) params.set('status', customerStatus); if (tab !== 'customers' && statusFilter) params.set('status', statusFilter); if (tab !== 'customers' && customerFilter) params.set('customerId', customerFilter); const result = await api.get<PortalItem[]>(`/api/${tab}?${params}`); setItems(result.data); if (result.meta) setMeta(result.meta); } catch (error) { toast.error(errorMessage(error)); } }, [tab, keyword, customerStatus, statusFilter, customerFilter, toast]);
  useEffect(() => { load(); }, [load]);
  const publish = async () => { if (!confirm) return; try { const result = await api.patch(`/api/${tab}/${confirm._id}/${confirm.status === 'PUBLISHED' ? 'unpublish' : 'publish'}`); toast.success(result.message); setConfirm(null); load(); } catch (error) { toast.error(errorMessage(error)); } };
  const resolveTransfer = async () => {
    if (!transferDecision) return;
    try {
      const result = await api.patch(`/api/transfers/${transferDecision.item._id}/${transferDecision.action}`);
      toast.success(result.message);
      setTransferDecision(null);
      load();
    } catch (error) { toast.error(errorMessage(error)); }
  };
  const deleteSelectedItem = async () => {
    if (!deleteTarget) return;
    try { const path = tab === 'customers' ? `/api/customers/${deleteTarget._id}` : `/api/${tab}/${deleteTarget._id}`; const result = await api.delete(path); toast.success(result.message); setDeleteTarget(null); load(); }
    catch (error) { toast.error(errorMessage(error)); }
  };
  const columns = useMemo<DataColumn<PortalItem>[]>(() => {
    if (tab === 'customers') return [{ key: 'fullName', label: 'Họ tên' }, { key: 'phone', label: 'Số điện thoại' }, { key: 'initialGoal', label: 'Mục tiêu' }, { key: 'packages', label: 'Gói tập', render: (item) => <button className="text-button" onClick={() => setPackageCustomer(item)}>Gói PT</button> }, { key: 'status', label: 'Trạng thái', render: (item) => <StatusBadge status={item.status} /> }];
    if (tab === 'transfers') return [{ key: 'customerId', label: 'Khách hàng' }, { key: 'fromPtId', label: 'PT chuyển' }, { key: 'toPtId', label: 'PT nhận' }, { key: 'reason', label: 'Lý do' }, { key: 'status', label: 'Trạng thái', render: (item) => <StatusBadge status={item.status} /> }];
    return [{ key: 'title', label: tab === 'inbody' ? 'Ngày đo' : 'Tên nội dung', render: (item) => item.title || (item.measurementDate ? new Date(item.measurementDate).toLocaleDateString('vi-VN') : '—') }, { key: 'customerId', label: 'Khách hàng' }, { key: 'status', label: 'Trạng thái', render: (item) => <StatusBadge status={item.status} /> }];
  }, [tab]);
  const openCreateForm = () => {
    if (tab === 'customers') setCustomerForm({ open: true, customer: null });
    else { setFormItem(null); setShowForm(true); }
  };
  return <>
    <SectionHeader title="Khách hàng của tôi" description="Quản lý hồ sơ và công bố nội dung cho khách hàng." action={<button className="button button-primary" onClick={openCreateForm}><Plus size={18} /> Tạo mới</button>} />
    <div className="tab-bar">{ptTabs.map(([value, label]) => <button key={value} className={tab === value ? 'active' : ''} onClick={() => { setTab(value); setStatusFilter(''); setCustomerFilter(''); setShowForm(false); setCustomerForm({ open: false, customer: null }); }}>{label}</button>)}</div>
    <TransferFormModal open={showForm && tab === 'transfers'} transfer={formItem} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
    <ContentFormModal open={showForm && !['customers', 'transfers'].includes(tab)} resource={tab as Resource} item={formItem as ContentItem | null} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
    <CustomerAccountModal open={Boolean(accountCustomer)} customer={accountCustomer} onClose={() => setAccountCustomer(null)} onSaved={() => { setAccountCustomer(null); load(); }} />
    <PtPackageManagerModal open={Boolean(packageCustomer)} customer={packageCustomer} onClose={() => setPackageCustomer(null)} />
    {tab === 'customers' && <div className="filter-bar panel"><label className="field"><span>Trạng thái khách hàng</span><select aria-label="Lọc trạng thái khách hàng" value={customerStatus} onChange={(event) => setCustomerStatus(event.target.value)}><option value="">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Ngừng hoạt động</option><option value="LEAD">Tiềm năng</option></select></label></div>}
    {tab !== 'customers' && <div className="filter-bar panel"><label className="field"><span>Trạng thái</span><select aria-label="Lọc theo trạng thái" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Tất cả trạng thái</option>{tab === 'transfers' ? <><option value="PENDING">Chờ xác nhận</option><option value="ACCEPTED">Đã nhận</option><option value="REJECTED">Đã từ chối</option><option value="ADMIN_FORCED">Admin chuyển</option></> : <><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Đã công bố</option></>}</select></label><label className="field"><span>Mã khách hàng</span><input aria-label="Lọc theo mã khách hàng" value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)} placeholder="Nhập mã khách hàng" /></label><button className="button button-secondary" onClick={() => load()}><RefreshCw size={17} /> Lọc</button></div>}
    <div className="panel">{tab === 'customers' && <FilterBar keyword={keyword} onKeywordChange={setKeyword}><button className="button button-secondary" onClick={() => load()}><RefreshCw size={17} /> Lọc</button></FilterBar>}<DataList items={items} columns={columns} renderActions={(item) => <div className="inline-actions">{tab === 'customers' ? <><button className="text-button" onClick={() => setCustomerForm({ open: true, customer: item })}><Pencil size={16} /> Sửa</button>{!item.userId && <button className="text-button" onClick={() => setAccountCustomer(item)}>Cấp tài khoản</button>}</> : <button className="text-button" onClick={() => { setFormItem(item); setShowForm(true); }}><Pencil size={16} /> Sửa</button>}{tab === 'transfers' && item.status === 'PENDING' && <><button className="text-button" onClick={() => setTransferDecision({ item, action: 'accept' })}><Check size={16} /> Xác nhận nhận khách</button><button className="text-button" onClick={() => setTransferDecision({ item, action: 'reject' })}><X size={16} /> Từ chối</button></>}{!['customers', 'transfers'].includes(tab) && <button className="text-button" onClick={() => setConfirm(item)}><Send size={16} /> {item.status === 'PUBLISHED' ? 'Thu hồi' : 'Công bố'}</button>}<button className="text-button text-danger" onClick={() => setDeleteTarget(item)}>Xóa</button></div>} /><Pagination page={meta.page || 1} totalPages={meta.totalPages || 0} onPageChange={load} /></div>
    <CustomerFormModal open={customerForm.open} customer={customerForm.customer} onClose={() => setCustomerForm({ open: false, customer: null })} onSaved={() => { setCustomerForm({ open: false, customer: null }); load(meta.page || 1); }} />
    <ConfirmModal open={Boolean(confirm)} title={confirm?.status === 'PUBLISHED' ? 'Thu hồi nội dung?' : 'Công bố nội dung?'} description={confirm?.status === 'PUBLISHED' ? 'Khách hàng sẽ không còn nhìn thấy nội dung này.' : 'Khách hàng sẽ nhìn thấy nội dung sau khi công bố.'} onClose={() => setConfirm(null)} onConfirm={publish} />
    <ConfirmModal open={Boolean(transferDecision)} title={transferDecision?.action === 'accept' ? 'Xác nhận nhận khách?' : 'Từ chối nhận khách?'} description={transferDecision?.action === 'accept' ? 'Sau khi xác nhận, khách hàng sẽ được chuyển sang danh sách quản lý của bạn.' : 'Yêu cầu chuyển khách sẽ được đánh dấu là đã từ chối.'} onClose={() => setTransferDecision(null)} onConfirm={resolveTransfer} />
    <ConfirmModal open={Boolean(deleteTarget)} title="Xóa vĩnh viễn?" description="Dữ liệu đã xóa không thể khôi phục." danger confirmLabel="Xóa vĩnh viễn" onClose={() => setDeleteTarget(null)} onConfirm={deleteSelectedItem} />
  </>;
}

export function CustomerView() {
  const toast = useToast();
  const [content, setContent] = useState<CustomerContent>({ inbody: [], goals: [], workoutPlans: [], nutritionPlans: [] });
  useEffect(() => { api.get<CustomerContent>('/api/me/content').then((result) => setContent(result.data)).catch((error: unknown) => toast.error(errorMessage(error))); }, [toast]);
  const groups: Array<[keyof CustomerContent, string]> = [['inbody', 'Kết quả InBody'], ['goals', 'Mục tiêu'], ['workoutPlans', 'Giáo án'], ['nutritionPlans', 'Dinh dưỡng']];
  return <><SectionHeader title="Hành trình của tôi" description="Các nội dung đã được PT xác nhận và công bố." /><div className="customer-content-grid">{groups.map(([key, label]) => <section className="panel" key={key}><h2>{label}</h2>{content[key]?.length ? content[key].map((item) => <article className="published-card" key={item._id}><StatusBadge status={item.status} /><h3>{item.title || (item.measurementDate ? new Date(item.measurementDate).toLocaleDateString('vi-VN') : label)}</h3>{item.weight && <p>Cân nặng: <strong>{item.weight} kg</strong></p>}{item.targetCalories && <p>Calories mục tiêu: <strong>{item.targetCalories} kcal</strong></p>}</article>) : <div className="empty-state">PT chưa công bố nội dung.</div>}</section>)}</div></>;
}
