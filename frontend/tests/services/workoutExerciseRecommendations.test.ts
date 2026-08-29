import { describe, expect, it } from 'vitest';
import { recommendExercises } from '../../src/services/workoutExerciseRecommendations';

const exercises = [
  { _id: 'legs', name: 'Squat', muscleGroup: 'Chân', level: 'BEGINNER' as const, equipment: ['Thanh đòn'], technique: 'Giữ lưng thẳng' },
  { _id: 'chest', name: 'Đẩy ngực', muscleGroup: 'Ngực', level: 'INTERMEDIATE' as const, equipment: ['Tạ đơn'], technique: 'Ép cơ ngực' },
  { _id: 'cardio', name: 'Chạy bộ', muscleGroup: 'Toàn thân', level: 'BEGINNER' as const, equipment: ['Máy chạy'], technique: 'Duy trì sức bền' },
];

describe('recommendExercises', () => {
  it('ranks accent-insensitive goal matches together with plan muscle groups and level', () => {
    const result = recommendExercises(exercises, {
      goal: 'Phát triển NGỰC và sức bền',
      level: 'BEGINNER',
      muscleGroups: ['Chân'],
    });

    expect(result.map((exercise) => exercise._id)).toEqual(['chest', 'cardio', 'legs']);
  });

  it('falls back to muscle group and level when the free-text goal has no matching keywords', () => {
    const result = recommendExercises(exercises, {
      goal: 'Cải thiện thể trạng',
      level: 'INTERMEDIATE',
      muscleGroups: ['Chân'],
    });

    expect(result.map((exercise) => exercise._id)).toEqual(['legs', 'chest']);
  });

  it('returns at most five exercises and preserves library order for equal scores', () => {
    const library = Array.from({ length: 7 }, (_, index) => ({
      _id: String(index), name: `Bài ${index}`, muscleGroup: 'Lưng', level: 'BEGINNER' as const,
    }));

    expect(recommendExercises(library, { goal: '', level: 'BEGINNER', muscleGroups: [] }).map((exercise) => exercise._id)).toEqual(['0', '1', '2', '3', '4']);
  });
});
