# Progress Interface Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/pt/progress` and `/me/progress` around a shared KPI snapshot and consistent Tailwind-first states without changing APIs, DTOs, payloads, permissions, or business behavior.

**Architecture:** Add small role-neutral visual primitives in `components/progress`, then compose them inside the existing PT and customer workspaces. Keep fetching in `ProgressPage` and `CustomerPortalPage`; keep PT mutations in existing feature components; split the customer progress monolith into read-only report, photo, achievement, and dialog components.

**Tech Stack:** React 19, TypeScript 7, Tailwind CSS v4 via `@tailwindcss/vite`, Lucide React, Vitest 4, Testing Library.

## Global Constraints

- Tailwind CSS v4 is the only styling method for new or modified UI.
- Reuse `primary`, `secondary`, `gym-bg`, `gym-dark`, `gym-gray`, `font-oswald`, and `font-montserrat` from `frontend/src/index.css`.
- Do not add inline styles, CSS modules, styled-components, new `.progress-*` global selectors, UI libraries, chart libraries, or animation libraries.
- Do not change backend code, endpoints, `CustomerJourneyDto`, payloads, permissions, or existing business behavior.
- Keep all existing seven PT tabs and all existing PT mutations.
- Customer progress remains read-only and only renders reports returned by `/api/me/journey`.
- Interactive controls need hover, active, disabled, focus-visible, and motion-reduce states with a minimum 44px target on mobile.
- Missing numeric values render `—`, never `0`; chart series with fewer than two points retain the explicit insufficient-data state.
- Test files remain under `frontend/tests/`; React tests use jsdom and `@testing-library/jest-dom/vitest`.

---

## File Map

### Shared progress UI

- Create `frontend/src/components/progress/ProgressMetricCard.tsx`: renders one labelled KPI.
- Create `frontend/src/components/progress/ProgressSnapshot.tsx`: maps `JourneyAnalytics` to four metric cards and data-quality warnings.
- Create `frontend/src/components/progress/ProgressSection.tsx`: semantic section shell with optional count and action.
- Create `frontend/src/components/progress/ProgressEmptyState.tsx`: role-neutral empty state with optional CTA.
- Create `frontend/src/components/progress/ProgressSkeleton.tsx`: accessible loading skeleton.
- Create `frontend/tests/components/progress/ProgressPrimitives.test.tsx`: focused behavior and accessibility tests for the five primitives.

### PT route

- Modify `frontend/src/pages/pt/ProgressPage.tsx`: explicit initial/refresh loading, retained-data refresh, inline error/retry, and no-selection empty state.
- Modify `frontend/src/components/progress/PtProgressWorkspace.tsx`: customer identity, shared snapshot, three quick actions, accessible tabs, and role-specific empty states.
- Modify `frontend/tests/components/progress/ProgressWorkspace.test.tsx`: snapshot and three quick-action contracts.
- Create `frontend/tests/pages/pt/ProgressPage.test.tsx`: page-level fetch, skeleton, retry, retained data, and reset tests.

### PT tab presentation

- Modify `frontend/src/components/progress/ProgressOverview.tsx`.
- Modify `frontend/src/components/progress/WorkoutSessionLogger.tsx`.
- Modify `frontend/src/components/progress/WorkoutSessionDetail.tsx`.
- Modify `frontend/src/components/progress/MeasurementForm.tsx`.
- Modify `frontend/src/components/progress/ProgressCharts.tsx`.
- Modify `frontend/src/components/progress/AchievementList.tsx`.
- Modify `frontend/src/components/progress/ProgressReportGenerator.tsx`.
- Modify the matching existing files under `frontend/tests/components/progress/` only when an accessibility contract changes.

### Customer route

- Create `frontend/src/components/customer-portal/CustomerProgressReportSection.tsx`.
- Create `frontend/src/components/customer-portal/CustomerProgressPhotoGallery.tsx`.
- Create `frontend/src/components/customer-portal/CustomerProgressAchievements.tsx`.
- Create `frontend/src/components/customer-portal/ProgressPhotoLightbox.tsx`.
- Modify `frontend/src/components/customer-portal/CustomerReportsPhotos.tsx` to compose shared snapshot and the four focused components.
- Create `frontend/tests/components/customer-portal/CustomerReportsPhotos.test.tsx`.
- Keep the existing integration assertion in `frontend/tests/components/customer-portal/CustomerPortalComponents.test.tsx`.

