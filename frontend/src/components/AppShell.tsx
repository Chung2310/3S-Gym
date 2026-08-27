import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Dumbbell, LogOut, Menu, X } from 'lucide-react';
import { clearSession } from '../services/session';
import { navigationForPath, visibleNavigation, type NavigationSection } from '../config/portalNavigation';
import type { FeatureState, User, UserRole } from '../types';

const roleNames: Record<UserRole, string> = { ADMIN: 'Quản lý hệ thống', PT: 'Huấn luyện viên', CUSTOMER: 'Khách hàng' };
const sectionOrder: NavigationSection[] = ['Tổng quan', 'Vận hành', 'Tri thức & trợ lý', 'Tài khoản'];
interface AppShellProps { user: User; children: ReactNode; features?: FeatureState }

export default function AppShell({ user, children, features = {} }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const items = visibleNavigation(user, features);
  const current = navigationForPath(location.pathname, user, features);
  const logout = () => { clearSession(); navigate('/login'); };
  return <div className="portal-shell">
    <aside className={`portal-sidebar ${open ? 'mobile-open' : ''}`}>
      <div className="portal-brand"><Dumbbell size={28} /><div><strong>3S Wellness</strong><span>PT Portal</span></div><button type="button" className="mobile-close" aria-label="Đóng menu" onClick={() => setOpen(false)}><X /></button></div>
      <nav aria-label="Điều hướng portal" className="portal-navigation">{sectionOrder.map((section) => {
        const sectionItems = items.filter((item) => item.section === section);
        if (!sectionItems.length) return null;
        return <div className="portal-nav-section" key={section} aria-label={section}><span className="portal-nav-heading">{section}</span>{sectionItems.map((item) => {
          const Icon = item.icon; const active = current?.path === item.path;
          return <Link key={item.path} to={item.path} aria-current={active ? 'page' : undefined} className={active ? 'active' : undefined} onClick={() => setOpen(false)}><Icon size={18} aria-hidden="true" /><span>{item.label}</span></Link>;
        })}</div>;
      })}</nav>
      <div className="portal-user"><strong>{user.fullName || user.username}</strong><span>{roleNames[user.role]}</span><button type="button" onClick={logout}><LogOut size={17} /> Đăng xuất</button></div>
    </aside>
    {open && <button className="sidebar-overlay" aria-label="Đóng menu" onClick={() => setOpen(false)} />}
    <div className="portal-main"><header className="portal-header"><button className="mobile-menu" type="button" onClick={() => setOpen(true)}><Menu /> Menu</button><nav className="portal-breadcrumb" aria-label="Điều hướng trang"><span>Portal</span>{current && <><ChevronRight size={15} /><span>{current.section}</span><ChevronRight size={15} /><strong>{current.label}</strong></>}</nav><div className="portal-header-user"><strong>{user.fullName || user.username}</strong><span>{roleNames[user.role]}</span></div></header><main className="portal-content">{children}</main></div>
  </div>;
}
