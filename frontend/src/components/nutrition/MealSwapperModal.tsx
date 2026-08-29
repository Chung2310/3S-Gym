import { useState, useId } from 'react';
import { ArrowRightLeft, Check, Sparkles, Utensils, X } from 'lucide-react';
import type { FoodItem } from '../../types';

const FOOD_DATABASE: FoodItem[] = [
  // Protein
  { id: 'chicken_breast', name: 'Ức gà tươi không da', category: 'protein', categoryLabel: 'Đạm (Protein)', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, unit: 'g', defaultServingGrams: 150 },
  { id: 'beef_lean', name: 'Thịt bò thăn nạc', category: 'protein', categoryLabel: 'Đạm (Protein)', caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15, unit: 'g', defaultServingGrams: 150 },
  { id: 'salmon', name: 'Cá hồi Na Uy', category: 'protein', categoryLabel: 'Đạm (Protein)', caloriesPer100g: 206, proteinPer100g: 22, carbsPer100g: 0, fatPer100g: 13, unit: 'g', defaultServingGrams: 150 },
  { id: 'shrimp', name: 'Tôm thô luộc/hấp', category: 'protein', categoryLabel: 'Đạm (Protein)', caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3, unit: 'g', defaultServingGrams: 150 },
  { id: 'pork_tenderloin', name: 'Thịt thăn heo nạc', category: 'protein', categoryLabel: 'Đạm (Protein)', caloriesPer100g: 143, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 3.5, unit: 'g', defaultServingGrams: 150 },
  { id: 'whole_egg', name: 'Trứng gà nguyên quả (1 quả ~ 50g)', category: 'protein', categoryLabel: 'Đạm (Protein)', caloriesPer100g: 144, proteinPer100g: 12.6, carbsPer100g: 0.8, fatPer100g: 9.6, unit: 'g', defaultServingGrams: 100 },
  { id: 'egg_white', name: 'Lòng trắng trứng gà (1 quả ~ 33g)', category: 'protein', categoryLabel: 'Đạm (Protein)', caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2, unit: 'g', defaultServingGrams: 100 },
  { id: 'whey_isolate', name: 'Whey Protein Isolate (1 scoop ~ 30g)', category: 'protein', categoryLabel: 'Đạm (Protein)', caloriesPer100g: 400, proteinPer100g: 90, carbsPer100g: 3.3, fatPer100g: 1.6, unit: 'g', defaultServingGrams: 30 },

  // Carbs
  { id: 'white_rice', name: 'Cơm trắng', category: 'carbs', categoryLabel: 'Tinh bột (Carbs)', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, unit: 'g', defaultServingGrams: 150 },
  { id: 'brown_rice', name: 'Cơm gạo lứt', category: 'carbs', categoryLabel: 'Tinh bột (Carbs)', caloriesPer100g: 111, proteinPer100g: 2.6, carbsPer100g: 23, fatPer100g: 0.9, unit: 'g', defaultServingGrams: 150 },
  { id: 'sweet_potato', name: 'Khoai lang luộc', category: 'carbs', categoryLabel: 'Tinh bột (Carbs)', caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1, unit: 'g', defaultServingGrams: 200 },
  { id: 'oats', name: 'Yến mạch thô cán vỡ', category: 'carbs', categoryLabel: 'Tinh bột (Carbs)', caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66, fatPer100g: 6.9, unit: 'g', defaultServingGrams: 50 },
  { id: 'whole_wheat_bread', name: 'Bánh mì đen nguyên cám (1 lát ~ 30g)', category: 'carbs', categoryLabel: 'Tinh bột (Carbs)', caloriesPer100g: 265, proteinPer100g: 13, carbsPer100g: 43, fatPer100g: 3.3, unit: 'g', defaultServingGrams: 60 },

  // Fat
  { id: 'avocado', name: 'Bơ sáp chín', category: 'fat', categoryLabel: 'Chất béo tốt (Fat)', caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 8.5, fatPer100g: 14.7, unit: 'g', defaultServingGrams: 50 },
  { id: 'almonds', name: 'Hạt hạnh nhân nướng', category: 'fat', categoryLabel: 'Chất béo tốt (Fat)', caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50, unit: 'g', defaultServingGrams: 20 },
  { id: 'olive_oil', name: 'Dầu Olive Extra Virgin (1 thìa ~ 5g)', category: 'fat', categoryLabel: 'Chất béo tốt (Fat)', caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, unit: 'g', defaultServingGrams: 10 },
  { id: 'peanuts', name: 'Lạc / Đậu phộng rang', category: 'fat', categoryLabel: 'Chất béo tốt (Fat)', caloriesPer100g: 567, proteinPer100g: 26, carbsPer100g: 16, fatPer100g: 49, unit: 'g', defaultServingGrams: 20 },

  // Veggies
  { id: 'broccoli', name: 'Bông cải xanh (Súp lơ)', category: 'veggies', categoryLabel: 'Rau củ / Xơ', caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 6.6, fatPer100g: 0.4, unit: 'g', defaultServingGrams: 100 },
  { id: 'water_spinach', name: 'Rau muống luộc', category: 'veggies', categoryLabel: 'Rau củ / Xơ', caloriesPer100g: 19, proteinPer100g: 3.2, carbsPer100g: 2.1, fatPer100g: 0.4, unit: 'g', defaultServingGrams: 150 },
  { id: 'cucumber', name: 'Dưa chuột tươi', category: 'veggies', categoryLabel: 'Rau củ / Xơ', caloriesPer100g: 15, proteinPer100g: 0.7, carbsPer100g: 3.6, fatPer100g: 0.1, unit: 'g', defaultServingGrams: 150 },
];

