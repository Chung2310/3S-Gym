import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Droplets,
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
  type RoadmapCustomerMeta,
  type RoadmapEvaluationCheckpoint,
  type RoadmapGoalType,
  type RoadmapNutritionStrategy,
  type RoadmapPhaseProposal,
  type RoadmapStrategyProposal,
  type RoadmapWeekProposal,
} from '../../services/roadmapGenerator';
import CustomerSelect from '../ui/CustomerSelect';
import { useToast } from '../ui/ToastProvider';
import type { Roadmap } from '../../types/roadmap';

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

  const addPhaseGoal = (phaseIndex: number) => {
    setPhases((current) =>
      current.map((phase, pIdx) => {
        if (pIdx !== phaseIndex) return phase;
        return { ...phase, goals: [...(phase.goals || []), ''] };
      })
    );
  };

  const updatePhaseGoal = (phaseIndex: number, goalIndex: number, text: string) => {
    setPhases((current) =>
      current.map((phase, pIdx) => {
        if (pIdx !== phaseIndex) return phase;
        const newGoals = [...(phase.goals || [])];
        newGoals[goalIndex] = text;
        return { ...phase, goals: newGoals };
      })
    );
  };

  const removePhaseGoal = (phaseIndex: number, goalIndex: number) => {
    setPhases((current) =>
      current.map((phase, pIdx) => {
        if (pIdx !== phaseIndex) return phase;
        return { ...phase, goals: (phase.goals || []).filter((_, gIdx) => gIdx !== goalIndex) };
      })
    );
  };

  const updateWeekSessionTargets = (phaseIndex: number, weekIndex: number, sessionTargets: number) => {
    setPhases((current) =>
      current.map((phase, pIdx) => {
        if (pIdx !== phaseIndex) return phase;
        return {
          ...phase,
          weeks: phase.weeks.map((w, wIdx) => (wIdx === weekIndex ? { ...w, sessionTargets } : w)),
        };
      })
    );
  };

  const updateStrategy = (change: Partial<RoadmapStrategyProposal>) => {
    setStrategy((prev) => (prev ? { ...prev, ...change } : null));
  };

  const updateNutrition = (change: Partial<RoadmapNutritionStrategy>) => {
    setStrategy((prev) => (prev ? { ...prev, nutrition: { ...prev.nutrition, ...change } } : null));
  };

  const updateCheckpoint = (index: number, change: Partial<RoadmapEvaluationCheckpoint>) => {
    setStrategy((prev) => {
      if (!prev) return null;
      const cps = [...prev.checkpoints];
      if (cps[index]) {
        cps[index] = { ...cps[index], ...change };
      }
      return { ...prev, checkpoints: cps };
    });
  };

  const addCheckpoint = () => {
    setStrategy((prev) => {
      if (!prev) return null;
      const newCp: RoadmapEvaluationCheckpoint = {
        week: (prev.checkpoints.length + 1) * 4,
        title: `Mốc ${prev.checkpoints.length + 1}: Đánh giá & InBody`,
        description: 'Kiểm tra tỷ lệ cơ/mỡ và tinh chỉnh lộ trình',
      };
      return { ...prev, checkpoints: [...prev.checkpoints, newCp] };
    });
  };

  const removeCheckpoint = (index: number) => {
    setStrategy((prev) => {
      if (!prev) return null;
      return { ...prev, checkpoints: prev.checkpoints.filter((_, idx) => idx !== index) };
    });
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
      const sanitizedPhases = phases.map((phase) => ({
        ...phase,
        goals: (phase.goals || []).map((g) => g.trim()).filter(Boolean),
        weeks: phase.weeks.map((week) => ({
          week: week.week,
          focus: week.focus.trim(),
          sessionTargets: week.sessionTargets || sessionsPerWeek,
          sessions: [],
        })),
      }));

      const payload = {
        customerId,
        title,
        baseline: baseline || {},
        strategy: strategy || {},
        phases: sanitizedPhases,
      };

      if (initialData?._id) {
        const { customerId: _customerId, ...updatePayload } = payload;
        const result = await api.patch<Roadmap>(`/api/roadmaps/${initialData._id}`, updatePayload);
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
            label="Học viên / Khách hàng"
            name="customerId"
            value={customerId}
            onChange={setCustomerId}
            required
            placeholder="Tìm theo tên học viên, số điện thoại..."
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

      {/* 3. Comprehensive Strategy Overview (Editable) */}
      {strategy && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
            display: 'grid',
            gap: '20px',
          }}
        >
          {/* Header với Tiêu đề & Cấu hình Thời lượng/Tần suất đẹp mắt */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--primary-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: 0,
                }}
              >
                <Zap size={20} color="#eab308" /> Chiến lược Huấn luyện & Dinh dưỡng (Có thể tùy chỉnh)
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Định hướng phương pháp huấn luyện, phân chia lịch tập, cardio, macro dinh dưỡng và các mốc kiểm tra.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#f8fafc',
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color="#0284c7" />
                <span style={{ color: '#475569', fontWeight: 600 }}>Thời lượng:</span>
                <input
                  aria-label="Số tuần ước tính"
                  type="number"
                  min="1"
                  max="52"
                  value={strategy.estimatedWeeks || durationWeeks}
                  onChange={(e) => updateStrategy({ estimatedWeeks: Number(e.target.value) })}
                  style={{
                    width: '56px',
                    padding: '4px 6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    textAlign: 'center',
                    background: '#ffffff',
                    color: '#0f172a',
                  }}
                />
                <span style={{ color: '#64748b', fontWeight: 600 }}>Tuần</span>
              </div>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Dumbbell size={15} color="#0284c7" />
                <span style={{ color: '#475569', fontWeight: 600 }}>Tần suất:</span>
                <input
                  aria-label="Số buổi mỗi tuần"
                  type="number"
                  min="1"
                  max="7"
                  value={strategy.sessionsPerWeek || sessionsPerWeek}
                  onChange={(e) => updateStrategy({ sessionsPerWeek: Number(e.target.value) })}
                  style={{
                    width: '50px',
                    padding: '4px 6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    textAlign: 'center',
                    background: '#ffffff',
                    color: '#0f172a',
                  }}
                />
                <span style={{ color: '#64748b', fontWeight: 600 }}>Buổi / Tuần</span>
              </div>
            </div>
          </div>

          {/* BỐ CỤC 2 CỘT RỘNG RÃI VÀ THOÁNG MẮT (Training + Cardio vs Nutrition) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
            {/* CỘT 1: HUẤN LUYỆN & CARDIO (TRAINING & CARDIO) */}
            <div
              style={{
                background: '#f8fafc',
                padding: '18px 20px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: 'var(--primary-color)', fontSize: '0.95rem' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'rgba(2, 132, 199, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Dumbbell size={16} color="var(--secondary-color)" />
                </div>
                Phương pháp tập & Lịch phân chia
              </div>

              {/* Training Method */}
              <div style={{ display: 'grid', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Phương pháp tập luyện (Training Method):</span>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 400 }}>Tùy chỉnh theo học viên</span>
                </label>
                <textarea
                  aria-label="Phương pháp tập luyện"
                  rows={3}
                  value={strategy.trainingMethod || ''}
                  onChange={(e) => updateStrategy({ trainingMethod: e.target.value })}
                  placeholder="Ví dụ: Progressive Overload (Tăng tiến quá tải) kết hợp Hypertrophy..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '0.88rem',
                    lineHeight: '1.5',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#1e293b',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Training Split */}
              <div style={{ display: 'grid', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 700 }}>
                  Lịch tập phân chia (Split):
                </label>
                <input
                  aria-label="Lịch tập phân chia"
                  value={strategy.trainingSplit || ''}
                  onChange={(e) => updateStrategy({ trainingSplit: e.target.value })}
                  placeholder="Ví dụ: Upper / Lower / Full Body luân phiên..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.88rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#1e293b',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Cardio Protocol */}
              <div style={{ display: 'grid', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HeartPulse size={15} color="#ef4444" />
                  <span>Chiến lược Cardio & Tim mạch (Cardio Protocol):</span>
                </label>
                <textarea
                  aria-label="Chiến lược cardio"
                  rows={4}
                  value={strategy.cardioProtocol || ''}
                  onChange={(e) => updateStrategy({ cardioProtocol: e.target.value })}
                  placeholder="Ví dụ: Kết hợp Cardio Zone 2 (30-45 phút, 3-4 buổi/tuần) để tối ưu đốt mỡ..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '0.88rem',
                    lineHeight: '1.5',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#1e293b',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* CỘT 2: DINH DƯỠNG & MACROS (NUTRITION & MACROS) */}
            <div
              style={{
                background: '#f8fafc',
                padding: '18px 20px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: 'var(--primary-color)', fontSize: '0.95rem' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'rgba(22, 163, 74, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Utensils size={16} color="#16a34a" />
                </div>
                Mục tiêu Dinh dưỡng & Calo hàng ngày
              </div>

              {/* Calo & Deficit/Surplus Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'grid', gap: '4px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Flame size={14} color="#f97316" /> Calo mục tiêu (kcal/ngày)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      aria-label="Calo mục tiêu"
                      type="number"
                      value={strategy.nutrition?.targetCalories || 0}
                      onChange={(e) => updateNutrition({ targetCalories: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <span style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600 }}>kcal</span>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'grid', gap: '4px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Scale size={14} color="#8b5cf6" /> Thâm hụt / Thặng dư
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      aria-label="Thâm hụt hoặc thặng dư calo"
                      type="number"
                      value={strategy.nutrition?.calorieDeficitOrSurplus || 0}
                      onChange={(e) => updateNutrition({ calorieDeficitOrSurplus: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: (strategy.nutrition?.calorieDeficitOrSurplus || 0) < 0 ? '#dc2626' : '#16a34a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <span style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600 }}>kcal</span>
                  </div>
                </div>
              </div>

              {/* 3 Macros: Đạm, Carb, Fat */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ background: '#fef2f2', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <span style={{ fontSize: '0.74rem', color: '#991b1b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>🥩 Đạm (Protein)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      aria-label="Protein grams"
                      type="number"
                      value={strategy.nutrition?.proteinGrams || 0}
                      onChange={(e) => updateNutrition({ proteinGrams: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        border: '1px solid #fca5a5',
                        borderRadius: '6px',
                        textAlign: 'center',
                        background: '#ffffff',
                        color: '#991b1b',
                        boxSizing: 'border-box',
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>g</span>
                  </div>
                </div>

                <div style={{ background: '#fffbeb', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <span style={{ fontSize: '0.74rem', color: '#92400e', fontWeight: 700, display: 'block', marginBottom: '4px' }}>🍚 Tinh bột (Carb)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      aria-label="Carb grams"
                      type="number"
                      value={strategy.nutrition?.carbsGrams || 0}
                      onChange={(e) => updateNutrition({ carbsGrams: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        border: '1px solid #fcd34d',
                        borderRadius: '6px',
                        textAlign: 'center',
                        background: '#ffffff',
                        color: '#92400e',
                        boxSizing: 'border-box',
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600 }}>g</span>
                  </div>
                </div>

                <div style={{ background: '#f5f3ff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                  <span style={{ fontSize: '0.74rem', color: '#6b21a8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>🥑 Chất béo (Fat)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      aria-label="Fat grams"
                      type="number"
                      value={strategy.nutrition?.fatGrams || 0}
                      onChange={(e) => updateNutrition({ fatGrams: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        border: '1px solid #c4b5fd',
                        borderRadius: '6px',
                        textAlign: 'center',
                        background: '#ffffff',
                        color: '#6b21a8',
                        boxSizing: 'border-box',
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#6b21a8', fontWeight: 600 }}>g</span>
                  </div>
                </div>
              </div>

              {/* Nước uống */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f0f9ff', padding: '8px 14px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <span style={{ fontSize: '0.82rem', color: '#0369a1', fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Droplets size={15} color="#0284c7" /> Lượng nước tối thiểu:
                </span>
                <input
                  aria-label="Lượng nước"
                  type="number"
                  step="0.1"
                  value={strategy.nutrition?.waterLiters || 2.5}
                  onChange={(e) => updateNutrition({ waterLiters: Number(e.target.value) })}
                  style={{
                    width: '70px',
                    padding: '4px 8px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    border: '1px solid #7dd3fc',
                    borderRadius: '6px',
                    textAlign: 'center',
                    background: '#ffffff',
                    color: '#0369a1',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 600 }}>Lít / ngày</span>
              </div>

              {/* Lời khuyên dinh dưỡng */}
              <div style={{ display: 'grid', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 700 }}>
                  Lời khuyên & Định hướng Dinh dưỡng:
                </label>
                <textarea
                  aria-label="Lời khuyên dinh dưỡng"
                  rows={3}
                  value={strategy.nutrition?.advice || ''}
                  onChange={(e) => updateNutrition({ advice: e.target.value })}
                  placeholder="Ví dụ: Tập trung vào thực phẩm toàn phần, giàu protein, chất xơ. Hạn chế đồ uống có đường..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#1e293b',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* HÀNG 2: CÁC MỐC ĐÁNH GIÁ & CHECKPOINTS (FULL WIDTH RỘNG RÃI) */}
          <div
            style={{
              background: '#f8fafc',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'grid',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={18} color="#8b5cf6" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                    Các mốc Đánh giá & Đo lường Thể chất (Checkpoints)
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Các cột mốc kiểm tra InBody, chụp ảnh vóc dáng và đánh giá mức độ thích nghi định kỳ
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={addCheckpoint}
                style={{
                  background: '#f5f3ff',
                  border: '1px solid #ddd6fe',
                  color: '#7c3aed',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background 0.2s',
                }}
              >
                <Plus size={14} /> Thêm mốc kiểm tra
              </button>
            </div>

            {/* Grid các Checkpoint Card độc lập - Rộng rãi, KHÔNG scroll ngang chồng chéo! */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {(strategy.checkpoints || []).map((cp, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#ffffff',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    display: 'grid',
                    gap: '10px',
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  {/* Row 1: Badge Tuần + Input Tiêu đề + Nút Xóa */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#f5f3ff',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #ddd6fe',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed' }}>Tuần</span>
                      <input
                        aria-label={`Tuần mốc ${idx + 1}`}
                        type="number"
                        min="1"
                        max="52"
                        value={cp.week}
                        onChange={(e) => updateCheckpoint(idx, { week: Number(e.target.value) })}
                        style={{
                          width: '40px',
                          padding: '2px 4px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          border: '1px solid #c4b5fd',
                          borderRadius: '4px',
                          textAlign: 'center',
                          background: '#ffffff',
                          color: '#7c3aed',
                        }}
                      />
                    </div>

                    <input
                      aria-label={`Tiêu đề mốc ${idx + 1}`}
                      value={cp.title}
                      onChange={(e) => updateCheckpoint(idx, { title: e.target.value })}
                      placeholder="Ví dụ: Mốc 1: Đánh giá thích nghi..."
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: '#ffffff',
                        color: '#0f172a',
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => removeCheckpoint(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Xóa mốc này"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Row 2: Textarea mô tả */}
                  <textarea
                    aria-label={`Mô tả mốc ${idx + 1}`}
                    rows={2}
                    value={cp.description}
                    onChange={(e) => updateCheckpoint(idx, { description: e.target.value })}
                    placeholder="Mô tả chi tiết nội dung kiểm tra, đo lường InBody, điều chỉnh kế hoạch..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '0.8rem',
                      lineHeight: '1.4',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      background: '#ffffff',
                      color: '#334155',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}

              {(!strategy.checkpoints || strategy.checkpoints.length === 0) && (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    fontSize: '0.82rem',
                    color: '#94a3b8',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: '16px',
                    background: '#ffffff',
                    borderRadius: '8px',
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  Chưa có mốc đánh giá định kỳ nào. Bấm &quot;Thêm mốc kiểm tra&quot; để thiết lập các cột mốc đo lường InBody.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Multi-Phase Breakdown (Phases -> Weeks & Goals) */}
      <div style={{ display: 'grid', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Layers size={20} color="var(--secondary-color)" /> Lộ trình Phân kỳ ({phases.length} Phase • {phases.reduce((acc, p) => acc + (p.durationWeeks || 0), 0)} Tuần)
          </h3>
          <button
            type="button"
            className="button button-secondary"
            onClick={addPhase}
            style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={14} /> Thêm Phase
          </button>
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

                  {/* Phase Goals List (Editable) */}
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Target size={14} color="var(--secondary-color)" /> Mục tiêu giai đoạn Phase {phase.order}:
                      </span>
                      <button
                        type="button"
                        onClick={() => addPhaseGoal(phaseIndex)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#ffffff',
                          border: '1px solid #bae6fd',
                          borderRadius: '6px',
                          color: '#0284c7',
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={11} /> Thêm mục tiêu
                      </button>
                    </div>

                    <div style={{ display: 'grid', gap: '6px' }}>
                      {(phase.goals || []).map((goal, gIdx) => (
                        <div key={gIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            aria-label={`Mục tiêu ${gIdx + 1} phase ${phase.order}`}
                            value={goal}
                            onChange={(e) => updatePhaseGoal(phaseIndex, gIdx, e.target.value)}
                            placeholder={`Ví dụ: Chuẩn hóa kỹ thuật Squat & Deadlift...`}
                            style={{ flex: 1, padding: '6px 10px', fontSize: '0.82rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff' }}
                          />
                          <button
                            type="button"
                            onClick={() => removePhaseGoal(phaseIndex, gIdx)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                            title="Xóa mục tiêu này"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      {(!phase.goals || phase.goals.length === 0) && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', padding: '4px 0' }}>
                          Chưa có mục tiêu cho giai đoạn này. Bấm &quot;Thêm mục tiêu&quot; để thiết lập.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Weeks list inside Phase */}
                  <div style={{ display: 'grid', gap: '10px' }}>
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
                          background: '#ffffff',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ background: '#0284c7', color: '#ffffff', fontWeight: 800, fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', flexShrink: 0 }}>
                          Tuần {week.week}
                        </span>

                        <input
                          aria-label={`Trọng tâm tuần ${week.week} phase ${phaseIndex + 1}`}
                          placeholder={`Trọng tâm & mục tiêu huấn luyện tuần ${week.week}...`}
                          value={week.focus}
                          onChange={(e) => updateWeekFocus(phaseIndex, weekIndex, e.target.value)}
                          style={{ flex: 1, minWidth: '220px', padding: '6px 10px', fontSize: '0.84rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                          required
                        />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Tần suất:</span>
                          <select
                            aria-label={`Tần suất tuần ${week.week}`}
                            value={week.sessionTargets || sessionsPerWeek}
                            onChange={(e) => updateWeekSessionTargets(phaseIndex, weekIndex, Number(e.target.value))}
                            style={{ padding: '4px 8px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155' }}
                          >
                            <option value="2">2 buổi/tuần</option>
                            <option value="3">3 buổi/tuần</option>
                            <option value="4">4 buổi/tuần</option>
                            <option value="5">5 buổi/tuần</option>
                            <option value="6">6 buổi/tuần</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                          onClick={() => removeWeek(phaseIndex, weekIndex)}
                          title="Xóa tuần này"
                        >
                          <Trash2 size={15} />
                        </button>
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
