import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRightLeft,
  Check,
  CheckCircle2,
  Image as ImageIcon,
  Info,
  Plus,
  RefreshCw,
  Salad,
  Save,
  Send,
  Sliders,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { errorMessage } from '../../types';
import type { Customer, NutritionDraftPlan, MealDishItem, CalculatedNutrition, AiNutritionAnalysisResult } from '../../types';
import MealSwapperModal from './MealSwapperModal';
import MealInfographicPoster from '../MealInfographicPoster';
import MealAiConfigStudio, { DIET_STYLES, ALLERGY_CHIPS } from './MealAiConfigStudio';
import MealCardItem, { type MealBlock, type MealFoodItem } from './MealCardItem';
import MealImagePreviewModal from './MealImagePreviewModal';

interface MealPlannerBuilderProps {
  selectedCustomer?: Customer | null;
  customerId?: string;
  onSaved?: () => void;
  onBack?: () => void;
  editingPlan?: any | null;
  appliedNutrition?: CalculatedNutrition | null;
  appliedAiAnalysis?: AiNutritionAnalysisResult | null;
}

export default function MealPlannerBuilder({
  selectedCustomer,
  customerId,
  onSaved,
  onBack,
  editingPlan,
  appliedNutrition,
  appliedAiAnalysis,
}: MealPlannerBuilderProps) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [meals, setMeals] = useState<MealBlock[]>([]);
  const [dietAdviceNotes, setDietAdviceNotes] = useState('');
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  // AI Configuration Studio State
  const [showConfigStudio, setShowConfigStudio] = useState(true);
  const [mealCount, setMealCount] = useState<number>(4);
  const [targetKcalInput, setTargetKcalInput] = useState<string>('1850');
  const [dietStyle, setDietStyle] = useState<string>('vietnamese_easy');
  const [workoutSchedule, setWorkoutSchedule] = useState<string>('Tập gym chiều 17h30 - 19h00, làm văn phòng ngồi nhiều');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customDietNotes, setCustomDietNotes] = useState<string>('');
  const [budgetLevel, setBudgetLevel] = useState<string>('STANDARD');

  // Loading & View States
  const [loadingAi, setLoadingAi] = useState(false);
  const [mealAiProgress, setMealAiProgress] = useState<number>(0);
  const [mealAiStage, setMealAiStage] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const [swapperOpen, setSwapperOpen] = useState(false);
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Animated Loading Progress Tracker
  useEffect(() => {
    if (!loadingAi) {
      setMealAiProgress(0);
      setMealAiStage(0);
      return;
    }
    setMealAiProgress(15);
    setMealAiStage(1);
    const t1 = setTimeout(() => { setMealAiProgress(42); setMealAiStage(2); }, 1200);
    const t2 = setTimeout(() => { setMealAiProgress(70); setMealAiStage(3); }, 2800);
    const t3 = setTimeout(() => { setMealAiProgress(92); setMealAiStage(4); }, 4600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [loadingAi]);

  // Sync editingPlan or new draft when props change
  useEffect(() => {
    if (editingPlan) {
      setCurrentPlanId(editingPlan._id || editingPlan.id || null);
      if (editingPlan.title) setTitle(editingPlan.title);
      if (editingPlan.notes) setDietAdviceNotes(editingPlan.notes);
      if (editingPlan.targetCalories) setTargetKcalInput(String(editingPlan.targetCalories));
      if (Array.isArray(editingPlan.menu) && editingPlan.menu.length > 0) {
        setMealCount(editingPlan.menu.length);
        const parsedMeals: MealBlock[] = editingPlan.menu.map((m: any, idx: number) => {
          const rawItems = Array.isArray(m.items) ? m.items : [];
          const mealFoods: MealFoodItem[] = rawItems.map((it: any) => {
            if (typeof it === 'object' && it !== null) {
              return {
                name: it.name || 'Món ăn',
                amount: it.amount || '100g',
                calories: it.calories || 100,
                protein: it.protein || 10,
                carbs: it.carbs || 10,
                fat: it.fat || 3,
                prepTip: it.prepTip || undefined,
              };
            }
            const str = String(it);
            return {
              name: str.split('(')[0]?.trim() || str,
              amount: '1 khẩu phần',
              calories: 120,
              protein: 15,
              carbs: 10,
              fat: 3,
            };
          });

          return {
            id: `meal_loaded_${idx + 1}`,
            name: m.name || `Bữa ${idx + 1}`,
            timeSlot: m.timeSlot || '08:00',
            targetKcal: m.calories || 400,
            items: mealFoods,
            imageUrl: m.imageUrl || undefined,
          };
        });
        setMeals(parsedMeals);
        setShowConfigStudio(false);
      }
    } else if (appliedAiAnalysis) {
      setCurrentPlanId(null);
      setTitle(`Thực Đơn ${appliedAiAnalysis.goalLabel} - ${selectedCustomer?.fullName || 'Học viên'}`);
      setTargetKcalInput(String(appliedAiAnalysis.targetCalories));
      if (appliedAiAnalysis.dietaryAdvice?.keyNotes) {
        setDietAdviceNotes(appliedAiAnalysis.dietaryAdvice.keyNotes);
      }
      if (appliedAiAnalysis.timingStrategy && appliedAiAnalysis.timingStrategy.length > 0) {
        setMealCount(appliedAiAnalysis.timingStrategy.length);
        const timingMeals: MealBlock[] = appliedAiAnalysis.timingStrategy.map((ts, idx) => ({
          id: `meal_ai_timing_${idx + 1}`,
          name: `${ts.meal} (${ts.focus})`,
          timeSlot: ts.time,
          targetKcal: ts.calorieTarget,
          items: [],
        }));
        setMeals(timingMeals);
      }
      setShowConfigStudio(true);
    } else if (appliedNutrition) {
      setCurrentPlanId(null);
      setTitle(`Thực Đơn ${appliedNutrition.goalLabel} - ${selectedCustomer?.fullName || 'Học viên'}`);
      setTargetKcalInput(String(appliedNutrition.targetCalories));
      setShowConfigStudio(true);
    } else {
      setCurrentPlanId(null);
      if (selectedCustomer?.fullName) {
        setTitle(`Thực Đơn Dinh Dưỡng - ${selectedCustomer.fullName}`);
      } else {
        setTitle('Kế Hoạch Thực Đơn Dinh Dưỡng');
      }
      setMeals([]);
      setShowConfigStudio(true);
    }
  }, [editingPlan, appliedAiAnalysis, appliedNutrition, selectedCustomer]);

  // Total Macros Calculation
  const totalKcal = meals.reduce((sum, m) => sum + m.items.reduce((s, i) => s + (i.calories || 0), 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.items.reduce((s, i) => s + (i.protein || 0), 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.items.reduce((s, i) => s + (i.carbs || 0), 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + m.items.reduce((s, i) => s + (i.fat || 0), 0), 0);

  // Infographic Poster Dishes
  const posterDishes: MealDishItem[] = meals.map((m, idx) => ({
    id: idx + 1,
    title: m.name,
    leftPills: m.items.slice(0, 3).map((item) => ({
      label: item.name.split('(')[0].trim(),
      weight: item.amount || '1 khẩu phần',
    })),
    rightPills: [
      { label: 'Calo Bữa', val: `${m.items.reduce((s, i) => s + (i.calories || 0), 0)} kcal`, highlight: true },
      { label: 'Protein', val: `${m.items.reduce((s, i) => s + (i.protein || 0), 0)}g` },
    ],
  }));

  const toggleAllergy = (chip: string) => {
    setSelectedAllergies((prev) => (prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]));
  };

  /**
   * Handle Comprehensive AI Meal Generation
   */
  const handleAiGenerate = async () => {
    const targetId = customerId || selectedCustomer?._id;
    if (!targetId) {
      toast.error('Vui lòng chọn học viên ở thanh tìm kiếm phía trên để AI cá nhân hóa chỉ số.');
      return;
    }

    try {
      setLoadingAi(true);

      const styleObj = DIET_STYLES.find((s) => s.id === dietStyle);
      const compositeRequest = `
YÊU CẦU THIẾT KẾ THỰC ĐƠN:
- Số bữa ăn: ${mealCount} bữa/ngày.
- Calo mục tiêu: ${targetKcalInput ? `${targetKcalInput} kcal` : 'Tự động tính theo chỉ số'}.
- Phong cách ẩm thực: ${styleObj?.label || 'Món Việt Nam dễ nấu'} (${styleObj?.desc || ''}).
- Lịch trình sinh hoạt & giờ tập: ${workoutSchedule}.
- Kiêng kỵ & Dị ứng: ${selectedAllergies.length > 0 ? selectedAllergies.join(', ') : 'Không có dị ứng đặc biệt'}.
- Ngân sách: ${budgetLevel === 'BUDGET' ? 'Tiết kiệm / Sinh viên' : budgetLevel === 'PREMIUM' ? 'Cao cấp (cá hồi, bò Úc, whey isolate)' : 'Tiêu chuẩn Gym'}.
${customDietNotes ? `- Yêu cầu bổ sung: ${customDietNotes}` : ''}
      `.trim();

      const res = await api.post<NutritionDraftPlan>('/api/content-drafts/nutrition', {
        customerId: targetId,
        request: compositeRequest,
      });

      const draft = res.data;
      if (draft) {
        const generatedId = (draft as any)._id || (draft as any).id;
        if (generatedId) {
          setCurrentPlanId(generatedId);
        }
        if (draft.title) setTitle(draft.title);
        if (draft.advice) setDietAdviceNotes(draft.advice);
        if (Array.isArray(draft.menu) && draft.menu.length > 0) {
          const generatedMeals: MealBlock[] = draft.menu.map((m: any, idx: number) => {
            const rawItems = Array.isArray(m.items) ? m.items : [];
            const mealFoods: MealFoodItem[] = rawItems.map((it: any) => {
              if (typeof it === 'object' && it !== null) {
                return {
                  name: it.name || 'Món ăn dinh dưỡng',
                  amount: it.amount || '150g',
                  calories: it.calories || Math.round((m.calories || 400) / (rawItems.length || 1)),
                  protein: it.protein || 15,
                  carbs: it.carbs || 20,
                  fat: it.fat || 5,
                  prepTip: it.prepTip || undefined,
                };
              }
              return {
                name: String(it),
                amount: '1 khẩu phần',
                calories: Math.round((m.calories || 400) / (rawItems.length || 1)),
                protein: 15,
                carbs: 20,
                fat: 5,
              };
            });

            return {
              id: `meal_${idx + 1}`,
              name: m.name || m.title || `Bữa ${idx + 1}`,
              timeSlot: m.timeSlot || (idx === 0 ? '07:00 - 07:45' : idx === 1 ? '12:00 - 12:45' : idx === 2 ? '16:30 - 17:00' : '19:30 - 20:15'),
              targetKcal: m.calories || Math.round((draft.targetCalories || 1800) / draft.menu.length),
              items: mealFoods.length > 0 ? mealFoods : [{ name: 'Món ăn dinh dưỡng', amount: '150g', calories: 150, protein: 15, carbs: 15, fat: 3 }],
            };
          });
          setMeals(generatedMeals);
        }
      }
      toast.success('AI đã tự động sinh thực đơn chi tiết 100% khớp nhu cầu học viên!');
      setShowConfigStudio(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoadingAi(false);
    }
  };

  /**
   * Sinh ảnh AI cho bữa ăn bằng FLUX.2 Klein 4B qua /api/images/generate
   */
  const handleGenerateMealImage = async (mealIdx: number) => {
    const meal = meals[mealIdx];
    if (!meal || meal.items.length === 0) {
      toast.error('Vui lòng thêm các món ăn vào bữa trước khi tạo ảnh minh họa.');
      return;
    }

    try {
      setGeneratingImageId(meal.id);
      const foodDescriptions = meal.items.map((i) => `${i.name} (${i.amount})`).join(', ');
      const prompt = `Professional food photography of a healthy fitness gym meal: ${meal.name}, containing ${foodDescriptions}. Beautifully arranged on a modern ceramic plate, warm natural restaurant lighting, fresh ingredients, appetizing, high detail 4k.`;

      const res = await api.post<{ b64Json: string; mediaType: string; cost?: number }>('/api/images/generate', {
        prompt,
        aspectRatio: '4:3',
        outputFormat: 'jpeg',
      });

      if (res.data?.b64Json) {
        const dataUrl = `data:${res.data.mediaType || 'image/jpeg'};base64,${res.data.b64Json}`;
        const newMeals = [...meals];
        newMeals[mealIdx] = {
          ...newMeals[mealIdx],
          imageUrl: dataUrl,
        };
        setMeals(newMeals);
        toast.success(`AI đã tạo ảnh trực quan cho ${meal.name} (FLUX.2 Klein 4B)!`);
      }
    } catch (err: any) {
      const msg = errorMessage(err);
      if (msg.includes('402') || msg.includes('credits') || msg.includes('Insufficient')) {
        toast.error('Tài khoản OpenRouter cần nạp thêm credit để tạo ảnh AI (FLUX.2 Klein 4B).');
      } else {
        toast.error(`Không thể tạo ảnh AI: ${msg}`);
      }
    } finally {
      setGeneratingImageId(null);
    }
  };

  const handleSavePlan = async (publishToCustomer: boolean = false) => {
    const targetId = customerId || selectedCustomer?._id;
    if (!targetId) {
      toast.error('Vui lòng chọn học viên trước khi lưu thực đơn.');
      return;
    }
    if (meals.length === 0) {
      toast.error('Chưa có bữa ăn nào trong thực đơn. Vui lòng bấm AI Sinh Thực Đơn trước khi lưu.');
      return;
    }

    try {
      setSaving(true);
      const menuPayload = meals.map((m) => ({
        name: m.name,
        timeSlot: m.timeSlot,
        calories: m.items.reduce((s, i) => s + (i.calories || 0), 0),
        items: m.items.map((i) => ({
          name: i.name,
          amount: i.amount,
          calories: i.calories,
          protein: i.protein || 0,
          carbs: i.carbs || 0,
          fat: i.fat || 0,
          prepTip: i.prepTip || undefined,
        })),
        imageUrl: m.imageUrl || undefined,
      }));

      const payload = {
        customerId: targetId,
        title: title || `Thực Đơn Dinh Dưỡng - ${selectedCustomer?.fullName || 'Học viên'}`,
        targetCalories: totalKcal,
        macros: {
          protein: totalProtein,
          carbs: totalCarbs,
          fat: totalFat,
        },
        menu: menuPayload,
        notes: dietAdviceNotes || undefined,
      };

      let planId = currentPlanId || editingPlan?._id || editingPlan?.id;
      if (planId) {
        await api.patch(`/api/nutrition-plans/${planId}`, payload);
      } else {
        const res = await api.post<any>('/api/nutrition-plans', payload);
        planId = res.data?._id || res.data?.id;
        if (planId) setCurrentPlanId(planId);
      }

      if (publishToCustomer && planId) {
        await api.patch(`/api/nutrition-plans/${planId}/publish`, { publish: true });
        toast.success('Đã lưu vào cơ sở dữ liệu và CÔNG BỐ thành công cho học viên áp dụng!');
      } else {
        toast.success('Đã lưu bản nháp thực đơn vào cơ sở dữ liệu thành công!');
      }

      if (onSaved) onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = (mealIndex: number) => {
    const newMeals = [...meals];
    newMeals[mealIndex].items.push({
      name: 'Món ăn mới',
      amount: '100g',
      calories: 120,
      protein: 15,
      carbs: 10,
      fat: 2,
      prepTip: 'Chế biến ít dầu mỡ',
    });
    setMeals(newMeals);
  };

  const handleRemoveItem = (mealIndex: number, itemIndex: number) => {
    const newMeals = [...meals];
    newMeals[mealIndex].items.splice(itemIndex, 1);
    setMeals(newMeals);
  };

  const handleUpdateItem = (mealIndex: number, itemIndex: number, field: keyof MealFoodItem, val: any) => {
    const newMeals = [...meals];
    (newMeals[mealIndex].items[itemIndex] as any)[field] = val;
    setMeals(newMeals);
  };

  const handleUpdateMealName = (mealIndex: number, name: string) => {
    const newMeals = [...meals];
    newMeals[mealIndex].name = name;
    setMeals(newMeals);
  };

  const handleUpdateMealTimeSlot = (mealIndex: number, timeSlot: string) => {
    const newMeals = [...meals];
    newMeals[mealIndex].timeSlot = timeSlot;
    setMeals(newMeals);
  };

  const handleAddMealBlock = () => {
    const newIdx = meals.length + 1;
    setMeals([
      ...meals,
      {
        id: `meal_custom_${Date.now()}`,
        name: `Bữa ${newIdx}`,
        timeSlot: '15:00',
        targetKcal: 300,
        items: [{ name: 'Món ăn dinh dưỡng', amount: '150g', calories: 150, protein: 10, carbs: 15, fat: 5 }],
      },
    ]);
  };

  const handleRemoveMealBlock = (mealIndex: number) => {
    const newMeals = [...meals];
    newMeals.splice(mealIndex, 1);
    setMeals(newMeals);
  };

  return (
    <div style={{ display: 'grid', gap: '16px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {/* Top Banner & Quick Controls */}
      <div
        style={{
          background: 'linear-gradient(135deg, #003b70 0%, #002244 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '18px 22px',
          boxShadow: '0 4px 20px rgba(0, 59, 112, 0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '9px 14px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                title="Quay lại danh sách các bản thực đơn của học viên"
              >
                <ArrowLeft size={16} /> Danh Sách
              </button>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#38bdf8', fontWeight: 800 }}>
                  THIẾT KẾ THỰC ĐƠN CƠM VIỆT
                </span>
                {meals.length > 0 && (
                  <span style={{ background: '#10b981', color: '#ffffff', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                    {meals.length} Bữa Ăn • {totalKcal} kcal
                  </span>
                )}
              </div>
              <h2 style={{ margin: '4px 0 0', fontSize: '1.25rem', color: '#ffffff', fontWeight: 800 }}>
                {selectedCustomer ? `Thực Đơn: ${selectedCustomer.fullName}` : 'Thiết Kế Thực Đơn Dinh Dưỡng'}
              </h2>
              {meals.length > 0 && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.76rem', color: '#93c5fd', flexWrap: 'wrap' }}>
                  <span>Đạm (P): <strong style={{ color: '#ffffff' }}>{totalProtein}g</strong></span>
                  <span>Tinh bột (C): <strong style={{ color: '#ffffff' }}>{totalCarbs}g</strong></span>
                  <span>Chất béo (F): <strong style={{ color: '#ffffff' }}>{totalFat}g</strong></span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowConfigStudio(!showConfigStudio)}
              style={{
                background: showConfigStudio ? '#0f172a' : '#ffffff',
                color: showConfigStudio ? '#38bdf8' : '#003b70',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 14px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sliders size={14} /> {showConfigStudio ? 'Thu Gọn Cấu Hình' : 'Cấu Hình Nhu Cầu AI'}
            </button>

            {meals.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setSwapperOpen(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    padding: '9px 14px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ArrowRightLeft size={14} /> Đổi Món
                </button>

                <button
                  type="button"
                  onClick={() => setShowPoster(!showPoster)}
                  style={{
                    background: showPoster ? '#0f172a' : 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    padding: '9px 14px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ImageIcon size={14} /> {showPoster ? 'Ẩn Poster' : 'Xem Poster'}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSavePlan(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    borderRadius: '8px',
                    padding: '9px 14px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title="Lưu bản nháp vào CSDL để chỉnh sửa tiếp"
                >
                  <Save size={14} /> {saving ? 'Lưu...' : 'Lưu Nháp'}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSavePlan(true)}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 16px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                  }}
                  title="Lưu vào CSDL và gửi trực tiếp cho học viên áp dụng trên Portal"
                >
                  <Send size={14} /> {saving ? 'Gửi...' : 'Lưu & Gửi Học Viên'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI CONFIGURATION STUDIO COMPONENT */}
      {showConfigStudio && (
        <MealAiConfigStudio
          mealCount={mealCount}
          setMealCount={setMealCount}
          targetKcalInput={targetKcalInput}
          setTargetKcalInput={setTargetKcalInput}
          dietStyle={dietStyle}
          setDietStyle={setDietStyle}
          budgetLevel={budgetLevel}
          setBudgetLevel={setBudgetLevel}
          workoutSchedule={workoutSchedule}
          setWorkoutSchedule={setWorkoutSchedule}
          selectedAllergies={selectedAllergies}
          toggleAllergy={toggleAllergy}
          customDietNotes={customDietNotes}
          setCustomDietNotes={setCustomDietNotes}
          loadingAi={loadingAi}
          onAiGenerate={() => void handleAiGenerate()}
          appliedNutrition={appliedNutrition}
        />
      )}

      {/* Visual Infographic Poster View */}
      {showPoster && (
        <div style={{ marginBottom: '6px' }}>
          <MealInfographicPoster
            titleTag="Thực Đơn Đề Xuất Khoa Học"
            subTitle={title}
            timeframeText="3S GYM NUTRITION AI"
            dishes={posterDishes}
          />
        </div>
      )}

      {/* Total Macros Summary Strip */}
      {meals.length > 0 && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ flex: '1 1 260px' }}>
            <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, display: 'block', marginBottom: '2px' }}>
              TÊN KẾ HOẠCH THỰC ĐƠN
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Thực Đơn Giảm Mỡ - Nguyễn Văn A"
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontWeight: 800,
                fontSize: '0.92rem',
                color: '#003b70',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ background: '#f8fafc', padding: '6px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>TỔNG CALO</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--primary-color)' }}>{totalKcal} kcal</div>
            </div>
            <div style={{ background: '#eff6ff', padding: '6px 14px', borderRadius: '10px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: '#1d4ed8', fontWeight: 700 }}>PROTEIN</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1e40af' }}>{totalProtein}g</div>
            </div>
            <div style={{ background: '#fffbeb', padding: '6px 14px', borderRadius: '10px', border: '1px solid #fde68a', textAlign: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: '#b45309', fontWeight: 700 }}>CARBS</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#92400e' }}>{totalCarbs}g</div>
            </div>
            <div style={{ background: '#fdf2f8', padding: '6px 14px', borderRadius: '10px', border: '1px solid #fbcfe8', textAlign: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: '#be185d', fontWeight: 700 }}>FAT</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#9d174d' }}>{totalFat}g</div>
            </div>
          </div>

          <button
            type="button"
            className="button button-primary"
            onClick={() => void handleSavePlan()}
            disabled={saving}
            style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 20px', fontSize: '0.88rem', fontWeight: 800 }}
          >
            {saving ? <RefreshCw size={15} className="spin" /> : <Check size={15} />}
            Lưu Thực Đơn
          </button>
        </div>
      )}

      {/* Advice Note banner if available */}
      {dietAdviceNotes && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', fontSize: '0.82rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={16} color="#16a34a" />
          <span><strong>Lời khuyên từ Chuyên Gia AI:</strong> {dietAdviceNotes}</span>
        </div>
      )}

      {/* AI Meal Generation Loading Banner */}
      {loadingAi && (
        <div
          style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '2px dashed #3b82f6',
            borderRadius: '14px',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={22} color="#2563eb" className="spin" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e3a8a', fontWeight: 900 }}>
                  Trợ Lý AI Đang Thiết Kế Thực Đơn Chi Tiết...
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#1d4ed8' }}>
                  Tính toán thâm hụt calo, phân bổ macro và chọn lọc món ăn thực tế
                </span>
              </div>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#2563eb' }}>
              {mealAiProgress}%
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div style={{ width: '100%', height: '8px', background: '#bfdbfe', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${mealAiProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #2563eb 0%, #38bdf8 100%)',
                borderRadius: '4px',
                transition: 'width 0.6s ease',
              }}
            />
          </div>

          {/* 4 Clear Stages Checklist */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginTop: '2px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: mealAiStage >= 1 ? '#1e3a8a' : '#94a3b8', fontWeight: mealAiStage === 1 ? 800 : 600 }}>
              {mealAiStage > 1 ? <CheckCircle2 size={15} color="#16a34a" /> : mealAiStage === 1 ? <RefreshCw size={13} color="#2563eb" className="spin" /> : <div style={{ width: 13, height: 13, borderRadius: '50%', border: '1px solid #cbd5e1' }} />}
              <span>1. Định lượng Calo & Macro từng bữa</span>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: mealAiStage >= 2 ? '#1e3a8a' : '#94a3b8', fontWeight: mealAiStage === 2 ? 800 : 600 }}>
              {mealAiStage > 2 ? <CheckCircle2 size={15} color="#16a34a" /> : mealAiStage === 2 ? <RefreshCw size={13} color="#2563eb" className="spin" /> : <div style={{ width: 13, height: 13, borderRadius: '50%', border: '1px solid #cbd5e1' }} />}
              <span>2. Lọc kiêng kỵ & dị ứng thực phẩm</span>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: mealAiStage >= 3 ? '#1e3a8a' : '#94a3b8', fontWeight: mealAiStage === 3 ? 800 : 600 }}>
              {mealAiStage > 3 ? <CheckCircle2 size={15} color="#16a34a" /> : mealAiStage === 3 ? <RefreshCw size={13} color="#2563eb" className="spin" /> : <div style={{ width: 13, height: 13, borderRadius: '50%', border: '1px solid #cbd5e1' }} />}
              <span>3. Lên món Việt & định lượng gram</span>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: mealAiStage >= 4 ? '#1e3a8a' : '#94a3b8', fontWeight: mealAiStage === 4 ? 800 : 600 }}>
              {mealAiStage > 4 ? <CheckCircle2 size={15} color="#16a34a" /> : mealAiStage === 4 ? <RefreshCw size={13} color="#2563eb" className="spin" /> : <div style={{ width: 13, height: 13, borderRadius: '50%', border: '1px solid #cbd5e1' }} />}
              <span>4. Căn giờ nạp & mẹo chế biến</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty State when no meals exist yet and not loading */}
      {!loadingAi && meals.length === 0 && (
        <div
          style={{
            background: '#ffffff',
            border: '2px dashed #cbd5e1',
            borderRadius: '14px',
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <div style={{ background: '#f0f9ff', borderRadius: '50%', padding: '16px', color: '#0284c7' }}>
            <Salad size={40} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#003b70', fontWeight: 800 }}>
            {selectedCustomer ? `Chưa có thực đơn cho ${selectedCustomer.fullName}` : 'Sẵn Sàng Thiết Kế Thực Đơn Bằng AI'}
          </h3>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', maxWidth: '440px', lineHeight: 1.5 }}>
            Tùy chỉnh số lượng bữa ăn, phong cách ăn uống và lịch tập ở bảng phía trên, sau đó bấm <strong>&quot;AI Sinh Thực Đơn Chi Tiết&quot;</strong> để hệ thống tự động sinh thực đơn dinh dưỡng thực tế khớp 100% hồ sơ học viên.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => void handleAiGenerate()}
              disabled={loadingAi}
              style={{
                background: 'linear-gradient(135deg, #003b70 0%, #00a4e4 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '0.86rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(0, 59, 112, 0.2)',
              }}
            >
              {loadingAi ? <RefreshCw size={15} className="spin" /> : <Wand2 size={15} />}
              {loadingAi ? 'AI đang tạo thực đơn...' : 'AI Sinh Thực Đơn Ngay'}
            </button>
            <button
              type="button"
              onClick={handleAddMealBlock}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '0.86rem',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              + Tạo bữa ăn thủ công
            </button>
          </div>
        </div>
      )}

      {/* Meals Grid (Bữa Sáng, Bữa Trưa, Bữa Phụ, Bữa Tối, v.v.) */}
      {meals.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
          {meals.map((meal, mealIdx) => (
            <MealCardItem
              key={meal.id}
              meal={meal}
              mealIdx={mealIdx}
              mealsCount={meals.length}
              isGeneratingImg={generatingImageId === meal.id}
              onUpdateMealName={handleUpdateMealName}
              onUpdateMealTimeSlot={handleUpdateMealTimeSlot}
              onRemoveMeal={handleRemoveMealBlock}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onUpdateItem={handleUpdateItem}
              onGenerateImage={(idx) => void handleGenerateMealImage(idx)}
              onOpenSwapper={() => setSwapperOpen(true)}
              onPreviewImage={(prev) => setPreviewImage(prev)}
            />
          ))}
        </div>
      )}

      {/* Add New Meal Block Button */}
      {meals.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
          <button
            type="button"
            onClick={handleAddMealBlock}
            style={{
              background: '#ffffff',
              border: '2px dashed #00a4e4',
              borderRadius: '10px',
              padding: '10px 24px',
              fontSize: '0.84rem',
              color: '#003b70',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Plus size={16} color="#00a4e4" /> Thêm Một Bữa Ăn Mới (Bữa 5, Bữa Phụ...)
          </button>
        </div>
      )}

      {/* STICKY SAVE & PUBLISH ACTION BAR */}
      {meals.length > 0 && (
        <div
          style={{
            marginTop: '18px',
            background: 'linear-gradient(135deg, #003b70 0%, #002244 100%)',
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 8px 24px rgba(0, 59, 112, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ color: '#ffffff' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                Tổng Thực Đơn: <span style={{ color: '#4ade80' }}>{totalKcal} kcal</span> ({meals.length} bữa ăn)
              </div>
              <div style={{ fontSize: '0.76rem', color: '#93c5fd', marginTop: '2px' }}>
                P: <strong>{totalProtein}g</strong> | C: <strong>{totalCarbs}g</strong> | F: <strong>{totalFat}g</strong> • Học viên: <strong>{selectedCustomer?.fullName || 'Chưa chọn'}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSavePlan(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '10px 18px',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Save size={15} /> {saving ? 'Đang Lưu...' : 'Lưu Bản Nháp'}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSavePlan(true)}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 22px',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.45)',
              }}
            >
              <Send size={15} /> {saving ? 'Đang Gửi...' : 'Lưu & Gửi Cho Học Viên Áp Dụng Ngay'}
            </button>
          </div>
        </div>
      )}

      {/* Full-size Image Preview Modal */}
      <MealImagePreviewModal
        previewImage={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      {/* Swapper Modal */}
      <MealSwapperModal open={swapperOpen} onClose={() => setSwapperOpen(false)} />
    </div>
  );
}
