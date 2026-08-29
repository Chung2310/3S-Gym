import {
  ArrowRightLeft,
  Clock,
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

export interface MealFoodItem {
  name: string;
  amount: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  prepTip?: string;
}

export interface MealBlock {
  id: string;
  name: string;
  timeSlot?: string;
  targetKcal: number;
  items: MealFoodItem[];
  imageUrl?: string;
}

interface MealCardItemProps {
  meal: MealBlock;
  mealIdx: number;
  mealsCount: number;
  isGeneratingImg: boolean;
  onUpdateMealName: (mealIdx: number, name: string) => void;
  onUpdateMealTimeSlot: (mealIdx: number, timeSlot: string) => void;
  onRemoveMeal: (mealIdx: number) => void;
  onAddItem: (mealIdx: number) => void;
  onRemoveItem: (mealIdx: number, itemIdx: number) => void;
  onUpdateItem: (mealIdx: number, itemIdx: number, field: keyof MealFoodItem, val: any) => void;
  onGenerateImage: (mealIdx: number) => void;
  onOpenSwapper: () => void;
  onPreviewImage: (preview: { url: string; title: string }) => void;
}

export default function MealCardItem({
  meal,
  mealIdx,
  mealsCount,
  isGeneratingImg,
  onUpdateMealName,
  onUpdateMealTimeSlot,
  onRemoveMeal,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onGenerateImage,
  onOpenSwapper,
  onPreviewImage,
}: MealCardItemProps) {
  const mealKcal = meal.items.reduce((s, i) => s + (i.calories || 0), 0);
  const mealP = meal.items.reduce((s, i) => s + (i.protein || 0), 0);
  const mealC = meal.items.reduce((s, i) => s + (i.carbs || 0), 0);
  const mealF = meal.items.reduce((s, i) => s + (i.fat || 0), 0);

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
      }}
    >
      {/* Meal Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
        <div>
          <input
            value={meal.name}
            onChange={(e) => onUpdateMealName(mealIdx, e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              fontWeight: 800,
              fontSize: '0.95rem',
              color: '#003b70',
              outline: 'none',
              width: '100%',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <Clock size={12} color="#64748b" />
            <input
              value={meal.timeSlot || ''}
              onChange={(e) => onUpdateMealTimeSlot(mealIdx, e.target.value)}
              placeholder="07:00 - 07:45"
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '0.74rem',
                color: '#64748b',
                fontWeight: 600,
                outline: 'none',
                width: '120px',
              }}
            />
          </div>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div>
            <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#16a34a' }}>
              {mealKcal} kcal
            </span>
            <div style={{ fontSize: '0.7rem', color: '#1d4ed8', fontWeight: 700 }}>
              P:{mealP}g | C:{mealC}g | F:{mealF}g
            </div>
          </div>
          {mealsCount > 1 && (
            <button
              type="button"
              onClick={() => onRemoveMeal(mealIdx)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
              title="Xóa bữa ăn này"
            >
              <X size={14} color="#ef4444" />
            </button>
          )}
        </div>
      </div>

      {/* AI Image Generation In-Progress Animation */}
      {isGeneratingImg && (
        <div
          style={{
            height: '140px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '2px dashed #86efac',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: '#15803d',
            textAlign: 'center',
            padding: '10px',
          }}
        >
          <RefreshCw size={26} className="spin" color="#16a34a" />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>
              FLUX.2 Klein 4B đang vẽ ảnh ẩm thực...
            </div>
            <div style={{ fontSize: '0.7rem', color: '#166534' }}>
              Tạo ảnh chất lượng cao 4K cho món ăn trong bữa
            </div>
          </div>
        </div>
      )}

      {/* AI Meal Image Display (if generated) */}
      {!isGeneratingImg && meal.imageUrl && (
        <div
          style={{
            position: 'relative',
            borderRadius: '10px',
            overflow: 'hidden',
            height: '140px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
          }}
          onClick={() => onPreviewImage({ url: meal.imageUrl!, title: meal.name })}
        >
          <img
            src={meal.imageUrl}
            alt={meal.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
              padding: '6px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#ffffff', fontSize: '0.72rem', fontWeight: 700 }}>
              Ảnh AI minh họa (FLUX.2)
            </span>
            <span style={{ color: '#38bdf8', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <ExternalLink size={11} /> Xem lớn
            </span>
          </div>
        </div>
      )}

      {/* Meal Food Items List */}
      <div style={{ display: 'grid', gap: '8px' }}>
        {meal.items.map((item, itemIdx) => (
          <div
            key={itemIdx}
            style={{
              background: '#f8fafc',
              border: '1px solid #f1f5f9',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <input
                value={item.name}
                onChange={(e) => onUpdateItem(mealIdx, itemIdx, 'name', e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#16a34a' }}>
                  {item.calories} kcal
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveItem(mealIdx, itemIdx)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                  title="Xóa món"
                >
                  <Trash2 size={13} style={{ color: '#ef4444' }} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '1 1 auto', minWidth: '140px' }}>
                <span style={{ fontWeight: 600, color: '#64748b' }}>Định lượng:</span>
                <input
                  value={item.amount}
                  onChange={(e) => onUpdateItem(mealIdx, itemIdx, 'amount', e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '100px',
                    padding: '3px 8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    background: '#ffffff',
                  }}
                  placeholder="VD: 150g thịt ức gà"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem' }}>P: {item.protein || 0}g</span>
                <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem' }}>C: {item.carbs || 0}g</span>
                <span style={{ background: '#fdf2f8', color: '#be185d', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem' }}>F: {item.fat || 0}g</span>
              </div>
            </div>

            {item.prepTip && (
              <div style={{ fontSize: '0.7rem', color: '#0284c7', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span>🍳 Chế biến:</span>
                <input
                  value={item.prepTip}
                  onChange={(e) => onUpdateItem(mealIdx, itemIdx, 'prepTip', e.target.value)}
                  style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '0.7rem', color: '#0284c7', fontStyle: 'italic', outline: 'none' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add item & AI Image buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap', gap: '6px' }}>
        <button
          type="button"
          onClick={() => onAddItem(mealIdx)}
          style={{
            background: 'none',
            border: '1px dashed #cbd5e1',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.76rem',
            color: '#0284c7',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Plus size={13} /> Thêm món
        </button>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => onGenerateImage(mealIdx)}
            disabled={isGeneratingImg}
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              color: '#166534',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Tạo ảnh món ăn minh họa bằng AI FLUX.2"
          >
            {isGeneratingImg ? <RefreshCw size={13} className="spin" /> : <Sparkles size={13} color="#16a34a" />}
            {isGeneratingImg ? 'Đang vẽ...' : meal.imageUrl ? 'Vẽ lại ảnh' : 'Sinh ảnh AI'}
          </button>

          <button
            type="button"
            onClick={onOpenSwapper}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.75rem',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ArrowRightLeft size={12} color="#0284c7" /> Đổi món
          </button>
        </div>
      </div>
    </div>
  );
}
