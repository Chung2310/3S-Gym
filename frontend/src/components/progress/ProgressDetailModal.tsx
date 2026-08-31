import type { CustomerJourneyDto, CustomerProgressOverview } from '../../types/progress';
import CustomerJourney from '../customer-portal/CustomerJourney';
import ProgressModal from './ProgressModal';

export default function ProgressDetailModal({ item, journey, loading, onClose }: { item: CustomerProgressOverview | null; journey: CustomerJourneyDto | null; loading: boolean; onClose: () => void }) {
  return <ProgressModal open={Boolean(item)} title={`Tiến độ ${item?.customer.fullName || ''}`} description="Toàn bộ hành trình, chỉ số và lịch sử của khách hàng." loading={loading} onClose={onClose}>{journey ? <CustomerJourney journey={journey} /> : <div className="empty-state progress-modal-empty">Không có dữ liệu tiến độ.</div>}</ProgressModal>;
}
