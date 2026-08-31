import type { JourneyAnalytics } from '../../types';
import ProgressSnapshot from './ProgressSnapshot';

export default function ProgressOverview({ analytics }: { analytics: JourneyAnalytics }) {
  return (
    <div className="flex flex-col gap-4">
      <ProgressSnapshot analytics={analytics} />
    </div>
  );
}
