import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, LogOut, Menu, X } from 'lucide-react';
import { clearSession } from '../services/session';

const roleNames = { ADMIN: 'Quản lý hệ thống', PT: 'Huấn luyện viên', CUSTOMER: 'Khách hàng' };

export default function AppShell({ user, children }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const logout = () => { clearSession(); navigate('/login'); };

  return (
    <div className="portal-shell">
      <aside className={`portal-sidebar ${open ? 'mobile-open' : ''}`}>
        <div className="portal-brand"><Dumbbell size={28} /><div><strong>3S Wellness</strong><span>PT Portal</span></div><button type="button" className="mobile-close" aria-label="Đóng menu" onClick={() => setOpen(false)}><X /></button></div>
        <nav><Link to="/portal" onClick={() => setOpen(false)}>Tổng quan Đợt 1</Link><Link to="/consultation" onClick={() => setOpen(false)}>Trợ lý dinh dưỡng</Link></nav>
        <div className="portal-user"><strong>{user.fullName || user.username}</strong><span>{roleNames[user.role] || user.role}</span><button type="button" onClick={logout}><LogOut size={17} /> Đăng xuất</button></div>
      </aside>
      {open && <button className="sidebar-overlay" aria-label="Đóng menu" onClick={() => setOpen(false)} />}
      <div className="portal-main"><header className="portal-header"><button className="mobile-menu" type="button" onClick={() => setOpen(true)}><Menu /> Menu</button><div><strong>{user.fullName || user.username}</strong><span>{roleNames[user.role]}</span></div></header><main className="portal-content">{children}</main></div>
    </div>
  );
}
