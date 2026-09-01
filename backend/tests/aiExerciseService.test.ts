import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/aiProvider.js', () => ({ generateText: vi.fn() }));

import { generateText } from '../services/aiProvider.js';
import { generateExerciseDrafts } from '../services/aiExerciseService.js';

const input = {
  prompt: 'Tạo 2 bài tập chân với tạ đơn cho người mới',
  quantity: 2,
};

const validDraft = (name: string) => ({
  name,
  muscleGroup: 'Chân',
  level: 'BEGINNER',
  defaultTrackingType: 'STRENGTH',
  equipment: ['Tạ đơn'],
  description: 'Bài tập chân cơ bản.',
  technique: 'Giữ lưng trung lập.',
  commonMistakes: ['Gối đổ vào trong'],
  contraindications: ['Đau gối cấp'],
  variants: ['Biến thể không tạ'],
});

beforeEach(() => vi.mocked(generateText).mockReset());

describe('generateExerciseDrafts', () => {
  it('uses TEXT_WORKOUT billing and returns only allowed fields', async () => {
    vi.mocked(generateText).mockResolvedValueOnce(JSON.stringify({ exercises: [
      { ...validDraft('Goblet Squat'), videos: [{ url: 'https://invalid.example' }], scope: 'PRIVATE', ownerPtId: 'other-user' },
      validDraft('Dumbbell Romanian Deadlift'),
    ] }));

    const result = await generateExerciseDrafts({ id: 'pt-1', role: 'PT' }, input, 'request-1');

    expect(generateText).toHaveBeenCalledWith(
      { userId: 'pt-1', taskType: 'TEXT_WORKOUT', requestKey: 'request-1:text-exercise-generation' },
      expect.stringContaining('CHÍNH XÁC 2 bài'),
    );
    expect(result).toEqual({
      drafts: [validDraft('Goblet Squat'), validDraft('Dumbbell Romanian Deadlift')],
      discardedCount: 0,
    });
    expect(result.drafts[0]).not.toHaveProperty('videos');
    expect(result.drafts[0]).not.toHaveProperty('scope');
    expect(result.drafts[0]).not.toHaveProperty('ownerPtId');
  });

  it('accepts fenced root-array JSON with every schema field', async () => {
    const plank = { ...validDraft('Plank'), muscleGroup: 'Cơ bụng', defaultTrackingType: 'BODYWEIGHT' };
    vi.mocked(generateText).mockResolvedValueOnce(`\`\`\`json\n${JSON.stringify([plank])}\n\`\`\``);

    const result = await generateExerciseDrafts(
      { id: 'admin-1', role: 'ADMIN' },
      { prompt: 'Tạo một bài tập cơ bụng', quantity: 1 },
      'request-2',
    );

    expect(result.drafts).toEqual([plank]);
  });

  it('discards invalid and duplicate drafts before applying the quantity limit', async () => {
    vi.mocked(generateText).mockResolvedValueOnce(JSON.stringify({ exercises: [
      validDraft('Goblet Squat'),
      validDraft('  goblet   squat  '),
      { ...validDraft('Invalid'), defaultTrackingType: 'UNCLASSIFIED' },
      validDraft('Split Squat'),
      validDraft('Extra Squat'),
    ] }));

    const result = await generateExerciseDrafts({ id: 'pt-1', role: 'PT' }, input, 'request-3');

    expect(result.drafts.map((draft) => draft.name)).toEqual(['Goblet Squat', 'Split Squat']);
    expect(result.discardedCount).toBe(3);
  });

  it('rejects output when no valid draft remains', async () => {
    vi.mocked(generateText).mockResolvedValueOnce(JSON.stringify({ exercises: [
      { name: '', muscleGroup: 'Chân', level: 'BEGINNER', defaultTrackingType: 'STRENGTH' },
      { ...validDraft('Sai enum'), level: 'EXPERT' },
    ] }));

    await expect(generateExerciseDrafts({ id: 'pt-1', role: 'PT' }, input, 'request-4'))
      .rejects.toMatchObject({ status: 502, message: 'AI không trả về bài tập hợp lệ.' });
  });

  it('rejects a partial result instead of returning fewer exercises than requested', async () => {
    vi.mocked(generateText).mockResolvedValueOnce(JSON.stringify({ exercises: [validDraft('Goblet Squat')] }));

    await expect(generateExerciseDrafts({ id: 'pt-1', role: 'PT' }, input, 'request-partial'))
      .rejects.toMatchObject({ status: 502, message: 'AI chưa tạo đủ 2 bài tập hợp lệ. Vui lòng thử lại.' });
  });

  it('rejects malformed JSON', async () => {
    vi.mocked(generateText).mockResolvedValueOnce('not-json');

    await expect(generateExerciseDrafts({ id: 'pt-1', role: 'PT' }, input, 'request-5'))
      .rejects.toMatchObject({ status: 502, message: 'AI không trả về bài tập hợp lệ.' });
  });
});
