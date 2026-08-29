import {
  Clock,
  Coins,
  Flame,
  Layers,
  RefreshCw,
  Salad,
  Sparkles,
  Wand2,
} from 'lucide-react';
import type { CalculatedNutrition } from '../../types';

export const DIET_STYLES = [
  { id: 'vietnamese_easy', label: '🇻🇳 Món Việt dễ nấu / Tiết kiệm', desc: 'Thực phẩm tươi sống chợ Việt, nấu nhanh 15-20 phút' },
  { id: 'eat_clean', label: '🥗 Eat Clean Chuẩn Gym', desc: 'Ức gà, cá áp chảo, gạo lứt, khoai lang, rau luộc' },
  { id: 'high_protein_vegan', label: '🌿 Ăn Chay Giàu Protein', desc: 'Đậu phụ, nấm, hạt, yến mạch, whey thực vật' },
  { id: 'low_carb_keto', label: '🥑 Low-Carb / Giàu Chất Béo Tốt', desc: 'Hạn chế tinh bột dưới 50g, tăng chất béo tốt' },
  { id: 'office_eating_out', label: '🏢 Dân Văn Phòng Ăn Ngoài', desc: 'Gợi ý chọn món chuẩn tại quán cơm văn phòng' },
];

export const MEAL_COUNT_OPTIONS = [
  { value: 3, label: '3 bữa/ngày (Sáng - Trưa - Tối)' },
  { value: 4, label: '4 bữa/ngày (Sáng - Trưa - Phụ trước tập - Tối) - Chuẩn Gym' },
  { value: 5, label: '5 bữa/ngày (Tăng cơ nạc Lean Bulk)' },
  { value: 2, label: '2 bữa/ngày (Nhịn ăn gián đoạn IF 16/8)' },
];

export const ALLERGY_CHIPS = [
  'Dị ứng hải sản vỏ (tôm/cua)',
  'Không dung nạp lactose (sữa bò)',
  'Không ăn thịt đỏ (bò/heo)',
  'Không ăn cay / tiêu',
  'Không ăn trứng gà',
  'Không ăn đồ sống',
];

interface MealAiConfigStudioProps {
  mealCount: number;
  setMealCount: (val: number) => void;
  targetKcalInput: string;
  setTargetKcalInput: (val: string) => void;
  dietStyle: string;
  setDietStyle: (val: string) => void;
  budgetLevel: string;
  setBudgetLevel: (val: string) => void;
  workoutSchedule: string;
  setWorkoutSchedule: (val: string) => void;
  selectedAllergies: string[];
  toggleAllergy: (chip: string) => void;
  customDietNotes: string;
  setCustomDietNotes: (val: string) => void;
  loadingAi: boolean;
  onAiGenerate: () => void;
  appliedNutrition?: CalculatedNutrition | null;
}

