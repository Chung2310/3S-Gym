import { useCallback, useState } from 'react';
import { Search, X, Activity, RotateCcw } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { errorMessage } from '../../types';
import MeasurementForm from './MeasurementForm';
import ProgressCharts, { type Measurement } from './ProgressCharts';
import ProgressReportEditor from './ProgressReportEditor';
import ProgressReportList, { type ProgressReport } from './ProgressReportList';

export default function ProgressWorkspace() {
  const toast = useToast();
  const [customerId, setCustomerId] = useState('');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      const [progress, reportResult] = await Promise.all([
        api.get<{ measurements: Measurement[] }>(`/api/progress/${customerId}`),
        api.get<ProgressReport[]>(`/api/progress-reports?customerId=${customerId}&page=1&limit=20`),
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
          <p>Số đo, biểu đồ và báo cáo công bố.</p>
        </div>
      </div>

      <div className="panel" style={{ padding: '10px 14px', marginBottom: '14px' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <div className="search-field" style={{ maxWidth: '340px' }}>
            <Search size={16} className="search-icon" aria-hidden="true" />
            <input
              aria-label="Mã khách hàng tiến độ"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="Nhập mã khách hàng để tra cứu tiến độ..."
            />
            {customerId && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setCustomerId('')}
                aria-label="Xóa mã khách hàng"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <button
            className="button button-primary"
            onClick={() => void load()}
            disabled={!customerId || loading}
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
            >
              <RotateCcw size={13} /> Xóa tìm kiếm
            </button>
          )}
        </div>
      </div>

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
