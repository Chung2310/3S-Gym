# Workout and Progress InBody Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đồng bộ toàn bộ giao diện Giáo án và Tiến độ với mật độ, phân cấp, responsive và cách tổ chức hành động của InBody mà không thay đổi nghiệp vụ hoặc API.

**Architecture:** Triển khai theo ba lớp phụ thuộc: shared UI primitives, toàn bộ luồng Giáo án, rồi toàn bộ luồng Tiến độ. Page giữ state và API orchestration; feature components giữ presentation theo domain; shared primitives chỉ nhận data và callback qua props. Mọi phần được sửa dùng Tailwind CSS v4 và chỉ xóa CSS legacy sau khi không còn consumer.

**Tech Stack:** React 19, TypeScript 7, React Router 7, Tailwind CSS 4, Lucide React, Vitest 4, Testing Library.

## Global Constraints

- Module InBody là chuẩn trực tiếp về mật độ, spacing, radius, typography, surface và action hierarchy.
- Nhịp dọc cấp trang là 18px; panel chính dùng padding 16–20px và radius 12–14px; thành phần con dùng padding 10–16px và radius 8–12px.
- Nút tương tác cao tối thiểu 40–44px; action group dùng gap 8px.
- Chỉ dùng Tailwind CSS v4 cho UI được tạo hoặc sửa; không thêm CSS module, styled-components, thư viện CSS hoặc inline style mới.
- Giữ các inline style động bắt buộc của timeline (`top`, `height` từ dữ liệu kéo/thả); không thêm inline style tĩnh mới.
- Giữ nguyên endpoint, payload, response mapping, route, query string, quyền thao tác và quy tắc nghiệp vụ hiện có.
- Desktop dùng bảng/grid phù hợp; từ 768px trở xuống bảng Giáo án khách hàng và Tiến độ chuyển thành card.
- Không sao chép inline style từ InBody; chỉ dùng module này làm chuẩn thị giác.
- Chỉ tạo shared primitive khi có ít nhất hai consumer thực tế.
- Không tạo commit trong lúc thực thi nếu người dùng chưa cấp quyền; các bước commit bên dưới là checkpoint dự kiến.

---

## File map

### Shared foundation

- Create `frontend/src/components/ui/ModuleHeader.tsx`: header module dùng chung.
- Create `frontend/src/components/ui/SegmentedTabs.tsx`: tab có semantics và active state dùng chung.
- Create `frontend/src/components/ui/MetricStrip.tsx`: dải metric phẳng, responsive.
- Create `frontend/src/components/ui/ModuleToolbar.tsx`: tìm kiếm, lọc và action toolbar.
- Create `frontend/src/components/ui/ActionGroup.tsx`: nhóm action có wrap và alignment thống nhất.
- Create `frontend/src/components/ui/ModuleFeedback.tsx`: empty/error state có action.
- Create `frontend/src/components/ui/Button.tsx`: button variants Tailwind dùng chung.
- Modify `frontend/src/components/ui/index.ts`: export các primitive mới.
- Create `frontend/tests/components/ui/ModuleChrome.test.tsx`: contract hành vi và accessibility của foundation.

### Giáo án

- Modify `frontend/src/components/workouts/MyWorkoutPlans.tsx`: shell, header, action group và tabs.
- Modify `frontend/src/components/workouts/WorkoutTemplateList.tsx`: toolbar, loading, empty và grid density.
- Modify `frontend/src/components/workouts/WorkoutTemplateCard.tsx`: hierarchy card gọn.
- Modify `frontend/src/components/workouts/CustomerWorkoutPlans.tsx`: section hierarchy trong hồ sơ khách hàng.
- Modify `frontend/src/components/workouts/CustomerWorkoutPlanPanel.tsx`: toolbar, DataList và actions.
- Modify `frontend/src/components/workouts/CustomerWorkoutPlanModal.tsx`: modal/form alignment.
- Modify `frontend/src/components/ui/ContentFormModal.tsx`: nhận `className` presentation hook để feature giáo án dùng modal shell chung mà không đổi các resource khác.
- Modify `frontend/src/pages/pt/ExerciseLibraryPage.tsx`: shell và orchestration giữ nguyên.
- Modify `frontend/src/components/exercises/ExerciseFilter.tsx`: dùng ModuleToolbar.
- Modify `frontend/src/components/exercises/ExerciseLibraryCard.tsx`: compact card hierarchy.
- Modify `frontend/src/components/exercises/ExerciseFormModal.tsx`: form sections theo InBody.
- Modify `frontend/src/components/workouts/WorkoutBuilder.tsx`: form sections và session editor.
- Modify `frontend/src/components/workouts/AiWorkoutWizard.tsx`: step layout và form shell.
- Modify `frontend/src/pages/pt/WorkoutPlansPage.tsx`: giữ màn legacy testable đồng bộ nếu được tái kích hoạt.
- Modify `frontend/src/components/workouts/WorkoutCheckIn.tsx`: form check-in dùng cùng form section.
- Modify `frontend/src/components/workouts/WorkoutSessionHistory.tsx`: history panel dùng cùng surface.
- Modify `frontend/src/pages/pt/WorkoutStudioPage.tsx`: responsive workspace shell.
- Modify `frontend/src/components/workout-studio/StudioHeader.tsx`: compact metadata/actions.
- Modify `frontend/src/components/workout-studio/StudioDayNavigator.tsx`: segmented day controls.
- Modify `frontend/src/components/workout-studio/ExercisePalette.tsx`: toolbar và compact exercise rows.
- Modify `frontend/src/components/workout-studio/DayTimeline.tsx`: panel surface và timeline density.
- Modify `frontend/src/components/workout-studio/StudioSidebar.tsx`: inspector sections.
- Update tests dưới `frontend/tests/components/workouts/`, `frontend/tests/components/exercises/`, `frontend/tests/components/workout-studio/` và `frontend/tests/pages/WorkoutStudioPage.test.tsx`.

### Tiến độ

- Modify `frontend/src/pages/pt/ProgressPage.tsx`: ModuleHeader và page states.
- Modify `frontend/src/components/progress/ProgressDashboard.tsx`: MetricStrip, ModuleToolbar và DataList responsive.
- Modify `frontend/src/types/progress.ts`: cho phép `CustomerProgressOverview` dùng với generic `DataList` mà không đổi dữ liệu runtime.
- Modify `frontend/src/components/progress/ProgressModal.tsx`: modal shell theo InBody.
- Modify `frontend/src/components/progress/ProgressDetailModal.tsx`: detail composition.
- Modify `frontend/src/components/progress/WorkoutSessionModal.tsx`: session modal composition.
- Modify `frontend/src/components/progress/PtProgressWorkspace.tsx`: snapshot, tabs và tab panels.
- Modify `frontend/src/components/progress/WorkoutSessionLogger.tsx`: session form sections.
- Modify `frontend/src/components/progress/WorkoutSessionDetail.tsx`: compact session history.
- Modify `frontend/src/components/progress/MeasurementForm.tsx`: form grid.
- Modify `frontend/src/components/progress/ProgressOverview.tsx`: metric hierarchy.
- Modify `frontend/src/components/progress/ProgressCharts.tsx`: chart surfaces.
- Modify `frontend/src/components/progress/AchievementList.tsx`: achievement rows.
- Modify `frontend/src/components/progress/ProgressReportGenerator.tsx`: period/editor/actions.
- Modify `frontend/src/components/progress/ProgressReportEditor.tsx`: editor form.
- Modify `frontend/src/components/progress/ProgressReportList.tsx`: responsive list.
- Modify `frontend/src/index.css`: xóa `progress-*` và studio legacy selector không còn consumer.
- Delete `frontend/tests/components/progress/ProgressLegacyCssContract.test.ts`: bỏ contract gắn với CSS legacy.
- Update các test Progress còn lại theo role/name và hành vi.

---

### Task 1: Shared InBody-aligned module chrome

**Files:**
- Create: `frontend/src/components/ui/ModuleHeader.tsx`
- Create: `frontend/src/components/ui/SegmentedTabs.tsx`
- Create: `frontend/src/components/ui/MetricStrip.tsx`
- Create: `frontend/src/components/ui/ModuleToolbar.tsx`
- Create: `frontend/src/components/ui/ActionGroup.tsx`
- Create: `frontend/src/components/ui/ModuleFeedback.tsx`
- Create: `frontend/src/components/ui/Button.tsx`
- Modify: `frontend/src/components/ui/index.ts`
- Test: `frontend/tests/components/ui/ModuleChrome.test.tsx`

