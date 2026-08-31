import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/ocrProvider.js', () => ({
  extractInBody: vi.fn().mockResolvedValue({
    weight: 62.5, bodyFatPercentage: 24.1, muscleMass: 23.4, confidence: 0.91, warnings: [],
  }),
}));

import { calculateLegacyNutrition } from '../controllers/legacyNutritionController.js';
import { scanInBodyDraft } from '../services/nutritionScanService.js';

describe('legacy nutrition compatibility', () => {
  it('keeps the calculation response fields and canonical formula identity', async () => {
    const result = await calculateLegacyNutrition({ id: 'legacy-user', role: 'PT' }, {
      clientName: 'Khách A', gender: 'male', weight: 70, height: 170, age: 30,
      activityLevel: 'moderate', mealCount: 3, timeframe: '1_day',
    }, 'legacy-calculate-test');
    expect(result).toMatchObject({
      clientName: 'Khách A', formula: 'MIFFLIN_ST_JEOR', bmi: expect.any(Number),
      bmr: expect.any(Number), tdee: expect.any(Number), targetCalories: expect.any(Number),
      macros: { protein: expect.any(Number), carbs: expect.any(Number), fat: expect.any(Number) },
      posterList: expect.any(Array),
    });
  });

  it('returns only OCR values actually extracted by the provider', async () => {
    const result = await scanInBodyDraft({ id: 'legacy-user', role: 'PT' }, { imageBase64: `data:image/png;base64,${Buffer.from('real-image-bytes').toString('base64')}` }, 'legacy-ocr-test');
    expect(result).toMatchObject({ weight: 62.5, bodyFatPercentage: 24.1, ocrStatus: 'REVIEW_REQUIRED' });
    expect(result).not.toHaveProperty('age');
    expect(result).not.toHaveProperty('inbodyScore');
  });

  it('keeps external provider calls out of the route module', () => {
    const source = fs.readFileSync(path.resolve('backend/routes/nutrition.ts'), 'utf8');
    expect(source).not.toMatch(/fetch\s*\(/);
    expect(source).not.toContain('openrouter.ai');
    expect(source).not.toContain('using safe fallback');
  });
});
