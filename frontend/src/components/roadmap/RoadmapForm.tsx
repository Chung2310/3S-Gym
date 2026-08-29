import { useEffect, useState, type FormEvent } from 'react';
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Flame,
  HeartPulse,
  Layers,
  Loader2,
  Plus,
  Scale,
  Sparkles,
  Target,
  Trash2,
  Utensils,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api';
import { errorMessage } from '../../types';
import type { InBodyRecordData } from '../../types/inbody';
import {
  generateSmartRoadmap,
  type GeneratedRoadmapProposal,
  type RoadmapCustomerMeta,
  type RoadmapGoalType,
  type RoadmapPhaseProposal,
  type RoadmapStrategyProposal,
  type RoadmapWeekProposal,
} from '../../services/roadmapGenerator';
import CustomerSelect from '../ui/CustomerSelect';
import { useToast } from '../ui/ToastProvider';
import type { Roadmap } from '../../types';

export type { Roadmap };

interface RoadmapFormProps {
  onSaved: () => void;
  onCancel: () => void;
  initialData?: Roadmap | null;
}

const newPhase = (order: number): RoadmapPhaseProposal => ({
  order,
  name: '',
  durationWeeks: 1,
  goals: [],
  weeks: [],
});

export default function RoadmapForm({ onSaved, onCancel, initialData }: RoadmapFormProps) {
  const toast = useToast();

  // Core Form State
  const [customerId, setCustomerId] = useState(initialData?.customerId || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [phases, setPhases] = useState<RoadmapPhaseProposal[]>((initialData?.phases as RoadmapPhaseProposal[]) || [newPhase(1)]);
  const [strategy, setStrategy] = useState<RoadmapStrategyProposal | null>((initialData?.strategy as RoadmapStrategyProposal) || null);
  const [baseline, setBaseline] = useState<Record<string, number>>((initialData?.baseline as Record<string, number>) || {});
  const [phaseError, setPhaseError] = useState('');
  const [loading, setLoading] = useState(false);

  // Customer Context & InBody Data
  const [customerMeta, setCustomerMeta] = useState<RoadmapCustomerMeta | null>(null);
  const [latestInbody, setLatestInbody] = useState<InBodyRecordData | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  // Smart Proposal Generator Controls
  const [goalType, setGoalType] = useState<RoadmapGoalType>('FAT_LOSS');
  const [targetValue, setTargetValue] = useState<number>(5);
  const [targetUnit, setTargetUnit] = useState<string>('kg');
  const [durationWeeks, setDurationWeeks] = useState<number>(12);
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(3);
  const [customNotes, setCustomNotes] = useState<string>('');

  // UI Accordion toggles
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({ 0: true });
  const [showSessions, setShowSessions] = useState(true);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiElapsedSeconds, setAiElapsedSeconds] = useState(0);
  const [aiStep, setAiStep] = useState(1);
  const [aiProgress, setAiProgress] = useState(15);

  // Timer & dynamic step progression for AI generation
  useEffect(() => {
    if (!loadingAi) {
      setAiElapsedSeconds(0);
      setAiStep(1);
      setAiProgress(15);
      return;
    }

    const timer = setInterval(() => {
      setAiElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next <= 5) {
          setAiStep(1);
          setAiProgress(15 + next * 2);
        } else if (next <= 60) {
          setAiStep(2);
          setAiProgress(25 + Math.floor(((next - 5) / 55) * 35));
        } else if (next <= 120) {
          setAiStep(3);
          setAiProgress(60 + Math.floor(((next - 60) / 60) * 25));
        } else {
          setAiStep(4);
          setAiProgress(Math.min(96, 85 + Math.floor(((next - 120) / 60) * 11)));
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadingAi]);

  // 1. Fetch Customer Profile & Latest InBody when customer is selected
  useEffect(() => {
    if (!customerId) {
      setCustomerMeta(null);
      setLatestInbody(null);
      return;
    }

    let isMounted = true;
    const fetchContext = async () => {
      setLoadingContext(true);
      try {
        // Fetch Customer Info
        const custRes = await api.get<any>(`/api/customers/${customerId}`).catch(() => null);
        if (isMounted && custRes?.data) {
          setCustomerMeta(custRes.data);
          if (custRes.data.medicalNotes) {
            setCustomNotes((prev) => prev || custRes.data.medicalNotes || '');
          }
        }

        // Fetch Latest InBody
        const inbodyRes = await api.get<InBodyRecordData[]>(`/api/inbody?customerId=${customerId}&limit=1`).catch(() => null);
        if (isMounted && inbodyRes?.data && inbodyRes.data.length > 0) {
          setLatestInbody(inbodyRes.data[0]);
        }

        // Fetch Active Goal if any
        const goalRes = await api.get<any[]>(`/api/goals?customerId=${customerId}&limit=1`).catch(() => null);
        if (isMounted && goalRes?.data && goalRes.data.length > 0) {
          const activeGoal = goalRes.data[0];
          if (activeGoal.type) setGoalType(activeGoal.type as RoadmapGoalType);
          if (activeGoal.targetValue) setTargetValue(Number(activeGoal.targetValue));
          if (activeGoal.targetUnit) setTargetUnit(activeGoal.targetUnit);
          if (activeGoal.sessionsPerWeek) setSessionsPerWeek(Number(activeGoal.sessionsPerWeek));
        }
      } catch (err) {
        console.error('Error fetching customer context:', err);
      } finally {
        if (isMounted) setLoadingContext(false);
      }
    };

    void fetchContext();
    return () => {
      isMounted = false;
    };
  }, [customerId]);

  // Fast Instant Sports Science Roadmap Generation
  const applyInstantSportsScienceRoadmap = () => {
    const fallbackProposal = generateSmartRoadmap(
      customerMeta || { _id: customerId, fullName: 'Học viên' },
      latestInbody,
      {
        type: goalType,
        targetValue,
        targetUnit,
        durationWeeks,
        sessionsPerWeek,
        customNotes,
      }
    );

    setTitle(fallbackProposal.title);
    setStrategy(fallbackProposal.strategy);
    setPhases(fallbackProposal.phases);
    setBaseline(fallbackProposal.baseline);

    const expandedMap: Record<number, boolean> = {};
    fallbackProposal.phases.forEach((_, idx) => {
      expandedMap[idx] = true;
    });
    setExpandedPhases(expandedMap);
    setLoadingAi(false);
  };

  // 2. Trigger Real AI Proposal Generation with Strict 20s Timeout
  const handleGenerateSmartProposal = async () => {
    if (!customerId) {
      toast.error('Vui lòng chọn học viên trước khi tạo đề xuất lộ trình.');
      return;
    }

    setLoadingAi(true);
    const requestText = `Mục tiêu chính: ${goalType}, Số lượng/Chỉ số: ${targetValue} ${targetUnit}, Thời lượng: ${durationWeeks} tuần, Tần suất: ${sessionsPerWeek} buổi/tuần. Ghi chú & Yêu cầu riêng: ${customNotes || 'Tối ưu hóa thể hình và sức khỏe toàn diện'}`;

    try {
      // Race between AI backend call and 180-second timeout (3 phút)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT_EXCEEDED')), 180000)
      );

      const aiCallPromise = api.post<{
        title: string;
        strategy: RoadmapStrategyProposal;
        phases: RoadmapPhaseProposal[];
        baseline?: Record<string, number>;
      }>('/api/content-drafts/roadmap', {
        customerId,
        request: requestText,
      });

      const result = await Promise.race([aiCallPromise, timeoutPromise]);
      const proposal = result.data;
      if (proposal) {
        if (proposal.title) setTitle(proposal.title);
        if (proposal.strategy) setStrategy(proposal.strategy);
        if (proposal.phases && Array.isArray(proposal.phases)) {
          let weekCounter = 1;
          const normalizedPhases = proposal.phases.map((p, pIdx) => {
            const duration = p.durationWeeks || (p.weeks ? p.weeks.length : 4);
            const existing = Array.isArray(p.weeks) ? p.weeks : [];
            const fullWeeks: RoadmapWeekProposal[] = [];

            for (let w = 0; w < duration; w++) {
              const weekNum = weekCounter + w;
              const match = existing.find((ew) => ew.week === weekNum || ew.week === (w + 1)) || existing[w];
              if (match) {
                fullWeeks.push({
                  ...match,
                  week: weekNum,
                  sessionTargets: match.sessionTargets || sessionsPerWeek,
                  sessions: Array.isArray(match.sessions) && match.sessions.length > 0 ? match.sessions : (existing[0]?.sessions || []),
                });
              } else {
                fullWeeks.push({
                  week: weekNum,
                  focus: `Tuần ${weekNum}: Phân kỳ huấn luyện theo ${p.name || `Phase ${pIdx + 1}`}`,
                  sessionTargets: sessionsPerWeek,
                  sessions: existing[0]?.sessions || [],
                });
              }
            }
            weekCounter += duration;
            return {
              ...p,
              order: pIdx + 1,
              durationWeeks: duration,
              weeks: fullWeeks,
            };
          });
          setPhases(normalizedPhases);
        }
        if (proposal.baseline) setBaseline(proposal.baseline);

        const expandedMap: Record<number, boolean> = {};
        (proposal.phases || []).forEach((_, idx) => {
          expandedMap[idx] = true;
        });
        setExpandedPhases(expandedMap);
        toast.success(result.message || 'AI đã tạo lộ trình Roadmap thành công!');
        return;
      }
    } catch (err: any) {
      // Fallback tự động nếu backend AI provider quá thời gian hoặc gặp lỗi mạng
      applyInstantSportsScienceRoadmap();
      if (err?.message === 'AI_TIMEOUT_EXCEEDED') {
        toast.info('Quá thời gian chờ AI (>180s). Đã tự động tạo lộ trình tức thì theo Khoa học Thể thao & InBody!');
      } else {
        toast.info('Đã tự động khởi tạo lộ trình chuẩn theo Khoa học Thể thao & InBody!');
      }
    } finally {
      setLoadingAi(false);
    }
  };

  // Phase & Week Manipulation Helpers
  const togglePhaseExpand = (index: number) => {
    setExpandedPhases((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const updatePhase = (index: number, change: Partial<RoadmapPhaseProposal>) => {
    setPhases((current) =>
      current.map((phase, pIdx) => (pIdx === index ? { ...phase, ...change } : phase))
    );
  };

  const removePhase = (index: number) => {
    if (phases.length <= 1) {
      toast.error('Lộ trình phải có ít nhất 1 giai đoạn (Phase).');
      return;
    }
    setPhases((current) => current.filter((_, idx) => idx !== index).map((p, idx) => ({ ...p, order: idx + 1 })));
  };

  const addPhase = () => {
    setPhases((current) => [...current, newPhase(current.length + 1)]);
    setExpandedPhases((prev) => ({ ...prev, [phases.length]: true }));
  };

  const addWeek = (phaseIndex: number) => {
    setPhases((current) =>
      current.map((phase, idx) => {
        if (idx !== phaseIndex) return phase;
        const nextWeekNum = phase.weeks.length + 1;
        const newWeek: RoadmapWeekProposal = {
          week: nextWeekNum,
          focus: '',
          sessionTargets: sessionsPerWeek,
          sessions: [],
        };
        return {
          ...phase,
          durationWeeks: Math.max(phase.durationWeeks, nextWeekNum),
          weeks: [...phase.weeks, newWeek],
        };
      })
    );
  };

  const updateWeekFocus = (phaseIndex: number, weekIndex: number, focus: string) => {
    setPhases((current) =>
      current.map((phase, pIdx) => {
        if (pIdx !== phaseIndex) return phase;
        return {
          ...phase,
          weeks: phase.weeks.map((w, wIdx) => (wIdx === weekIndex ? { ...w, focus } : w)),
        };
      })
    );
  };

  const removeWeek = (phaseIndex: number, weekIndex: number) => {
    setPhases((current) =>
      current.map((phase, pIdx) => {
        if (pIdx !== phaseIndex) return phase;
        if (phase.weeks.length <= 1) return phase;
        const newWeeks = phase.weeks.filter((_, wIdx) => wIdx !== weekIndex).map((w, i) => ({ ...w, week: i + 1 }));
        return {
          ...phase,
          durationWeeks: Math.max(1, newWeeks.length),
          weeks: newWeeks,
        };
      })
    );
  };

  // Submit Handler
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (new Set(phases.map((phase) => phase.order)).size !== phases.length) {
      setPhaseError('Thứ tự phase không được trùng.');
      return;
    }
    setPhaseError('');
    setLoading(true);

    try {
      const payload = {
        customerId,
        title,
        baseline: baseline || {},
        strategy: strategy || {},
        phases,
      };

      if (initialData?._id) {
        const result = await api.patch<Roadmap>(`/api/roadmaps/${initialData._id}`, payload);
        toast.success(result.message || 'Cập nhật roadmap thành công.');
      } else {
        const result = await api.post<Roadmap>('/api/roadmaps', payload);
        toast.success(result.message || 'Tạo roadmap thành công.');
      }
      onSaved();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="panel" onSubmit={submit} style={{ display: 'grid', gap: '20px', padding: '24px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Sparkles size={22} color="var(--secondary-color)" /> {initialData ? 'Chỉnh sửa Lộ trình Roadmap' : 'Đề xuất Lộ trình & Mục tiêu Toàn diện'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>
            Hệ thống kết hợp chỉ số InBody, hồ sơ học viên và mục tiêu của PT để tự động sinh lộ trình chi tiết theo từng giai đoạn.
          </p>
        </div>
      </div>

      {/* 1. Customer Selector & Quick Baseline Card */}
      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div className="form-grid" style={{ marginBottom: '12px' }}>
          <CustomerSelect
            label="Mã khách hàng"
            name="customerId"
            value={customerId}
            onChange={setCustomerId}
            required
            placeholder="Tìm theo tên học viên hoặc SĐT..."
          />
          <label className="field">
            <span style={{ fontWeight: 700 }}>Tên Lộ trình (Roadmap Title)</span>
            <input
              aria-label="Tên roadmap"
              placeholder="Ví dụ: Lộ trình Giảm mỡ & Tái cấu trúc 12 tuần..."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
        </div>

        {/* Snapshot info of the selected customer & InBody */}
        {customerId && (
          <div style={{ marginTop: '12px', padding: '12px 16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Scale size={16} color="var(--secondary-color)" /> Hồ sơ Thể trạng & Dữ liệu InBody gần nhất:
              </span>
              {loadingContext && <span style={{ color: 'var(--secondary-color)' }}>Đang tải dữ liệu...</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              <div style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Cân nặng</div>
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{latestInbody?.weight || customerMeta?.initialWeight || 'Chưa đo'} kg</strong>
              </div>
              <div style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>% Mỡ cơ thể</div>
                <strong style={{ fontSize: '1rem', color: latestInbody?.bodyFatPercentage && latestInbody.bodyFatPercentage > 25 ? '#dc2626' : '#16a34a' }}>
                  {latestInbody?.bodyFatPercentage ? `${latestInbody.bodyFatPercentage}%` : 'Chưa có'}
                </strong>
              </div>
              <div style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Khối lượng Cơ (SMM)</div>
                <strong style={{ fontSize: '1rem', color: '#0284c7' }}>{latestInbody?.muscleMass ? `${latestInbody.muscleMass} kg` : 'Chưa có'}</strong>
              </div>
              <div style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Mỡ nội tạng / Điểm</div>
                <strong style={{ fontSize: '1rem', color: '#d97706' }}>Level {latestInbody?.visceralFatLevel || '--'} • {latestInbody?.inbodyScore || '--'}đ</strong>
              </div>
              <div style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>BMR / TDEE cơ bản</div>
                <strong style={{ fontSize: '1rem', color: '#475569' }}>{latestInbody?.bmr || 1600} kcal</strong>
              </div>
            </div>

            {customerMeta?.medicalNotes && (
              <div style={{ marginTop: '8px', color: '#b45309', background: '#fef3c7', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> <strong>Lưu ý bệnh lý / Chấn thương:</strong> {customerMeta.medicalNotes}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Goal & Roadmap Parameter Controls */}
      <div style={{ background: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)', padding: '20px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 14px' }}>
          <Target size={18} /> Thiết lập Thông số Mục tiêu (Goal Engine)
        </h3>

        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <label className="field">
            <span style={{ fontWeight: 700 }}>Mục tiêu chính</span>
            <select value={goalType} onChange={(e) => setGoalType(e.target.value as RoadmapGoalType)} style={{ fontWeight: 600 }}>
              <option value="FAT_LOSS">🔥 Giảm mỡ & Giữ cơ (Fat Loss)</option>
              <option value="WEIGHT_LOSS">📉 Giảm cân toàn thân (Weight Loss)</option>
              <option value="MUSCLE_GAIN">💪 Tăng cơ nạc (Muscle Gain / Bulking)</option>
              <option value="RECOMPOSITION">⚡ Tái cấu trúc vóc dáng (Recomposition)</option>
              <option value="FITNESS">🏃 Cải thiện Thể lực & Sức bền (Fitness)</option>
              <option value="STRENGTH">🏋️ Tăng Sức mạnh nền tảng (Strength)</option>
            </select>
          </label>

          <label className="field">
            <span style={{ fontWeight: 700 }}>Chỉ số mục tiêu (Con số)</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="50"
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                required
                style={{ flex: 1 }}
              />
              <select value={targetUnit} onChange={(e) => setTargetUnit(e.target.value)} style={{ width: '80px' }}>
                <option value="kg">kg</option>
                <option value="% mỡ">% mỡ</option>
                <option value="cm eo">cm eo</option>
              </select>
            </div>
          </label>

          <label className="field">
            <span style={{ fontWeight: 700 }}>Thời gian dự kiến (Tuần)</span>
            <select value={durationWeeks} onChange={(e) => setDurationWeeks(Number(e.target.value))}>
              <option value="4">4 tuần (1 tháng - Cấp tốc)</option>
              <option value="8">8 tuần (2 tháng - Cơ bản)</option>
              <option value="12">12 tuần (3 tháng - Chuẩn khuyến nghị)</option>
              <option value="16">16 tuần (4 tháng - Chuyên sâu)</option>
              <option value="24">24 tuần (6 tháng - Chuyển hóa toàn diện)</option>
            </select>
          </label>

          <label className="field">
            <span style={{ fontWeight: 700 }}>Tần suất tập luyện</span>
            <select value={sessionsPerWeek} onChange={(e) => setSessionsPerWeek(Number(e.target.value))}>
              <option value="3">3 buổi / tuần (Full Body Split)</option>
              <option value="4">4 buổi / tuần (Upper / Lower)</option>
              <option value="5">5 buổi / tuần (Push / Pull / Legs)</option>
              <option value="6">6 buổi / tuần (Vận động viên)</option>
            </select>
          </label>
        </div>

        <label className="field" style={{ marginTop: '12px' }}>
          <span style={{ fontWeight: 700 }}>Ghi chú cá nhân hóa / Yêu cầu riêng của học viên</span>
          <input
            placeholder="Ví dụ: Dân văn phòng ngồi nhiều đau lưng dưới, ưu tiên siết mỡ đùi và eo, tập sáng..."
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
          />
        </label>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="button button-primary"
            onClick={handleGenerateSmartProposal}
            disabled={loadingAi}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #003b70 100%)',
              padding: '10px 22px',
              fontSize: '0.95rem',
              fontWeight: 800,
              boxShadow: '0 4px 14px rgba(2,132,199,0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: loadingAi ? 'not-allowed' : 'pointer',
              opacity: loadingAi ? 0.75 : 1,
            }}
          >
            <Sparkles size={18} />
            {loadingAi ? 'AI đang suy nghĩ, phân tích...' : '⚡ Tạo Lộ trình với AI'}
          </button>
        </div>

        {/* AI Detailed Loading Progress Overlay Card */}
        {loadingAi && (
          <div
            style={{
              marginTop: '16px',
              padding: '18px 20px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              borderRadius: '12px',
              border: '1px solid #334155',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              display: 'grid',
              gap: '14px',
            }}
          >
            {/* Header with timer and fast-skip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                  <Loader2 size={18} className="spin" />
                </div>
                <div>
                  <strong style={{ fontSize: '0.95rem', color: '#f8fafc', display: 'block' }}>
                    Đang xử lý & phân kỳ lộ trình bằng AI (Qwen 3.8 Flash)
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Kết hợp hồ sơ {customerMeta?.fullName || 'học viên'}, dữ liệu InBody và mục tiêu PT
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> {aiElapsedSeconds}s
                </span>
                <button
                  type="button"
                  onClick={applyInstantSportsScienceRoadmap}
                  style={{
                    background: '#eab308',
                    color: '#000000',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Bỏ qua chờ đợi, dùng ngay bộ tạo chuẩn Khoa học Thể thao"
                >
                  <Zap size={13} /> Lấy ngay (0.01s)
                </button>
              </div>
            </div>

            {/* Dynamic Progress Bar */}
            <div style={{ width: '100%', height: '6px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${aiProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            {/* 4 Steps Indicator */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '0.76rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: aiStep >= 1 ? '#38bdf8' : '#64748b', fontWeight: aiStep === 1 ? 700 : 500 }}>
                {aiStep > 1 ? <CheckCircle2 size={14} color="#4ade80" /> : <Loader2 size={14} className="spin" />}
                <span>1. Đọc InBody & Hồ sơ</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: aiStep >= 2 ? '#38bdf8' : '#64748b', fontWeight: aiStep === 2 ? 700 : 500 }}>
                {aiStep > 2 ? <CheckCircle2 size={14} color="#4ade80" /> : aiStep === 2 ? <Loader2 size={14} className="spin" /> : <span style={{ width: '14px', textAlign: 'center' }}>•</span>}
                <span>2. Gửi LLM & Suy luận</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: aiStep >= 3 ? '#38bdf8' : '#64748b', fontWeight: aiStep === 3 ? 700 : 500 }}>
                {aiStep > 3 ? <CheckCircle2 size={14} color="#4ade80" /> : aiStep === 3 ? <Loader2 size={14} className="spin" /> : <span style={{ width: '14px', textAlign: 'center' }}>•</span>}
                <span>3. Tính Calo & Cardio</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: aiStep >= 4 ? '#38bdf8' : '#64748b', fontWeight: aiStep === 4 ? 700 : 500 }}>
                {aiStep > 4 ? <CheckCircle2 size={14} color="#4ade80" /> : aiStep === 4 ? <Loader2 size={14} className="spin" /> : <span style={{ width: '14px', textAlign: 'center' }}>•</span>}
                <span>4. Dựng Phase & Tuần</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Comprehensive Strategy Overview Cards (Generated or Custom) */}
      {strategy && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Zap size={18} color="#eab308" /> Chiến lược Huấn luyện & Dinh dưỡng Tổng quan
            </h3>
            <span style={{ fontSize: '0.8rem', background: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
              {strategy.estimatedWeeks} Tuần • {strategy.sessionsPerWeek} Buổi/Tuần
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Phương pháp tập luyện */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', fontSize: '0.9rem' }}>
                <Dumbbell size={16} color="var(--secondary-color)" /> Phương pháp tập luyện & Lịch phân chia
              </div>
              <p style={{ margin: '0 0 6px', fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
                {strategy.trainingMethod}
              </p>
              <div style={{ fontSize: '0.78rem', color: '#64748b', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <strong>Lịch tập:</strong> {strategy.trainingSplit}
              </div>
            </div>

            {/* Chiến lược Cardio */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', fontSize: '0.9rem' }}>
                <HeartPulse size={16} color="#ef4444" /> Chiến lược Cardio & Tim mạch
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
                {strategy.cardioProtocol}
              </p>
            </div>

            {/* Chiến lược Dinh dưỡng */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', fontSize: '0.9rem' }}>
                <Utensils size={16} color="#16a34a" /> Mục tiêu Dinh dưỡng & Calo hàng ngày
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a' }}>
                  {strategy.nutrition.targetCalories} kcal
                </span>
                <span style={{ fontSize: '0.78rem', color: strategy.nutrition.calorieDeficitOrSurplus < 0 ? '#dc2626' : '#2563eb', fontWeight: 700 }}>
                  ({strategy.nutrition.calorieDeficitOrSurplus < 0 ? `Thâm hụt ${Math.abs(strategy.nutrition.calorieDeficitOrSurplus)}` : `Thặng dư ${strategy.nutrition.calorieDeficitOrSurplus}`} kcal)
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '0.76rem', textAlign: 'center', background: '#ffffff', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div><span style={{ color: '#64748b' }}>Đạm (Protein)</span><br /><strong>{strategy.nutrition.proteinGrams}g</strong></div>
                <div><span style={{ color: '#64748b' }}>Tinh bột (Carb)</span><br /><strong>{strategy.nutrition.carbsGrams}g</strong></div>
                <div><span style={{ color: '#64748b' }}>Chất béo (Fat)</span><br /><strong>{strategy.nutrition.fatGrams}g</strong></div>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '6px' }}>
                💧 Uống tối thiểu: <strong>{strategy.nutrition.waterLiters} Lít nước/ngày</strong>
              </div>
            </div>

            {/* Các mốc đánh giá */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', fontSize: '0.9rem' }}>
                <CheckCircle2 size={16} color="#8b5cf6" /> Các mốc Đánh giá & Checkpoints
              </div>
              <div style={{ display: 'grid', gap: '6px' }}>
                {strategy.checkpoints.map((cp, idx) => (
                  <div key={idx} style={{ fontSize: '0.78rem', background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ color: '#4338ca' }}>{cp.title}</strong>
                    <div style={{ color: '#64748b', fontSize: '0.74rem' }}>{cp.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Multi-Phase Breakdown (Phases -> Weeks -> Sessions) */}
      <div style={{ display: 'grid', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Layers size={20} color="var(--secondary-color)" /> Lộ trình Phân kỳ ({phases.length} Phase • {phases.reduce((acc, p) => acc + (p.durationWeeks || 0), 0)} Tuần)
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setShowSessions(!showSessions)}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              {showSessions ? 'Ẩn chi tiết buổi tập' : 'Hiện chi tiết buổi tập'}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={addPhase}
              style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} /> Thêm Phase
            </button>
          </div>
        </div>

        {phases.map((phase, phaseIndex) => {
          const isExpanded = Boolean(expandedPhases[phaseIndex]);

          return (
            <div
              key={phaseIndex}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                overflow: 'hidden',
              }}
            >
              {/* Phase Card Header */}
              <div
                style={{
                  background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                }}
                onClick={() => togglePhaseExpand(phaseIndex)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <span
                    style={{
                      background: 'var(--primary-color)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      padding: '4px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    Phase {phase.order}
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                    {phase.name || `Giai đoạn ${phase.order}`}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', background: '#ffffff', padding: '2px 8px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    {phase.durationWeeks} tuần • {phase.weeks?.length || 0} tuần chi tiết
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhase(phaseIndex);
                    }}
                    title="Xóa Phase này"
                  >
                    <Trash2 size={16} />
                  </button>
                  {isExpanded ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
                </div>
              </div>

              {/* Phase Card Body */}
              {isExpanded && (
                <div style={{ padding: '18px', display: 'grid', gap: '16px' }}>
                  <div className="form-grid" style={{ gridTemplateColumns: '80px 1fr 140px' }}>
                    <label className="field">
                      <span style={{ fontWeight: 700 }}>Thứ tự</span>
                      <input
                        aria-label={`Thứ tự phase ${phaseIndex + 1}`}
                        type="number"
                        min="1"
                        value={phase.order}
                        onChange={(e) => updatePhase(phaseIndex, { order: Number(e.target.value) })}
                        required
                      />
                    </label>
                    <label className="field">
                      <span style={{ fontWeight: 700 }}>Tên giai đoạn (Phase Name)</span>
                      <input
                        aria-label={`Tên phase ${phaseIndex + 1}`}
                        placeholder="Ví dụ: Giai đoạn 1: Thích nghi & Chuẩn hóa Kỹ thuật..."
                        value={phase.name}
                        onChange={(e) => updatePhase(phaseIndex, { name: e.target.value })}
                        required
                      />
                    </label>
                    <label className="field">
                      <span style={{ fontWeight: 700 }}>Thời lượng (Tuần)</span>
                      <input
                        aria-label={`Thời lượng phase ${phaseIndex + 1}`}
                        type="number"
                        min="1"
                        value={phase.durationWeeks}
                        onChange={(e) => updatePhase(phaseIndex, { durationWeeks: Number(e.target.value) })}
                        required
                      />
                    </label>
                  </div>

                  {/* Weeks list inside Phase */}
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#475569' }}>
                        Chi tiết các tuần huấn luyện trong Phase {phase.order}:
                      </span>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => addWeek(phaseIndex)}
                        style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={12} /> Thêm tuần vào phase {phaseIndex + 1}
                      </button>
                    </div>

                    {phase.weeks.map((week, weekIndex) => (
                      <div
                        key={weekIndex}
                        style={{
                          background: '#f8fafc',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          display: 'grid',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <span style={{ background: '#0284c7', color: '#ffffff', fontWeight: 800, fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px' }}>
                              Tuần {week.week}
                            </span>
                            <input
                              aria-label={`Trọng tâm tuần ${week.week} phase ${phaseIndex + 1}`}
                              placeholder={`Trọng tâm huấn luyện tuần ${week.week}...`}
                              value={week.focus}
                              onChange={(e) => updateWeekFocus(phaseIndex, weekIndex, e.target.value)}
                              style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
                              required
                            />
                          </div>

                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                            onClick={() => removeWeek(phaseIndex, weekIndex)}
                            title="Xóa tuần này"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Sessions inside week */}
                        {showSessions && week.sessions && week.sessions.length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginTop: '4px' }}>
                            {week.sessions.map((sess, sIdx) => (
                              <div
                                key={sIdx}
                                style={{
                                  background: '#ffffff',
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #e2e8f0',
                                  fontSize: '0.78rem',
                                }}
                              >
                                <strong style={{ color: '#003b70', display: 'block', marginBottom: '2px' }}>
                                  {sess.name}
                                </strong>
                                <div style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: '4px' }}>
                                  {sess.focus}
                                </div>
                                <div style={{ color: '#475569', fontSize: '0.7rem', display: 'grid', gap: '2px' }}>
                                  {sess.exercises?.map((ex, exIdx) => (
                                    <div key={exIdx}>• {ex}</div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {phaseError && <p className="field-error" role="alert">{phaseError}</p>}

      {/* Action Footer */}
      <div className="modal-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <button className="button button-secondary" type="button" onClick={onCancel}>
          Hủy
        </button>
        <button className="button button-secondary" type="button" onClick={addPhase}>
          Thêm phase
        </button>
        <button
          className="button button-primary"
          type="submit"
          disabled={loading}
          style={{ minWidth: '140px', fontWeight: 800 }}
        >
          {loading ? 'Đang lưu...' : initialData ? 'Cập nhật Roadmap' : 'Lưu roadmap'}
        </button>
      </div>
    </form>
  );
}
