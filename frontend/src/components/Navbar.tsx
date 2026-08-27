import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, User as UserIcon, MapPin, Phone, Menu, X, Bot } from 'lucide-react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const rawToken = localStorage.getItem('token');
  const token = (rawToken && rawToken !== 'undefined' && rawToken !== 'null') ? rawToken : null;

  const user = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      {/* Top Announcement Bar */}
      <div style={{ background: '#00264a', color: '#cbd5e1', fontSize: '0.78rem', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Phone size={13} color="#00a4e4" /> 088 9926 222 / 082 333 5977
            </span>
            <span className="hide-on-mobile" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={13} color="#00a4e4" /> Tầng 5 Tòa VNPT - 33 Lý Thái Tổ, TP. Bắc Ninh
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Social Icons */}
            <a href="https://facebook.com" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center' }} title="Facebook">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center' }} title="Instagram">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar Header */}
      <nav style={{ background: '#ffffff', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0, 59, 112, 0.08)', padding: '2px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px' }}>
          
          {/* Logo */}
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="/images/logo.png" 
              alt="3S Wellness Fitness & Yoga" 
              style={{ 
                height: '70px', 
                width: 'auto', 
                objectFit: 'contain'
              }} 
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="desktop-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link to="/" style={{ fontWeight: 700, color: 'var(--secondary-color)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TRANG CHỦ
            </Link>
            <a href="#about" style={{ fontWeight: 600, color: 'var(--primary-color)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              GIỚI THIỆU
            </a>
            <a href="#classes" style={{ fontWeight: 600, color: 'var(--primary-color)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              BỘ MÔN
            </a>
            <a href="#schedule" style={{ fontWeight: 600, color: 'var(--primary-color)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              LỊCH TẬP
            </a>

            {token ? (
              <>
                <Link to="/consultation" style={{ color: 'var(--secondary-color)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  TRỢ LÝ PT
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,164,228,0.08)', padding: '6px 14px', borderRadius: '20px' }}>
                  <UserIcon size={16} color="var(--primary-color)" />
                  <span style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '0.85rem' }}>{user?.username || 'admin'}</span>
                  <button onClick={handleLogout} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center', marginLeft: '4px' }} title="Đăng xuất">
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.88rem', textTransform: 'uppercase' }}>
                <LogIn size={16} color="var(--primary-color)" /> ĐĂNG NHẬP
              </Link>
            )}

            {/* CTA Enroll Button */}
            <a 
              href="tel:0889926222" 
              style={{ 
                background: 'linear-gradient(135deg, #00a4e4, #0082c5)', 
                color: 'white', 
                fontWeight: 700, 
                fontSize: '0.85rem', 
                padding: '9px 20px', 
                borderRadius: '30px', 
                boxShadow: '0 4px 14px rgba(0,164,228,0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Đăng Ký Ngay
            </a>
          </div>

          {/* Mobile Hamburger Menu Button */}
          <button
            className="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              padding: '8px',
              color: '#003b70',
              cursor: 'pointer'
            }}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-menu" style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: 700, color: 'var(--secondary-color)', fontSize: '1rem', textTransform: 'uppercase' }}>
              Trang Chủ
            </Link>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: 600, color: 'var(--primary-color)', fontSize: '1rem' }}>
              Giới Thiệu
            </a>
            <a href="#classes" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: 600, color: 'var(--primary-color)', fontSize: '1rem' }}>
              Các Bộ Môn
            </a>
            <a href="#schedule" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: 600, color: 'var(--primary-color)', fontSize: '1rem' }}>
              Lịch Tập Luyện
            </a>

            <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />

            {token ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link to="/consultation" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary-color)', fontWeight: 800, fontSize: '1rem' }}>
                  <Bot size={18} /> TRỢ LÝ PT & INBODY
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#003b70', fontWeight: 700 }}>
                    <UserIcon size={18} color="#00a4e4" /> {user?.username || 'admin'}
                  </div>
                  <button onClick={handleLogout} style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                    Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontWeight: 700, fontSize: '1rem' }}>
                <LogIn size={18} /> Đăng Nhập Hệ Thống
              </Link>
            )}

            <a 
              href="tel:0889926222" 
              style={{ 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #00a4e4, #0082c5)', 
                color: 'white', 
                fontWeight: 800, 
                fontSize: '0.95rem', 
                padding: '12px', 
                borderRadius: '12px', 
                boxShadow: '0 4px 14px rgba(0,164,228,0.3)',
                textTransform: 'uppercase',
                marginTop: '8px'
              }}
            >
              Đăng Ký Tập Thử Ngay
            </a>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
