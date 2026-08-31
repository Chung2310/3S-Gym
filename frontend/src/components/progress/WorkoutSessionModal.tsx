import { ClipboardList } from 'lucide-react';
import type { CustomerJourneyDto, CustomerProgressOverview } from '../../types/progress';
import ProgressEmptyState from './ProgressEmptyState';
import ProgressModal from './ProgressModal';
import WorkoutSessionLogger from './WorkoutSessionLogger';

type ActivePlan = {
  _id: string;
  sourceTemplateId?: string;
  title: string;
  sessions?: Array<{
    name: string;
    exercises?: Array<{ name: string; sets?: number; reps?: string | number }>;
  }>;
};

export default function WorkoutSessionModal({
  item,
  journey,
  loading,
  onClose,
  onSaved,
}: {
  item: CustomerProgressOverview | null;
  journey: CustomerJourneyDto | null;
  loading: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const activePlan = journey?.plans.active as ActivePlan | null | undefined;
  return (
    <ProgressModal
      open={Boolean(item)}
      title={`Ghi nhận buổi tập · ${item?.customer.fullName || ''}`}
      loading={loading}
      onClose={onClose}
    >
      {journey ? (
        <WorkoutSessionLogger
          customerId={journey.customer._id}
          activePlan={activePlan || null}
          onSaved={onSaved}
        />
      ) : (
        <ProgressEmptyState
          icon={ClipboardList}
          title="Không tải được giáo án"
          description="Hãy thử đóng cửa sổ và tải lại dữ liệu học viên."
        />
      )}
    </ProgressModal>
  );
}
