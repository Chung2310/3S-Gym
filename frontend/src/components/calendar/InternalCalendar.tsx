import { useCallback, useEffect, useState } from 'react';
import { Calendar, RotateCcw, Plus } from 'lucide-react';
import Pagination from '../ui/Pagination';
import { useToast } from '../ui/ToastProvider';
import { api } from '../../services/api';
import type { PaginationMeta, UserRole } from '../../types';
import { errorMessage } from '../../types';
import CalendarEventModal, { type CalendarItem } from './CalendarEventModal';

export default function InternalCalendar({ role }: { role: UserRole }) {
  const toast = useToast();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 0 });
  const [dates, setDates] = useState({ fromDate: '', toDate: '' });
  const [editing, setEditing] = useState<CalendarItem | null | undefined>(undefined);

  const load = useCallback(async (page = 1) => {
    try {
      const query = new URLSearchParams({ page: String(page), limit: '20' });
      if (dates.fromDate) query.set('fromDate', dates.fromDate);
      if (dates.toDate) query.set('toDate', dates.toDate);
      const result = await api.get<CalendarItem[]>(`/api/calendar-events?${query}`);
      setItems(result.data);
      if (result.meta) setMeta(result.meta);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }, [dates.fromDate, dates.toDate, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (item: CalendarItem) => {
    try {
      await api.delete(`/api/calendar-events/${item._id}`);
      void load(meta.page);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const hasActiveFilter = Boolean(dates.fromDate || dates.toDate);

  return (
    <section>
      <div className="section-header">
        <div>
          <h1>Lịch nội bộ</h1>
          <p>Lịch tập và công việc theo khoảng ngày.</p>
        </div>
        {role === 'PT' && (
          <button className="button button-primary" onClick={() => setEditing(null)}>
            <Plus size={18} /> Tạo lịch
          </button>
        )}
      </div>

      <div className="filter-card" style={{ padding: '12px 16px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#003b70' }}>
              <Calendar size={16} color="var(--secondary-color)" />
              <span>Khoảng ngày:</span>
            </div>
            <label className="filter-field" style={{ minWidth: '150px' }}>
              <span className="sr-only">Từ ngày</span>
              <input
                type="date"
                aria-label="Lịch từ ngày"
                value={dates.fromDate}
                onChange={(e) => setDates({ ...dates, fromDate: e.target.value })}
              />
            </label>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>→</span>
            <label className="filter-field" style={{ minWidth: '150px' }}>
              <span className="sr-only">Đến ngày</span>
              <input
                type="date"
                aria-label="Lịch đến ngày"
                value={dates.toDate}
                onChange={(e) => setDates({ ...dates, toDate: e.target.value })}
              />
            </label>
          </div>

          <div className="filter-presets">
            <button
              type="button"
              className="filter-preset-chip"
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                setDates({ fromDate: today, toDate: today });
              }}
            >
              Hôm nay
            </button>
            <button
              type="button"
              className="filter-preset-chip"
              onClick={() => {
                const now = new Date();
                const to = new Date().toISOString().slice(0, 10);
                now.setDate(now.getDate() - 7);
                const from = now.toISOString().slice(0, 10);
                setDates({ fromDate: from, toDate: to });
              }}
            >
              7 ngày qua
            </button>
            {hasActiveFilter && (
              <button
                type="button"
                className="button-filter-reset"
                style={{ height: '26px', padding: '0 8px', fontSize: '0.74rem' }}
                onClick={() => setDates({ fromDate: '', toDate: '' })}
              >
                <RotateCcw size={12} /> Đặt lại
              </button>
            )}
          </div>
        </div>
      </div>

      <ul className="panel calendar-list" aria-label="Danh sách lịch">
        {items.length ? (
          items.map((item) => (
            <li className="published-card" key={item._id}>
              <strong>{item.title}</strong>
              <span>{new Date(item.startsAt).toLocaleString('vi-VN')}</span>
              <span>{item.status}</span>
              {role === 'PT' && (
                <div className="inline-actions">
                  <button className="text-button" onClick={() => setEditing(item)}>Sửa</button>
                  <button className="text-button text-danger" onClick={() => void remove(item)}>Xóa</button>
                </div>
              )}
            </li>
          ))
        ) : (
          <div className="empty-state">Không có sự kiện lịch trong khoảng thời gian này.</div>
        )}
      </ul>

      <Pagination page={meta.page || 1} totalPages={meta.totalPages || 0} onPageChange={load} />
      <CalendarEventModal
        open={editing !== undefined}
        event={editing}
        onClose={() => setEditing(undefined)}
        onSaved={() => void load(meta.page)}
      />
    </section>
  );
}