---

### Task 1: Shared progress primitives

**Files:**
- Create: `frontend/src/components/progress/ProgressMetricCard.tsx`
- Create: `frontend/src/components/progress/ProgressSnapshot.tsx`
- Create: `frontend/src/components/progress/ProgressSection.tsx`
- Create: `frontend/src/components/progress/ProgressEmptyState.tsx`
- Create: `frontend/src/components/progress/ProgressSkeleton.tsx`
- Test: `frontend/tests/components/progress/ProgressPrimitives.test.tsx`

**Interfaces:**
- Consumes: `JourneyAnalytics` from `frontend/src/types/progress.ts`, `LucideIcon` from `lucide-react`, and React nodes.
- Produces:

```ts
export interface ProgressMetricCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  featured?: boolean;
}

export interface ProgressSnapshotProps {
  analytics: JourneyAnalytics;
  title?: string;
}

export interface ProgressSectionProps {
  title: string;
  description?: string;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export interface ProgressEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}
```

- [x] **Step 1: Write failing primitive tests**

Create tests that render complete and insufficient analytics, assert all four KPI labels/values, assert `—` for missing attendance/RPE, assert the data-quality reason, assert a named semantic section, assert optional CTA behavior, and assert `aria-busy="true"` on the skeleton.

```tsx
const analytics: JourneyAnalytics = {
  totalVolume: 8500,
  averageRpe: 8.2,
  attendance: { present: 8, late: 0, absent: 0, rate: 100 },
  streakWeeks: 3,
  achievements: [],
  dataQuality: { level: 'COMPLETE', reasons: [] },
};

render(<ProgressSnapshot analytics={analytics} />);
expect(screen.getByText('Tỷ lệ tham gia')).toBeVisible();
expect(screen.getByText('100%')).toBeVisible();
expect(screen.getByText('8.500 kg')).toBeVisible();
expect(screen.getByText('RPE 8,2')).toBeVisible();
expect(screen.getByText('3 tuần')).toBeVisible();
```

- [x] **Step 2: Run tests and confirm RED**

Run:

```powershell
npx vitest run frontend/tests/components/progress/ProgressPrimitives.test.tsx
```

Expected: FAIL because the five primitive modules do not exist.

- [x] **Step 3: Implement the five primitives**

Use static Tailwind class strings. `ProgressSnapshot` formats values with `toLocaleString('vi-VN')`, uses `—` for nullable rate/RPE, and renders each `dataQuality.reasons` entry in an amber warning list. `ProgressSection` sets `aria-labelledby` using `useId`; `ProgressSkeleton` has `role="status"`, `aria-live="polite"`, and `aria-busy="true"`.

```tsx
const metrics = [
  { label: 'Tỷ lệ tham gia', value: analytics.attendance.rate === null ? '—' : `${analytics.attendance.rate}%`, hint: 'Số buổi có mặt và đi muộn', icon: CalendarCheck, featured: true },
  { label: 'Tổng volume', value: `${analytics.totalVolume.toLocaleString('vi-VN')} kg`, hint: 'Tổng khối lượng set hoàn thành', icon: Dumbbell },
  { label: 'RPE trung bình', value: analytics.averageRpe === null ? '—' : `RPE ${analytics.averageRpe.toLocaleString('vi-VN')}`, hint: 'Cường độ cảm nhận', icon: Gauge },
  { label: 'Chuỗi tập', value: `${analytics.streakWeeks.toLocaleString('vi-VN')} tuần`, hint: 'Số tuần tập liên tiếp', icon: Flame },
];
```

- [x] **Step 4: Run primitive tests and confirm GREEN**

Run the focused command from Step 2.

Expected: all tests in `ProgressPrimitives.test.tsx` pass.

- [x] **Step 5: Commit shared primitives**

