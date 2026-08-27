import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowRightLeft, Check, Dumbbell, Pencil, Plus, RefreshCw, Ruler, Salad, Send, Target, Users, X, Search, RotateCcw, type LucideIcon } from 'lucide-react';
import ConfirmModal from '../ui/ConfirmModal';
import ContentFormModal from '../ui/ContentFormModal';
import CustomerAccountModal from '../ui/CustomerAccountModal';
import CustomerFormModal from '../ui/CustomerFormModal';
import DataList from '../ui/DataList';
import type { DataColumn } from '../ui/DataList';
import FilterBar from '../ui/FilterBar';
import Pagination from '../ui/Pagination';
import PtPackageManagerModal from '../ui/PtPackageManagerModal';
import StatusBadge from '../ui/StatusBadge';
import TransferFormModal from '../ui/TransferFormModal';
import PtManagementView from '../admin/PtManagementView';
import { useToast } from '../ui/ToastProvider';
import { api } from '../../services/api';
import type { PaginationMeta } from '../../types';
import { errorMessage } from '../../types';
import type { ContentItem, Resource } from '../ui/ContentFormModal';

interface PortalItem { _id?: string; id?: string; title?: string; summary?: string; status?: string; customerId?: string; measurementDate?: string; weight?: number; targetCalories?: number; fullName?: string; username?: string; phone?: string; email?: string; initialGoal?: string; packages?: unknown; userId?: string; fromPtId?: string; toPtId?: string; reason?: string; [key: string]: unknown }
interface SectionHeaderProps { title: string; description: string; action?: ReactNode }
interface TransferDecision { item: PortalItem; action: 'accept' | 'reject' }
interface CustomerContent { inbody: PortalItem[]; goals: PortalItem[]; workoutPlans: PortalItem[]; nutritionPlans: PortalItem[]; progressReports: PortalItem[] }

function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return <div className="section-header"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

export function AdminView() {
  return <PtManagementView />;
}

type PtTab = 'customers' | 'transfers' | Resource;
interface PtTabItem { value: PtTab; label: string; icon: LucideIcon }

