import { useCallback, useEffect, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import ProgressDashboard from '../../components/progress/ProgressDashboard';
import ProgressDetailModal from '../../components/progress/ProgressDetailModal';
import ProgressEmptyState from '../../components/progress/ProgressEmptyState';
import ProgressSkeleton from '../../components/progress/ProgressSkeleton';
import WorkoutSessionModal from '../../components/progress/WorkoutSessionModal';
import { useToast } from '../../components/ui/ToastProvider';
import { api } from '../../services/api';
import { errorMessage, type CustomerJourneyDto, type CustomerProgressOverview } from '../../types';

const retryButtonClass = 'inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 motion-reduce:transition-none';

export default function ProgressPage() {
  const toast = useToast();
  const [items, setItems] = useState<CustomerProgressOverview[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [detailItem, setDetailItem] = useState<CustomerProgressOverview | null>(null);
  const [workoutItem, setWorkoutItem] = useState<CustomerProgressOverview | null>(null);
  const [journey, setJourney] = useState<CustomerJourneyDto | null>(null);

  const loadOverview = useCallback(async () => {
    setOverviewError(null);
    setOverviewLoading(true);
    try {
      const result = await api.get<CustomerProgressOverview[]>('/api/customers/progress-overview');
      setItems(result.data);
    } catch (caught) {
      const message = errorMessage(caught);
      setOverviewError(message);
      toast.error(message);
    } finally {
      setOverviewLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const close = useCallback(() => {
    setDetailItem(null);
    setWorkoutItem(null);
    setJourney(null);
    setJourneyLoading(false);
  }, []);

  const open = async (item: CustomerProgressOverview, mode: 'detail' | 'workout') => {
    setJourney(null);
    if (mode === 'detail') setDetailItem(item);
    else setWorkoutItem(item);
    setJourneyLoading(true);
    try {
      const result = await api.get<CustomerJourneyDto>(`/api/customers/${item.customer._id}/journey`);
      setJourney(result.data);
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setJourneyLoading(false);
    }
  };

  const saved = () => {
    close();
    void loadOverview();
  };

  return (
    <section className="space-y-6 pb-[calc(2rem+env(safe-area-inset-bottom))] font-montserrat">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Customer journey</p>
        <h1 className="mt-1 font-oswald text-3xl font-bold uppercase tracking-tight text-primary sm:text-4xl">
          Tiến độ khách hàng
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Tổng quan toàn bộ học viên được phân công và truy cập nhanh từng hành trình tập luyện.
        </p>
      </header>

      {overviewLoading && items.length === 0 && <ProgressSkeleton />}
      {overviewError && items.length === 0 && !overviewLoading && (
        <ProgressEmptyState
          icon={CircleAlert}
          title="Không thể tải tổng quan tiến độ"
          description={overviewError}
          action={<button type="button" className={retryButtonClass} onClick={() => void loadOverview()}>Thử lại</button>}
        />
      )}
      {(!overviewLoading || items.length > 0) && !overviewError && (
        <ProgressDashboard
          items={items}
          onView={(item) => void open(item, 'detail')}
          onLogWorkout={(item) => void open(item, 'workout')}
        />
      )}

      <ProgressDetailModal
        item={detailItem}
        journey={detailItem ? journey : null}
        loading={journeyLoading}
        onClose={close}
      />
      <WorkoutSessionModal
        item={workoutItem}
        journey={workoutItem ? journey : null}
        loading={journeyLoading}
        onClose={close}
        onSaved={saved}
      />
    </section>
  );
}
