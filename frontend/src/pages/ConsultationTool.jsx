import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Utensils, Activity, Target, Zap, ChevronRight, Sunrise, Sun, Apple, Moon } from 'lucide-react';

const ConsultationTool = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    gender: 'male',
    weight: '',
    height: '',
    age: '',
    activityLevel: 'moderate',
    goal: 'maintain'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/nutrition/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          weight: Number(formData.weight),
          height: Number(formData.height),
          age: Number(formData.age)
        })
      });
      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        alert(data.message || 'Lỗi khi tính toán');
      }
    } catch (err) {
      alert('Không thể kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '60px 24px', position: 'relative' }}>
      
      <div className="animate-fade-in-up" style={{ marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--secondary-color)', fontWeight: 600, marginBottom: '12px' }}>
          <Activity size={18} /> PT PORTAL
        </div>
        <h1 className="display-font" style={{ fontSize: '3.5rem', color: 'var(--primary-color)', lineHeight: 1.2 }}>PHÂN TÍCH<br/>THỂ TRẠNG & DINH DƯỠNG</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(350px, 1fr)', gap: '40px', alignItems: 'start' }}>
        
        {/* Input Form */}
        <div className="glass-card animate-fade-in-up delay-100" style={{ position: 'sticky', top: '100px' }}>
          <h2 className="display-font" style={{ fontSize: '2rem', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary-color)' }}>
            <Calculator color="var(--secondary-color)" size={28} /> THÔNG SỐ HỘI VIÊN
          </h2>
          <form onSubmit={handleCalculate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Giới tính</label>
                <select name="gender" value={formData.gender} onChange={handleChange} style={{ cursor: 'pointer' }}>
                  <option value="male">Nam giới</option>
                  <option value="female">Nữ giới</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tuổi</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} required min="10" max="100" placeholder="Ví dụ: 25" />
              </div>
              <div className="form-group">
                <label>Chiều cao (cm)</label>
                <input type="number" name="height" value={formData.height} onChange={handleChange} required min="100" max="250" placeholder="Ví dụ: 170" />
              </div>
              <div className="form-group">
                <label>Cân nặng (kg)</label>
                <input type="number" name="weight" value={formData.weight} onChange={handleChange} required min="30" max="200" placeholder="Ví dụ: 65" />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Mức độ vận động (Activity Level)</label>
              <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} style={{ cursor: 'pointer' }}>
                <option value="sedentary">Ít vận động (Dân văn phòng, không tập)</option>
                <option value="light">Vận động nhẹ (Tập 1-3 ngày/tuần)</option>
                <option value="moderate">Vận động vừa (Tập 3-5 ngày/tuần)</option>
                <option value="active">Vận động nhiều (Tập 6-7 ngày/tuần)</option>
                <option value="very_active">Vận động cường độ cao (VĐV, lao động nặng)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Mục tiêu tập luyện</label>
              <select name="goal" value={formData.goal} onChange={handleChange} style={{ cursor: 'pointer' }}>
                <option value="lose">Giảm cân / Giảm mỡ (-500 kcal)</option>
                <option value="maintain">Giữ dáng / Duy trì (+0 kcal)</option>
                <option value="gain">Tăng cân / Tăng cơ (+500 kcal)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '24px', fontSize: '1.2rem', padding: '16px' }} disabled={loading}>
              {loading ? 'ĐANG XỬ LÝ...' : 'PHÂN TÍCH CHỈ SỐ'} <ChevronRight style={{ marginLeft: '8px' }}/>
            </button>
          </form>
        </div>

        {/* Results */}
        {result ? (
          <div className="animate-fade-in-up delay-200" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Target Card */}
            <div className="glass-card" style={{ background: 'linear-gradient(135deg, var(--primary-color), #00284d)', color: 'white' }}>
              <h3 className="display-font" style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={20} color="var(--secondary-color)" /> NĂNG LƯỢNG MỤC TIÊU
              </h3>
              <div style={{ fontSize: '4.5rem', fontWeight: 'bold', fontFamily: 'Oswald', lineHeight: 1, marginBottom: '16px', color: 'var(--secondary-color)' }}>
                {result.targetCalories} <span style={{ fontSize: '1.5rem', fontWeight: 'normal', color: 'white', fontFamily: 'Montserrat' }}>kcal/ngày</span>
              </div>
              <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>BMR (Năng lượng nền)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{result.bmr} kcal</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>TDEE (Tổng tiêu hao)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{result.tdee} kcal</div>
                </div>
              </div>
            </div>

            {/* Macros Card */}
            <div className="glass-card">
              <h3 className="display-font" style={{ fontSize: '1.5rem', marginBottom: '24px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={20} color="var(--secondary-color)" /> TỈ LỆ MACRO (ĐA LƯỢNG)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ background: 'rgba(255, 51, 102, 0.05)', border: '1px solid rgba(255, 51, 102, 0.2)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--accent-color)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '8px' }}>Protein (30%)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Oswald', color: 'var(--text-dark)' }}>{result.macros.protein}g</div>
                </div>
                <div style={{ background: 'rgba(0, 164, 228, 0.05)', border: '1px solid rgba(0, 164, 228, 0.2)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--secondary-color)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '8px' }}>Carb (40%)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Oswald', color: 'var(--text-dark)' }}>{result.macros.carbs}g</div>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '8px' }}>Fat (30%)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Oswald', color: 'var(--text-dark)' }}>{result.macros.fat}g</div>
                </div>
              </div>
            </div>

            {/* Meals Card */}
            <div className="glass-card">
              <h3 className="display-font" style={{ fontSize: '1.5rem', marginBottom: '24px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Utensils size={20} color="var(--secondary-color)" /> GỢI Ý PHÂN BỔ BỮA ĂN
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { name: 'Bữa Sáng', pct: '25%', data: result.meals.breakfast, icon: <Sunrise size={22} color="var(--secondary-color)"/> },
                  { name: 'Bữa Trưa', pct: '35%', data: result.meals.lunch, icon: <Sun size={22} color="#f59e0b"/> },
                  { name: 'Bữa Phụ', pct: '10%', data: result.meals.snack, icon: <Apple size={22} color="var(--accent-color)"/> },
                  { name: 'Bữa Tối', pct: '30%', data: result.meals.dinner, icon: <Moon size={22} color="var(--primary-color)"/> }
                ].map((meal, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'var(--white)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', transition: 'transform 0.2s ease', cursor: 'default' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(8px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ background: 'rgba(0,0,0,0.03)', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>{meal.icon}</div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{meal.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--secondary-color)', fontWeight: 600 }}>{meal.pct} Năng lượng</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'Oswald', color: 'var(--primary-color)' }}>{meal.data.calories} kcal</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 500, marginTop: '4px' }}>
                        P: {meal.data.protein}g &bull; C: {meal.data.carbs}g &bull; F: {meal.data.fat}g
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="animate-fade-in-up delay-200" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', opacity: 0.5, textAlign: 'center' }}>
            <Activity size={64} color="var(--secondary-color)" style={{ marginBottom: '24px' }} />
            <h3 className="display-font" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>CHỜ PHÂN TÍCH</h3>
            <p style={{ maxWidth: '300px', margin: '16px auto', color: 'var(--text-light)' }}>Vui lòng nhập thông số hội viên ở form bên trái để hệ thống tính toán lộ trình dinh dưỡng.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default ConsultationTool;