const ptTabs: PtTabItem[] = [
  { value: 'customers', label: 'Khách hàng', icon: Users },
  { value: 'inbody', label: 'InBody', icon: Ruler },
  { value: 'goals', label: 'Mục tiêu', icon: Target },
  { value: 'workout-plans', label: 'Giáo án', icon: Dumbbell },
  { value: 'nutrition-plans', label: 'Dinh dưỡng', icon: Salad },
  { value: 'transfers', label: 'Chuyển PT', icon: ArrowRightLeft },
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
  const selectTab = (value: PtTab) => {
    setTab(value);
    setStatusFilter('');
    setCustomerFilter('');
    setShowForm(false);
    setCustomerForm({ open: false, customer: null });
  };
  return <>
    <SectionHeader title="Khách hàng của tôi" description="Quản lý hồ sơ và công bố nội dung cho khách hàng." action={<button className="button button-primary" onClick={openCreateForm}><Plus size={18} /> Tạo mới</button>} />
    <div className="customer-browser-tabs" role="tablist" aria-label="Nội dung khách hàng">{ptTabs.map(({ value, label, icon: Icon }) => <button id={`customer-tab-${value}`} type="button" role="tab" aria-selected={tab === value} aria-controls="customer-tab-panel" key={value} className={tab === value ? 'active' : ''} onClick={() => selectTab(value)}><Icon size={16} aria-hidden="true" /><span>{label}</span></button>)}</div>
    <TransferFormModal open={showForm && tab === 'transfers'} transfer={formItem} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
    <ContentFormModal open={showForm && !['customers', 'transfers'].includes(tab)} resource={tab as Resource} item={formItem as ContentItem | null} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
    <CustomerAccountModal open={Boolean(accountCustomer)} customer={accountCustomer} onClose={() => setAccountCustomer(null)} onSaved={() => { setAccountCustomer(null); load(); }} />
    <PtPackageManagerModal open={Boolean(packageCustomer)} customer={packageCustomer} onClose={() => setPackageCustomer(null)} />
    <div id="customer-tab-panel" className="customer-tab-panel" role="tabpanel" aria-labelledby={`customer-tab-${tab}`}>
      <div className="panel">
        {tab === 'customers' ? (
          <FilterBar ariaLabel="Tìm khách hàng" keyword={keyword} onKeywordChange={setKeyword} placeholder="Tìm khách hàng theo tên, số điện thoại, mục tiêu...">
            <select aria-label="Lọc trạng thái khách hàng" className="filter-select" value={customerStatus} onChange={(event) => setCustomerStatus(event.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
              <option value="LEAD">Tiềm năng</option>
            </select>
            <button className="button button-secondary" onClick={() => load()}>
              <RefreshCw size={15} /> Lọc
            </button>
            {(keyword || customerStatus) && (
              <button className="button-filter-reset" onClick={() => { setKeyword(''); setCustomerStatus(''); }}>
                <RotateCcw size={13} /> Xóa lọc
              </button>
            )}
          </FilterBar>
        ) : (
          <div className="filter-bar">
            <div className="search-field" style={{ maxWidth: '300px' }}>
              <Search size={16} className="search-icon" aria-hidden="true" />
              <input
                aria-label="Lọc theo mã khách hàng"
                value={customerFilter}
                onChange={(event) => setCustomerFilter(event.target.value)}
                placeholder="Nhập mã khách hàng..."
              />
              {customerFilter && (
                <button type="button" className="search-clear-btn" onClick={() => setCustomerFilter('')} aria-label="Xóa mã khách hàng">
                  <X size={12} />
                </button>
              )}
            </div>
            <select aria-label="Lọc theo trạng thái" className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">Tất cả trạng thái</option>
              {tab === 'transfers' ? <>
                <option value="PENDING">Chờ xác nhận</option>
                <option value="ACCEPTED">Đã nhận</option>
                <option value="REJECTED">Đã từ chối</option>
                <option value="ADMIN_FORCED">Admin chuyển</option>
              </> : <>
                <option value="DRAFT">Bản nháp</option>
                <option value="PUBLISHED">Đã công bố</option>
              </>}
            </select>
            <button className="button button-secondary" onClick={() => load()}>
              <RefreshCw size={15} /> Lọc
            </button>
            {(customerFilter || statusFilter) && (
              <button className="button-filter-reset" onClick={() => { setCustomerFilter(''); setStatusFilter(''); }}>
                <RotateCcw size={13} /> Xóa lọc
              </button>
            )}
          </div>
        )}
        <DataList items={items} columns={columns} renderActions={(item) => <div className="inline-actions">{tab === 'customers' ? <><button className="text-button" onClick={() => setCustomerForm({ open: true, customer: item })}><Pencil size={16} /> Sửa</button>{!item.userId && <button className="text-button" onClick={() => setAccountCustomer(item)}>Cấp tài khoản</button>}</> : <button className="text-button" onClick={() => { setFormItem(item); setShowForm(true); }}><Pencil size={16} /> Sửa</button>}{tab === 'transfers' && item.status === 'PENDING' && <><button className="text-button" onClick={() => setTransferDecision({ item, action: 'accept' })}><Check size={16} /> Xác nhận nhận khách</button><button className="text-button" onClick={() => setTransferDecision({ item, action: 'reject' })}><X size={16} /> Từ chối</button></>}{!['customers', 'transfers'].includes(tab) && <button className="text-button" onClick={() => setConfirm(item)}><Send size={16} /> {item.status === 'PUBLISHED' ? 'Thu hồi' : 'Công bố'}</button>}<button className="text-button text-danger" onClick={() => setDeleteTarget(item)}>Xóa</button></div>} />
        <Pagination page={meta.page || 1} totalPages={meta.totalPages || 0} onPageChange={load} />
      </div>
    </div>
    <CustomerFormModal open={customerForm.open} customer={customerForm.customer} onClose={() => setCustomerForm({ open: false, customer: null })} onSaved={() => { setCustomerForm({ open: false, customer: null }); load(meta.page || 1); }} />
    <ConfirmModal open={Boolean(confirm)} title={confirm?.status === 'PUBLISHED' ? 'Thu hồi nội dung?' : 'Công bố nội dung?'} description={confirm?.status === 'PUBLISHED' ? 'Khách hàng sẽ không còn nhìn thấy nội dung này.' : 'Khách hàng sẽ nhìn thấy nội dung sau khi công bố.'} onClose={() => setConfirm(null)} onConfirm={publish} />
    <ConfirmModal open={Boolean(transferDecision)} title={transferDecision?.action === 'accept' ? 'Xác nhận nhận khách?' : 'Từ chối nhận khách?'} description={transferDecision?.action === 'accept' ? 'Sau khi xác nhận, khách hàng sẽ được chuyển sang danh sách quản lý của bạn.' : 'Yêu cầu chuyển khách sẽ được đánh dấu là đã từ chối.'} onClose={() => setTransferDecision(null)} onConfirm={resolveTransfer} />
    <ConfirmModal open={Boolean(deleteTarget)} title="Xóa vĩnh viễn?" description="Dữ liệu đã xóa không thể khôi phục." danger confirmLabel="Xóa vĩnh viễn" onClose={() => setDeleteTarget(null)} onConfirm={deleteSelectedItem} />
  </>;
}

export function CustomerView() {
  const toast = useToast();
  const [content, setContent] = useState<CustomerContent>({ inbody: [], goals: [], workoutPlans: [], nutritionPlans: [], progressReports: [] });
  useEffect(() => { api.get<CustomerContent>('/api/me/content').then((result) => setContent(result.data)).catch((error: unknown) => toast.error(errorMessage(error))); }, [toast]);
  const groups: Array<[keyof CustomerContent, string]> = [['inbody', 'Kết quả InBody'], ['goals', 'Mục tiêu'], ['workoutPlans', 'Giáo án'], ['nutritionPlans', 'Dinh dưỡng'], ['progressReports', 'Báo cáo tiến độ']];
  return <><SectionHeader title="Hành trình của tôi" description="Các nội dung đã được PT xác nhận và công bố." /><div className="customer-content-grid">{groups.map(([key, label]) => <section className="panel" key={key}><h2>{label}</h2>{content[key]?.length ? content[key].map((item) => <article className="published-card" key={item._id}><StatusBadge status={item.status} /><h3>{item.title || (item.measurementDate ? new Date(item.measurementDate).toLocaleDateString('vi-VN') : label)}</h3>{item.weight && <p>Cân nặng: <strong>{item.weight} kg</strong></p>}{item.targetCalories && <p>Calories mục tiêu: <strong>{item.targetCalories} kcal</strong></p>}</article>) : <div className="empty-state">PT chưa công bố nội dung.</div>}</section>)}</div></>;
}
