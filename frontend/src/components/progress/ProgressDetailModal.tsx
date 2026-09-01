import { CircleAlert } from 'lucide-react';
import type { CustomerJourneyDto, CustomerProgressOverview } from '../../types/progress';
import CustomerJourney from '../customer-portal/CustomerJourney';
import ProgressEmptyState from './ProgressEmptyState';
import ProgressModal from './ProgressModal';

export default function ProgressDetailModal({
  item,
  journey,
  loading,
  onClose,
}: {
  item: CustomerProgressOverview | null;
  journey: CustomerJourneyDto | null;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <ProgressModal
      open={Boolean(item)}
      title={`Tiến độ ${item?.customer.fullName || ''}`}
      loading={loading}
      onClose={onClose}
    >
      {journey ? (
        <CustomerJourney journey={journey} />
      ) : (
        <ProgressEmptyState
          icon={CircleAlert}
          title="Không có dữ liệu tiến độ"
          description="Không thể tải hành trình của học viên ở thời điểm hiện tại."
        />
      )}
    </ProgressModal>
  );
}
