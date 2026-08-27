import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, LogOut, Menu, X } from 'lucide-react';
import { clearSession } from '../services/session';
import type { FeatureKey, FeatureState, User, UserRole } from '../types';

const roleNames: Record<UserRole, string> = { ADMIN: 'Quản lý hệ thống', PT: 'Huấn luyện viên', CUSTOMER: 'Khách hàng' };
export interface NavigationItem { path: string; label: string; roles: UserRole[]; feature?: FeatureKey }
interface AppShellProps { user: User; children: ReactNode; features?: FeatureState }

export const portalNavigation: NavigationItem[] = [
  { path: '/portal/admin', label: 'Quản lý PT', roles: ['ADMIN'] },
  { path: '/portal/pt/customers', label: 'Khách hàng', roles: ['PT'] },
  { path: '/portal/pt/inbody', label: 'InBody OCR', roles: ['PT'], feature: 'OCR_INBODY' },
  { path: '/portal/pt/roadmaps', label: 'Roadmap', roles: ['PT'], feature: 'ROADMAP' },
  { path: '/portal/pt/exercises', label: 'Thư viện bài tập', roles: ['PT'], feature: 'EXERCISE_LIBRARY' },
  { path: '/portal/pt/workouts', label: 'Giáo án & buổi tập', roles: ['PT'], feature: 'PROGRESS' },
  { path: '/portal/pt/progress', label: 'Tiến độ', roles: ['PT'], feature: 'PROGRESS' },
  { path: '/consultation', label: 'Trợ lý dinh dưỡng', roles: ['PT'] },
  { path: '/portal/pt/assistant', label: 'PT Assistant', roles: ['PT'], feature: 'PT_ASSISTANT' },
  { path: '/portal/me', label: 'Hành trình của tôi', roles: ['CUSTOMER'] },
];

export default function AppShell({ user, children, features = {} }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const logout = () => { clearSession(); navigate('/login'); };
  return <div className="portal-shell">
    <aside className={`portal-sidebar ${open ? 'mobile-open' : ''}`}>
      <div className="portal-brand"><Dumbbell size={28} /><div><strong>3S Wellness</strong><span>PT Portal</span></div><button type="button" className="mobile-close" aria-label="Đóng menu" onClick={() => setOpen(false)}><X /></button></div>
      <nav>{portalNavigation.filter((item) => item.roles.includes(user.role) && (!item.feature || features[item.feature] === true)).map((item) => <Link key={item.path} to={item.path} onClick={() => setOpen(false)}>{item.label}</Link>)}</nav>
      <div className="portal-user"><strong>{user.fullName || user.username}</strong><span>{roleNames[user.role]}</span><button type="button" onClick={logout}><LogOut size={17} /> Đăng xuất</button></div>
    </aside>
    {open && <button className="sidebar-overlay" aria-label="Đóng menu" onClick={() => setOpen(false)} />}
    <div className="portal-main"><header className="portal-header"><button className="mobile-menu" type="button" onClick={() => setOpen(true)}><Menu /> Menu</button><div><strong>{user.fullName || user.username}</strong><span>{roleNames[user.role]}</span></div></header><main className="portal-content">{children}</main></div>
  </div>;
}
