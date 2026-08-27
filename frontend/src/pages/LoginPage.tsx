import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useToast } from '../components/ToastProvider';
import { destinationForRole, saveSession } from '../services/session';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        saveSession(data.data);
        toast.success(data.message || 'Đăng nhập thành công.');
        navigate(destinationForRole());
      } else {
        toast.error(data.message || 'Tài khoản hoặc mật khẩu không chính xác.');
      }
    } catch {
      toast.error('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* LEFT COLUMN: BRAND PHOTO & OVERLAY */}
      <div style={{ position: 'relative', width: '100%', height: '100%', background: '#07162c', overflow: 'hidden' }}>
        <img 
          src="/images/login_bg.jpg" 
          alt="3S Wellness Kickfit PT Training" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }} 
        />
        <div style={{ 
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'linear-gradient(135deg, rgba(0, 59, 112, 0.9) 0%, rgba(0, 164, 228, 0.45) 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 40px', color: 'white'
        }}>
          <div>
            <Link to="/">
              <img src="/images/logo-white.png" alt="3S Wellness Logo" style={{ height: '70px', width: 'auto', objectFit: 'contain' }} />
            </Link>
          </div>

          <div style={{ maxWidth: '480px' }}>
            <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(0,164,228,0.25)', color: '#00a4e4', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '1px', marginBottom: '14px' }}>
              GYM • YOGA • ZUMBA • KICKFIT & TRỊ LIỆU
            </div>
            <h1 style={{ fontSize: '2.5rem', lineHeight: '1.2', fontWeight: 800, fontFamily: "'Be Vietnam Pro', sans-serif", marginBottom: '14px' }}>
              CỔNG QUẢN TRỊ PT & TRỢ LÝ AI 3S BẮC NINH
            </h1>
            <p style={{ fontSize: '1rem', opacity: 0.9, lineHeight: 1.5, fontWeight: 400 }}>
              Hệ thống quản trị chuyên dụng hỗ trợ HLV PT tính toán chỉ số thể trạng và tư vấn thực đơn hội viên.
            </p>
          </div>

          <div style={{ opacity: 0.6, fontSize: '0.8rem' }}>
            © 2026 3S WELLNESS FITNESS & YOGA. Tầng 5 Tòa Nhà VNPT - 33 Lý Thái Tổ - Tp. Bắc Ninh.
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: COMPACT LOGIN FORM (NO SCROLL NEEDED) */}
      <div style={{ background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', position: 'relative', height: '100vh' }}>
        
        <div style={{ width: '100%', maxWidth: '380px' }}>
          
          {/* Back to Home Link */}
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', marginBottom: '24px', transition: 'color 0.2s ease' }} onMouseOver={(e) => e.currentTarget.style.color = '#00a4e4'} onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}>
            <ArrowLeft size={16} /> Quay về Trang chủ 3S Gym
          </Link>

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '2rem', color: '#003b70', fontWeight: 800, fontFamily: "'Be Vietnam Pro', sans-serif", marginBottom: '6px' }}>
              ĐĂNG NHẬP PT PORTAL
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Nhập tài khoản quản trị để truy cập Trợ Lý AI PT
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#003b70', marginBottom: '6px', display: 'block' }}>
                Tài khoản
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="Tên đăng nhập..."
                  style={{ width: '100%', padding: '12px 14px 12px 44px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                  required 
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#003b70', marginBottom: '6px', display: 'block' }}>
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '12px 44px 12px 44px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #003b70 0%, #00a4e4 100%)',
                color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 6px 16px rgba(0, 59, 112, 0.25)', marginTop: '8px'
              }}
            >
              {loading ? 'Đang xác thực...' : (
                <>
                  VÀO HỆ THỐNG <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};

export default LoginPage;
