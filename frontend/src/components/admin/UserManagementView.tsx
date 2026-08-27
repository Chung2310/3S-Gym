import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Pencil, Trash2, Users, ShieldCheck, UserCheck, RotateCcw } from 'lucide-react';
import DataList from '../../components/ui/DataList';
import FilterBar from '../../components/ui/FilterBar';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import RoleBadge from '../../components/ui/RoleBadge';
import ConfirmModal from '../../components/ui/ConfirmModal';
import UserFormModal, { type UserRecord } from '../../components/ui/UserFormModal';
import { useToast } from '../../components/ui/ToastProvider';
import { api } from '../../services/api';
import type { PaginationMeta, UserRole } from '../../types';
import { errorMessage } from '../../types';

export default function UserManagementView() {
  const toast = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 0 });
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [formUser, setFormUser] = useState<UserRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });
      if (keyword.trim()) params.set('keyword', keyword.trim());
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);

      const result = await api.get<UserRecord[]>(`/api/users?${params.toString()}`);
      setUsers(result.data || []);
      if (result.meta) setMeta(result.meta);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [keyword, roleFilter, statusFilter, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    const userId = deleteUser._id || deleteUser.id;
    try {
      const result = await api.delete(`/api/users/${userId}`);
      toast.success(result.message || 'Xóa tài khoản thành công');
      setDeleteUser(null);
      loadUsers(meta.page || 1);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const handleResetFilters = () => {
    setKeyword('');
    setRoleFilter('');
    setStatusFilter('');
  };

  const hasActiveFilters = Boolean(keyword || roleFilter || statusFilter);

  return (
    <div className="user-management-view">
      <div className="section-header">
        <div>
          <h2>Quản lý toàn bộ tài khoản</h2>
          <p>Danh sách quản trị viên, huấn luyện viên (PT) và hội viên khách hàng trong hệ thống 3S Gym.</p>
        </div>
        <button
          className="button button-primary"
          type="button"
          onClick={() => {
            setFormUser(null);
            setIsCreateOpen(true);
          }}
        >
          <Plus size={18} /> Thêm tài khoản
        </button>
      </div>

      <div className="user-stat-chips" role="group" aria-label="Lọc nhanh theo vai trò">
        <button
          type="button"
          className={`user-stat-chip ${roleFilter === '' ? 'active' : ''}`}
          onClick={() => setRoleFilter('')}
        >
          <span>Tất cả vai trò</span>
        </button>
        <button
          type="button"
          className={`user-stat-chip ${roleFilter === 'ADMIN' ? 'active' : ''}`}
          onClick={() => setRoleFilter('ADMIN')}
        >
          <ShieldCheck size={14} />
          <span>Quản trị viên</span>
        </button>
        <button
          type="button"
          className={`user-stat-chip ${roleFilter === 'PT' ? 'active' : ''}`}
          onClick={() => setRoleFilter('PT')}
        >
          <Users size={14} />
          <span>Huấn luyện viên (PT)</span>
        </button>
        <button
          type="button"
          className={`user-stat-chip ${roleFilter === 'CUSTOMER' ? 'active' : ''}`}
          onClick={() => setRoleFilter('CUSTOMER')}
        >
          <UserCheck size={14} />
          <span>Hội viên (Customer)</span>
        </button>
      </div>

      <div className="panel">
        <FilterBar
          ariaLabel="Tìm kiếm tài khoản"
          keyword={keyword}
          onKeywordChange={setKeyword}
          placeholder="Tìm theo họ tên, số điện thoại, email, username..."
        >
          <select
            className="filter-select"
            aria-label="Lọc theo vai trò"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
            <option value="PT">Huấn luyện viên (PT)</option>
            <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
          </select>

          <select
            className="filter-select"
            aria-label="Lọc theo trạng thái"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
          </select>

          <button className="button button-secondary" type="button" onClick={() => loadUsers(1)} disabled={loading}>
            <RefreshCw size={15} /> {loading ? 'Đang tải...' : 'Tải lại'}
          </button>

          {hasActiveFilters && (
            <button
              className="button-filter-reset"
              type="button"
              onClick={handleResetFilters}
              title="Đặt lại toàn bộ lọc"
            >
              <RotateCcw size={13} /> Xóa lọc
            </button>
          )}
        </FilterBar>

        <DataList<UserRecord>
          items={users}
          columns={[
            {
              key: 'fullName',
              label: 'Người dùng',
              render: (item) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      backgroundColor: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.avatarUrl ? (
                      <img src={item.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Users size={18} color="#64748b" />
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#003b70' }}>{item.fullName || 'Chưa đặt tên'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>@{item.username}</div>
                  </div>
                </div>
              ),
            },
            {
              key: 'role',
              label: 'Vai trò',
              render: (item) => <RoleBadge role={item.role as UserRole} />,
            },
            {
              key: 'phone',
              label: 'Liên hệ',
              render: (item) => (
                <div>
                  <div>{item.phone || '—'}</div>
                  {item.email && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.email}</div>}
                </div>
              ),
            },
            {
              key: 'status',
              label: 'Trạng thái',
              render: (item) => <StatusBadge status={item.status} />,
            },
          ]}
          renderActions={(item) => (
            <div className="inline-actions">
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setFormUser(item);
                  setIsCreateOpen(true);
                }}
              >
                <Pencil size={16} /> Sửa
              </button>
              <button
                className="text-button text-danger"
                type="button"
                onClick={() => setDeleteUser(item)}
              >
                <Trash2 size={16} /> Xóa
              </button>
            </div>
          )}
        />

        <Pagination
          page={meta.page || 1}
          totalPages={meta.totalPages || 0}
          onPageChange={loadUsers}
        />
      </div>

      <UserFormModal
        open={isCreateOpen}
        user={formUser}
        defaultRole={(roleFilter as UserRole) || 'PT'}
        onClose={() => {
          setIsCreateOpen(false);
          setFormUser(null);
        }}
        onSaved={() => {
          setIsCreateOpen(false);
          setFormUser(null);
          loadUsers(meta.page || 1);
        }}
      />

      <ConfirmModal
        open={Boolean(deleteUser)}
        title="Xóa tài khoản người dùng?"
        description={`Bạn có chắc chắn muốn xóa tài khoản "${deleteUser?.fullName || deleteUser?.username}". Hành động này không thể khôi phục.`}
        danger
        confirmLabel="Xóa vĩnh viễn"
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}