**Interfaces:**
- Produces: `Button`, `ModuleHeader`, `SegmentedTabs<T>`, `MetricStrip`, `ModuleToolbar`, `ActionGroup`, `ModuleFeedback`.
- Consumes: React `ReactNode`; Lucide icons are passed as nodes and never imported by the primitives.

- [ ] **Step 1: Write the failing shared primitive tests**

```tsx
// frontend/tests/components/ui/ModuleChrome.test.tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionGroup, Button, MetricStrip, ModuleFeedback, ModuleHeader, ModuleToolbar, SegmentedTabs } from '../../../src/components/ui';

it('groups module actions beside the title', () => {
  render(<ModuleHeader title="Giáo án" description="Quản lý giáo án"><ActionGroup ariaLabel="Hành động giáo án"><Button variant="primary">Tạo thủ công</Button><Button>Tạo bằng AI</Button></ActionGroup></ModuleHeader>);
  const actions = screen.getByRole('group', { name: 'Hành động giáo án' });
  expect(screen.getByRole('heading', { name: 'Giáo án' })).toBeVisible();
  expect(within(actions).getByRole('button', { name: 'Tạo thủ công' })).toBeVisible();
  expect(within(actions).getByRole('button', { name: 'Tạo bằng AI' })).toBeVisible();
});

it('exposes accessible tabs and invokes selection', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<SegmentedTabs ariaLabel="Nội dung" value="plans" onChange={onChange} tabs={[{ value: 'plans', label: 'Giáo án', panelId: 'plans-panel' }, { value: 'exercises', label: 'Bài tập', panelId: 'exercise-panel' }]} />);
  expect(screen.getByRole('tab', { name: 'Giáo án' })).toHaveAttribute('aria-selected', 'true');
  await user.click(screen.getByRole('tab', { name: 'Bài tập' }));
  expect(onChange).toHaveBeenCalledWith('exercises');
});

it('renders metrics in one labelled region and clears search', async () => {
  const user = userEvent.setup();
  const onKeywordChange = vi.fn();
  const { rerender } = render(<><MetricStrip ariaLabel="Tổng quan" items={[{ key: 'customers', label: 'Khách hàng', value: '12', tone: 'primary' }]} /><ModuleToolbar search={{ keyword: 'An', onKeywordChange, ariaLabel: 'Tìm khách hàng', placeholder: 'Tìm khách hàng...' }} /></>);
  expect(screen.getByRole('region', { name: 'Tổng quan' })).toBeVisible();
  rerender(<ModuleToolbar search={{ keyword: 'An', onKeywordChange, ariaLabel: 'Tìm khách hàng', placeholder: 'Tìm khách hàng...' }} />);
  await user.click(screen.getByRole('button', { name: 'Xóa tìm kiếm' }));
  expect(onKeywordChange).toHaveBeenCalledWith('');
});

it('announces a loading error and exposes retry', async () => {
  const user = userEvent.setup();
  const onRetry = vi.fn();
  render(<ModuleFeedback kind="error" title="Không tải được dữ liệu" description="Kiểm tra kết nối và thử lại." action={<button onClick={onRetry}>Thử lại</button>} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Không tải được dữ liệu');
  await user.click(screen.getByRole('button', { name: 'Thử lại' }));
  expect(onRetry).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/ui/ModuleChrome.test.tsx`

Expected: FAIL because the five primitive modules are not defined or exported.

- [ ] **Step 3: Implement the primitive interfaces with static Tailwind classes**

```tsx
// frontend/src/components/ui/ActionGroup.tsx
import type { ReactNode } from 'react';
export default function ActionGroup({ ariaLabel, children, className = '' }: { ariaLabel: string; children: ReactNode; className?: string }) {
  return <div role="group" aria-label={ariaLabel} className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>{children}</div>;
}

// frontend/src/components/ui/Button.tsx
import type { ButtonHTMLAttributes } from 'react';
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
const variants: Record<ButtonVariant, string> = { primary: 'border-primary bg-primary text-white hover:bg-primary/90', secondary: 'border-sky-200 bg-sky-50 text-primary hover:border-sky-300 hover:bg-sky-100', tertiary: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-primary', danger: 'border-transparent bg-transparent text-red-600 hover:bg-red-50 hover:text-red-700' };
export default function Button({ variant = 'secondary', className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button type={type} className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3.5 font-montserrat text-xs font-bold transition hover:-translate-y-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${variants[variant]} ${className}`.trim()} {...props} />;
}

// frontend/src/components/ui/ModuleHeader.tsx
import type { ReactNode } from 'react';
export default function ModuleHeader({ title, description, icon, children }: { title: string; description?: string; icon?: ReactNode; children?: ReactNode }) {
  return <header className="flex flex-col gap-3 rounded-[14px] border border-slate-200 bg-white px-5 py-4 shadow-[0_2px_8px_rgba(0,59,112,0.04)] sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h1 className="flex items-center gap-2.5 font-oswald text-[1.3rem] font-extrabold uppercase leading-tight text-primary">{icon}{title}</h1>{description ? <p className="mt-1 max-w-[65ch] font-montserrat text-[0.84rem] leading-[1.45] text-slate-500">{description}</p> : null}</div>{children}</header>;
}

// frontend/src/components/ui/SegmentedTabs.tsx
import type { ReactNode } from 'react';
export interface SegmentedTab<T extends string> { value: T; label: string; panelId: string; icon?: ReactNode }
export default function SegmentedTabs<T extends string>({ ariaLabel, value, tabs, onChange }: { ariaLabel: string; value: T; tabs: SegmentedTab<T>[]; onChange: (value: T) => void }) {
  return <div role="tablist" aria-label={ariaLabel} className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-[10px] bg-slate-100 p-1">{tabs.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={value === tab.value} aria-controls={tab.panelId} onClick={() => onChange(tab.value)} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3.5 font-montserrat text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${value === tab.value ? 'bg-white text-primary shadow-[0_2px_8px_rgba(0,59,112,0.08)]' : 'text-slate-500 hover:bg-white/70 hover:text-primary'}`}>{tab.icon}{tab.label}</button>)}</div>;
}

// frontend/src/components/ui/MetricStrip.tsx
import type { ReactNode } from 'react';
export type MetricTone = 'primary' | 'secondary' | 'success' | 'warning';
export interface MetricItem { key: string; label: string; value: ReactNode; icon?: ReactNode; tone?: MetricTone }
const tones: Record<MetricTone, string> = { primary: 'text-primary bg-blue-50', secondary: 'text-sky-700 bg-sky-50', success: 'text-emerald-700 bg-emerald-50', warning: 'text-amber-700 bg-amber-50' };
export default function MetricStrip({ ariaLabel, items }: { ariaLabel: string; items: MetricItem[] }) {
  return <section role="region" aria-label={ariaLabel} className="grid overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_2px_8px_rgba(0,59,112,0.04)] sm:grid-cols-2 xl:grid-cols-4">{items.map((item) => <article key={item.key} className="flex min-h-20 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"><div className="min-w-0"><p className="font-montserrat text-[0.72rem] font-bold uppercase tracking-[0.04em] text-slate-500">{item.label}</p><p className="mt-1 font-oswald text-2xl font-extrabold tabular-nums text-primary">{item.value}</p></div>{item.icon ? <span className={`grid size-10 shrink-0 place-items-center rounded-[10px] ${tones[item.tone || 'primary']}`}>{item.icon}</span> : null}</article>)}</section>;
}

