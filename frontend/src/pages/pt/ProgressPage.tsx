import { useCallback, useState } from 'react';
import { Activity, RotateCcw } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import CustomerSelect from '../../components/ui/CustomerSelect';
import { errorMessage } from '../../types';
import PtProgressWorkspace from '../../components/progress/PtProgressWorkspace';
import type { CustomerJourneyDto } from '../../types';

export default function ProgressPage() {
  const toast = useToast();
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [journey, setJourney] = useState<CustomerJourneyDto | null>(null);

  const load = useCallback(
    async (targetId?: string) => {
      const idToLoad = targetId || customerId;
      if (!idToLoad) return;
      try {
        setLoading(true);
        const journeyResult = await api.get<CustomerJourneyDto>(`/api/customers/${idToLoad}/journey`);
        setJourney(journeyResult.data);
      } catch (error) {
        toast.error(errorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [customerId, toast]
  );

  return (
    <section>
      <div className="section-header">
        <div>
          <h1>Tiến độ khách hàng</h1>
          <p>Check-in, lịch sử tập, số đo, biểu đồ và báo cáo công bố.</p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
        <h3 className="mb-3 text-sm font-bold text-slate-800">
          Tra cứu tiến độ học viên
        </h3>
        <div className="grid items-end gap-3 md:grid-cols-[minmax(280px,420px)_auto_auto]">
          <CustomerSelect
            label="Chọn học viên"
            name="lookupCustomerId"
            value={customerId}
            onChange={(selectedId) => {
              setCustomerId(selectedId);
              if (selectedId) void load(selectedId);
            }}
            placeholder="Tìm theo tên học viên hoặc SĐT..."
          />
          <button
            onClick={() => void load()}
            disabled={!customerId || loading}
            className="button button-primary min-h-11"
          >
            <Activity size={15} /> {loading ? 'Đang tải...' : 'Tải tiến độ'}
          </button>
          {customerId && (
            <button
              type="button"
              onClick={() => {
                setCustomerId('');
                setJourney(null);
              }}
              className="button-filter-reset min-h-11"
            >
              <RotateCcw size={13} /> Xóa tìm kiếm
            </button>
          )}
        </div>
      </div>

      {customerId && journey && <PtProgressWorkspace journey={journey} onRefresh={() => void load()} />}
    </section>
  );
}
