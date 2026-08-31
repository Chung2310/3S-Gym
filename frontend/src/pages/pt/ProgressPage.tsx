import { useCallback, useState } from 'react';
import { Activity, CircleAlert, RotateCcw, UserRoundSearch } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import CustomerSelect from '../../components/ui/CustomerSelect';
import { errorMessage } from '../../types';
import PtProgressWorkspace from '../../components/progress/PtProgressWorkspace';
import ProgressEmptyState from '../../components/progress/ProgressEmptyState';
import ProgressSection from '../../components/progress/ProgressSection';
import ProgressSkeleton from '../../components/progress/ProgressSkeleton';
import type { CustomerJourneyDto } from '../../types';

const primaryButtonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,59,112,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_12px_26px_rgba(0,59,112,0.22)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none';
const secondaryButtonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition duration-200 hover:border-secondary/40 hover:bg-sky-50 hover:text-primary active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none';

export default function ProgressPage() {
  const toast = useToast();
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [journey, setJourney] = useState<CustomerJourneyDto | null>(null);

  const load = useCallback(
    async (targetId?: string) => {
      const idToLoad = targetId || customerId;
      if (!idToLoad) return;

      setError(null);
      setLoading(true);
      try {
        const journeyResult = await api.get<CustomerJourneyDto>(`/api/customers/${idToLoad}/journey`);
        setJourney(journeyResult.data);
      } catch (caught) {
        const message = errorMessage(caught);
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [customerId, toast]
  );

  const handleCustomerChange = (selectedId: string) => {
    setCustomerId(selectedId);
    setError(null);
    if (!selectedId) {
      setJourney(null);
      setLoading(false);
      return;
    }
    void load(selectedId);
  };

  const clearCustomer = () => {
    setCustomerId('');
    setJourney(null);
    setError(null);
    setLoading(false);
  };

  return (
    <section className="space-y-6 pb-[calc(2rem+env(safe-area-inset-bottom))] font-montserrat">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Customer journey</p>
        <h1 className="mt-1 font-oswald text-3xl font-bold uppercase tracking-tight text-primary sm:text-4xl">
          Tiến độ khách hàng
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Theo dõi lịch sử tập, chỉ số cơ thể, thành tích và báo cáo của từng học viên tại một nơi.
        </p>
      </header>

      <ProgressSection
        title="Tra cứu tiến độ học viên"
        description="Chọn đúng học viên để tải snapshot và toàn bộ hành trình tập luyện."
      >
        <div className="grid items-end gap-3 lg:grid-cols-[minmax(18rem,1fr)_auto_auto]">
          <CustomerSelect
            label="Chọn học viên"
            name="lookupCustomerId"
            value={customerId}
            onChange={handleCustomerChange}
            placeholder="Tìm theo tên học viên hoặc SĐT..."
          />
          <button
            type="button"
            onClick={() => void load()}
            disabled={!customerId || loading}
            className={primaryButtonClass}
          >
            <Activity size={16} aria-hidden="true" />
            {loading ? 'Đang tải...' : 'Tải tiến độ'}
          </button>
          {customerId && (
            <button type="button" onClick={clearCustomer} className={secondaryButtonClass}>
              <RotateCcw size={15} aria-hidden="true" />
              Xóa tìm kiếm
            </button>
          )}
        </div>
      </ProgressSection>

      {!customerId && (
        <ProgressEmptyState
          icon={UserRoundSearch}
          title="Chọn học viên để xem tiến độ"
          description="Snapshot, lịch sử tập, số đo và báo cáo sẽ xuất hiện sau khi bạn chọn một học viên."
        />
      )}

      {customerId && loading && !journey && <ProgressSkeleton />}

      {customerId && error && !journey && !loading && (
        <ProgressEmptyState
          icon={CircleAlert}
          title="Không thể tải tiến độ"
          description={error}
          action={(
            <button type="button" onClick={() => void load()} className={primaryButtonClass}>
              Thử lại
            </button>
          )}
        />
      )}

      {journey && (
        <div className="space-y-4">
          {error && (
            <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 sm:flex-row sm:items-center sm:justify-between" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => void load()} className="font-bold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
                Thử lại
              </button>
            </div>
          )}
          <PtProgressWorkspace journey={journey} onRefresh={() => void load()} />
        </div>
      )}
    </section>
  );
}