// frontend/src/components/ui/ModuleToolbar.tsx
import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
export interface ModuleToolbarSearch { keyword: string; onKeywordChange: (value: string) => void; ariaLabel: string; placeholder: string }
export default function ModuleToolbar({ ariaLabel, search, children, actions }: { ariaLabel?: string; search?: ModuleToolbarSearch; children?: ReactNode; actions?: ReactNode }) {
  const regionLabel = ariaLabel || (search ? `${search.ariaLabel} và bộ lọc` : 'Bộ lọc');
  return <section aria-label={regionLabel} className="flex flex-col gap-3 rounded-[12px] border border-slate-200 bg-white px-5 py-4 shadow-[0_2px_8px_rgba(0,59,112,0.04)] lg:flex-row lg:items-end">{search ? <label className="relative min-w-0 flex-1"><span className="sr-only">{search.ariaLabel}</span><Search aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label={search.ariaLabel} value={search.keyword} onChange={(event) => search.onKeywordChange(event.target.value)} placeholder={search.placeholder} className="min-h-11 w-full rounded-[10px] border border-slate-200 bg-slate-50 pl-10 pr-10 font-montserrat text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/20" />{search.keyword ? <button type="button" aria-label="Xóa tìm kiếm" onClick={() => search.onKeywordChange('')} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-primary focus-visible:outline-2 focus-visible:outline-secondary"><X size={14} /></button> : null}</label> : null}{children ? <div className="flex flex-wrap items-end gap-2">{children}</div> : null}{actions ? <div className="flex flex-wrap items-center gap-2 lg:ml-auto">{actions}</div> : null}</section>;
}

// frontend/src/components/ui/ModuleFeedback.tsx
import type { ReactNode } from 'react';
export default function ModuleFeedback({ kind, title, description, action }: { kind: 'empty' | 'error'; title: string; description?: string; action?: ReactNode }) {
  return <section role={kind === 'error' ? 'alert' : 'status'} className={`grid justify-items-center gap-2 rounded-[12px] border border-dashed px-5 py-10 text-center font-montserrat ${kind === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-slate-300 bg-slate-50 text-slate-600'}`}><h3 className="font-oswald text-lg font-bold uppercase text-primary">{title}</h3>{description ? <p className="max-w-[52ch] text-sm leading-6">{description}</p> : null}{action ? <div className="mt-2">{action}</div> : null}</section>;
}
```

Add exports to `frontend/src/components/ui/index.ts`:

```ts
export { default as ActionGroup } from './ActionGroup';
export { default as Button, type ButtonVariant } from './Button';
export { default as MetricStrip, type MetricItem, type MetricTone } from './MetricStrip';
export { default as ModuleHeader } from './ModuleHeader';
export { default as ModuleFeedback } from './ModuleFeedback';
export { default as ModuleToolbar, type ModuleToolbarSearch } from './ModuleToolbar';
export { default as SegmentedTabs, type SegmentedTab } from './SegmentedTabs';
```

- [ ] **Step 4: Run tests and typecheck**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/ui/ModuleChrome.test.tsx`

Expected: PASS, 4 tests.

Run: `npm run typecheck`

Expected: exit code 0.

- [ ] **Step 5: Review checkpoint and authorized commit**

Verify the primitives do not import business types and all class strings are statically discoverable. If commits are authorized:

```bash
git add frontend/src/components/ui frontend/tests/components/ui/ModuleChrome.test.tsx
git commit -m "feat(ui): add InBody-aligned module primitives"
```

---

### Task 2: Giáo án shell, template toolbar and compact cards

**Files:**
- Modify: `frontend/src/components/workouts/MyWorkoutPlans.tsx`
- Modify: `frontend/src/components/workouts/WorkoutTemplateList.tsx`
- Modify: `frontend/src/components/workouts/WorkoutTemplateCard.tsx`
- Test: `frontend/tests/components/workouts/MyWorkoutPlans.test.tsx`
- Create: `frontend/tests/components/workouts/WorkoutTemplateList.test.tsx`

**Interfaces:**
- Consumes: `ModuleHeader`, `SegmentedTabs<'plans' | 'exercises'>`, `ModuleToolbar`, `ActionGroup` from Task 1.
- Produces: compact template cards and unchanged callbacks `onEdit`, `onAssign`, archive and delete behavior.

- [ ] **Step 1: Replace style assertions with behavior and hierarchy tests**

Add these assertions to `MyWorkoutPlans.test.tsx` and create the list test if absent:

```tsx
const actions = screen.getByRole('group', { name: 'Hành động giáo án' });
expect(within(actions).getByRole('button', { name: 'Tạo thủ công' })).toBeVisible();
expect(within(actions).getByRole('button', { name: 'Tạo bằng AI' })).toBeVisible();
const card = await screen.findByRole('article', { name: template.title });
expect(within(card).getByRole('group', { name: `Thông tin ${template.title}` })).toHaveTextContent('1 buổi');
expect(within(card).getByRole('group', { name: `Hành động ${template.title}` })).toBeVisible();
```

Remove the brittle `expect(card).toHaveClass('p-6')` assertion.

- [ ] **Step 2: Run tests and confirm the new accessible groups fail**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/workouts/MyWorkoutPlans.test.tsx frontend/tests/components/workouts/WorkoutTemplateList.test.tsx`

Expected: FAIL because the new action and information groups do not exist.

- [ ] **Step 3: Compose the page from shared primitives**

Use this exact hierarchy in `MyWorkoutPlans.tsx`, preserving the existing query-string state and callbacks:

```tsx
<section className="grid gap-[18px] font-montserrat">
  <ModuleHeader title="Giáo án của tôi" description="Xây dựng và tái sử dụng thư viện giáo án riêng của bạn." icon={<Dumbbell aria-hidden="true" size={24} className="text-sky-600" />}>
    {activeTab === 'plans' ? <ActionGroup ariaLabel="Hành động giáo án"><Button variant="primary" onClick={() => navigate('/pt/my-workout-plans/new')}><Plus size={17} /> Tạo thủ công</Button><Button onClick={() => setAiOpen(true)}>Tạo bằng AI</Button></ActionGroup> : null}
  </ModuleHeader>
  <SegmentedTabs ariaLabel="Nội dung Giáo án của tôi" value={activeTab} onChange={selectTab} tabs={[{ value: 'plans', label: 'Giáo án của tôi', panelId: 'workout-panel-plans', icon: <BookOpen size={15} /> }, { value: 'exercises', label: 'Thư viện bài tập', panelId: 'workout-panel-exercises', icon: <Dumbbell size={15} /> }]} />
  {activeTab === 'plans' ? <div id="workout-panel-plans" role="tabpanel" aria-label="Giáo án của tôi"><WorkoutTemplateList refreshKey={refreshKey} onEdit={(template) => navigate(`/pt/my-workout-plans/${template._id}/edit`)} /></div> : <div id="workout-panel-exercises" role="tabpanel" aria-label="Thư viện bài tập"><ExerciseLibraryPage /></div>}
  <AiWorkoutWizard open={aiOpen} customers={customers} onClose={() => setAiOpen(false)} onGenerated={(draft) => navigate('/pt/my-workout-plans/new', { state: { aiWorkoutDraft: draft } })} />
</section>
```

In `WorkoutTemplateList.tsx`, replace the custom filter panel with `ModuleToolbar`, keep the current search/status state and pagination, and use `grid gap-3 md:grid-cols-2 xl:grid-cols-3`. Track `loadError: string | null`; clear it before `load`, set it with `errorMessage(error)` in `catch`, keep the toast, and render `<ModuleFeedback kind="error" title="Không tải được giáo án" description={loadError} action={<Button onClick={() => void load(meta.page || 1)}>Thử lại</Button>} />`. Render no-data states with this exact branch:

```tsx
const hasFilters = Boolean(search || status);
<ModuleFeedback kind="empty" title={hasFilters ? 'Không tìm thấy giáo án phù hợp' : 'Chưa có giáo án nào'} description={hasFilters ? 'Thử đổi từ khóa hoặc xóa bộ lọc hiện tại.' : 'Tạo giáo án đầu tiên để bắt đầu xây dựng thư viện.'} action={hasFilters ? <Button onClick={() => { setSearch(''); setStatus(''); }}>Xóa bộ lọc</Button> : null} />
```

In `WorkoutTemplateCard.tsx`, remove the inline `padding` style and use one outer surface. Add these semantic groups:

```tsx
<dl role="group" aria-label={`Thông tin ${template.title}`} className="my-3 grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100">
  <div className="min-w-0 py-2.5 pr-3"><dt className="text-[0.68rem] font-semibold uppercase text-slate-400">Lịch tập</dt><dd className="mt-1 text-sm font-bold text-slate-800">{sessionCount} buổi</dd></div>
  <div className="min-w-0 px-3 py-2.5"><dt className="text-[0.68rem] font-semibold uppercase text-slate-400">Bài tập</dt><dd className="mt-1 text-sm font-bold text-slate-800">{exerciseCount} bài</dd></div>
  <div className="min-w-0 py-2.5 pl-3"><dt className="text-[0.68rem] font-semibold uppercase text-slate-400">Cấp độ</dt><dd className="mt-1 truncate text-sm font-bold text-slate-800">{levelLabels[template.level] || template.level}</dd></div>
</dl>
<ActionGroup ariaLabel={`Hành động ${template.title}`} className="mt-auto border-t border-slate-100 pt-3">
  <Button variant="primary" aria-label={`Chỉnh sửa ${template.title}`} onClick={() => onEdit(template)}><Pencil size={14} /> Sửa</Button>
  {onAssign ? <Button aria-label={`Gán ${template.title} cho học viên`} onClick={() => onAssign(template)}><UserPlus size={14} /> Gán học viên</Button> : null}
  {template.status === 'ACTIVE' ? <Button variant="tertiary" className="ml-auto" aria-label={`Lưu trữ ${template.title}`} onClick={() => onArchive(template)}><Archive size={14} /> Lưu trữ</Button> : <Button variant="danger" className="ml-auto" aria-label={`Xóa ${template.title}`} onClick={() => onDelete(template)}><Trash2 size={14} /> Xóa</Button>}
</ActionGroup>
```

The outer card class must be:

```ts
const cardClass = 'group flex min-w-0 flex-col rounded-[14px] border border-slate-200 bg-white px-4 py-4 font-montserrat shadow-[0_2px_8px_rgba(0,59,112,0.04)] transition hover:-translate-y-px hover:border-sky-200 hover:shadow-[0_5px_14px_rgba(0,59,112,0.07)] motion-reduce:transform-none';
```

- [ ] **Step 4: Run focused tests and inspect no inline styles remain in the three files**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/workouts/MyWorkoutPlans.test.tsx frontend/tests/components/workouts/WorkoutTemplateList.test.tsx`

Expected: PASS.

Run: `rg -n "style=|p-6|rounded-2xl" frontend/src/components/workouts/MyWorkoutPlans.tsx frontend/src/components/workouts/WorkoutTemplateList.tsx frontend/src/components/workouts/WorkoutTemplateCard.tsx`

Expected: no matches.

- [ ] **Step 5: Review checkpoint and authorized commit**

```bash
git add frontend/src/components/workouts/MyWorkoutPlans.tsx frontend/src/components/workouts/WorkoutTemplateList.tsx frontend/src/components/workouts/WorkoutTemplateCard.tsx frontend/tests/components/workouts
git commit -m "feat(workouts): align template library with InBody"
```

---

### Task 3: Giáo án khách hàng and Exercise Library

**Files:**
- Modify: `frontend/src/components/workouts/CustomerWorkoutPlans.tsx`
- Modify: `frontend/src/components/workouts/CustomerWorkoutPlanPanel.tsx`
- Modify: `frontend/src/components/workouts/CustomerWorkoutPlanModal.tsx`
- Modify: `frontend/src/components/ui/ContentFormModal.tsx`
- Modify: `frontend/src/pages/pt/ExerciseLibraryPage.tsx`
- Modify: `frontend/src/components/exercises/ExerciseFilter.tsx`
- Modify: `frontend/src/components/exercises/ExerciseLibraryCard.tsx`
- Modify: `frontend/src/components/exercises/ExerciseFormModal.tsx`
- Test: `frontend/tests/components/workouts/CustomerWorkoutPlans.test.tsx`
- Test: `frontend/tests/components/workouts/CustomerWorkoutPlanPanel.test.tsx`
- Test: `frontend/tests/components/workouts/CustomerWorkoutPlanModal.test.tsx`
- Test: `frontend/tests/components/exercises/ExerciseLibrary.test.tsx`

**Interfaces:**
- Consumes: `ModuleHeader`, `ModuleToolbar`, `ActionGroup`, existing `DataList`, `Pagination`, `CustomerSelect`, `FormModal`.
- Produces: responsive customer-plan DataList and compact exercise cards without changing CRUD calls.

- [ ] **Step 1: Add tests for responsive record semantics and grouped actions**

```tsx
expect(await screen.findByRole('table')).toBeVisible();
const row = screen.getByRole('row', { name: /Nguyễn An/ });
expect(within(row).getByRole('group', { name: /Hành động giáo án Nguyễn An/ })).toBeVisible();
expect(screen.getByRole('region', { name: 'Tìm kiếm và lọc giáo án khách hàng' })).toBeVisible();
expect(screen.getByRole('region', { name: 'Tìm kiếm và lọc bài tập' })).toBeVisible();
```

- [ ] **Step 2: Run the four focused tests and confirm failure on missing regions/groups**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/workouts/CustomerWorkoutPlans.test.tsx frontend/tests/components/workouts/CustomerWorkoutPlanPanel.test.tsx frontend/tests/components/workouts/CustomerWorkoutPlanModal.test.tsx frontend/tests/components/exercises/ExerciseLibrary.test.tsx`

Expected: FAIL only on the new UI semantics; existing API assertions remain green.

- [ ] **Step 3: Replace feature-local chrome while preserving DataList and modal callbacks**

Use `ModuleToolbar` in both filter areas with `ariaLabel="Tìm kiếm và lọc giáo án khách hàng"` and `ariaLabel="Tìm kiếm và lọc bài tập"`. Both list owners track `loadError: string | null`, preserve toast errors, and render `ModuleFeedback kind="error"` with a retry button. Customer plans use `const clearPlanFilters = () => { setCustomerId(''); setStatus(''); };` and `<Button onClick={openCreate}>Tạo mới</Button>` when empty. Exercises use `const clearExerciseFilters = () => { setMuscleGroup(''); setLevel(''); };`, `const openCreateExercise = () => setFormExercise(null);`, and titles `Chưa có bài tập phù hợp` when filters are active or `Chưa có bài tập nào` otherwise. Filtered-empty state renders `<Button onClick={clearExerciseFilters}>Xóa bộ lọc</Button>`; no-data state renders `<Button onClick={openCreateExercise}>Tạo bài tập</Button>`. Customer-plan actions must be rendered as:

```tsx
const responsiveDataClass = '[&_.data-table-wrap]:hidden [&_.data-cards]:grid [&_.data-cards]:gap-3 md:[&_.data-table-wrap]:!block md:[&_.data-cards]:!hidden';
const customerName = (item: CustomerWorkoutPlan) => {
  const raw = item.customerId as unknown;
  return raw !== null && typeof raw === 'object' && 'fullName' in raw ? String((raw as { fullName?: string }).fullName || item.title) : item.title;
};
const renderPlanActions = (item: CustomerWorkoutPlan) => <ActionGroup ariaLabel={`Hành động giáo án ${customerName(item)}`} className="justify-end"><Button variant="tertiary" onClick={() => { setEditing(item); setDraft(null); setFormOpen(true); }}>Sửa</Button><Button variant="tertiary" onClick={() => setAction({ kind: item.status === 'PUBLISHED' ? 'unpublish' : 'publish', item })}>{item.status === 'PUBLISHED' ? 'Thu hồi' : 'Công bố'}</Button><Button variant="danger" onClick={() => setAction({ kind: 'delete', item })}>Xóa</Button></ActionGroup>;
<div className={responsiveDataClass}><DataList items={items} columns={columns} renderActions={renderPlanActions} /></div>
```

Exercise cards must use one outer surface and this metadata layout:

```tsx
<article aria-label={exercise.name} className="flex min-w-0 flex-col rounded-[14px] border border-slate-200 bg-white px-4 py-4 shadow-[0_2px_8px_rgba(0,59,112,0.04)]">
  <header className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-oswald text-lg font-bold uppercase text-primary">{exercise.name}</h3><p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{exercise.technique || 'Chưa có hướng dẫn kỹ thuật.'}</p></div></header>
  <dl className="mt-3 grid grid-cols-2 divide-x divide-slate-100 border-y border-slate-100 py-2.5"><div className="pr-3"><dt className="text-[0.68rem] font-bold uppercase text-slate-400">Nhóm cơ</dt><dd className="mt-1 text-sm font-semibold text-slate-700">{exercise.muscleGroup}</dd></div><div className="pl-3"><dt className="text-[0.68rem] font-bold uppercase text-slate-400">Cấp độ</dt><dd className="mt-1 text-sm font-semibold text-slate-700">{exercise.level}</dd></div></dl>
  {exercise.canManage ? <ActionGroup ariaLabel={`Hành động ${exercise.name}`} className="mt-3"><Button aria-label={`Sửa ${exercise.name}`} onClick={() => onEdit(exercise)}><Pencil size={15} /> Sửa</Button><Button variant="danger" aria-label={`Xóa ${exercise.name}`} onClick={() => onDelete(exercise)}><Trash2 size={15} /> Xóa</Button></ActionGroup> : null}
</article>
```

Keep customer plans inside the existing customer workflow. Do not add a new top-level tab or route.

Add an optional presentation hook to `ContentFormModal` and pass it through to `FormModal`:

```diff
-interface ContentFormModalProps { open: boolean; resource: Resource; item?: ContentItem | null; onClose: () => void; onSaved: (data: unknown) => void }
+interface ContentFormModalProps { open: boolean; resource: Resource; item?: ContentItem | null; className?: string; onClose: () => void; onSaved: (data: unknown) => void }
-export default function ContentFormModal({ open, resource, item, onClose, onSaved }: ContentFormModalProps) {
+export default function ContentFormModal({ open, resource, item, className = '', onClose, onSaved }: ContentFormModalProps) {
-  return <FormModal open={open} title={`${editing ? 'Sửa' : 'Tạo'} ${labels[resource]}`} dirty={dirty} loading={loading} onClose={onClose} onSubmit={submit} submitLabel={editing ? 'Lưu thay đổi' : 'Lưu bản nháp'}>
+  return <FormModal open={open} title={`${editing ? 'Sửa' : 'Tạo'} ${labels[resource]}`} className={className} dirty={dirty} loading={loading} onClose={onClose} onSubmit={submit} submitLabel={editing ? 'Lưu thay đổi' : 'Lưu bản nháp'}>
```

These are the three exact edits to the existing interface, parameter destructuring and opening `FormModal` tag; leave the current modal body and closing tag in place. `CustomerWorkoutPlanModal` passes this static Tailwind class:

```tsx
<ContentFormModal className="font-montserrat [&_.profile-form-body]:bg-white [&_.profile-form-section]:rounded-[12px] [&_.profile-form-section]:border [&_.profile-form-section]:border-slate-200 [&_.profile-form-section]:bg-slate-50 [&_.profile-form-section]:px-4 [&_.profile-form-section]:py-4" open={open} resource="workout-plans" item={(item || initialDraft) as ContentItem | null} onClose={onClose} onSaved={onSaved} />
```

Wrap the existing fields in `ExerciseFormModal` with `grid gap-3 rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-4 md:grid-cols-2`; keep `ExerciseVideoFields` as a second section with the same outer spacing.

- [ ] **Step 4: Run focused tests and typecheck**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/workouts/CustomerWorkoutPlans.test.tsx frontend/tests/components/workouts/CustomerWorkoutPlanPanel.test.tsx frontend/tests/components/workouts/CustomerWorkoutPlanModal.test.tsx frontend/tests/components/exercises/ExerciseLibrary.test.tsx`

Expected: PASS.

Run: `npm run typecheck`

Expected: exit code 0.

- [ ] **Step 5: Review checkpoint and authorized commit**

```bash
git add frontend/src/components/workouts/CustomerWorkoutPlan* frontend/src/pages/pt/ExerciseLibraryPage.tsx frontend/src/components/exercises frontend/tests/components/workouts frontend/tests/components/exercises
git commit -m "feat(workouts): align customer plans and exercise library"
```

---

### Task 4: Manual builder and AI Wizard form system

**Files:**
- Modify: `frontend/src/components/workouts/WorkoutBuilder.tsx`
- Modify: `frontend/src/components/workouts/AiWorkoutWizard.tsx`
- Modify: `frontend/src/pages/pt/WorkoutPlansPage.tsx`
- Modify: `frontend/src/components/workouts/WorkoutCheckIn.tsx`
- Modify: `frontend/src/components/workouts/WorkoutSessionHistory.tsx`
- Test: `frontend/tests/components/workouts/WorkoutBuilder.test.tsx`
- Test: `frontend/tests/components/workouts/AiWorkoutWizard.test.tsx`
- Test: `frontend/tests/components/workouts/WorkoutCheckIn.test.tsx`
- Create: `frontend/tests/components/workouts/WorkoutSessionHistory.test.tsx`
- Test: `frontend/tests/pages/pt/WorkoutPlansPage.test.tsx`

**Interfaces:**
- Consumes: existing `FormModal`, `FormField`, `ActionGroup` and unchanged AI endpoints.
- Produces: editable AI proposal and manual session sections with the same form hierarchy.

- [ ] **Step 1: Add tests for the approved step flow and editable proposal**

```tsx
expect(screen.getByRole('dialog', { name: 'Tạo giáo án bằng AI' })).toBeVisible();
expect(screen.getByText('Bước 1')).toBeVisible();
await user.click(screen.getByRole('button', { name: 'Phân tích bằng AI' }));
expect(await screen.findByText('Bước 2')).toBeVisible();
expect(screen.getByLabelText('Số tuần')).toBeEnabled();
expect(screen.getByLabelText('Số buổi mỗi tuần')).toBeEnabled();
expect(screen.getByLabelText('Số phút mỗi buổi')).toBeEnabled();
```

For `WorkoutBuilder`, assert each session is a named group and adding a session preserves behavior:

```tsx
expect(screen.getByRole('group', { name: 'Buổi tập 1' })).toBeVisible();
await user.click(screen.getByRole('button', { name: 'Thêm buổi tập' }));
expect(screen.getByRole('group', { name: 'Buổi tập 2' })).toBeVisible();
```

For the remaining legacy surfaces, assert the same form/list hierarchy:

```tsx
expect(screen.getByRole('form', { name: 'Check-in buổi tập' })).toBeVisible();
expect(screen.getByRole('region', { name: 'Lịch sử buổi tập' })).toBeVisible();
expect(screen.getByRole('tablist', { name: 'Quản lý giáo án' })).toBeVisible();
```

Create the focused history test with an empty API result:

```tsx
// frontend/tests/components/workouts/WorkoutSessionHistory.test.tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import WorkoutSessionHistory from '../../../src/components/workouts/WorkoutSessionHistory';
import { api } from '../../../src/services/api';
vi.mock('../../../src/services/api', () => ({ api: { get: vi.fn() } }));
it('renders the session history as a labelled region', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [], meta: { page: 1, totalPages: 0 }, message: '' });
  render(<ToastProvider><WorkoutSessionHistory customerId="customer-1" refreshKey={0} /></ToastProvider>);
  expect(await screen.findByRole('region', { name: 'Lịch sử buổi tập' })).toBeVisible();
});
```

- [ ] **Step 2: Run tests and verify the semantic step/session assertions fail**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/workouts/WorkoutBuilder.test.tsx frontend/tests/components/workouts/AiWorkoutWizard.test.tsx frontend/tests/components/workouts/WorkoutCheckIn.test.tsx frontend/tests/components/workouts/WorkoutSessionHistory.test.tsx frontend/tests/pages/pt/WorkoutPlansPage.test.tsx`

Expected: FAIL on the new step labels and named session groups.

- [ ] **Step 3: Refactor presentation into InBody-like sections**

Use these classes for every form section and session group:

```ts
const formSectionClass = 'grid gap-3 rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-4';
const formSectionTitleClass = 'font-oswald text-base font-bold uppercase text-primary';
const sessionGridClass = 'grid gap-3 md:grid-cols-2 xl:grid-cols-3';
```

Render AI progress with text, not color alone:

```tsx
const stepClass = (active: boolean) => `grid gap-0.5 rounded-[10px] border px-3 py-2 text-xs ${active ? 'border-sky-200 bg-sky-50 text-primary' : 'border-slate-200 bg-white text-slate-500'}`;

<ol aria-label="Tiến trình tạo giáo án" className="grid grid-cols-2 gap-2">
  <li aria-current={!proposal ? 'step' : undefined} className={stepClass(!proposal)}><span>Bước 1</span><strong>Chọn học viên</strong></li>
  <li aria-current={proposal ? 'step' : undefined} className={stepClass(Boolean(proposal))}><span>Bước 2</span><strong>Duyệt đề xuất</strong></li>
</ol>
```

Use `FormField` for customer, duration, frequency and minutes. Keep the submit branch exactly `proposal ? generate : analyze`, and preserve `onGenerated` so the generated draft still opens Studio.

Give `WorkoutCheckIn` the form label `aria-label="Check-in buổi tập"`, apply `formSectionClass` to its field group, and keep the submit payload unchanged. Give `WorkoutSessionHistory` `aria-label="Lịch sử buổi tập"` and use the same `rounded-[14px] border border-slate-200 bg-white px-5 py-4` surface. Replace `WorkoutPlansPage`'s `browser-tabs` with `SegmentedTabs<'templates' | 'customers'>` while keeping its local tab state and callbacks.

- [ ] **Step 4: Run focused tests**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/workouts/WorkoutBuilder.test.tsx frontend/tests/components/workouts/AiWorkoutWizard.test.tsx frontend/tests/components/workouts/WorkoutCheckIn.test.tsx frontend/tests/components/workouts/WorkoutSessionHistory.test.tsx frontend/tests/pages/pt/WorkoutPlansPage.test.tsx frontend/tests/pages/WorkoutStudioPage.test.tsx`

Expected: PASS.

- [ ] **Step 5: Review checkpoint and authorized commit**

```bash
git add frontend/src/components/workouts/WorkoutBuilder.tsx frontend/src/components/workouts/AiWorkoutWizard.tsx frontend/src/components/workouts/WorkoutCheckIn.tsx frontend/src/components/workouts/WorkoutSessionHistory.tsx frontend/src/pages/pt/WorkoutPlansPage.tsx frontend/tests/components/workouts frontend/tests/pages/pt/WorkoutPlansPage.test.tsx frontend/tests/pages/WorkoutStudioPage.test.tsx
git commit -m "feat(workouts): align manual and AI creation forms"
```

---

### Task 5: Responsive Workout Studio

**Files:**
- Modify: `frontend/src/pages/pt/WorkoutStudioPage.tsx`
- Modify: `frontend/src/components/workout-studio/StudioHeader.tsx`
- Modify: `frontend/src/components/workout-studio/StudioDayNavigator.tsx`
- Modify: `frontend/src/components/workout-studio/ExercisePalette.tsx`
- Modify: `frontend/src/components/workout-studio/DayTimeline.tsx`
- Modify: `frontend/src/components/workout-studio/StudioSidebar.tsx`
- Test: `frontend/tests/pages/WorkoutStudioPage.test.tsx`
- Test: `frontend/tests/components/workout-studio/StudioHeader.test.tsx`

**Interfaces:**
- Consumes: existing studio state, drag/drop handlers, `SegmentedTabs`, `ModuleToolbar`, `ActionGroup`.
- Produces: desktop three-panel workspace and mobile panel toggles without changing `ScheduledExercise` or save payloads.

- [ ] **Step 1: Add tests for panel labels, week/day controls and dirty state**

```tsx
expect(screen.getByRole('region', { name: 'Thư viện bài tập' })).toBeVisible();
expect(screen.getByRole('main', { name: 'Lịch tập trong ngày' })).toBeVisible();
expect(screen.getByRole('complementary', { name: 'Thuộc tính giáo án' })).toBeVisible();
expect(screen.getByRole('tablist', { name: 'Tuần trong giáo án' })).toBeVisible();
expect(screen.getByRole('tablist', { name: 'Ngày tập trong tuần' })).toBeVisible();
```

Keep existing tests for drag/drop, overlap rejection, unsaved navigation and save payload unchanged.

- [ ] **Step 2: Run Studio tests and confirm new landmark assertions fail**

Run: `npx vitest run --config vitest.config.ts frontend/tests/pages/WorkoutStudioPage.test.tsx frontend/tests/components/workout-studio/StudioHeader.test.tsx`

Expected: FAIL on missing landmark roles and tablists; existing interaction tests remain diagnostic.

- [ ] **Step 3: Apply the approved panel hierarchy without changing handlers**

Use these layout constants in `WorkoutStudioPage.tsx`:

```ts
const studioPageClass = 'grid min-w-0 gap-3 pb-6 font-montserrat';
const studioGridClass = 'grid min-w-0 gap-3 min-[1100px]:grid-cols-[17rem_minmax(0,1fr)_18rem]';
const studioPanelClass = 'min-w-0 rounded-[14px] border border-slate-200 bg-white shadow-[0_2px_8px_rgba(0,59,112,0.04)]';
```

Assign explicit landmarks by changing only the roots of the existing feature components:

```ts
// ExercisePalette.tsx root
const paletteRootClass = 'flex min-w-0 flex-col gap-3 overflow-hidden rounded-[14px] border border-slate-200 bg-white px-4 py-4 shadow-[0_2px_8px_rgba(0,59,112,0.04)] min-[1100px]:sticky min-[1100px]:top-4 min-[1100px]:max-h-[calc(100dvh-2rem)]';
// DayTimeline.tsx root
const timelineRootClass = 'min-h-[36rem] min-w-0 overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_2px_8px_rgba(0,59,112,0.04)]';
// StudioSidebar.tsx root
const sidebarRootClass = 'min-w-0 rounded-[14px] border border-slate-200 bg-white px-4 py-4 shadow-[0_2px_8px_rgba(0,59,112,0.04)] min-[1100px]:sticky min-[1100px]:top-4 min-[1100px]:max-h-[calc(100dvh-2rem)] min-[1100px]:overflow-y-auto';
```

Set the root labels to `aria-label="Thư viện bài tập"`, `aria-label="Lịch tập trong ngày"` and `aria-label="Thuộc tính giáo án"`. Render week and day controls with `SegmentedTabs`; keep `activeWeek`, `activeDay`, `setActiveWeek` and `setActiveDay` unchanged. At widths below 1100px, use the existing inspector state to show one secondary panel at a time; do not alter drag/drop event functions.

- [ ] **Step 4: Run Studio regression tests and typecheck**

Run: `npx vitest run --config vitest.config.ts frontend/tests/pages/WorkoutStudioPage.test.tsx frontend/tests/components/workout-studio/StudioHeader.test.tsx frontend/tests/services/workoutStudioModel.test.ts frontend/tests/services/workoutExerciseRecommendations.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: exit code 0.

- [ ] **Step 5: Browser checkpoint for Giáo án and authorized commit**

Open these routes on `localhost:3008` with a PT account:

- `/pt/my-workout-plans` at 1440px, 1024px and 390px.
- `/pt/my-workout-plans?tab=exercises` at the same widths.
- `/pt/my-workout-plans/new` at 1440px and 390px.

Verify both create buttons stay adjacent, cards have compact density, Studio has no unwanted horizontal overflow, drag/drop and save still work, and console/network show no new errors.

If commits are authorized:

```bash
git add frontend/src/pages/pt/WorkoutStudioPage.tsx frontend/src/components/workout-studio frontend/tests/pages/WorkoutStudioPage.test.tsx frontend/tests/components/workout-studio
git commit -m "feat(workouts): align Studio workspace with InBody"
```

---

### Task 6: Progress overview, metrics and responsive customer list

**Files:**
- Modify: `frontend/src/pages/pt/ProgressPage.tsx`
- Modify: `frontend/src/components/progress/ProgressDashboard.tsx`
- Modify: `frontend/src/types/progress.ts`
- Test: `frontend/tests/pages/pt/ProgressPage.test.tsx`
- Test: `frontend/tests/components/progress/ProgressDashboard.test.tsx`

**Interfaces:**
- Consumes: `ModuleHeader`, `MetricStrip`, `ModuleToolbar`, `ActionGroup`, existing `DataList`.
- Produces: unchanged `onView(item)` and `onLogWorkout(item)` callbacks from a responsive list.

- [ ] **Step 1: Replace legacy CSS contract assertions with semantic list tests**

```tsx
const summary = screen.getByRole('region', { name: 'Tổng quan tiến độ' });
expect(within(summary).getByText('2 khách hàng')).toBeVisible();
expect(screen.getByRole('table')).toBeVisible();
const actions = screen.getByRole('group', { name: 'Hành động tiến độ Nguyễn An' });
expect(within(actions).getByRole('button', { name: 'Xem tiến độ Nguyễn An' })).toBeVisible();
expect(within(actions).getByRole('button', { name: 'Ghi nhận buổi tập Nguyễn An' })).toBeVisible();
```

Add a loading-state case to `ProgressPage.test.tsx`:

```tsx
vi.mocked(api.get).mockReturnValue(new Promise<never>(() => undefined));
render(<ToastProvider><ProgressPage /></ToastProvider>);
expect(screen.getByRole('status', { name: 'Đang tải tổng quan tiến độ' })).toBeVisible();
```

Delete assertions for `.progress-metrics`, `.progress-customer-stats` and `.progress-stat`.

- [ ] **Step 2: Run Progress dashboard tests and confirm failure**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/progress/ProgressDashboard.test.tsx frontend/tests/pages/pt/ProgressPage.test.tsx`

Expected: FAIL because the dashboard still renders feature-local progress cards rather than shared primitives/DataList.

- [ ] **Step 3: Compose overview from shared primitives**

Use `ModuleHeader` in `ProgressPage.tsx`. Track `loadError: string | null`; on failure preserve the toast and render `<ModuleFeedback kind="error" title="Không tải được tiến độ" description={loadError} action={<Button onClick={() => void load()}>Thử lại</Button>} />`. In `ProgressDashboard.tsx`, build metrics and columns from the existing values:

```tsx
const attendanceRates = items.map((item) => item.analytics.attendance.rate).filter((value): value is number => value !== null);
const averageAttendance = attendanceRates.length ? number(attendanceRates.reduce((sum, value) => sum + value, 0) / attendanceRates.length) : '—';
const metrics: MetricItem[] = [
  { key: 'customers', label: 'Khách hàng', value: `${items.length} khách hàng`, tone: 'primary' },
  { key: 'sessions', label: 'Tổng buổi tập', value: items.reduce((sum, item) => sum + item.sessionCount, 0), tone: 'secondary' },
  { key: 'attendance', label: 'Tham gia trung bình', value: averageAttendance === '—' ? averageAttendance : `${averageAttendance}%`, tone: 'success' },
  { key: 'active', label: 'Có hoạt động', value: items.filter((item) => item.sessionCount > 0).length, tone: 'warning' },
];

const columns: DataColumn<CustomerProgressOverview>[] = [
  { key: 'customer', label: 'Học viên', render: (item) => <div><strong>{item.customer.fullName}</strong><span>{item.customer.phone}</span></div> },
  { key: 'sessionCount', label: 'Buổi đã tập' },
  { key: 'attendance', label: 'Tỷ lệ tham gia', render: (item) => `${item.analytics.attendance.rate ?? 0}%` },
  { key: 'weight', label: 'Cân nặng', render: (item) => item.latestMeasurement?.weight ? `${item.latestMeasurement.weight} kg` : '—' },
  { key: 'lastSessionAt', label: 'Buổi gần nhất', render: (item) => date(item.lastSessionAt) },
  { key: 'status', label: 'Trạng thái', render: (item) => <StatusBadge status={item.customer.status} /> },
];
```

Add the `DataList` index signature without changing fields:

```ts
export interface CustomerProgressOverview {
  [key: string]: unknown;
  customer: { _id: string; fullName: string; phone: string; status: string };
  sessionCount: number;
  lastSessionAt: string | null;
  latestMeasurement: Partial<BodyMeasurementDto> | null;
  analytics: JourneyAnalytics;
}
```

Replace the plain loading box in `ProgressPage.tsx` with a stable skeleton:

```tsx
<section role="status" aria-label="Đang tải tổng quan tiến độ" className="grid gap-3" aria-live="polite"><div className="h-20 animate-pulse rounded-[14px] border border-slate-200 bg-white motion-reduce:animate-none" /><div className="h-16 animate-pulse rounded-[12px] border border-slate-200 bg-white motion-reduce:animate-none" /><div className="h-64 animate-pulse rounded-[14px] border border-slate-200 bg-white motion-reduce:animate-none" /></section>
```

Render actions through `ActionGroup ariaLabel={`Hành động tiến độ ${item.customer.fullName}`}` and preserve both callbacks.

Wrap `DataList` so the breakpoint is exactly 768px even though the legacy global fallback currently switches at 800px:

```tsx
const responsiveDataClass = '[&_.data-table-wrap]:hidden [&_.data-cards]:grid [&_.data-cards]:gap-3 md:[&_.data-table-wrap]:!block md:[&_.data-cards]:!hidden';
const renderProgressActions = (item: CustomerProgressOverview) => <ActionGroup ariaLabel={`Hành động tiến độ ${item.customer.fullName}`} className="justify-end"><Button aria-label={`Xem tiến độ ${item.customer.fullName}`} onClick={() => onView(item)}>Xem chi tiết</Button><Button variant="primary" aria-label={`Ghi nhận buổi tập ${item.customer.fullName}`} onClick={() => onLogWorkout(item)}>Ghi buổi tập</Button></ActionGroup>;
<div className={responsiveDataClass}><DataList items={filtered} columns={columns} renderActions={renderProgressActions} /></div>
```

- [ ] **Step 4: Run focused tests and typecheck**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/progress/ProgressDashboard.test.tsx frontend/tests/pages/pt/ProgressPage.test.tsx`

Expected: PASS.

Run: `npm run typecheck`

Expected: exit code 0.

- [ ] **Step 5: Review checkpoint and authorized commit**

```bash
git add frontend/src/pages/pt/ProgressPage.tsx frontend/src/components/progress/ProgressDashboard.tsx frontend/src/types/progress.ts frontend/tests/pages/pt/ProgressPage.test.tsx frontend/tests/components/progress/ProgressDashboard.test.tsx
git commit -m "feat(progress): align overview with InBody"
```

---

### Task 7: Progress detail modal, snapshot and tabs

**Files:**
- Modify: `frontend/src/components/progress/ProgressModal.tsx`
- Modify: `frontend/src/components/progress/ProgressDetailModal.tsx`
- Modify: `frontend/src/components/progress/WorkoutSessionModal.tsx`
- Modify: `frontend/src/components/progress/PtProgressWorkspace.tsx`
- Test: `frontend/tests/components/progress/ProgressWorkspace.test.tsx`
- Test: `frontend/tests/pages/pt/ProgressPage.test.tsx`

**Interfaces:**
- Consumes: `SegmentedTabs`, `MetricStrip`, existing journey data and modal callbacks.
- Produces: tabs `Tổng quan | Buổi tập | Chỉ số cơ thể | Thành tích | Ảnh tiến độ | Giáo án | Báo cáo` with unchanged child components.

- [ ] **Step 1: Add modal and tab semantic tests**

```tsx
expect(screen.getByRole('dialog', { name: /Tiến độ Nguyễn An/ })).toBeVisible();
expect(screen.getByRole('region', { name: 'Tổng quan Nguyễn An' })).toBeVisible();
expect(screen.getByRole('tablist', { name: 'Khu vực tiến độ' })).toBeVisible();
expect(screen.getByRole('tab', { name: 'Tổng quan' })).toHaveAttribute('aria-selected', 'true');
await user.click(screen.getByRole('tab', { name: 'Buổi tập' }));
expect(screen.getByRole('tabpanel', { name: 'Buổi tập' })).toBeVisible();
```

- [ ] **Step 2: Run detail tests and verify failure**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/progress/ProgressWorkspace.test.tsx frontend/tests/pages/pt/ProgressPage.test.tsx`

Expected: FAIL on the new default Overview tab, labelled snapshot region or panel semantics.

- [ ] **Step 3: Implement the approved detail composition**

Use this tab definition and preserve the current data sources:

```tsx
type ProgressTab = 'Tổng quan' | 'Buổi tập' | 'Chỉ số cơ thể' | 'Thành tích' | 'Ảnh tiến độ' | 'Giáo án' | 'Báo cáo';
const tabs: SegmentedTab<ProgressTab>[] = [
  { value: 'Tổng quan', label: 'Tổng quan', panelId: 'progress-overview-panel' },
  { value: 'Buổi tập', label: 'Buổi tập', panelId: 'progress-sessions-panel' },
  { value: 'Chỉ số cơ thể', label: 'Chỉ số cơ thể', panelId: 'progress-body-panel' },
  { value: 'Thành tích', label: 'Thành tích', panelId: 'progress-achievements-panel' },
  { value: 'Ảnh tiến độ', label: 'Ảnh tiến độ', panelId: 'progress-photos-panel' },
  { value: 'Giáo án', label: 'Giáo án', panelId: 'progress-plans-panel' },
  { value: 'Báo cáo', label: 'Báo cáo', panelId: 'progress-reports-panel' },
];
```

The modal body must use `grid gap-[18px]`; snapshot metrics come before the tabs; each active panel gets `role="tabpanel"`, `aria-label={tab}` and one outer surface only. Keep modal Escape/focus behavior intact.

- [ ] **Step 4: Run detail and modal regression tests**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/progress/ProgressWorkspace.test.tsx frontend/tests/pages/pt/ProgressPage.test.tsx frontend/tests/components/progress/WorkoutSessionLogger.test.tsx`

Expected: PASS.

- [ ] **Step 5: Review checkpoint and authorized commit**

```bash
git add frontend/src/components/progress/ProgressModal.tsx frontend/src/components/progress/ProgressDetailModal.tsx frontend/src/components/progress/WorkoutSessionModal.tsx frontend/src/components/progress/PtProgressWorkspace.tsx frontend/tests/components/progress frontend/tests/pages/pt/ProgressPage.test.tsx
git commit -m "feat(progress): align detail workspace with InBody"
```

---

### Task 8: Progress session, measurement, charts and achievements

**Files:**
- Modify: `frontend/src/components/progress/WorkoutSessionLogger.tsx`
- Modify: `frontend/src/components/progress/WorkoutSessionDetail.tsx`
- Modify: `frontend/src/components/progress/MeasurementForm.tsx`
- Modify: `frontend/src/components/progress/ProgressOverview.tsx`
- Modify: `frontend/src/components/progress/ProgressCharts.tsx`
- Modify: `frontend/src/components/progress/AchievementList.tsx`
- Test: `frontend/tests/components/progress/WorkoutSessionLogger.test.tsx`
- Test: `frontend/tests/components/progress/MeasurementForm.test.tsx`
- Test: `frontend/tests/components/progress/ProgressCharts.test.tsx`
- Test: `frontend/tests/components/progress/ProgressWorkspace.test.tsx`

**Interfaces:**
- Consumes: journey sessions/measurements/analytics and unchanged save callbacks.
- Produces: compact forms and flat data sections; no calculation changes.

- [ ] **Step 1: Add named-group tests for session sets and body metrics**

```tsx
expect(screen.getByRole('group', { name: /Thông số Squat/ })).toBeVisible();
expect(screen.getByRole('group', { name: 'Chỉ số cơ thể' })).toBeVisible();
expect(screen.getByRole('figure', { name: /Biểu đồ cân nặng/ })).toBeVisible();
expect(screen.getByRole('list', { name: 'Thành tích' })).toBeVisible();
```

- [ ] **Step 2: Run the focused tests and confirm missing semantics**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/progress/WorkoutSessionLogger.test.tsx frontend/tests/components/progress/MeasurementForm.test.tsx frontend/tests/components/progress/ProgressCharts.test.tsx frontend/tests/components/progress/ProgressWorkspace.test.tsx`

Expected: FAIL on the new named regions while existing submit/calculation assertions still identify regressions.

- [ ] **Step 3: Apply one-surface sections and compact row styles**

Use these static class constants across the six components:

```ts
const progressPanelClass = 'grid gap-4 rounded-[14px] border border-slate-200 bg-white px-5 py-4 shadow-[0_2px_8px_rgba(0,59,112,0.04)]';
const progressInnerClass = 'grid gap-3 rounded-[10px] bg-slate-50 px-4 py-3';
const progressRowClass = 'grid gap-3 border-b border-slate-100 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_repeat(4,minmax(5rem,7rem))]';
```

Use fieldsets with explicit legends for exercise logs; use `figure`/`figcaption` for charts; use a semantic list for achievements. Preserve all `api.post`, `api.patch`, metric calculations, SVG path calculations and `onSaved` calls.

- [ ] **Step 4: Run feature tests and typecheck**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/progress/WorkoutSessionLogger.test.tsx frontend/tests/components/progress/MeasurementForm.test.tsx frontend/tests/components/progress/ProgressCharts.test.tsx frontend/tests/components/progress/ProgressWorkspace.test.tsx`

Expected: PASS.

Run: `npm run typecheck`

Expected: exit code 0.

- [ ] **Step 5: Review checkpoint and authorized commit**

```bash
git add frontend/src/components/progress/WorkoutSessionLogger.tsx frontend/src/components/progress/WorkoutSessionDetail.tsx frontend/src/components/progress/MeasurementForm.tsx frontend/src/components/progress/ProgressOverview.tsx frontend/src/components/progress/ProgressCharts.tsx frontend/src/components/progress/AchievementList.tsx frontend/tests/components/progress
git commit -m "feat(progress): align sessions and measurements with InBody"
```

---

### Task 9: Progress photos, plans and reports

**Files:**
- Modify: `frontend/src/components/progress/PtProgressWorkspace.tsx`
- Modify: `frontend/src/components/progress/ProgressReportGenerator.tsx`
- Modify: `frontend/src/components/progress/ProgressReportEditor.tsx`
- Modify: `frontend/src/components/progress/ProgressReportList.tsx`
- Test: `frontend/tests/components/progress/ProgressReportEditor.test.tsx`
- Test: `frontend/tests/components/progress/ProgressWorkspace.test.tsx`

**Interfaces:**
- Consumes: journey photos, plan history, reports and existing report endpoints.
- Produces: accessible photo grid, plan summary and report workflow.

- [ ] **Step 1: Add tests for empty/populated photo, plan and report panels**

```tsx
expect(screen.getByRole('list', { name: 'Ảnh tiến độ' })).toBeVisible();
expect(screen.getByRole('list', { name: 'Lịch sử giáo án' })).toBeVisible();
expect(screen.getByRole('group', { name: 'Kỳ báo cáo' })).toBeVisible();
expect(screen.getByRole('group', { name: 'Hành động báo cáo' })).toBeVisible();
```

- [ ] **Step 2: Run report/workspace tests and confirm failure**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/progress/ProgressReportEditor.test.tsx frontend/tests/components/progress/ProgressWorkspace.test.tsx`

Expected: FAIL on missing list/group semantics.

- [ ] **Step 3: Implement flat lists and grouped report actions**

Use this photo list contract:

```tsx
<ul aria-label="Ảnh tiến độ" className="grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
  {journey.photos.map((photo) => <li key={String(photo._id)} className="overflow-hidden rounded-[12px] border border-slate-200 bg-white"><img className="aspect-[4/3] w-full object-cover" src={String(photo.photoUrl)} alt={`Ảnh tiến độ ${String(photo.stage)}`} /><p className="px-3 py-2 text-xs font-semibold text-slate-600">{String(photo.stage || 'Chưa phân loại')}</p></li>)}
</ul>
```

Use a semantic list for plan history and `ActionGroup ariaLabel="Hành động báo cáo"` for save/publish. Keep report generate, patch and publish calls exactly as they are.

- [ ] **Step 4: Run report tests**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/progress/ProgressReportEditor.test.tsx frontend/tests/components/progress/ProgressWorkspace.test.tsx`

Expected: PASS.

- [ ] **Step 5: Review checkpoint and authorized commit**

```bash
git add frontend/src/components/progress/PtProgressWorkspace.tsx frontend/src/components/progress/ProgressReportGenerator.tsx frontend/src/components/progress/ProgressReportEditor.tsx frontend/src/components/progress/ProgressReportList.tsx frontend/tests/components/progress
git commit -m "feat(progress): align photos plans and reports"
```

---

### Task 10: Remove legacy UI contracts and complete verification

**Files:**
- Modify: `frontend/src/index.css`
- Delete: `frontend/tests/components/progress/ProgressLegacyCssContract.test.ts`
- Modify: any focused test still querying deleted presentation selectors.

**Interfaces:**
- Consumes: all migrated components from Tasks 1–9.
- Produces: no remaining active `progress-*` UI CSS contract and a verified production build.

- [ ] **Step 1: Prove legacy selectors have no consumers before deletion**

Run:

```powershell
rg -n "progress-(page|dashboard|metrics|metric|customer|workspace|tabs|tab|form|session|overview|chart|achievement|report|photo|plan)" frontend/src --glob "*.tsx"
```

Expected: no matches for legacy presentation class names. Domain component/type names are acceptable only when they are not `className` values.

- [ ] **Step 2: Delete only orphaned CSS blocks and the obsolete CSS-contract test**

Remove the block beginning with `/* Progress module — legacy CSS contract */` from `frontend/src/index.css`. Search studio selectors and remove only selectors with zero TSX consumers. Preserve InBody CSS and all shared legacy styles still used outside these two modules.

Delete `frontend/tests/components/progress/ProgressLegacyCssContract.test.ts` because behavior and accessibility tests now provide the contract.

- [ ] **Step 3: Run the complete focused frontend regression set**

Run:

```powershell
npx vitest run --config vitest.config.ts frontend/tests/components/ui/ModuleChrome.test.tsx frontend/tests/components/workouts frontend/tests/components/exercises/ExerciseLibrary.test.tsx frontend/tests/components/workout-studio frontend/tests/pages/WorkoutStudioPage.test.tsx frontend/tests/pages/pt/WorkoutPlansPage.test.tsx frontend/tests/components/progress frontend/tests/pages/pt/ProgressPage.test.tsx
```

Expected: all selected tests PASS; no unhandled promise rejection or React act warning introduced by this work.

- [ ] **Step 4: Run static and production verification**

Run: `npm run typecheck`

Expected: exit code 0.

Run: `npm run build`

Expected: exit code 0 and Vite production assets emitted successfully.

Run: `git diff --check`

Expected: no whitespace errors or conflict markers.

- [ ] **Step 5: Browser smoke test on localhost:3008**

Use a PT account and verify at 1440px, 1024px and 390px:

- `/pt/my-workout-plans`: tabs, filters, manual creation, AI creation, archive/delete confirmation and pagination.
- `/pt/my-workout-plans?tab=exercises`: create/edit/delete permissions, filters and cards.
- `/pt/my-workout-plans/new`: week/day navigation, palette, timeline, inspector, overlap prevention, dirty warning and save.
- `/pt/progress`: metrics, search, responsive table/card, detail modal and workout modal.
- Progress detail tabs: overview, sessions, body measurements, achievements, photos, plans and reports.
- Keyboard: visible focus, tab order, modal Escape handling and focus return.
- Visual: no 24px card padding, no nested rounded surfaces without meaning, action buttons stay adjacent and no unintended horizontal scrolling.

Expected: all flows work with no new console or network errors.

- [ ] **Step 6: Final review checkpoint and authorized commit**

```bash
git add frontend/src frontend/tests docs/superpowers/specs/2026-08-31-workout-progress-inbody-alignment-design.md docs/superpowers/plans/2026-08-31-workout-progress-inbody-alignment.md
git commit -m "feat: align workout and progress modules with InBody"
```

Do not run this commit unless the user explicitly authorizes commits during execution.
