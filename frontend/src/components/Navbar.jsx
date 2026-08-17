import { Link, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      {/* Main Navbar */}
      <nav style={{ background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0, 59, 112, 0.08)', padding: '4px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '75px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="/images/logo.png" 
              alt="3S Wellness Logo" 
              style={{ 
                height: '90px', 
                width: 'auto', 
                objectFit: 'contain',
                margin: '-10px 0'
              }} 
            />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <Link to="/" style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '1rem' }}>Trang chủ</Link>
            {token ? (
              <>
                <Link to="/consultation" style={{ color: 'var(--secondary-color)', fontWeight: 'bold', fontSize: '1rem' }}>Tư vấn PT</Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,164,228,0.08)', padding: '6px 14px', borderRadius: '20px' }}>
                  <UserIcon size={18} color="var(--primary-color)" />
                  <span style={{ fontWeight: 600, color: 'var(--primary-color)', fontSize: '0.95rem' }}>{user?.username || 'admin'}</span>
                  <button onClick={handleLogout} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center', marginLeft: '4px' }} title="Đăng xuất">
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,164,228,0.08)', padding: '6px 16px', borderRadius: '20px', color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.95rem' }}>
                <LogIn size={18} color="var(--primary-color)" /> Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