```powershell
git add frontend/src/components/progress/ProgressMetricCard.tsx frontend/src/components/progress/ProgressSnapshot.tsx frontend/src/components/progress/ProgressSection.tsx frontend/src/components/progress/ProgressEmptyState.tsx frontend/src/components/progress/ProgressSkeleton.tsx frontend/tests/components/progress/ProgressPrimitives.test.tsx
git commit -m "feat: add shared progress interface primitives"
```

---

### Task 2: PT progress page and workspace

**Files:**
- Modify: `frontend/src/pages/pt/ProgressPage.tsx`
- Modify: `frontend/src/components/progress/PtProgressWorkspace.tsx`
- Modify: `frontend/tests/components/progress/ProgressWorkspace.test.tsx`
- Create: `frontend/tests/pages/pt/ProgressPage.test.tsx`

**Interfaces:**
- Consumes: all Task 1 primitives and the existing `CustomerJourneyDto`.
- Produces: `PtProgressWorkspace({ journey, onRefresh })` with the existing public props; no route/API change.

- [x] **Step 1: Add failing workspace tests**

Extend the existing fixture to assert the shared KPI snapshot and all three quick actions. Click each quick action and assert its target tab panel content.

```tsx
for (const name of ['Ghi nhận buổi tập', 'Nhập số đo', 'Tạo báo cáo']) {
  expect(screen.getByRole('button', { name })).toBeVisible();
}
await user.click(screen.getByRole('button', { name: 'Nhập số đo' }));
expect(screen.getByRole('heading', { name: 'Ghi số đo' })).toBeVisible();
await user.click(screen.getByRole('button', { name: 'Tạo báo cáo' }));
expect(screen.getByRole('button', { name: 'Tạo báo cáo tự động' })).toBeVisible();
```

- [x] **Step 2: Add failing page integration tests**

Mock `api.get`. Cover initial no-selection state, selection-triggered loading, resolved workspace, rejected request with retry, and clearing the selection. Supply customers directly to `CustomerSelect` by mocking it as a simple labelled `<select>` so the test targets `ProgressPage` instead of the selector internals.

```tsx
vi.mock('../../../src/components/ui/CustomerSelect', () => ({
  default: ({ value, onChange }: { value: string; onChange: (id: string) => void }) => (
    <select aria-label="Chọn học viên" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Chọn học viên</option>
      <option value="c1">Nguyễn An</option>
    </select>
  ),
}));
```

- [x] **Step 3: Run PT tests and confirm RED**

```powershell
npx vitest run frontend/tests/components/progress/ProgressWorkspace.test.tsx frontend/tests/pages/pt/ProgressPage.test.tsx
```

Expected: FAIL because snapshot, three quick actions, skeleton, inline error/retry, and no-selection empty state are absent.

- [x] **Step 4: Implement PT page states**

Add `error: string | null` while retaining current data during refresh. Initial request renders `ProgressSkeleton`; a rejected initial request renders `ProgressEmptyState` with a retry button; a failed refresh keeps `journey`. Clearing the selected customer clears journey and error. Use `ProgressSection` around the selector and `ProgressEmptyState` before selection.

```ts
const [error, setError] = useState<string | null>(null);

const load = useCallback(async (targetId?: string) => {
  const idToLoad = targetId || customerId;
  if (!idToLoad) return;
  setError(null);
  setLoading(true);
  try {
    const result = await api.get<CustomerJourneyDto>(`/api/customers/${idToLoad}/journey`);
    setJourney(result.data);
  } catch (caught) {
    const message = errorMessage(caught);
    setError(message);
    toast.error(message);
  } finally {
    setLoading(false);
  }
}, [customerId, toast]);
```

- [x] **Step 5: Implement PT workspace composition**

Render identity, `ProgressSnapshot`, quick actions, and accessible tabs. Keep the current tab names and child components. Quick actions only call `setTab`.

```tsx
<ProgressSnapshot analytics={journey.analytics} title="Tổng quan tiến độ" />
<button type="button" onClick={() => setTab('Buổi tập')}>Ghi nhận buổi tập</button>
<button type="button" onClick={() => setTab('Chỉ số cơ thể')}>Nhập số đo</button>
<button type="button" onClick={() => setTab('Báo cáo')}>Tạo báo cáo</button>
```

