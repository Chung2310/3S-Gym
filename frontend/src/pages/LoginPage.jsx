import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Activity } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/consultation');
      } else {
        setError(data.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setError('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', background: 'var(--bg-color)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Decorative background shapes */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(0,164,228,0.15) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(0,59,112,0.1) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }}></div>

      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', zIndex: 1 }}>
        <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: '450px', padding: '48px' }}>
          
          <div className="text-center" style={{ marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(0,164,228,0.1)', borderRadius: '50%', marginBottom: '24px' }}>
              <Activity size={40} color="var(--primary-color)" />
            </div>
            <h2 className="display-font" style={{ color: 'var(--primary-color)', fontSize: '2.5rem', marginBottom: '8px' }}>PT PORTAL</h2>
            <p style={{ color: 'var(--text-light)', fontWeight: 500 }}>Hệ thống quản lý & Tư vấn dinh dưỡng</p>
          </div>
          
          {error && (
            <div className="animate-fade-in-up" style={{ background: '#ffebee', color: '#c62828', padding: '16px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center', fontWeight: 600, borderLeft: '4px solid #c62828' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Tên đăng nhập</label>
              <div style={{ position: 'relative' }}>
                <User size={20} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-light)' }} />
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="Ví dụ: admin"
                  style={{ paddingLeft: '48px' }}
                  required 
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '32px' }}>
              <label>Mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-light)' }} />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Ví dụ: 123456"
                  style={{ paddingLeft: '48px' }}
                  required 
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '16px' }} disabled={loading}>
              {loading ? 'Đang xác thực...' : 'VÀO HỆ THỐNG'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
