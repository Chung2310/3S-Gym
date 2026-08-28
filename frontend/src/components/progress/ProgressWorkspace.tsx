import { useCallback, useState } from 'react';
import { Activity, RotateCcw } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import CustomerSelect from '../ui/CustomerSelect';
import { errorMessage } from '../../types';
import WorkoutCheckIn from '../workouts/WorkoutCheckIn';
import WorkoutSessionHistory from '../workouts/WorkoutSessionHistory';
import MeasurementForm from './MeasurementForm';
import ProgressCharts, { type Measurement } from './ProgressCharts';
import ProgressReportEditor from './ProgressReportEditor';
import ProgressReportList, { type ProgressReport } from './ProgressReportList';

export default function ProgressWorkspace() {
  const toast = useToast();
  const [customerId, setCustomerId] = useState('');
  const [sessionRefresh, setSessionRefresh] = useState(0);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (targetId?: string) => {
    const idToLoad = targetId || customerId;
    if (!idToLoad) return;
    try {
      setLoading(true);
      const [progress, reportResult] = await Promise.all([
        api.get<{ measurements: Measurement[] }>(`/api/progress/${idToLoad}`),
        api.get<ProgressReport[]>(`/api/progress-reports?customerId=${idToLoad}&page=1&limit=20`),
      ]);
      setMeasurements(progress.data.measurements);
      setReports(reportResult.data);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [customerId, toast]);

  return (
    <section>
      <div className="section-header">
        <div>
          <h1>Tiến độ khách hàng</h1>
          <p>Check-in, lịch sử tập, số đo, biểu đồ và báo cáo công bố.</p>
        </div>
      </div>

      <WorkoutCheckIn onCompleted={() => setSessionRefresh((value) => value + 1)} />

      <div className="panel" style={{ padding: '16px 20px', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '0.94rem', fontWeight: 700, margin: '0 0 12px 0', color: '#1e293b' }}>
          Tra cứu tiến độ học viên
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 420px) auto auto', gap: '12px', alignItems: 'flex-end' }}>
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
            className="button button-primary"
            onClick={() => void load()}
            disabled={!customerId || loading}
            style={{ height: '44px' }}
          >
            <Activity size={15} /> {loading ? 'Đang tải...' : 'Tải tiến độ'}
          </button>
          {customerId && (
            <button
              type="button"
              className="button-filter-reset"
              onClick={() => {
                setCustomerId('');
                setMeasurements([]);
                setReports([]);
              }}
              style={{ height: '44px' }}
            >
              <RotateCcw size={13} /> Xóa tìm kiếm
            </button>
          )}
        </div>
      </div>

      <WorkoutSessionHistory customerId={customerId} refreshKey={sessionRefresh} />

      {customerId && (
        <>
          <MeasurementForm customerId={customerId} onSaved={() => void load()} />
          <ProgressCharts measurements={measurements} />
          <ProgressReportEditor customerId={customerId} onSaved={() => void load()} />
          <ProgressReportList reports={reports} />
        </>
      )}
    </section>
  );
}