- [x] **Step 6: Run PT tests and confirm GREEN**

Run the command from Step 3.

Expected: all PT page/workspace tests pass.

- [x] **Step 7: Commit the PT shell**

```powershell
git add frontend/src/pages/pt/ProgressPage.tsx frontend/src/components/progress/PtProgressWorkspace.tsx frontend/tests/components/progress/ProgressWorkspace.test.tsx frontend/tests/pages/pt/ProgressPage.test.tsx
git commit -m "feat: redesign PT progress workspace"
```

---

### Task 3: Normalize active PT tab presentation

**Files:**
- Modify: `frontend/src/components/progress/ProgressOverview.tsx`
- Modify: `frontend/src/components/progress/WorkoutSessionLogger.tsx`
- Modify: `frontend/src/components/progress/WorkoutSessionDetail.tsx`
- Modify: `frontend/src/components/progress/MeasurementForm.tsx`
- Modify: `frontend/src/components/progress/ProgressCharts.tsx`
- Modify: `frontend/src/components/progress/AchievementList.tsx`
- Modify: `frontend/src/components/progress/ProgressReportGenerator.tsx`
- Test: existing matching files in `frontend/tests/components/progress/`

**Interfaces:**
- Consumes: `ProgressSection` and `ProgressEmptyState` from Task 1.
- Produces: the same exported component props and the same API calls/payloads as before.

- [x] **Step 1: Add focused accessibility assertions**

Add assertions only where markup contracts change: named sections for overview/charts/reports, explicit empty-state heading for missing plan/achievements, and labelled form regions. Do not assert raw Tailwind class strings.

```tsx
expect(screen.getByRole('region', { name: 'Biểu đồ tiến độ' })).toBeVisible();
expect(screen.getByRole('heading', { name: 'Chưa có giáo án đang áp dụng' })).toBeVisible();
```

- [x] **Step 2: Run the existing PT component suite and confirm RED for new assertions**

```powershell
npx vitest run frontend/tests/components/progress
```

Expected: existing behavior tests pass; newly added semantic assertions fail.

- [x] **Step 3: Replace legacy presentation with shared sections**

Keep all handlers and payload construction unchanged. Replace legacy `button`, `panel`, generic nested cards, and inconsistent headings in the seven active components with static Tailwind utilities and Task 1 primitives. Reformat one-line JSX into readable blocks. Every modified input/textarea retains an explicit placeholder or accessible label.

```tsx
<ProgressSection
  title="Biểu đồ tiến độ"
  description="Theo dõi thay đổi cơ thể qua từng lần đo."
>
  <div className="grid gap-4 lg:grid-cols-2">{charts}</div>
</ProgressSection>
```

- [x] **Step 4: Verify no inline style or legacy panel classes remain in active PT files**

```powershell
rg -n "style=|className=\"(?:panel|field|button )" frontend/src/pages/pt/ProgressPage.tsx frontend/src/components/progress/PtProgressWorkspace.tsx frontend/src/components/progress/ProgressOverview.tsx frontend/src/components/progress/WorkoutSessionLogger.tsx frontend/src/components/progress/WorkoutSessionDetail.tsx frontend/src/components/progress/MeasurementForm.tsx frontend/src/components/progress/ProgressCharts.tsx frontend/src/components/progress/AchievementList.tsx frontend/src/components/progress/ProgressReportGenerator.tsx
```

Expected: no matches.

- [x] **Step 5: Run the full focused PT component suite**

Run the command from Step 2.

Expected: all files under `frontend/tests/components/progress` pass.

- [x] **Step 6: Commit PT tab presentation**

```powershell
git add frontend/src/components/progress frontend/tests/components/progress
git commit -m "style: unify PT progress tab presentation"
```

---

### Task 4: Customer progress workspace and accessible photo dialog

