import { ClipboardList } from 'lucide-react';
import type { CustomerJourneyDto, CustomerProgressOverview } from '../../types/progress';
import ProgressEmptyState from './ProgressEmptyState';
import ProgressModal from './ProgressModal';
import WorkoutSessionLogger, { type WorkoutLoggerActivePlan } from './WorkoutSessionLogger';

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
  const activePlan = journey?.plans.active as unknown as WorkoutLoggerActivePlan | null | undefined;
  return (
    <ProgressModal
      open={Boolean(item)}
      title={`Ghi nhận buổi tập · ${item?.customer.fullName || ''}`}
      description="Kết quả thực tế được lấy theo giáo án đang áp dụng."
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
