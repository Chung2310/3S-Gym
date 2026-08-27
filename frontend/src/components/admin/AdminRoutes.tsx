import { useState } from 'react';
import { LayoutDashboard, Users, SlidersHorizontal } from 'lucide-react';
import { AdminView } from '../portal/PortalViews';
import AdminDashboardPage from './AdminDashboardPage';
import UserManagementView from './UserManagementView';
import FeatureFlagsView from './FeatureFlagsView';

type AdminTab = 'overview' | 'users' | 'flags';

export default function AdminRoutes() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  return (
    <div className="admin-workspace">
      <div className="customer-browser-tabs" role="tablist" aria-label="Bảng điều khiển quản trị">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={16} aria-hidden="true" />
          <span>Tổng quan & Huấn luyện viên</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'users'}
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} aria-hidden="true" />
          <span>Toàn bộ tài khoản</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'flags'}
          className={activeTab === 'flags' ? 'active' : ''}
          onClick={() => setActiveTab('flags')}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>Tính năng hệ thống</span>
        </button>
      </div>

      <div className="customer-tab-panel" role="tabpanel">
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: '32px' }}>
            <AdminDashboardPage />
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '28px' }}>
              <AdminView />
            </div>
          </div>
        )}
        {activeTab === 'users' && <UserManagementView />}
        {activeTab === 'flags' && <FeatureFlagsView />}
      </div>
    </div>
  );
}
