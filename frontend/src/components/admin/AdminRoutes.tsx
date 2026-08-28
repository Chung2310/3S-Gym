import { useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Users, SlidersHorizontal, UserCheck } from 'lucide-react';
import AdminDashboardPage from './AdminDashboardPage';
import PtManagementView from './PtManagementView';
import UserManagementView from './UserManagementView';
import FeatureFlagsView from './FeatureFlagsView';

type AdminTab = 'overview' | 'pts' | 'users' | 'flags';

const TABS: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'pts', label: 'Huấn luyện viên (PT)', icon: UserCheck },
  { id: 'users', label: 'Toàn bộ tài khoản', icon: Users },
  { id: 'flags', label: 'Tính năng hệ thống', icon: SlidersHorizontal },
];

export default function AdminRoutes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') as AdminTab;
  const activeTab: AdminTab = TABS.some((t) => t.id === rawTab) ? rawTab : 'overview';

  const selectTab = (tab: AdminTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === 'overview') {
        next.delete('tab');
      } else {
        next.set('tab', tab);
      }
      return next;
    });
  };

  return (
    <div className="admin-workspace">
      {/* Top Tab Navigation */}
      <div className="customer-browser-tabs" role="tablist" aria-label="Bảng điều khiển quản trị">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`admin-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`admin-tab-panel-${id}`}
            className={activeTab === id ? 'active' : ''}
            onClick={() => selectTab(id)}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panel Content: Each tab strictly renders its own dedicated component */}
      <div
        id={`admin-tab-panel-${activeTab}`}
        className="customer-tab-panel"
        role="tabpanel"
        aria-labelledby={`admin-tab-${activeTab}`}
      >
        {activeTab === 'overview' && <AdminDashboardPage />}
        {activeTab === 'pts' && <PtManagementView />}
        {activeTab === 'users' && <UserManagementView />}
        {activeTab === 'flags' && <FeatureFlagsView />}
      </div>
    </div>
  );
}