**Files:**
- Create: `frontend/src/components/customer-portal/CustomerProgressReportSection.tsx`
- Create: `frontend/src/components/customer-portal/CustomerProgressPhotoGallery.tsx`
- Create: `frontend/src/components/customer-portal/CustomerProgressAchievements.tsx`
- Create: `frontend/src/components/customer-portal/ProgressPhotoLightbox.tsx`
- Modify: `frontend/src/components/customer-portal/CustomerReportsPhotos.tsx`
- Create: `frontend/tests/components/customer-portal/CustomerReportsPhotos.test.tsx`
- Test: `frontend/tests/components/customer-portal/CustomerPortalComponents.test.tsx`

**Interfaces:**
- Consumes: `CustomerJourneyDto`, `JourneyProgressReport`, `AchievementDto`, photo objects from `CustomerJourneyDto['photos']`, and Task 1 shared primitives.
- Produces:

```ts
export interface CustomerProgressReportSectionProps {
  reports: JourneyProgressReport[];
  featured?: boolean;
}

export interface CustomerProgressPhotoGalleryProps {
  photos: CustomerJourneyDto['photos'];
  onOpenPhoto: (photoUrl: string, alt: string, trigger: HTMLButtonElement) => void;
}

export interface CustomerProgressAchievementsProps {
  achievements: AchievementDto[];
}

export interface ProgressPhotoLightboxProps {
  open: boolean;
  imageUrl: string;
  imageAlt: string;
  onClose: () => void;
}
```

- [x] **Step 1: Write failing customer workspace tests**

Use a compact local `CustomerJourneyDto` fixture with two reports in reverse chronological input order, one photo, one achievement, and complete analytics. Assert snapshot, newest report first, each filter, each empty state, no PT mutation action, dialog semantics, Escape close, and focus return.

```tsx
expect(screen.getByText('Tỷ lệ tham gia')).toBeVisible();
expect(screen.getByRole('heading', { name: /Báo cáo mới nhất/i })).toBeVisible();
await user.click(screen.getByRole('button', { name: /Ảnh/ }));
expect(screen.getByAltText('Ảnh tiến độ MONTH_1')).toBeVisible();
await user.click(screen.getByRole('button', { name: 'Mở ảnh tiến độ MONTH_1' }));
expect(screen.getByRole('dialog', { name: 'Ảnh tiến độ MONTH_1' })).toBeVisible();
await user.keyboard('{Escape}');
expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
```

- [x] **Step 2: Run customer tests and confirm RED**

```powershell
npx vitest run frontend/tests/components/customer-portal/CustomerReportsPhotos.test.tsx frontend/tests/components/customer-portal/CustomerPortalComponents.test.tsx
```

Expected: FAIL because the focused modules and shared snapshot composition are absent.

- [x] **Step 3: Implement read-only customer sections**

Sort reports by `periodEnd` descending without mutating props. Render the newest report as the featured section and the remaining reports in a responsive grid. Render semantic buttons around gallery images, role-neutral achievements, and specific empty states. Use `toLocaleDateString('vi-VN')` and `toLocaleString('vi-VN')`.

```ts
const orderedReports = [...reports].sort(
  (left, right) => new Date(right.periodEnd).getTime() - new Date(left.periodEnd).getTime()
);
const [latestReport, ...previousReports] = orderedReports;
```

- [x] **Step 4: Implement accessible lightbox**

Use a native dialog-like fixed overlay with `role="dialog"`, `aria-modal="true"`, `aria-label={imageAlt}`, close button, Escape listener, body scroll restoration, initial close-button focus, and focus return managed by `CustomerReportsPhotos` through the saved trigger ref. Stop overlay propagation inside the content.

```ts
useEffect(() => {
  if (!open) return;
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  closeButtonRef.current?.focus();
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', onKeyDown);
  return () => {
    document.body.style.overflow = previousOverflow;
    document.removeEventListener('keydown', onKeyDown);
  };
}, [open, onClose]);
```

- [x] **Step 5: Compose `CustomerReportsPhotos`**

Render `ProgressSnapshot` first, then the latest report, then the filter tablist and filtered sections. Keep filter state local. Do not render create/edit/publish controls. Save the clicked photo trigger and restore focus in the close callback.

- [x] **Step 6: Verify no inline style remains in customer progress files**

