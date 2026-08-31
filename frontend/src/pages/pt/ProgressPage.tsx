import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import { errorMessage } from '../../types';
import ProgressDashboard from '../../components/progress/ProgressDashboard';
import ProgressDetailModal from '../../components/progress/ProgressDetailModal';
import WorkoutSessionModal from '../../components/progress/WorkoutSessionModal';
import type { CustomerJourneyDto, CustomerProgressOverview } from '../../types';

export default function ProgressPage() {
  const toast = useToast();
  const [items, setItems] = useState<CustomerProgressOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailItem, setDetailItem] = useState<CustomerProgressOverview | null>(null);
  const [workoutItem, setWorkoutItem] = useState<CustomerProgressOverview | null>(null);
  const [journey, setJourney] = useState<CustomerJourneyDto | null>(null);

  const loadOverview = useCallback(async () => { try { setLoading(true); const result = await api.get<CustomerProgressOverview[]>('/api/customers/progress-overview'); setItems(result.data); } catch (error) { toast.error(errorMessage(error)); } finally { setLoading(false); } }, [toast]);
  useEffect(() => { void loadOverview(); }, [loadOverview]);
  const open = async (item: CustomerProgressOverview, mode: 'detail' | 'workout') => { setJourney(null); if (mode === 'detail') setDetailItem(item); else setWorkoutItem(item); try { setLoading(true); const result = await api.get<CustomerJourneyDto>(`/api/customers/${item.customer._id}/journey`); setJourney(result.data); } catch (error) { toast.error(errorMessage(error)); } finally { setLoading(false); } };
  const close = () => { setDetailItem(null); setWorkoutItem(null); setJourney(null); };
  const saved = () => { close(); void loadOverview(); };

  return (
    <section className="progress-page">
      <div className="progress-page-header">
        <h1 className="progress-page-title">Tiến độ khách hàng</h1>
      </div>
      {loading && !items.length ? <div className="progress-loading">Đang tải tổng quan tiến độ...</div> : <ProgressDashboard items={items} onView={(item) => void open(item, 'detail')} onLogWorkout={(item) => void open(item, 'workout')} />}
      <ProgressDetailModal item={detailItem} journey={detailItem ? journey : null} loading={loading} onClose={close} />
      <WorkoutSessionModal item={workoutItem} journey={workoutItem ? journey : null} loading={loading} onClose={close} onSaved={saved} />
    </section>
  );
}