export default function MealAiConfigStudio({
  mealCount,
  setMealCount,
  targetKcalInput,
  setTargetKcalInput,
  dietStyle,
  setDietStyle,
  budgetLevel,
  setBudgetLevel,
  workoutSchedule,
  setWorkoutSchedule,
  selectedAllergies,
  toggleAllergy,
  customDietNotes,
  setCustomDietNotes,
  loadingAi,
  onAiGenerate,
  appliedNutrition,
}: MealAiConfigStudioProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '14px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#00a4e4" />
          <strong style={{ fontSize: '0.95rem', color: '#003b70' }}>
            Cấu Hình Nhu Cầu Dinh Dưỡng Để AI Sinh Thực Đơn Phù Hợp
          </strong>
        </div>
        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
          Tùy chỉnh lịch trình, số bữa, chế độ ăn & dị ứng
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
        {/* Field 1: Meal Count */}
        <div>
          <label style={{ fontSize: '0.74rem', color: '#003b70', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            <Layers size={13} style={{ display: 'inline', marginRight: '4px' }} /> SỐ LƯỢNG BỮA ĂN / NGÀY
          </label>
          <select
            value={mealCount}
            onChange={(e) => setMealCount(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', fontWeight: 600 }}
          >
            {MEAL_COUNT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Field 2: Target Calories */}
        <div>
          <label style={{ fontSize: '0.74rem', color: '#003b70', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            <Flame size={13} style={{ display: 'inline', marginRight: '4px', color: '#ea580c' }} /> CALO MỤC TIÊU (KCAL/NGÀY)
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="number"
              value={targetKcalInput}
              onChange={(e) => setTargetKcalInput(e.target.value)}
              placeholder="VD: 1850"
              style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', fontWeight: 700, color: '#15803d' }}
            />
            {appliedNutrition && (
              <button
                type="button"
                onClick={() => setTargetKcalInput(String(appliedNutrition.targetCalories))}
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0 10px', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                title="Lấy số Calo vừa tính ở Tab 1"
              >
                Lấy từ Tab 1
              </button>
            )}
          </div>
        </div>

        {/* Field 3: Diet Style */}
        <div>
          <label style={{ fontSize: '0.74rem', color: '#003b70', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            <Salad size={13} style={{ display: 'inline', marginRight: '4px', color: '#16a34a' }} /> PHONG CÁCH ẨM THỰC
          </label>
          <select
            value={dietStyle}
            onChange={(e) => setDietStyle(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', fontWeight: 600 }}
          >
            {DIET_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Field 4: Budget Level */}
        <div>
          <label style={{ fontSize: '0.74rem', color: '#003b70', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            <Coins size={13} style={{ display: 'inline', marginRight: '4px', color: '#d97706' }} /> MỨC NGÂN SÁCH THỰC PHẨM
          </label>
          <select
            value={budgetLevel}
            onChange={(e) => setBudgetLevel(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', fontWeight: 600 }}
          >
            <option value="BUDGET">Bình dân / Tiết kiệm </option>
            <option value="STANDARD">Tiêu chuẩn Gym </option>
            <option value="PREMIUM">Cao cấp </option>
          </select>
        </div>
      </div>

      {/* Schedule & Workout Times */}
      <div>
        <label style={{ fontSize: '0.74rem', color: '#003b70', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
          <Clock size={13} style={{ display: 'inline', marginRight: '4px', color: '#0284c7' }} /> LỊCH SINH HOẠT & GIỜ TẬP LUYỆN THỰC TẾ
        </label>
        <input
          value={workoutSchedule}
          onChange={(e) => setWorkoutSchedule(e.target.value)}
          placeholder="VD: Sáng ăn 7h30, Trưa 12h, Tập gym 17h30-19h, Tối 20h (AI sẽ tự căn carb/đạm quanh giờ tập)"
          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', color: '#1e293b' }}
        />
      </div>

      {/* Allergies & Dietary Restrictions */}
      <div>
        <label style={{ fontSize: '0.74rem', color: '#003b70', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
          🚫 THỰC PHẨM KIÊNG KỴ / DỊ ỨNG (AI SẼ LOẠI BỎ 100%)
        </label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {ALLERGY_CHIPS.map((chip) => {
            const active = selectedAllergies.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                onClick={() => toggleAllergy(chip)}
                style={{
                  background: active ? '#fef2f2' : '#f8fafc',
                  color: active ? '#dc2626' : '#64748b',
                  border: active ? '1px solid #fecaca' : '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {active ? '✕ ' : '+ '} {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom PT Notes */}
      <div>
        <label style={{ fontSize: '0.74rem', color: '#003b70', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
          📝 GHI CHÚ BỔ SUNG TỪ PT (SỞ THÍCH, MÓN ĂN THÍCH, YÊU CẦU ĐẶC THÙ)
        </label>
        <input
          value={customDietNotes}
          onChange={(e) => setCustomDietNotes(e.target.value)}
          placeholder="VD: Học viên thích uống cafe đen buổi sáng, cần snack chống đói lúc 15h, ghét ăn ức gà luộc..."
          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', color: '#1e293b' }}
        />
      </div>

      {/* Big Action Button */}
      <button
        type="button"
        onClick={onAiGenerate}
        disabled={loadingAi}
        style={{
          background: 'linear-gradient(135deg, #003b70 0%, #00a4e4 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '10px',
          padding: '13px 20px',
          fontWeight: 800,
          fontSize: '0.92rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 4px 14px rgba(0, 59, 112, 0.25)',
          marginTop: '4px',
        }}
      >
        {loadingAi ? <RefreshCw size={18} className="spin" /> : <Wand2 size={18} />}
        {loadingAi ? 'AI đang phân tích và tạo thực đơn chi tiết...' : 'AI Sinh Thực Đơn Chi Tiết 100% Khớp Hồ Sơ'}
      </button>
    </div>
  );
}
