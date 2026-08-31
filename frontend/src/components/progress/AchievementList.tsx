import { Award, Trophy } from 'lucide-react';
import type { AchievementDto } from '../../types';
import ProgressEmptyState from './ProgressEmptyState';
import ProgressSection from './ProgressSection';

const labels = {
  MAX_WEIGHT: 'Mức tạ cao nhất',
  MAX_REPS: 'Số reps cao nhất',
  MAX_SET_VOLUME: 'Volume set cao nhất',
  ESTIMATED_1RM: 'Estimated 1RM',
} as const;

export default function AchievementList({ achievements }: { achievements: AchievementDto[] }) {
  if (achievements.length === 0) {
    return (
      <ProgressEmptyState
        icon={Trophy}
        title="Chưa có thành tích"
        description="Các cột mốc mới sẽ xuất hiện khi khách hàng hoàn thành thêm buổi tập."
      />
    );
  }

  return (
    <ProgressSection
      title="Thành tích cá nhân"
      count={achievements.length}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {achievements.map((item) => (
          <article
            className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:shadow-2xs hover:border-sky-300"
            key={`${item.exerciseName}-${item.kind}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-sky-700">
                {labels[item.kind]}
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Award size={15} />
              </span>
            </div>
            <h3 className="mt-2 text-sm font-bold text-[#003b70] truncate">
              {item.exerciseName}
            </h3>
            <p className="mt-2 text-2xl font-black text-[#003b70] tabular-nums">
              {item.value.toLocaleString('vi-VN')}
            </p>
          </article>
        ))}
      </div>
    </ProgressSection>
  );
}