```powershell
rg -n "style=" frontend/src/components/customer-portal/CustomerReportsPhotos.tsx frontend/src/components/customer-portal/CustomerProgressReportSection.tsx frontend/src/components/customer-portal/CustomerProgressPhotoGallery.tsx frontend/src/components/customer-portal/CustomerProgressAchievements.tsx frontend/src/components/customer-portal/ProgressPhotoLightbox.tsx
```

Expected: no matches.

- [x] **Step 7: Run customer tests and confirm GREEN**

Run the command from Step 2.

Expected: all focused customer progress tests pass.

- [x] **Step 8: Commit customer progress redesign**

```powershell
git add frontend/src/components/customer-portal/CustomerReportsPhotos.tsx frontend/src/components/customer-portal/CustomerProgressReportSection.tsx frontend/src/components/customer-portal/CustomerProgressPhotoGallery.tsx frontend/src/components/customer-portal/CustomerProgressAchievements.tsx frontend/src/components/customer-portal/ProgressPhotoLightbox.tsx frontend/tests/components/customer-portal/CustomerReportsPhotos.test.tsx frontend/tests/components/customer-portal/CustomerPortalComponents.test.tsx
git commit -m "feat: redesign customer progress workspace"
```

---

### Task 5: Integrated verification and cleanup

**Files:**
- Modify only files from Tasks 1–4 if verification identifies a concrete issue.
- Do not expand scope to InBody, backend, unused progress legacy components, or unrelated customer portal tabs.

**Interfaces:**
- Consumes: completed UI from Tasks 1–4.
- Produces: a clean worktree whose focused tests, full tests, typecheck, lint, and production build pass.

- [x] **Step 1: Run focused progress tests**

```powershell
npx vitest run frontend/tests/components/progress frontend/tests/pages/pt/ProgressPage.test.tsx frontend/tests/components/customer-portal/CustomerReportsPhotos.test.tsx frontend/tests/components/customer-portal/CustomerPortalComponents.test.tsx
```

Expected: all focused tests pass.

- [x] **Step 2: Run the full test suite**

```powershell
npm test
```

Expected: all test files and tests pass.

- [x] **Step 3: Run typecheck**

```powershell
npm run typecheck
```

Expected: exit code 0 with no TypeScript diagnostics.

- [x] **Step 4: Run lint**

```powershell
npm run lint
```

Expected: exit code 0 with no Oxlint errors.

- [x] **Step 5: Run production build**

```powershell
npm run build
```

Expected: exit code 0 and a generated Vite production bundle.

- [x] **Step 6: Run final static and Git checks**

```powershell
rg -n "style=" frontend/src/pages/pt/ProgressPage.tsx frontend/src/components/progress/ProgressMetricCard.tsx frontend/src/components/progress/ProgressSnapshot.tsx frontend/src/components/progress/ProgressSection.tsx frontend/src/components/progress/ProgressEmptyState.tsx frontend/src/components/progress/ProgressSkeleton.tsx frontend/src/components/progress/PtProgressWorkspace.tsx frontend/src/components/progress/ProgressOverview.tsx frontend/src/components/progress/WorkoutSessionLogger.tsx frontend/src/components/progress/WorkoutSessionDetail.tsx frontend/src/components/progress/MeasurementForm.tsx frontend/src/components/progress/ProgressCharts.tsx frontend/src/components/progress/AchievementList.tsx frontend/src/components/progress/ProgressReportGenerator.tsx frontend/src/components/customer-portal/CustomerReportsPhotos.tsx frontend/src/components/customer-portal/CustomerProgressReportSection.tsx frontend/src/components/customer-portal/CustomerProgressPhotoGallery.tsx frontend/src/components/customer-portal/CustomerProgressAchievements.tsx frontend/src/components/customer-portal/ProgressPhotoLightbox.tsx
git diff --check
git status --short
```

Expected: no `style=` matches, no whitespace errors, and only intentional uncommitted files if a final verification fix has not yet been committed.

- [x] **Step 7: Commit any verification-only fixes** *(skipped: no verification fixes required)*

```powershell
git add frontend/src frontend/tests
git commit -m "test: complete progress interface verification"
```

Skip this commit when Step 6 reports no uncommitted implementation changes.
