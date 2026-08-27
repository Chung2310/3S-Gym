import { useCallback, useState } from 'react';
import { Search, X, Sparkles, RefreshCw, RotateCcw } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { errorMessage } from '../../types';
import ActivityCalculator from './ActivityCalculator';
import NutritionLogForm from './NutritionLogForm';
import AiNutritionDraftModal from './AiNutritionDraftModal';

interface Summary {
  consumedCalories?: number;
  burnedCalories?: number;
  netCalories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export default function NutritionWorkspace() {
  const toast = useToast();
  const [customerId, setCustomerId] = useState('');
  const [summary, setSummary] = useState<Summary>({});
  const [aiOpen, setAiOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      const result = await api.get<unknown[]>(`/api/nutrition/logs?customerId=${customerId}&page=1&limit=20`);
      setSummary((result.summary as Summary | undefined) || {});
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
          <h1>Dinh dưỡng</h1>
          <p>Tính chỉ số, theo dõi nhật ký và review bản nháp AI.</p>
        </div>
        <button
          className="button button-primary"
          onClick={() => setAiOpen(true)}
          disabled={!customerId}
        >
          <Sparkles size={16} /> Mở trợ lý AI
        </button>
      </div>

      <div className="panel" style={{ padding: '10px 14px', marginBottom: '14px' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <div className="search-field" style={{ maxWidth: '340px' }}>
            <Search size={16} className="search-icon" aria-hidden="true" />
            <input
              aria-label="Mã khách hàng dinh dưỡng"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="Nhập mã khách hàng dinh dưỡng..."
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
            className="button button-secondary"
            onClick={() => void load()}
            disabled={!customerId || loading}
          >
            <RefreshCw size={15} /> {loading ? 'Đang tải...' : 'Tải tổng hợp'}
          </button>
          {customerId && (
            <button
              type="button"
              className="button-filter-reset"
              onClick={() => {
                setCustomerId('');
                setSummary({});
              }}
            >
              <RotateCcw size={13} /> Xóa tìm kiếm
            </button>
          )}
        </div>
      </div>

      <ActivityCalculator />

      {customerId && (
        <NutritionLogForm customerId={customerId} onSaved={() => void load()} />
      )}

      <section className="panel">
        <h2>Tổng hợp</h2>
        <p>
          Nạp <strong>{summary.consumedCalories || 0} kcal</strong> · Tiêu hao <strong>{summary.burnedCalories || 0} kcal</strong> · Ròng <strong>{summary.netCalories || 0} kcal</strong>
        </p>
      </section>

      <AiNutritionDraftModal
        open={aiOpen}
        customerId={customerId}
        onClose={() => setAiOpen(false)}
        onSaved={() => undefined}
      />
    </section>
  );
}
