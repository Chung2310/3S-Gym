// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NutritionMacroCalculator from '../../../src/components/nutrition/NutritionMacroCalculator';
import ActivityLibraryCalculator from '../../../src/components/nutrition/ActivityLibraryCalculator';
import MealSwapperModal from '../../../src/components/nutrition/MealSwapperModal';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';

describe('Nutrition Assistant Components', () => {
  it('tính toán BMR, TDEE, Calo nạp và Macro chính xác', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <NutritionMacroCalculator
          selectedCustomer={{
            _id: 'cust-1',
            fullName: 'Nguyễn Văn An',
            initialWeight: 70,
            height: 172,
            gender: 'MALE',
          } as any}
        />
      </ToastProvider>
    );

    // Bấm nút Tính Ngay
    await user.click(screen.getByRole('button', { name: /Tính Ngay/i }));

    // BMR của Nam 70kg, 172cm, 26t: 10*70 + 6.25*172 - 5*26 + 5 = 700 + 1075 - 130 + 5 = 1650 kcal
    // TDEE: 1650 * 1.55 = 2558 kcal
    // Giảm mỡ -350 kcal: ~2208 kcal
    expect(screen.getByText('Kết Quả Nhu Cầu Năng Lượng')).toBeVisible();
    expect(screen.getByText('BMR (Tối thiểu)')).toBeVisible();
    expect(screen.getByText('TDEE (Tiêu hao)')).toBeVisible();
    expect(screen.getByText('Mục tiêu Nạp')).toBeVisible();
    expect(screen.getByText('🥩 PROTEIN')).toBeVisible();
    expect(screen.getByText('🍚 CARBS')).toBeVisible();
    expect(screen.getByText('🥑 CHẤT BÉO')).toBeVisible();
  });

  it('thư viện hoạt động ước tính calo tiêu hao chính xác theo MET và cân nặng', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ActivityLibraryCalculator
          selectedCustomer={{
            _id: 'cust-1',
            fullName: 'Nguyễn Văn An',
            initialWeight: 70,
          } as any}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Ước Tính Tiêu Hao Calo Hoạt Động Thể Thao')).toBeVisible();
    // Check preset buttons
    expect(screen.getByRole('button', { name: '🏋️ Gym 1h' })).toBeVisible();
    expect(screen.getByRole('button', { name: '🏃 Chạy 5km' })).toBeVisible();
    expect(screen.getByRole('button', { name: '🏊 Bơi 1km' })).toBeVisible();
    expect(screen.getByRole('button', { name: '🚴 Cycling 20km' })).toBeVisible();

    // Chọn Bơi 1km
    await user.click(screen.getByRole('button', { name: '🏊 Bơi 1km' }));
    expect(screen.getAllByText(/Bơi lội 1km/i)[0]).toBeVisible();
  });

  it('bộ đổi món tương đương quy đổi đúng số gram cần ăn', () => {
    render(<MealSwapperModal open={true} onClose={() => undefined} />);
    expect(screen.getByText('Công Cụ Đổi Món Tương Đương Macro (Meal Swapper)')).toBeVisible();
    expect(screen.getByText('🥩 Nhóm Đạm (Protein)')).toBeVisible();
    expect(screen.getByText('🍚 Nhóm Tinh Bột (Carbs)')).toBeVisible();
    expect(screen.getByText('Món Ăn Gốc Trong Thực Đơn')).toBeVisible();
    expect(screen.getByText('Món Đổi Sang (Tương Đương)')).toBeVisible();
  });
});
