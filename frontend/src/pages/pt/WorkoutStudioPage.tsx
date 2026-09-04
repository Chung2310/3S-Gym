import { useEffect, useMemo, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { DAY_MINUTES, DAYS_PER_WEEK, hasOverlap, planDayIndex, planDaysForWeek, planWeekCount, SLOT_HEIGHT, SLOT_MINUTES, snapMinute } from '../../services/workoutStudioModel';
import { recommendExercises } from '../../services/workoutExerciseRecommendations';
import { outsideAvailabilityWarnings } from '../../services/workoutAvailability';
import { errorMessage, type Exercise } from '../../types';
import { useToast } from '../../components/ui/ToastProvider';
import ConfirmModal from '../../components/ui/ConfirmModal';
import StudioHeader from '../../components/workout-studio/StudioHeader';
import StudioDayNavigator from '../../components/workout-studio/StudioDayNavigator';
import ExercisePalette from '../../components/workout-studio/ExercisePalette';
import DayTimeline from '../../components/workout-studio/DayTimeline';
import StudioSidebar from '../../components/workout-studio/StudioSidebar';
import type { WorkoutAvailabilitySlot } from '../../types/workoutAvailability';
import type { AiWorkoutStudioDraft, ScheduledExercise, StudioTemplate, TemplateMetadata } from '../../types/workoutStudio';
import { normalizePlanExercise, planExerciseFromLibrary } from '../../utils/exerciseTracking';
const createScheduled = (exercise: Exercise, weekNumber: number, dayNumber: number, startMinute: number): ScheduledExercise => ({ id: crypto.randomUUID(), weekNumber, dayNumber, startMinute, durationMinutes: 60, ...planExerciseFromLibrary(exercise) });
const hydrateScheduled = (item: Omit<ScheduledExercise, 'id'>): ScheduledExercise => {
  const normalizedWeek = item.dayNumber > DAYS_PER_WEEK ? Math.max(item.weekNumber || 1, Math.ceil(item.dayNumber / DAYS_PER_WEEK)) : item.weekNumber || 1;
  const normalizedDay = item.dayNumber > DAYS_PER_WEEK ? ((item.dayNumber - 1) % DAYS_PER_WEEK) + 1 : item.dayNumber;
  return normalizePlanExercise({ ...item, weekNumber: normalizedWeek, dayNumber: normalizedDay, id: crypto.randomUUID() });
};
const emptyMetadata: TemplateMetadata = { muscleGroups: [], defaultReps: '', defaultWeight: '', defaultTempo: '', technicalNotes: '' };
type PendingConfirmation = { kind: 'back' | 'navigate'; destination: string } | { kind: 'duration'; nextDays: number; affectedCount: number };
type StudioView = 'schedule' | 'library' | 'inspector';

export default function WorkoutStudioPage() {
  const { templateId, customerId, planId } = useParams(); const navigate = useNavigate(); const location = useLocation(); const toast = useToast(); const [searchParams] = useSearchParams();
  const customerMode = Boolean(customerId && planId); const readOnly = searchParams.get('readonly') === '1';
  const [title, setTitle] = useState(''); const [goal, setGoal] = useState(''); const [level, setLevel] = useState('BEGINNER');
  const [durationDays, setDurationDays] = useState(7); const [activeWeek, setActiveWeek] = useState(1); const [activeDay, setActiveDay] = useState(1); const [library, setLibrary] = useState<Exercise[]>([]); const [exerciseQuery, setExerciseQuery] = useState(''); const [muscleGroup, setMuscleGroup] = useState(''); const [exerciseLevel, setExerciseLevel] = useState('');
  const [metadata, setMetadata] = useState<TemplateMetadata>(emptyMetadata); const [sidebarTab, setSidebarTab] = useState<'template' | 'exercise'>('template');
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation>();
  const [items, setItems] = useState<ScheduledExercise[]>([]); const [unscheduled, setUnscheduled] = useState<ScheduledExercise[]>([]); const [selectedId, setSelectedId] = useState<string>(); const [saving, setSaving] = useState(false); const [dirty, setDirty] = useState(false); const [customerName, setCustomerName] = useState('');
  const [movePreview, setMovePreview] = useState<{ id: string; startMinute: number; valid: boolean }>(); const [inspectorOpen, setInspectorOpen] = useState(false); const [studioView, setStudioView] = useState<StudioView>('schedule'); const timelineWrapRef = useRef<HTMLElement>(null);
  const studioViewTabs = useRef<Partial<Record<StudioView, HTMLButtonElement | null>>>({});
  const studioPanelCloses = useRef<Partial<Record<StudioView, HTMLButtonElement | null>>>({});
  const [generatedExercises, setGeneratedExercises] = useState<unknown[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<WorkoutAvailabilitySlot[]>([]);
  const selected = items.find((item) => item.id === selectedId); const dayItems = items.filter((item) => (item.weekNumber || 1) === activeWeek && item.dayNumber === activeDay); const totalMinutes = dayItems.reduce((sum, item) => sum + item.durationMinutes, 0);
  const muscleGroups = [...new Set(library.map((exercise) => exercise.muscleGroup))].sort();
  const metadataMuscleGroups = [...new Set([...muscleGroups, ...metadata.muscleGroups])].sort();
  const filteredLibrary = library.filter((exercise) => exercise.name.toLocaleLowerCase('vi').includes(exerciseQuery.trim().toLocaleLowerCase('vi')) && (!muscleGroup || exercise.muscleGroup === muscleGroup) && (!exerciseLevel || exercise.level === exerciseLevel));
  const recommendedExercises = useMemo(() => recommendExercises(library, { goal, level, muscleGroups: metadata.muscleGroups }), [library, goal, level, metadata.muscleGroups]);
  const availabilityWarnings = useMemo(
    () => outsideAvailabilityWarnings(items, availabilitySlots),
    [items, availabilitySlots],
  );

  useEffect(() => { api.get<Exercise[]>('/api/exercises?page=1&limit=100').then(({ data }) => setLibrary(data)).catch((error: unknown) => toast.error(errorMessage(error))); }, [toast]);
  useEffect(() => {
    const draft = (location.state as { aiWorkoutDraft?: AiWorkoutStudioDraft } | null)?.aiWorkoutDraft;
    if (templateId || customerMode || !draft) {
      setAvailabilitySlots([]);
      return;
    }
    setTitle(draft.title || 'Giáo án AI'); setGoal(draft.goal || ''); setLevel(draft.level || 'BEGINNER'); setDurationDays(Math.max(1, draft.durationWeeks * 7));
    setItems((draft.scheduledExercises || []).map(hydrateScheduled));
    setGeneratedExercises(draft.generatedExercises || []); setAvailabilitySlots(draft.availabilitySlots || []); setDirty(true);
  }, [location.state, templateId, customerMode]);
  useEffect(() => {
    if (!templateId && !customerMode) return;
    setAvailabilitySlots([]);
    const resourcePath = customerMode ? `/api/customers/${customerId}/workout-plans/${planId}` : `/api/workout-templates/${templateId}`;
    api.get<StudioTemplate & { customerName?: string; customerId?: { fullName?: string } }>(resourcePath).then(({ data }) => {
      setCustomerName(data.customerName || data.customerId?.fullName || 'Khách hàng');
      setTitle(data.title); setGoal(data.goal); setLevel(data.level); setDurationDays(data.durationDays || Math.max(1, data.sessions.length));
      setMetadata({ muscleGroups: data.muscleGroups || [], defaultSets: data.defaultSets, defaultReps: data.defaultReps || '', defaultWeight: data.defaultWeight || '', defaultTempo: data.defaultTempo || '', technicalNotes: data.technicalNotes || '' });
      if (data.scheduledExercises?.length) setItems(data.scheduledExercises.map(hydrateScheduled));
      const persistedUnscheduled = data.unscheduledExercises?.map((exercise) => normalizePlanExercise({ ...exercise, id: crypto.randomUUID(), dayNumber: 1, startMinute: 0 })) || [];
      const legacyUnscheduled = !data.scheduledExercises?.length && !persistedUnscheduled.length ? data.sessions.flatMap((session) => session.exercises.map((exercise) => normalizePlanExercise({ id: crypto.randomUUID(), dayNumber: 1, startMinute: 0, durationMinutes: 60, exerciseId: exercise.exerciseId, name: exercise.name, sets: exercise.sets, reps: exercise.reps, weight: exercise.weight == null ? '' : String(exercise.weight), rpe: exercise.rpe, rir: exercise.rir, tempo: exercise.tempo, restSeconds: exercise.restSeconds, notes: exercise.notes }))) : [];
      setUnscheduled([...persistedUnscheduled, ...legacyUnscheduled]);
      setDirty(false);
    }).catch((error: unknown) => toast.error(errorMessage(error)));
  }, [templateId, customerMode, customerId, planId, toast]);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  useEffect(() => { if (selectedId) { setSidebarTab('exercise'); setInspectorOpen(true); } }, [selectedId]);
  useEffect(() => {
    if (studioView === 'schedule' || !window.matchMedia?.('(min-width: 640px) and (max-width: 1023px)').matches) return;
    studioPanelCloses.current[studioView]?.focus();
  }, [studioView]);
  useEffect(() => { if (!dirty) return; const guardInternalLink = (event: MouseEvent) => { if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null; if (!target || target.target === '_blank' || target.hasAttribute('download')) return; const destination = new URL(target.href, window.location.href); if (destination.origin !== window.location.origin) return; event.preventDefault(); event.stopPropagation(); setPendingConfirmation({ kind: 'navigate', destination: `${destination.pathname}${destination.search}${destination.hash}` }); }; document.addEventListener('click', guardInternalLink, true); return () => document.removeEventListener('click', guardInternalLink, true); }, [dirty]);

  const mutate = (next: ScheduledExercise[]) => { setItems(next); setDirty(true); };
  const getNextAvailableMinute = (targetItems: ScheduledExercise[]) => {
    const currentDayItems = targetItems.filter((item) => (item.weekNumber || 1) === activeWeek && item.dayNumber === activeDay);
    if (currentDayItems.length === 0) return 480;
    const maxEnd = Math.max(...currentDayItems.map((item) => item.startMinute + item.durationMinutes));
    if (maxEnd + 60 <= DAY_MINUTES) return maxEnd;
    for (let m = 360; m <= 1320; m += 30) {
      const test = { weekNumber: activeWeek, dayNumber: activeDay, startMinute: m, durationMinutes: 60 };
      if (!hasOverlap(currentDayItems, test as ScheduledExercise)) return m;
    }
    return 480;
  };
  const place = (exercise: Exercise, startMinute?: number) => {
    const minute = startMinute ?? getNextAvailableMinute(items);
    const candidate = createScheduled(exercise, activeWeek, activeDay, Math.min(minute, 1380));
    if (hasOverlap(items, candidate)) {
      const fallbackMinute = getNextAvailableMinute(items);
      const fallbackCandidate = createScheduled(exercise, activeWeek, activeDay, Math.min(fallbackMinute, 1380));
      if (hasOverlap(items, fallbackCandidate)) {
        return toast.error('Ngày này đã kín khung giờ tập.');
      }
      mutate([...items, fallbackCandidate]);
      setSelectedId(fallbackCandidate.id);
      toast.success(`Đã thêm bài ${exercise.name} vào Ngày ${activeDay}`);
      return;
    }
    mutate([...items, candidate]);
    setSelectedId(candidate.id);
    toast.success(`Đã thêm bài ${exercise.name} vào Ngày ${activeDay}`);
  };
  const removeScheduled = (id: string) => {
    const removed = items.find((item) => item.id === id);
    mutate(items.filter((item) => item.id !== id));
    if (removed) {
      setUnscheduled((current) => [...current, removed]);
      toast.success(`Đã xóa bài ${removed.name} khỏi Ngày ${activeDay}`);
    }
    if (selectedId === id) {
      setSelectedId(undefined);
      setSidebarTab('template');
    }
  };
  const placeUnscheduled = (item: ScheduledExercise) => { const candidate = { ...item, weekNumber: activeWeek, dayNumber: activeDay, startMinute: Math.min(480, DAY_MINUTES - item.durationMinutes) }; if (hasOverlap(items, candidate)) return toast.error('Khung giờ này đã có bài tập.'); mutate([...items, candidate]); setUnscheduled((current) => current.filter((value) => value.id !== item.id)); setSelectedId(item.id); setInspectorOpen(true); closeStudioPanel(); };
  const moveScheduled = (item: ScheduledExercise, deltaMinutes: number) => { const startMinute = Math.max(0, Math.min(DAY_MINUTES - item.durationMinutes, item.startMinute + deltaMinutes)); const candidate = { ...item, startMinute }; if (hasOverlap(items, candidate)) return toast.error('Khung giờ này đã có bài tập.'); mutate(items.map((value) => value.id === item.id ? candidate : value)); setSelectedId(item.id); };
  const drop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); const startMinute = snapMinute(((event.clientY - rect.top) / rect.height) * DAY_MINUTES); const itemId = event.dataTransfer.getData('scheduleId'); if (itemId) { const current = items.find((item) => item.id === itemId); if (!current) return; const candidate = { ...current, weekNumber: activeWeek, dayNumber: activeDay, startMinute: Math.min(startMinute, DAY_MINUTES - current.durationMinutes) }; if (hasOverlap(items, candidate)) return toast.error('Khung giờ này đã có bài tập.'); mutate(items.map((item) => item.id === itemId ? candidate : item)); return; } const exercise = library.find((item) => item._id === event.dataTransfer.getData('exerciseId')); if (exercise) place(exercise, startMinute); };
  const updateSelected = (patch: Partial<ScheduledExercise>) => { if (!selected) return; const candidate = { ...selected, ...patch }; if (candidate.startMinute + candidate.durationMinutes > DAY_MINUTES || hasOverlap(items, candidate)) return toast.error('Thời gian bài tập không hợp lệ hoặc bị trùng.'); mutate(items.map((item) => item.id === selected.id ? candidate : item)); };
  const applyDurationDays = (next: number) => {
    const affected = items.filter((item) => planDayIndex(item) > next);
    if (affected.length) {
      setUnscheduled((current) => [...current, ...affected]);
      setItems((current) => current.filter((item) => planDayIndex(item) <= next));
    }
    setDurationDays(next);
    const nextActiveWeek = Math.min(activeWeek, planWeekCount(next));
    const nextWeekDays = planDaysForWeek(next, nextActiveWeek);
    setActiveWeek(nextActiveWeek);
    setActiveDay((day) => Math.min(day, nextWeekDays.length));
    setDirty(true);
  };
  const changeDurationDays = (raw: number) => {
    const next = Math.max(1, Math.min(365, raw));
    const affectedCount = items.filter((item) => planDayIndex(item) > next).length;
    if (affectedCount) {
      setPendingConfirmation({ kind: 'duration', nextDays: next, affectedCount });
      return;
    }
    applyDurationDays(next);
  };
  const beginResize = (event: ReactPointerEvent, item: ScheduledExercise) => { event.preventDefault(); event.stopPropagation(); const startY = event.clientY; const original = item.durationMinutes; const move = (pointer: PointerEvent) => { const durationMinutes = Math.max(15, Math.round((original + ((pointer.clientY - startY) / SLOT_HEIGHT) * SLOT_MINUTES) / SLOT_MINUTES) * SLOT_MINUTES); const candidate = { ...item, durationMinutes: Math.min(durationMinutes, DAY_MINUTES - item.startMinute) }; if (!hasOverlap(items, candidate)) mutate(items.map((value) => value.id === item.id ? candidate : value)); }; const end = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); };
  const beginMove = (event: ReactPointerEvent, item: ScheduledExercise) => { if (event.button !== 0) return; event.preventDefault(); setSelectedId(item.id); const startY = event.clientY; let candidate = item; let valid = true; const move = (pointer: PointerEvent) => { const deltaMinutes = Math.round((pointer.clientY - startY) / SLOT_HEIGHT) * SLOT_MINUTES; const startMinute = Math.max(0, Math.min(DAY_MINUTES - item.durationMinutes, item.startMinute + deltaMinutes)); candidate = { ...item, startMinute }; valid = !hasOverlap(items, candidate); setMovePreview({ id: item.id, startMinute, valid }); const wrapper = timelineWrapRef.current; if (wrapper) { const rect = wrapper.getBoundingClientRect(); const scrollDelta = pointer.clientY < rect.top + 64 ? -48 : pointer.clientY > rect.bottom - 64 ? 48 : 0; if (scrollDelta) { if (typeof wrapper.scrollBy === 'function') wrapper.scrollBy({ top: scrollDelta }); else wrapper.scrollTop += scrollDelta; } } }; const end = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); setMovePreview(undefined); if (candidate.startMinute !== item.startMinute) { if (valid) mutate(items.map((value) => value.id === item.id ? candidate : value)); else toast.error('Khung giờ này đã có bài tập.'); } }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); };
  const save = async () => {
    if (readOnly) return;
    if (!title.trim() || !goal.trim() || !items.length) return toast.error('Vui lòng nhập thông tin và xếp ít nhất một bài tập.');

    const invalid = [...items, ...unscheduled].find((item) => item.trackingType === 'UNCLASSIFIED' || !item.trackingType);
    if (invalid) {
      const scheduledInvalid = items.find((item) => item.id === invalid.id);
      if (scheduledInvalid) {
        setSelectedId(scheduledInvalid.id);
        setSidebarTab('exercise');
        setInspectorOpen(true);
        setStudioView('inspector');
      }
      return toast.error(`Bài tập ${invalid.name} chưa có cách ghi nhận. Vui lòng cập nhật trong Quản lý bài tập rồi thêm lại vào giáo án.`);
    }
    setSaving(true);
    try {
      const scheduledExercises = items.map(({ id: _id, ...item }) => item);
      const unscheduledExercises = unscheduled.map(({ id: _id, weekNumber: _weekNumber, dayNumber: _dayNumber, startMinute: _startMinute, ...item }) => item);
      const payload = { title, goal, level, durationDays, ...metadata, scheduledExercises, unscheduledExercises, ...(generatedExercises.length ? { generatedExercises } : {}) };
      const result = customerMode ? await api.patch<{ _id: string }>(`/api/customers/${customerId}/workout-plans/${planId}`, payload) : templateId ? await api.patch<{ _id: string }>(`/api/workout-templates/${templateId}`, payload) : await api.post<{ _id: string }>('/api/workout-templates', payload);
      toast.success(result.message);
      setDirty(false);
      if (!templateId && !customerMode) navigate(`/pt/my-workout-plans/${result.data._id}/edit`, { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };
  const confirmPendingAction = () => {
    const pending = pendingConfirmation;
    setPendingConfirmation(undefined);
    if (!pending) return;
    if (pending.kind === 'back' || pending.kind === 'navigate') navigate(pending.destination);
    if (pending.kind === 'duration') applyDurationDays(pending.nextDays);
  };
  const closeStudioPanel = () => { const trigger = studioViewTabs.current[studioView]; setStudioView('schedule'); trigger?.focus(); };
  const weekButtons = useMemo(() => Array.from({ length: planWeekCount(durationDays) }, (_, index) => index + 1), [durationDays]);
  const dayButtons = useMemo(() => planDaysForWeek(durationDays, activeWeek), [durationDays, activeWeek]);

  return <section aria-label="Workout Studio" className={`module-page workout-studio pb-28 sm:pb-8 ${inspectorOpen ? 'inspector-open' : ''}`}>
    <StudioHeader contextLabel={customerMode ? `Giáo án của ${customerName}` : undefined} readOnly={readOnly} title={title} goal={goal} level={level} durationDays={durationDays} dirty={dirty} saving={saving} onBack={() => { const destination = customerMode ? '/pt/customers' : '/pt/my-workout-plans'; if (dirty) setPendingConfirmation({ kind: 'back', destination }); else navigate(destination); }} onTitleChange={(value) => { setTitle(value); setDirty(true); }} onGoalChange={(value) => { setGoal(value); setDirty(true); }} onLevelChange={(value) => { setLevel(value); setDirty(true); }} onDurationDaysChange={changeDurationDays} onSave={() => void save()} />
    <nav className="studio-period-navigation" aria-label="Thời gian giáo án">
      <div className="studio-week-list">{weekButtons.map((week) => <button key={week} type="button" aria-current={week === activeWeek} onClick={() => { setActiveWeek(week); setActiveDay((day) => Math.min(day, planDaysForWeek(durationDays, week).length)); }}>Tuần {week}</button>)}</div>
      <StudioDayNavigator days={dayButtons} activeDay={activeDay} totalMinutes={totalMinutes} onChange={setActiveDay} />
    </nav>
    <div className="studio-view-tabs sticky top-0 z-40 bg-white/95 backdrop-blur-xs shadow-xs" role="tablist" aria-label="Khu vực thiết kế giáo án">
      {([['schedule', `Lịch tập (${dayItems.length})`], ['library', 'Bài tập'], ['inspector', selected ? `Thuộc tính (${selected.name.length > 10 ? selected.name.slice(0, 10) + '...' : selected.name})` : 'Thuộc tính']] as const).map(([view, label]) => <button key={view} ref={(node) => { studioViewTabs.current[view] = node; }} type="button" role="tab" aria-selected={studioView === view} aria-controls={`studio-${view}-panel`} onClick={() => setStudioView(view)}>{label}</button>)}
    </div>
    {studioView !== 'schedule' && <button type="button" className="studio-panel-backdrop" aria-label="Đóng bảng Studio" onClick={closeStudioPanel} />}
    <div className="studio-workspace">
      <section id="studio-library-panel" className={`studio-library-region ${studioView === 'library' ? 'is-mobile-active' : ''}`} aria-label="Thư viện bài tập Studio">
        <button ref={(node) => { studioPanelCloses.current.library = node; }} type="button" className="studio-panel-close" aria-label="Đóng thư viện bài tập" onClick={closeStudioPanel}>×</button>
        <ExercisePalette exercises={filteredLibrary} recommendations={recommendedExercises} unscheduled={unscheduled} query={exerciseQuery} muscleGroup={muscleGroup} level={exerciseLevel} muscleGroups={muscleGroups} activeDay={activeDay} onQueryChange={setExerciseQuery} onMuscleGroupChange={setMuscleGroup} onLevelChange={setExerciseLevel} onPlace={(exercise) => place(exercise)} onPlaceUnscheduled={placeUnscheduled} onClose={() => setStudioView('schedule')} />
      </section>
      <section id="studio-schedule-panel" className={`studio-schedule-region ${studioView === 'schedule' ? 'is-mobile-active' : ''}`} aria-label="Lịch tập">
        <DayTimeline wrapperRef={timelineWrapRef} activeDay={activeDay} items={dayItems} selectedId={selectedId} preview={movePreview} onDrop={drop} onMoveStart={beginMove} onResizeStart={beginResize} onKeyboardMove={moveScheduled} onSelect={(id) => { setSelectedId(id); setInspectorOpen(true); setStudioView('inspector'); }} onAddExercise={() => setStudioView('library')} onRemoveExercise={removeScheduled} />
      </section>
      <section id="studio-inspector-panel" className={`studio-inspector-region ${studioView === 'inspector' ? 'is-mobile-active' : ''}`} aria-label="Thuộc tính giáo án">
        <button ref={(node) => { studioPanelCloses.current.inspector = node; }} type="button" className="studio-panel-close" aria-label="Đóng thuộc tính giáo án" onClick={closeStudioPanel}>×</button>
        <StudioSidebar activeTab={sidebarTab} metadata={metadata} muscleGroupOptions={metadataMuscleGroups} readOnly={readOnly} selected={selected} days={dayButtons} onTabChange={setSidebarTab} onMetadataChange={(value) => { setMetadata(value); setDirty(true); }} onExerciseUpdate={updateSelected} onUnscheduled={() => { if (!selected) return; mutate(items.filter((item) => item.id !== selected.id)); setUnscheduled((current) => [...current, selected]); setSelectedId(undefined); setSidebarTab('template'); closeStudioPanel(); }} onClose={() => setStudioView('schedule')} />
      </section>
    </div>
    {selected && studioView === 'schedule' && <button type="button" aria-label="Bỏ chọn bài tập" className="studio-selection-clear" onClick={() => { setSelectedId(undefined); setSidebarTab('template'); setInspectorOpen(false); setStudioView('schedule'); }}>×</button>}
    <ConfirmModal open={Boolean(pendingConfirmation)} title={pendingConfirmation?.kind === 'back' ? 'Bỏ thay đổi chưa lưu?' : pendingConfirmation?.kind === 'navigate' ? 'Rời Studio?' : 'Giảm số ngày giáo án?'} description={pendingConfirmation?.kind === 'duration' ? `${pendingConfirmation.affectedCount} bài tập ở các ngày bị cắt sẽ chuyển về Chưa xếp lịch.` : 'Các chỉnh sửa chưa lưu trong Studio sẽ bị mất.'} danger={pendingConfirmation?.kind !== 'duration'} confirmLabel={pendingConfirmation?.kind === 'back' ? 'Bỏ thay đổi' : pendingConfirmation?.kind === 'navigate' ? 'Rời Studio' : 'Tiếp tục'} onClose={() => setPendingConfirmation(undefined)} onConfirm={confirmPendingAction} />
  </section>;
}