interface MealSwapperModalProps {
  open: boolean;
  onClose: () => void;
}

export default function MealSwapperModal({ open, onClose }: MealSwapperModalProps) {
  const sourceFoodId = useId();
  const sourceGramsId = useId();
  const targetFoodId = useId();

  const [activeCategory, setActiveCategory] = useState<'protein' | 'carbs' | 'fat' | 'veggies'>('protein');
  const [sourceFood, setSourceFood] = useState<FoodItem>(FOOD_DATABASE[0]);
  const [sourceGrams, setSourceGrams] = useState<string>('150');
  const [targetFood, setTargetFood] = useState<FoodItem>(FOOD_DATABASE[1]);

  if (!open) return null;

  const categoryFoods = FOOD_DATABASE.filter((f) => f.category === activeCategory);

  // Conversion calculations
  const gramsA = parseFloat(sourceGrams) || 100;
  const factorA = gramsA / 100;

  const proteinA = parseFloat((sourceFood.proteinPer100g * factorA).toFixed(1));
  const carbsA = parseFloat((sourceFood.carbsPer100g * factorA).toFixed(1));
  const fatA = parseFloat((sourceFood.fatPer100g * factorA).toFixed(1));
  const caloriesA = Math.round(sourceFood.caloriesPer100g * factorA);

  // Calculate required grams of Food B to match the primary macro of the category
  let requiredGramsB = 100;
  if (activeCategory === 'protein') {
    requiredGramsB = targetFood.proteinPer100g > 0 ? Math.round((proteinA / targetFood.proteinPer100g) * 100) : 100;
  } else if (activeCategory === 'carbs') {
    requiredGramsB = targetFood.carbsPer100g > 0 ? Math.round((carbsA / targetFood.carbsPer100g) * 100) : 100;
  } else if (activeCategory === 'fat') {
    requiredGramsB = targetFood.fatPer100g > 0 ? Math.round((fatA / targetFood.fatPer100g) * 100) : 100;
  } else {
    requiredGramsB = gramsA;
  }

  const factorB = requiredGramsB / 100;
  const proteinB = parseFloat((targetFood.proteinPer100g * factorB).toFixed(1));
  const carbsB = parseFloat((targetFood.carbsPer100g * factorB).toFixed(1));
  const fatB = parseFloat((targetFood.fatPer100g * factorB).toFixed(1));
  const caloriesB = Math.round(targetFood.caloriesPer100g * factorB);

  const calDiff = caloriesB - caloriesA;

  const handleCategoryChange = (cat: 'protein' | 'carbs' | 'fat' | 'veggies') => {
    setActiveCategory(cat);
    const list = FOOD_DATABASE.filter((f) => f.category === cat);
    if (list.length >= 2) {
      setSourceFood(list[0]);
      setTargetFood(list[1]);
      setSourceGrams(String(list[0].defaultServingGrams));
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-label="Thay thế món ăn tương đương macro">
      <div
        className="modal"
        style={{
          maxWidth: '740px',
          width: '95%',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#00a4e4', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                Công Cụ Đổi Món Tương Đương Macro (Meal Swapper)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Quy đổi chính xác số gram thực phẩm thay thế để đảm bảo không bị lệch Calo & Protein của học viên.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Category Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
          {[
            { id: 'protein', label: '🥩 Nhóm Đạm (Protein)' },
            { id: 'carbs', label: '🍚 Nhóm Tinh Bột (Carbs)' },
            { id: 'fat', label: '🥑 Nhóm Chất Béo (Fat)' },
            { id: 'veggies', label: '🥦 Rau Củ & Chất Xơ' },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleCategoryChange(c.id as any)}
              style={{
                background: activeCategory === c.id ? 'var(--primary-color)' : '#f1f5f9',
                color: activeCategory === c.id ? '#ffffff' : '#475569',
                border: '1px solid',
                borderColor: activeCategory === c.id ? 'var(--primary-color)' : '#cbd5e1',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Side-by-side Conversion UI */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '14px', alignItems: 'center', marginBottom: '20px' }}>
          {/* Source Food (From) */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '16px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Món Ăn Gốc Trong Thực Đơn
            </span>

            <div style={{ marginBottom: '12px' }}>
              <label htmlFor={sourceFoodId} style={{ display: 'block', fontSize: '0.74rem', color: '#475569', fontWeight: 600, marginBottom: '2px' }}>Chọn món</label>
              <select
                id={sourceFoodId}
                value={sourceFood.id}
                onChange={(e) => {
                  const found = FOOD_DATABASE.find((f) => f.id === e.target.value);
                  if (found) setSourceFood(found);
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', fontWeight: 600 }}
              >
                {categoryFoods.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label htmlFor={sourceGramsId} style={{ display: 'block', fontSize: '0.74rem', color: '#475569', fontWeight: 600, marginBottom: '2px' }}>Khối lượng (gram)</label>
              <input
                id={sourceGramsId}
                type="number"
                step="5"
                value={sourceGrams}
                onChange={(e) => setSourceGrams(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
              />
            </div>

            {/* Nutrients of Food A */}
            <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#003b70', marginBottom: '4px' }}>
                {caloriesA} kcal
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', color: '#475569' }}>
                <span>P: <strong>{proteinA}g</strong></span>
                <span>C: <strong>{carbsA}g</strong></span>
                <span>F: <strong>{fatA}g</strong></span>
              </div>
            </div>
          </div>

          {/* Swap Arrow Icon */}
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <ArrowRightLeft size={18} />
          </div>

          {/* Target Food (To) */}
          <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '16px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Món Đổi Sang (Tương Đương)
            </span>

            <div style={{ marginBottom: '12px' }}>
              <label htmlFor={targetFoodId} style={{ display: 'block', fontSize: '0.74rem', color: '#166534', fontWeight: 600, marginBottom: '2px' }}>Chọn món thay thế</label>
              <select
                id={targetFoodId}
                value={targetFood.id}
                onChange={(e) => {
                  const found = FOOD_DATABASE.find((f) => f.id === e.target.value);
                  if (found) setTargetFood(found);
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '0.85rem', background: '#fff', fontWeight: 600 }}
              >
                {categoryFoods.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <span style={{ display: 'block', fontSize: '0.74rem', color: '#166534', fontWeight: 600, marginBottom: '2px' }}>Số gram cần ăn chuẩn</span>
              <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1.5px solid #22c55e', fontSize: '1.15rem', fontWeight: 900, color: '#15803d' }}>
                {requiredGramsB} gram
              </div>
            </div>

            {/* Nutrients of Food B */}
            <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#15803d', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{caloriesB} kcal</span>
                <span style={{ fontSize: '0.72rem', color: calDiff > 0 ? '#ea580c' : '#16a34a', fontWeight: 700 }}>
                  ({calDiff > 0 ? `+${calDiff}` : calDiff} kcal)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', color: '#166534' }}>
                <span>P: <strong>{proteinB}g</strong></span>
                <span>C: <strong>{carbsB}g</strong></span>
                <span>F: <strong>{fatB}g</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid #bae6fd', borderRadius: '10px', padding: '14px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sparkles size={24} color="#0284c7" />
          <div style={{ fontSize: '0.85rem', color: '#0369a1', lineHeight: 1.5 }}>
            👉 <strong>Khuyến nghị cho PT:</strong> Khi học viên chán <strong>{gramsA}g {sourceFood.name}</strong>, có thể đổi sang <strong>{requiredGramsB}g {targetFood.name}</strong>. Hàm lượng dinh dưỡng tương đương ({activeCategory === 'protein' ? `${proteinA}g Protein` : `${carbsA}g Carbs`}) và calo chỉ chênh lệch <strong>{Math.abs(calDiff)} kcal</strong>.
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="button button-primary"
            onClick={onClose}
            style={{ padding: '8px 20px', fontSize: '0.88rem' }}
          >
            <Check size={16} /> Đã hiểu & Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
