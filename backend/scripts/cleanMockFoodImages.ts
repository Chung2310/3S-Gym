import dotenv from 'dotenv';
import type { QueryFilter } from 'mongoose';
import { loadEnv } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import FoodImage, { type IFoodImage } from '../models/FoodImage.js';
import NutritionPlan from '../models/NutritionPlan.js';

dotenv.config({ quiet: true });
loadEnv();

async function run() {
  console.log('--- DỌN DẸP MOCK ẢNH MÓN ĂN VÀ THỰC ĐƠN TRONG MONGODB ---');
  await connectDatabase();

  // 1. Tìm và xóa các bản ghi FoodImage mock
  const mockFoodFilter: QueryFilter<IFoodImage> = {
    $or: [
      { source: 'SEED' },
      { imageUrl: { $regex: '^/images/dishes', $options: 'i' } },
      { imageUrl: { $regex: 'unsplash\\.com', $options: 'i' } },
    ],
  };

  const mockDocs = await FoodImage.find(mockFoodFilter).select('name source imageUrl').lean();
  console.log(`Tìm thấy ${mockDocs.length} bản ghi mock trong collection FoodImage.`);
  for (const doc of mockDocs) {
    console.log(` - Xóa: [${doc.source}] ${doc.name} -> ${doc.imageUrl}`);
  }

  if (mockDocs.length > 0) {
    const res = await FoodImage.deleteMany(mockFoodFilter);
    console.log(`=> Đã xóa thành công ${res.deletedCount} bản ghi FoodImage mock.`);
  }

  // 2. Quét các thực đơn NutritionPlan có chứa URL ảnh mock
  const plans = await NutritionPlan.find().lean();
  let cleanedPlansCount = 0;

  for (const plan of plans) {
    let modified = false;

    const cleanMealList = (meals: any[]) => {
      if (!Array.isArray(meals)) return meals;
      return meals.map((m: any) => {
        if (!m || typeof m !== 'object') return m;
        let mealMod = false;
        let newImageUrl = m.imageUrl;

        if (typeof newImageUrl === 'string' && (newImageUrl.startsWith('/images/dishes') || newImageUrl.includes('unsplash.com'))) {
          newImageUrl = undefined;
          mealMod = true;
        }

        let newItems = m.items;
        if (Array.isArray(m.items)) {
          newItems = m.items.map((it: any) => {
            if (it && typeof it.imageUrl === 'string' && (it.imageUrl.startsWith('/images/dishes') || it.imageUrl.includes('unsplash.com'))) {
              mealMod = true;
              return { ...it, imageUrl: undefined };
            }
            return it;
          });
        }

        if (mealMod) {
          modified = true;
          return { ...m, imageUrl: newImageUrl, items: newItems };
        }
        return m;
      });
    };

    const newMenu = cleanMealList(plan.menu || []);
    let newDailyPlans = plan.dailyPlans;
    if (Array.isArray(plan.dailyPlans)) {
      newDailyPlans = plan.dailyPlans.map((day: any) => {
        if (!day || typeof day !== 'object') return day;
        const cleanedMeals = cleanMealList(day.meals || []);
        return { ...day, meals: cleanedMeals };
      });
    }

    if (modified) {
      await NutritionPlan.updateOne(
        { _id: plan._id },
        { $set: { menu: newMenu, dailyPlans: newDailyPlans } }
      );
      cleanedPlansCount++;
      console.log(` - Đã làm sạch URL mock trong thực đơn: "${plan.title}" (_id: ${plan._id})`);
    }
  }

  console.log(`=> Đã cập nhật làm sạch ${cleanedPlansCount} thực đơn có chứa link mock.`);
  console.log('--- HOÀN TẤT DỌN DẸP ---');
}

run()
  .catch((err) => {
    console.error('Lỗi khi chạy dọn dẹp mock data:', err);
    process.exit(1);
  })
  .finally(() => disconnectDatabase());
