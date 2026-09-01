# Exercise, Workout Plans, and Studio Index CSS Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the PT Exercise Library, Workout Plans, and Workout Studio as one responsive Clinical Performance system whose static presentation comes from semantic classes in `frontend/src/index.css`.

**Architecture:** Add a shared `module-*` CSS foundation, then migrate the three linked feature surfaces to isolated `exercise-*`, `workout-*`, and `studio-*` contracts. Pages retain API and routing orchestration, components retain existing data/callback interfaces, and only the timeline may expose data-dependent coordinates through typed CSS custom properties.

**Tech Stack:** React 19, TypeScript 7, React Router 7, CSS in `frontend/src/index.css`, Lucide React, Vitest 4, Testing Library.

## Global Constraints

- Preserve every existing URL, API contract, permission rule, feature flag, DTO, persistence behavior, and user capability.
- Use the existing `#003b70` primary, `#00a4e4` secondary, Oswald heading, and Montserrat body tokens.
- Do not add CSS modules, styled-components, component stylesheets, CSS frameworks, or dependencies.
- Do not modify InBody, Progress, Roadmap, Nutrition, Dashboard, portal navigation, or landing-page presentation.
- Remove Tailwind presentation utilities and static `style={{ ... }}` declarations from the files explicitly listed in this plan.
- Allow inline styling only for typed `--studio-item-top` and `--studio-item-height` values derived from timeline data.
- Use mobile `<640px`, tablet `640px–1023px`, desktop `>=1024px`, and wide desktop `>=1280px` breakpoints.
- Keep touch targets at least `44px`; include focus-visible, pressed, disabled, loading, error, empty, filtered-empty, and reduced-motion states.
- Run focused tests after every task and commit only when that task is green.

---

### Task 1: Shared module CSS foundation and architecture contract

**Files:**
- Create: `frontend/tests/components/IndexCssRedesignContract.test.ts`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: existing theme variables and `button`, `button-primary`, `button-secondary`, `modal-*`, and `field` contracts.
- Produces: reusable `module-page`, `module-header`, `module-toolbar`, `module-card`, `module-form`, `module-modal`, and module-state class families for Tasks 2–7.

- [ ] **Step 1: Write the failing foundation contract test**

```ts
// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('frontend/src/index.css', 'utf8');

describe('index CSS redesign contract', () => {
  it('defines the shared module foundation and approved breakpoints', () => {
    for (const selector of [
      '.module-page', '.module-header', '.module-heading', '.module-description',
      '.module-toolbar', '.module-card', '.module-card-actions', '.module-form',
      '.module-field', '.module-field-error', '.module-modal', '.module-skeleton',
      '.module-empty', '.module-filtered-empty', '.module-error',
    ]) expect(css).toContain(selector);
    expect(css).toContain('@media (max-width: 639px)');
    expect(css).toContain('@media (min-width: 640px) and (max-width: 1023px)');
    expect(css).toContain('@media (min-width: 1024px)');
    expect(css).toContain('@media (min-width: 1280px)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
```

- [ ] **Step 2: Run the contract test and verify RED**

Run: `npm test -- frontend/tests/components/IndexCssRedesignContract.test.ts`

Expected: FAIL because `.module-page` and the other foundation selectors do not exist.

- [ ] **Step 3: Add the shared Clinical Performance foundation**

Append one documented section to `frontend/src/index.css`. Use these exact contracts and extend their declarations without changing their names:

```css
/* Clinical Performance module foundation */
.module-page { display: grid; gap: 20px; color: #16324a; font-family: Montserrat, sans-serif; }
.module-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding: 22px 24px; border: 1px solid #dce8f0; border-radius: 16px; background: #fff; box-shadow: 0 8px 24px rgba(0, 59, 112, .06); }
.module-heading { margin: 0; color: var(--primary-color); font-family: Oswald, sans-serif; font-size: clamp(1.65rem, 2.5vw, 2rem); font-weight: 700; line-height: 1.08; text-transform: uppercase; text-wrap: balance; }
.module-description { max-width: 65ch; margin: 7px 0 0; color: #64748b; font-size: .875rem; line-height: 1.55; text-wrap: pretty; }
.module-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 10px; }
.module-toolbar { display: grid; gap: 14px; padding: 18px 20px; border: 1px solid #dce8f0; border-radius: 14px; background: #fff; box-shadow: 0 4px 16px rgba(0, 59, 112, .04); }
.module-card { min-width: 0; border: 1px solid #dce8f0; border-radius: 14px; background: #fff; box-shadow: 0 5px 18px rgba(0, 59, 112, .05); transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease; }
.module-card:hover { border-color: #b9dff0; box-shadow: 0 10px 28px rgba(0, 59, 112, .09); transform: translateY(-2px); }
.module-card-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: auto; }
.module-form { display: grid; gap: 18px; }
.module-field { display: grid; gap: 7px; color: #405b6f; font-size: .78rem; font-weight: 700; }
.module-field :is(input, select, textarea) { width: 100%; min-height: 44px; border: 1px solid #cbdbe5; border-radius: 10px; background: #fff; color: #16324a; }
.module-field-error { margin: 0; color: #b42318; font-size: .75rem; font-weight: 700; }
.module-field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.module-modal { width: min(720px, calc(100vw - 32px)); max-height: min(88dvh, 900px); overflow: hidden; }
.module-skeleton { border-radius: 12px; background: linear-gradient(90deg, #eef4f7 25%, #f8fbfc 50%, #eef4f7 75%); background-size: 200% 100%; animation: module-skeleton 1.4s ease infinite; }
.module-empty, .module-error { display: grid; min-height: 220px; place-items: center; gap: 8px; padding: 32px; border: 1px dashed #bfd2df; border-radius: 14px; background: #f8fbfc; text-align: center; }
.module-filtered-empty { border-color: #a8cedf; background: #f1f9fc; }
.module-error { border-color: #fecaca; background: #fff7f7; color: #991b1b; }
.module-page :is(button, a, input, select, textarea):focus-visible { outline: 3px solid rgba(0, 164, 228, .28); outline-offset: 2px; }
.module-page button:active { transform: translateY(1px); }
.module-page button:disabled, .module-page [aria-disabled="true"] { cursor: not-allowed; opacity: .58; }
@keyframes module-skeleton { to { background-position-x: -200%; } }
@media (max-width: 639px) { .module-header { align-items: stretch; padding: 18px; } .module-header, .module-actions { flex-direction: column; } .module-actions > * { width: 100%; min-height: 44px; } .module-field-grid { grid-template-columns: 1fr; } .module-modal { width: 100vw; max-height: 94dvh; border-radius: 20px 20px 0 0; } }
@media (min-width: 640px) and (max-width: 1023px) { .module-field-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .module-page { gap: 24px; } }
@media (min-width: 1280px) { .module-page { gap: 26px; } }
@media (prefers-reduced-motion: reduce) { .module-page *, .module-page *::before, .module-page *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }
```

- [ ] **Step 4: Run the focused test and typecheck**

Run: `npm test -- frontend/tests/components/IndexCssRedesignContract.test.ts`

Expected: PASS with one test.

Run: `npm run typecheck`

Expected: exit code 0.

- [ ] **Step 5: Commit the foundation**

```bash
git add frontend/src/index.css frontend/tests/components/IndexCssRedesignContract.test.ts
git commit -m "feat(ui): add clinical performance CSS foundation"
```

---

### Task 2: Exercise Library page, cards, filters, and form

**Files:**
- Modify: `frontend/tests/components/IndexCssRedesignContract.test.ts`
- Modify: `frontend/tests/components/exercises/ExerciseLibrary.test.tsx`
- Modify: `frontend/src/pages/pt/ExerciseLibraryPage.tsx`
- Modify: `frontend/src/components/exercises/ExerciseFilter.tsx`
- Modify: `frontend/src/components/exercises/ExerciseLibraryCard.tsx`
- Modify: `frontend/src/components/exercises/ExerciseFormModal.tsx`
- Modify: `frontend/src/components/exercises/ExerciseVideoFields.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: Task 1 `module-*` foundation and existing `Exercise`, `ExerciseVideo`, pagination, API, toast, and confirmation interfaces.
- Produces: `.exercise-page`, `.exercise-toolbar`, `.exercise-grid`, `.exercise-card`, `.exercise-form-section`, and zero Tailwind/static-inline styling in the listed exercise files.

- [ ] **Step 1: Add failing semantic and styling-contract assertions**

Add to `ExerciseLibrary.test.tsx` after the initial render:

```tsx
const page = await screen.findByRole('region', { name: 'Thư viện bài tập' });
expect(page).toHaveClass('module-page', 'exercise-page');
expect(within(page).getByRole('search', { name: 'Bộ lọc bài tập' })).toBeVisible();
expect(within(page).getByRole('list', { name: 'Danh sách bài tập' })).toBeVisible();
expect(within(page).getByRole('article', { name: 'Squat' })).toHaveClass('exercise-card');
```

Extend `IndexCssRedesignContract.test.ts` with:

```ts
const exerciseSources = [
  'frontend/src/pages/pt/ExerciseLibraryPage.tsx',
  'frontend/src/components/exercises/ExerciseFilter.tsx',
  'frontend/src/components/exercises/ExerciseLibraryCard.tsx',
  'frontend/src/components/exercises/ExerciseFormModal.tsx',
  'frontend/src/components/exercises/ExerciseVideoFields.tsx',
].map((path) => readFileSync(path, 'utf8')).join('\n');

it('keeps Exercise Library styling in semantic index CSS classes', () => {
  expect(exerciseSources).not.toMatch(/style=\{\{/);
  expect(exerciseSources).not.toMatch(/(?:sm:|md:|lg:|xl:|rounded-|bg-|text-slate-|border-slate-|shadow-\[|["'`\s](?:flex|grid|gap-\d+|p-\d+|px-\d+|py-\d+)(?=["'`\s]))/);
  for (const selector of ['.exercise-page', '.exercise-toolbar', '.exercise-grid', '.exercise-card', '.exercise-form-section']) expect(css).toContain(selector);
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/components/exercises/ExerciseLibrary.test.tsx`

Expected: FAIL because the page lacks named semantic regions and the files still contain Tailwind utilities.

- [ ] **Step 3: Replace exercise JSX presentation with semantic contracts**

Use this page shell and the current component props in `ExerciseLibraryPage.tsx`; leave the existing `Pagination`, `ExerciseFormModal`, and `ConfirmModal` prop blocks byte-for-byte unchanged:

```tsx
<section className="module-page exercise-page" aria-label="Thư viện bài tập">
  <header className="module-header exercise-header">
    <div><p className="exercise-eyebrow">Workout resources</p><h1 className="module-heading">Thư viện bài tập</h1><p className="module-description">Quản lý bài tập cá nhân và nội dung dùng chung trong một thư viện thống nhất.</p></div>
    <div className="module-actions"><span className="exercise-count">{meta.total ?? items.length} bài tập</span><button type="button" className="button button-primary" onClick={() => setFormExercise(null)}><Plus size={18} aria-hidden="true" /> Tạo bài tập</button></div>
  </header>
  <ExerciseFilter
    muscleGroup={muscleGroup}
    level={level}
    onMuscleGroupChange={setMuscleGroup}
    onLevelChange={setLevel}
    onFilter={() => void load()}
    onClear={() => { setMuscleGroup(''); setLevel(''); }}
  />
  {loading ? <div className="exercise-grid" aria-label="Đang tải bài tập">{Array.from({ length: 6 }, (_, index) => <div className="module-skeleton exercise-card-skeleton" key={index} />)}</div>
    : items.length ? <div className="exercise-grid" role="list" aria-label="Danh sách bài tập">{items.map((item) => <div className="exercise-grid-item" role="listitem" key={item._id}><ExerciseLibraryCard exercise={item} onEdit={setFormExercise} onDelete={setDeleteExercise} /></div>)}</div>
    : <div className={`module-empty exercise-empty ${hasFilters ? 'module-filtered-empty' : ''}`}><Dumbbell aria-hidden="true" /><h2>{hasFilters ? 'Không có bài tập phù hợp' : 'Chưa có bài tập'}</h2><p>{hasFilters ? 'Xóa bộ lọc để xem toàn bộ thư viện.' : 'Tạo bài tập đầu tiên để bắt đầu xây dựng thư viện.'}</p>{hasFilters && <button type="button" className="button button-secondary" onClick={() => { setMuscleGroup(''); setLevel(''); }}>Xóa bộ lọc</button>}</div>}
</section>
```

Define `const hasFilters = Boolean(muscleGroup || level);` next to the current derived page state. In the child components, use `module-toolbar exercise-toolbar`, `exercise-filter-*`, `<article aria-label={exercise.name} className="module-card exercise-card">`, `exercise-card-*`, `module-form exercise-form`, and `exercise-form-section` classes. Keep every current accessible name and callback. Add `role="search" aria-label="Bộ lọc bài tập"` to the filter root.

Replace the two existing utility-class assertions in `ExerciseLibrary.test.tsx` with:

```tsx
expect(card).toHaveClass('module-card', 'exercise-card');
for (const button of [editButton, deleteButton]) expect(button).toHaveClass('exercise-card-action');
```

- [ ] **Step 4: Add namespaced Exercise Library CSS**

Add a documented `.exercise-page` section to `index.css` defining:

```css
.exercise-toolbar { grid-template-columns: minmax(0, 1fr) 13rem auto auto; align-items: end; }
.exercise-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.exercise-grid-item { display: flex; min-width: 0; }
.exercise-grid-item > .exercise-card { width: 100%; }
.exercise-card { display: flex; min-height: 310px; flex-direction: column; padding: 20px; }
.exercise-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding-bottom: 16px; border-bottom: 1px solid #e6eef3; }
.exercise-card-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0; border-bottom: 1px solid #e6eef3; }
.exercise-card-actions { padding-top: 16px; border-top: 1px solid #e6eef3; }
.exercise-card-skeleton { min-height: 310px; }
.exercise-form-section { display: grid; gap: 14px; padding: 16px; border: 1px solid #e0ebf2; border-radius: 12px; background: #f8fbfc; }
@media (max-width: 639px) { .exercise-toolbar, .exercise-grid { grid-template-columns: 1fr; } .exercise-card { min-height: 0; } }
@media (min-width: 640px) and (max-width: 1023px) { .exercise-toolbar { grid-template-columns: 1fr 12rem; } .exercise-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
```

Add the remaining state rules with these contracts:

```css
.exercise-eyebrow, .workout-eyebrow { margin: 0 0 6px; color: var(--secondary-color); font-size: .7rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.exercise-count { color: #526b7e; font-size: .8rem; font-variant-numeric: tabular-nums; font-weight: 700; }
.exercise-card-title { margin: 0; color: var(--primary-color); font-family: Oswald, sans-serif; font-size: 1.2rem; line-height: 1.2; }
.exercise-badge { display: inline-flex; min-height: 28px; align-items: center; padding: 4px 9px; border-radius: 999px; background: #edf5f8; color: #31536b; font-size: .7rem; font-weight: 800; }
.exercise-badge.is-owned { background: #e0f4fb; color: #00658d; }
.exercise-badge.is-advanced { background: #fff1f2; color: #9f1239; }
.exercise-video-link { color: #006fa4; font-weight: 700; text-decoration-thickness: 1px; text-underline-offset: 3px; }
.exercise-form :is(input, select, textarea):disabled { cursor: not-allowed; background: #eef3f6; color: #8193a0; }
.exercise-upload-state { min-height: 44px; padding: 10px 12px; border: 1px dashed #b8ceda; border-radius: 10px; background: #f7fafb; color: #526b7e; }
@media (max-width: 639px) { .exercise-form-section { padding: 14px; } .exercise-form .modal-actions { position: sticky; bottom: 0; padding-bottom: max(12px, env(safe-area-inset-bottom)); background: #fff; } }
```

- [ ] **Step 5: Run focused tests and typecheck**

Run: `npm test -- frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/components/exercises/ExerciseLibrary.test.tsx`

Expected: all selected tests PASS.

Run: `npm run typecheck`

Expected: exit code 0.

- [ ] **Step 6: Commit Exercise Library**

```bash
git add frontend/src/index.css frontend/src/pages/pt/ExerciseLibraryPage.tsx frontend/src/components/exercises frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/components/exercises/ExerciseLibrary.test.tsx
git commit -m "feat(exercises): redesign library with index CSS"
```

---

### Task 3: Workout template navigation, list, and cards

**Files:**
- Modify: `frontend/tests/components/IndexCssRedesignContract.test.ts`
- Modify: `frontend/tests/components/workouts/MyWorkoutPlans.test.tsx`
- Modify: `frontend/src/components/workouts/MyWorkoutPlans.tsx`
- Modify: `frontend/src/components/workouts/WorkoutTemplateList.tsx`
- Modify: `frontend/src/components/workouts/WorkoutTemplateCard.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: existing workout-template API, URL tab state, edit/archive/delete callbacks, and Task 1 foundation.
- Produces: `.workout-page`, `.workout-tabs`, `.workout-toolbar`, `.workout-template-grid`, and `.workout-template-card` contracts.

- [ ] **Step 1: Write failing hierarchy and empty-state tests**

Add assertions to `MyWorkoutPlans.test.tsx`:

```tsx
const page = await screen.findByRole('region', { name: 'Quản lý giáo án' });
expect(page).toHaveClass('module-page', 'workout-page');
expect(within(page).getByRole('tablist', { name: 'Không gian giáo án' })).toBeVisible();
expect(within(page).getByRole('button', { name: 'Tạo giáo án' })).toHaveClass('button-primary');
expect(within(page).getByRole('button', { name: 'Tạo bằng AI' })).toHaveClass('button-secondary');
```

Extend the CSS contract test with the three workout files and assert no static inline style or Tailwind presentation utilities, plus the presence of `.workout-page`, `.workout-toolbar`, `.workout-template-grid`, and `.workout-template-card` in `index.css`.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/components/workouts/MyWorkoutPlans.test.tsx`

Expected: FAIL on the missing semantic page/tablist and forbidden Tailwind utilities.

- [ ] **Step 3: Refactor the workout list presentation**

Keep URL tab behavior unchanged and use this exact hierarchy around the existing state and imports:

```tsx
<section className="module-page workout-page" aria-label="Quản lý giáo án">
  <header className="module-header workout-header">
    <div><p className="workout-eyebrow">Programming workspace</p><h1 className="module-heading">Giáo án của tôi</h1><p className="module-description">Xây dựng, quản lý và triển khai giáo án cho từng mục tiêu tập luyện.</p></div>
    <div className="module-actions"><button type="button" className="button button-secondary" onClick={() => setAiOpen(true)}>Tạo bằng AI</button><button type="button" className="button button-primary" onClick={openCreate}>Tạo giáo án</button></div>
  </header>
  <div className="workout-tabs" role="tablist" aria-label="Không gian giáo án">
    <button id="workout-tab-plans" type="button" role="tab" aria-selected={activeTab === 'plans'} aria-controls="workout-panel-plans" className={activeTab === 'plans' ? 'is-active' : ''} onClick={() => selectTab('plans')}><BookOpen size={14} aria-hidden="true" /> Giáo án của tôi</button>
    <button id="workout-tab-exercises" type="button" role="tab" aria-selected={activeTab === 'exercises'} aria-controls="workout-panel-exercises" className={activeTab === 'exercises' ? 'is-active' : ''} onClick={() => selectTab('exercises')}><Dumbbell size={14} aria-hidden="true" /> Thư viện bài tập</button>
  </div>
  {activeTab === 'plans' ? <div id="workout-panel-plans" role="tabpanel" aria-labelledby="workout-tab-plans"><WorkoutTemplateList refreshKey={refreshKey} onEdit={(template) => navigate(`/pt/my-workout-plans/${template._id}/edit`)} /><AiWorkoutWizard open={aiOpen} customers={customers} onClose={() => setAiOpen(false)} onGenerated={(draft) => navigate('/pt/my-workout-plans/new', { state: { aiWorkoutDraft: draft } })} /></div> : <div id="workout-panel-exercises" role="tabpanel" aria-labelledby="workout-tab-exercises"><ExerciseLibraryPage /></div>}
</section>
```

Use `module-toolbar workout-toolbar`, `workout-template-grid`, `module-card workout-template-card`, `workout-template-status is-*`, and `module-card-actions workout-template-actions` in the list/card components. Preserve every current API query and action callback.

Replace the existing card utility-class assertion in `MyWorkoutPlans.test.tsx` with:

```tsx
expect(card).toHaveClass('module-card', 'workout-template-card');
```

- [ ] **Step 4: Add workout list CSS**

Add namespaced rules:

```css
.workout-tabs { display: flex; gap: 6px; padding: 5px; border: 1px solid #dce8f0; border-radius: 12px; background: #edf5f8; overflow-x: auto; }
.workout-tabs [role="tab"] { min-height: 42px; padding: 9px 14px; border: 0; border-radius: 9px; background: transparent; color: #526b7e; font-weight: 700; white-space: nowrap; }
.workout-tabs [role="tab"][aria-selected="true"] { background: #fff; color: var(--primary-color); box-shadow: 0 2px 8px rgba(0, 59, 112, .1); }
.workout-toolbar { grid-template-columns: minmax(0, 1fr) 13rem auto; align-items: end; }
.workout-template-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.workout-template-card { display: flex; min-height: 300px; flex-direction: column; padding: 20px; }
.workout-template-actions { padding-top: 16px; border-top: 1px solid #e5edf2; }
@media (max-width: 639px) { .workout-toolbar, .workout-template-grid { grid-template-columns: 1fr; } .workout-template-card { min-height: 0; } }
@media (min-width: 640px) and (max-width: 1023px) { .workout-template-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
```

Add the status, metric, loading, and action states with these contracts:

```css
.workout-template-status { display: inline-flex; min-height: 28px; align-items: center; padding: 4px 9px; border-radius: 999px; background: #edf5f8; color: #31536b; font-size: .7rem; font-weight: 800; }
.workout-template-status.is-active { background: #dcfce7; color: #166534; }
.workout-template-status.is-draft { background: #fff7d6; color: #854d0e; }
.workout-template-status.is-archived { background: #edf1f4; color: #5d6f7c; }
.workout-template-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; margin: 16px 0; background: #e5edf2; }
.workout-template-metrics > * { padding: 12px; background: #f8fbfc; font-variant-numeric: tabular-nums; }
.workout-template-skeleton { min-height: 300px; }
.workout-template-actions .button { min-height: 40px; }
.workout-page .module-empty[data-filtered="true"] { border-color: #c7dce7; background: #f5fafc; }
```

- [ ] **Step 5: Run workout tests and commit**

Run: `npm test -- frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/components/workouts/MyWorkoutPlans.test.tsx`

Expected: all selected tests PASS.

Run: `npm run typecheck`

Expected: exit code 0.

```bash
git add frontend/src/index.css frontend/src/components/workouts/MyWorkoutPlans.tsx frontend/src/components/workouts/WorkoutTemplateList.tsx frontend/src/components/workouts/WorkoutTemplateCard.tsx frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/components/workouts/MyWorkoutPlans.test.tsx
git commit -m "feat(workouts): redesign template library with index CSS"
```

---

### Task 4: Customer-plan surfaces and AI wizard

**Files:**
- Modify: `frontend/tests/components/IndexCssRedesignContract.test.ts`
- Modify: `frontend/tests/components/workouts/AiWorkoutWizard.test.tsx`
- Modify: `frontend/tests/components/workouts/CustomerWorkoutPlans.test.tsx`
- Modify: `frontend/tests/components/workouts/CustomerWorkoutPlanModal.test.tsx`
- Modify: `frontend/tests/components/workouts/CustomerWorkoutPlanPanel.test.tsx`
- Modify: `frontend/src/components/workouts/AiWorkoutWizard.tsx`
- Modify: `frontend/src/components/workouts/CustomerWorkoutPlans.tsx`
- Modify: `frontend/src/components/workouts/CustomerWorkoutPlanModal.tsx`
- Modify: `frontend/src/components/workouts/CustomerWorkoutPlanPanel.tsx`
- Modify: `frontend/src/components/ui/ContentFormModal.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: current customer-plan draft, proposal, generation, API, FormModal, and toast contracts.
- Produces: a four-step `.workout-ai-wizard` presentation and semantic `.workout-customer-plan-*` surfaces without changing requests or saved payloads.

- [ ] **Step 1: Write failing wizard and recovery assertions**

Extend `AiWorkoutWizard.test.tsx`:

```tsx
expect(screen.getByRole('dialog', { name: 'Tạo giáo án bằng AI' })).toHaveClass('workout-ai-wizard');
expect(screen.getByRole('list', { name: 'Tiến trình tạo giáo án' })).toBeVisible();
expect(screen.getByText('Chọn học viên')).toHaveAttribute('aria-current', 'step');
```

After mocking a rejected proposal request, assert:

```tsx
expect(screen.getByRole('alert')).toHaveTextContent('Không thể phân tích');
expect(screen.getByLabelText('Học viên')).toHaveValue('customer-1');
```

Add to `CustomerWorkoutPlans.test.tsx` after the module loads:

```tsx
expect(screen.getByRole('region', { name: 'Giáo án khách hàng' })).toHaveClass('module-page', 'workout-customer-plans');
```

Add to `CustomerWorkoutPlanModal.test.tsx` after opening the form:

```tsx
expect(screen.getByRole('dialog', { name: 'Tạo giáo án' })).toHaveClass('module-modal', 'workout-customer-plan-form');
```

Extend the index CSS contract scan to `AiWorkoutWizard.tsx`, `CustomerWorkoutPlans.tsx`, `CustomerWorkoutPlanModal.tsx`, and `CustomerWorkoutPlanPanel.tsx`; assert that none contains a static inline style or Tailwind presentation utility. Require `.workout-ai-wizard`, `.workout-wizard-progress`, `.workout-customer-plans`, `.workout-customer-plan-card`, and `.workout-customer-plan-form` selectors in `index.css`.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/components/workouts/AiWorkoutWizard.test.tsx frontend/tests/components/workouts/CustomerWorkoutPlans.test.tsx frontend/tests/components/workouts/CustomerWorkoutPlanModal.test.tsx frontend/tests/components/workouts/CustomerWorkoutPlanPanel.test.tsx`

Expected: FAIL because the wizard lacks the progress landmark and semantic classes.

- [ ] **Step 3: Implement the semantic wizard and customer-plan presentation**

Keep the current two backend requests and draft handoff. Render an explicit four-step indicator:

```tsx
const step = loading && proposal ? 3 : proposal ? 2 : customerId ? 1 : 0;

<ol className="workout-wizard-progress" aria-label="Tiến trình tạo giáo án">
  {['Chọn học viên', 'Duyệt phân tích', 'Cấu hình', 'Tạo giáo án'].map((label, index) => <li key={label} className={index < step ? 'is-complete' : index === step ? 'is-active' : ''} aria-current={index === step ? 'step' : undefined}><span>{index + 1}</span>{label}</li>)}
</ol>
```

Use `module-modal workout-ai-wizard`, `module-form workout-wizard-form`, `workout-wizard-summary`, `module-error` with `role="alert"`, and `module-actions workout-wizard-actions`. Do not reset customer, proposal, or constraints on request failure. Use `workout-customer-plan-card`, `workout-customer-plan-form`, and existing generic field/button contracts in customer plan components.

Replace the `CustomerWorkoutPlans.tsx` shell with:

```tsx
<section className="module-page workout-customer-plans" aria-label="Giáo án khách hàng">
  <header className="module-header workout-customer-plan-header">
    <div><p className="workout-eyebrow">Client programming</p><h1 className="module-heading">Giáo án khách hàng</h1><p className="module-description">Cá nhân hóa và công bố kế hoạch tập cho từng khách hàng.</p></div>
  </header>
  <CustomerWorkoutPlanPanel initialDraft={draft} />
</section>
```

In `CustomerWorkoutPlanPanel.tsx`, replace the root with `module-card workout-customer-plan-card`, the filter bar with `module-toolbar workout-customer-plan-toolbar`, the customer cell wrappers with `workout-customer-identity` and `workout-customer-phone`, and remove every static `style` prop. Add optional `className?: string` to `ContentFormModalProps`, default it to `''`, and pass it unchanged to the existing `FormModal`. Then render the customer modal as `<ContentFormModal className="module-modal workout-customer-plan-form" open={open} resource="workout-plans" item={(item || initialDraft) as ContentItem | null} onClose={onClose} onSaved={onSaved} />`. Other resources omit the optional prop and retain their current behavior.

Give the customer-plan list an explicit load state separate from the existing confirmation `loading` state:

```tsx
const [listLoading, setListLoading] = useState(true);
const hasFilters = Boolean(customerId || status);
// At the start of load(): setListLoading(true). In its finally: setListLoading(false).

{listLoading ? <div className="module-skeleton workout-customer-plan-skeleton" aria-label="Đang tải giáo án khách hàng" />
  : items.length ? <DataList items={items} columns={columns} renderActions={renderActions} />
  : <div className={`module-empty ${hasFilters ? 'module-filtered-empty' : ''}`}><h3>{hasFilters ? 'Không có giáo án phù hợp' : 'Chưa có giáo án khách hàng'}</h3><p>{hasFilters ? 'Xóa bộ lọc để xem toàn bộ giáo án.' : 'Tạo bản nháp đầu tiên cho một học viên.'}</p></div>}
```

Extract the current inline `renderActions` callback to a same-scope constant so it can be passed unchanged in the conditional above. Do not alter the action labels or callbacks.

- [ ] **Step 4: Add wizard and customer-plan CSS**

Add these wizard and customer-plan rules, then extend the same roots for existing summary field labels without renaming them:

```css
.workout-ai-wizard { width: min(780px, calc(100vw - 32px)); max-height: min(90dvh, 920px); overflow-y: auto; }
.workout-wizard-progress { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 0; padding: 0; list-style: none; }
.workout-wizard-progress li { display: grid; grid-template-columns: 28px minmax(0, 1fr); align-items: center; gap: 8px; min-width: 132px; color: #718391; font-size: .76rem; font-weight: 700; }
.workout-wizard-progress li > span { display: grid; width: 28px; height: 28px; place-items: center; border: 1px solid #c8d9e3; border-radius: 50%; background: #fff; font-variant-numeric: tabular-nums; }
.workout-wizard-progress .is-active { color: var(--primary-color); }
.workout-wizard-progress .is-active > span, .workout-wizard-progress .is-complete > span { border-color: var(--secondary-color); background: var(--secondary-color); color: #fff; }
.workout-wizard-summary, .workout-customer-plan-form { display: grid; gap: 14px; padding: 16px; border: 1px solid #dce8f0; border-radius: 12px; background: #f8fbfc; }
.workout-customer-plan-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.workout-customer-plan-card { padding: 18px; }
.workout-customer-plan-skeleton { min-height: 260px; }
.workout-customer-plan-toolbar { grid-template-columns: minmax(17.5rem, 1fr) 13rem auto; align-items: end; }
.workout-customer-identity { display: grid; gap: 2px; }
.workout-customer-identity strong { color: #16324a; font-size: .88rem; font-weight: 700; }
.workout-customer-phone { display: inline-flex; align-items: center; gap: 4px; color: #64748b; font-size: .76rem; }
.workout-customer-phone svg { color: #0284c7; }
.workout-wizard-actions .button:disabled { cursor: wait; opacity: .62; }
@media (max-width: 639px) { .workout-ai-wizard { width: 100vw; max-height: 94dvh; border-radius: 20px 20px 0 0; } .workout-wizard-progress { display: flex; overflow-x: auto; padding-bottom: 6px; } .workout-customer-plan-grid, .workout-customer-plan-toolbar { grid-template-columns: 1fr; } }
```

- [ ] **Step 5: Verify and commit**

Run: `npm test -- frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/components/workouts/AiWorkoutWizard.test.tsx frontend/tests/components/workouts/CustomerWorkoutPlans.test.tsx frontend/tests/components/workouts/CustomerWorkoutPlanModal.test.tsx frontend/tests/components/workouts/CustomerWorkoutPlanPanel.test.tsx`

Expected: all selected tests PASS.

Run: `npm run typecheck`

Expected: exit code 0.

```bash
git add frontend/src/index.css frontend/src/components/workouts/AiWorkoutWizard.tsx frontend/src/components/workouts/CustomerWorkoutPlans.tsx frontend/src/components/workouts/CustomerWorkoutPlanModal.tsx frontend/src/components/workouts/CustomerWorkoutPlanPanel.tsx frontend/src/components/ui/ContentFormModal.tsx frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/components/workouts/AiWorkoutWizard.test.tsx frontend/tests/components/workouts/CustomerWorkoutPlans.test.tsx frontend/tests/components/workouts/CustomerWorkoutPlanModal.test.tsx frontend/tests/components/workouts/CustomerWorkoutPlanPanel.test.tsx
git commit -m "feat(workouts): redesign AI and customer plan flows"
```

---

### Task 5: Studio shell and responsive workspace views

**Files:**
- Modify: `frontend/tests/components/IndexCssRedesignContract.test.ts`
- Modify: `frontend/tests/pages/WorkoutStudioPage.test.tsx`
- Modify: `frontend/src/pages/pt/WorkoutStudioPage.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: current Studio page state, active week/day, selected exercise, inspector state, navigation guards, and child component props.
- Produces: `StudioView = 'schedule' | 'library' | 'inspector'`, a responsive view tablist, and `.studio-workspace` shell without changing saved payloads.

- [ ] **Step 1: Write failing mobile/tablet view-state tests**

Add to `WorkoutStudioPage.test.tsx`:

```tsx
expect(await screen.findByRole('region', { name: 'Workout Studio' })).toHaveClass('module-page', 'workout-studio');
const views = screen.getByRole('tablist', { name: 'Khu vực thiết kế giáo án' });
expect(within(views).getByRole('tab', { name: 'Lịch tập' })).toHaveAttribute('aria-selected', 'true');
await user.click(within(views).getByRole('tab', { name: 'Bài tập' }));
expect(screen.getByRole('region', { name: 'Thư viện bài tập Studio' })).toHaveClass('is-mobile-active');
await user.click(within(views).getByRole('tab', { name: 'Thuộc tính' }));
expect(screen.getByRole('region', { name: 'Thuộc tính giáo án' })).toHaveClass('is-mobile-active');
```

Extend the contract scan to `WorkoutStudioPage.tsx` and require `.studio-view-tabs`, `.studio-workspace`, `.studio-library-region`, `.studio-schedule-region`, and `.studio-inspector-region`.

- [ ] **Step 2: Run the Studio page test and verify RED**

Run: `npm test -- frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/pages/WorkoutStudioPage.test.tsx`

Expected: FAIL because the responsive tablist and named regions do not exist.

- [ ] **Step 3: Add responsive view state without changing domain state**

Add:

```tsx
type StudioView = 'schedule' | 'library' | 'inspector';
const [studioView, setStudioView] = useState<StudioView>('schedule');
```

Render:

```tsx
<div className="studio-view-tabs" role="tablist" aria-label="Khu vực thiết kế giáo án">
  {([['schedule', 'Lịch tập'], ['library', 'Bài tập'], ['inspector', 'Thuộc tính']] as const).map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={studioView === value} onClick={() => setStudioView(value)}>{label}</button>)}
</div>
<div className="studio-workspace">
  <section className={`studio-library-region ${studioView === 'library' ? 'is-mobile-active' : ''}`} aria-label="Thư viện bài tập Studio"><ExercisePalette exercises={filteredLibrary} recommendations={recommendedExercises} unscheduled={unscheduled} query={exerciseQuery} muscleGroup={muscleGroup} level={exerciseLevel} muscleGroups={muscleGroups} onQueryChange={setExerciseQuery} onMuscleGroupChange={setMuscleGroup} onLevelChange={setExerciseLevel} onPlace={(exercise) => { place(exercise, 480); setStudioView('schedule'); }} onPlaceUnscheduled={(item) => { placeUnscheduled(item); setStudioView('schedule'); }} /></section>
  <section className={`studio-schedule-region ${studioView === 'schedule' ? 'is-mobile-active' : ''}`} aria-label="Lịch tập"><DayTimeline wrapperRef={timelineWrapRef} activeDay={activeDay} items={dayItems} selectedId={selectedId} preview={movePreview} onDrop={drop} onMoveStart={beginMove} onResizeStart={beginResize} onKeyboardMove={moveScheduled} onSelect={(id) => { setSelectedId(id); setInspectorOpen(true); setStudioView('inspector'); }} /></section>
  <section className={`studio-inspector-region ${studioView === 'inspector' ? 'is-mobile-active' : ''}`} aria-label="Thuộc tính giáo án"><StudioSidebar activeTab={sidebarTab} metadata={metadata} muscleGroupOptions={metadataMuscleGroups} readOnly={readOnly} selected={selected} days={dayButtons} onTabChange={setSidebarTab} onMetadataChange={(value) => { setMetadata(value); setDirty(true); }} onExerciseUpdate={updateSelected} onUnscheduled={() => { if (!selected) return; mutate(items.filter((item) => item.id !== selected.id)); setUnscheduled((current) => [...current, selected]); setSelectedId(undefined); setSidebarTab('template'); }} /></section>
</div>
```

When an exercise is placed, call `setStudioView('schedule')` in the existing placement handler. When a scheduled item is selected, keep `setSelectedId(id)` and `setInspectorOpen(true)`, then call `setStudioView('inspector')`. The view tabs are hidden on desktop, so these state transitions are harmless there; do not clear selection when switching tabs.

- [ ] **Step 4: Add responsive Studio shell CSS**

Use this responsive shell:

```css
.workout-studio { display: grid; gap: 16px; min-width: 0; }
.studio-view-tabs { display: flex; gap: 4px; padding: 4px; border: 1px solid #dce8f0; border-radius: 12px; background: #edf5f8; }
.studio-view-tabs [role="tab"] { min-height: 44px; flex: 1; border: 0; border-radius: 9px; background: transparent; color: #526b7e; font-weight: 800; }
.studio-view-tabs [aria-selected="true"] { background: #fff; color: var(--primary-color); box-shadow: 0 2px 8px rgba(0, 59, 112, .1); }
.studio-workspace { display: grid; min-width: 0; gap: 14px; }
.studio-library-region, .studio-schedule-region, .studio-inspector-region { min-width: 0; border: 1px solid #dce8f0; border-radius: 14px; background: #fff; }
@media (max-width: 639px) { .studio-workspace > section { display: none; } .studio-workspace > .is-mobile-active { display: block; } }
@media (min-width: 640px) and (max-width: 1023px) { .studio-view-tabs { margin-left: auto; width: min(100%, 430px); } .studio-workspace { grid-template-columns: minmax(0, 1fr); } .studio-library-region, .studio-inspector-region { display: none; position: fixed; z-index: 40; inset: 84px 0 0 auto; width: min(390px, 88vw); padding-bottom: env(safe-area-inset-bottom); overflow-y: auto; box-shadow: -18px 0 42px rgba(0, 34, 66, .18); } .studio-workspace > .is-mobile-active:not(.studio-schedule-region) { display: block; } }
@media (min-width: 1024px) { .studio-view-tabs { display: none; } .studio-workspace { grid-template-columns: 18rem minmax(0, 1fr) 19rem; align-items: start; } }
@media (min-width: 1280px) { .studio-workspace { grid-template-columns: 18rem minmax(0, 1fr) 20rem; } }
```

- [ ] **Step 5: Verify and commit**

Run: `npm test -- frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/pages/WorkoutStudioPage.test.tsx`

Expected: all selected tests PASS, including the nine existing Studio behavior tests.

Run: `npm run typecheck`

Expected: exit code 0.

```bash
git add frontend/src/index.css frontend/src/pages/pt/WorkoutStudioPage.tsx frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/pages/WorkoutStudioPage.test.tsx
git commit -m "feat(studio): add responsive workspace shell"
```

---

### Task 6: Studio header, metadata, navigation, and palette

**Files:**
- Modify: `frontend/tests/components/IndexCssRedesignContract.test.ts`
- Modify: `frontend/tests/components/workout-studio/StudioHeader.test.tsx`
- Modify: `frontend/tests/pages/WorkoutStudioPage.test.tsx`
- Modify: `frontend/src/components/workout-studio/StudioHeader.tsx`
- Modify: `frontend/src/components/workout-studio/TemplateMetadataForm.tsx`
- Modify: `frontend/src/components/workout-studio/StudioDayNavigator.tsx`
- Modify: `frontend/src/components/workout-studio/ExercisePalette.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: current header, metadata, week/day, recommendation, filter, placement, and unscheduled callbacks.
- Produces: `.studio-header`, `.studio-save-state`, `.studio-metadata`, `.studio-period-navigation`, `.studio-palette`, and `.studio-exercise-option` contracts.

- [ ] **Step 1: Add failing semantic tests**

Extend `StudioHeader.test.tsx`:

```tsx
expect(screen.getByRole('banner', { name: 'Thông tin giáo án' })).toHaveClass('studio-header');
expect(screen.getByRole('status')).toHaveClass('studio-save-state', 'is-saved');
expect(screen.getByRole('group', { name: 'Thông tin cơ bản' })).toHaveClass('studio-header-fields');
```

In the Studio page test, assert the palette exposes `role="search" aria-label="Tìm bài tập trong Studio"` and the week/day controls are within `role="navigation" aria-label="Thời gian giáo án"`.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/components/workout-studio/StudioHeader.test.tsx frontend/tests/pages/WorkoutStudioPage.test.tsx`

Expected: FAIL on missing banner/status/group/search/navigation semantics and Tailwind utilities.

- [ ] **Step 3: Replace presentation classes and add landmarks**

Use semantic class families only and preserve all current props. Replace the two current header wrappers with these exact landmarks; keep the current buttons, labels, inputs, and handlers inside their corresponding wrapper:

```tsx
<header className="studio-header" role="banner" aria-label="Thông tin giáo án">
  <div className="studio-header-command">
    <button type="button" aria-label="Về danh sách giáo án" className="studio-back-button" onClick={props.onBack}><ArrowLeft size={16} aria-hidden="true" /> Danh sách</button>
    <div className="studio-header-title"><p>Workout Studio</p><h1>Thiết kế giáo án</h1></div>
    <span role="status" aria-live="polite" className={`studio-save-state ${props.dirty ? 'is-dirty' : 'is-saved'}`}><CheckCircle2 size={14} aria-hidden="true" />{props.dirty ? 'Chưa lưu' : 'Đã lưu'}</span>
    <button type="button" className="button button-primary" disabled={props.saving || props.readOnly} onClick={props.onSave}><Save size={17} aria-hidden="true" /> {props.saving ? 'Đang lưu...' : 'Lưu giáo án'}</button>
  </div>
  <div className="studio-header-fields" role="group" aria-label="Thông tin cơ bản">
    <label><span data-field-title>Tên giáo án</span><input aria-label="Tên giáo án" placeholder="Ví dụ: Tăng cơ nền tảng 8 tuần" value={props.title} disabled={props.readOnly} onChange={(event) => props.onTitleChange(event.target.value)} /></label>
    <label><span data-field-title>Mục tiêu</span><input aria-label="Mục tiêu" placeholder="Ví dụ: Tăng cơ và cải thiện sức mạnh" value={props.goal} disabled={props.readOnly} onChange={(event) => props.onGoalChange(event.target.value)} /></label>
    <label><span data-field-title>Cấp độ</span><select aria-label="Cấp độ giáo án" value={props.level} disabled={props.readOnly} onChange={(event) => props.onLevelChange(event.target.value)}><option value="BEGINNER">Cơ bản</option><option value="INTERMEDIATE">Trung cấp</option><option value="ADVANCED">Nâng cao</option></select></label>
    <label><span data-field-title>Số ngày</span><input aria-label="Số ngày giáo án" type="number" min="1" max="365" placeholder="Ví dụ: 7" value={props.durationDays} disabled={props.readOnly} onChange={(event) => props.onDurationDaysChange(Number(event.target.value))} /></label>
  </div>
</header>
```

Use `studio-metadata`, `studio-metadata-grid`, `studio-period-navigation`, `studio-week-list`, `studio-day-list`, `studio-palette`, `studio-palette-search`, `studio-palette-filters`, `studio-exercise-list`, and `studio-exercise-option`. Keep every current filter and placement callback.

- [ ] **Step 4: Add namespaced CSS**

Add the following layout/state contracts; keep recommendation and empty-result copy inside `.studio-palette-section` and `.module-empty` respectively:

```css
.studio-header { display: grid; gap: 14px; padding: 18px 20px; border: 1px solid #dce8f0; border-radius: 14px; background: #fff; box-shadow: 0 8px 24px rgba(0, 59, 112, .06); }
.studio-header-command { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; gap: 12px; }
.studio-header-title p { margin: 0; color: var(--secondary-color); font-size: .68rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.studio-header-title h1 { margin: 2px 0 0; color: var(--primary-color); font-family: Oswald, sans-serif; font-size: 1.35rem; text-transform: uppercase; }
.studio-header-fields, .studio-metadata-grid { display: grid; grid-template-columns: 2fr 2fr 1fr 1fr; gap: 10px; }
.studio-header-fields label, .studio-metadata-grid label { display: grid; gap: 6px; color: #526b7e; font-size: .72rem; font-weight: 800; }
.studio-save-state { display: inline-flex; min-height: 34px; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; font-size: .72rem; font-variant-numeric: tabular-nums; font-weight: 800; }
.studio-save-state.is-saved { background: #dcfce7; color: #166534; }
.studio-save-state.is-dirty { background: #fff7d6; color: #854d0e; }
.studio-period-navigation { display: grid; gap: 10px; padding: 12px; border-bottom: 1px solid #e3edf3; }
.studio-week-list, .studio-day-list { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: thin; }
.studio-week-list button, .studio-day-list button { min-width: 44px; min-height: 44px; flex: 0 0 auto; border: 1px solid #d7e5ed; border-radius: 9px; background: #fff; color: #526b7e; font-weight: 800; }
.studio-week-list button[aria-current="true"], .studio-day-list button[aria-current="true"] { border-color: var(--secondary-color); background: #e6f7fd; color: var(--primary-color); }
.studio-palette { display: grid; gap: 12px; padding: 14px; }
.studio-palette-search, .studio-palette-filters { display: grid; gap: 8px; }
.studio-palette-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.studio-exercise-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.studio-exercise-option { display: grid; width: 100%; min-height: 44px; gap: 4px; padding: 10px 12px; border: 1px solid #dce8f0; border-radius: 10px; background: #fff; color: #16324a; text-align: left; }
.studio-exercise-option:hover { border-color: #8dcce5; background: #f1faff; }
.studio-exercise-option:active { transform: translateY(1px); }
@media (max-width: 639px) { .studio-header-command { grid-template-columns: auto minmax(0, 1fr); } .studio-header-command > .studio-save-state, .studio-header-command > .button { grid-column: span 1; } .studio-header-fields, .studio-metadata-grid, .studio-palette-filters { grid-template-columns: 1fr; } }
@media (min-width: 1024px) { .studio-header { position: sticky; z-index: 20; top: 12px; } .studio-palette { position: sticky; top: 12px; max-height: calc(100dvh - 24px); overflow-y: auto; } }
```

- [ ] **Step 5: Verify and commit**

Run: `npm test -- frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/components/workout-studio/StudioHeader.test.tsx frontend/tests/pages/WorkoutStudioPage.test.tsx`

Expected: all selected tests PASS.

Run: `npm run typecheck`

Expected: exit code 0.

```bash
git add frontend/src/index.css frontend/src/components/workout-studio/StudioHeader.tsx frontend/src/components/workout-studio/TemplateMetadataForm.tsx frontend/src/components/workout-studio/StudioDayNavigator.tsx frontend/src/components/workout-studio/ExercisePalette.tsx frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/components/workout-studio/StudioHeader.test.tsx frontend/tests/pages/WorkoutStudioPage.test.tsx
git commit -m "feat(studio): redesign header navigation and palette"
```

---

### Task 7: Timeline, unscheduled exercises, and inspector

**Files:**
- Modify: `frontend/tests/components/IndexCssRedesignContract.test.ts`
- Modify: `frontend/tests/pages/WorkoutStudioPage.test.tsx`
- Modify: `frontend/src/components/workout-studio/DayTimeline.tsx`
- Modify: `frontend/src/components/workout-studio/ExerciseInspector.tsx`
- Modify: `frontend/src/components/workout-studio/StudioSidebar.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: current `ScheduledExercise`, `MovePreview`, pointer/keyboard move, resize, update, unschedule, metadata, and selected-item contracts.
- Produces: typed `StudioPositionStyle`, data-only CSS variables, and semantic timeline/inspector classes with no Tailwind/static inline presentation.

- [ ] **Step 1: Write the failing CSS-variable and inspector tests**

Extend `IndexCssRedesignContract.test.ts`:

```ts
const timeline = readFileSync('frontend/src/components/workout-studio/DayTimeline.tsx', 'utf8');
expect(timeline).toContain("'--studio-item-top'");
expect(timeline).toContain("'--studio-item-height'");
expect(timeline).not.toContain('style={{ top:');
expect(timeline).not.toMatch(/style=\{\{\s*(?:top|height|background|color|padding)/);
expect(timeline).not.toMatch(/(?:rounded-|bg-|text-slate-|border-slate-|shadow-\[|sm:|md:|lg:|xl:)/);
```

Add to the Studio page test after selecting an exercise:

```tsx
expect(screen.getByRole('complementary', { name: 'Thuộc tính bài tập đã chọn' })).toHaveClass('studio-inspector');
expect(screen.getByRole('button', { name: 'Bỏ khỏi lịch' })).toHaveClass('studio-inspector-danger');
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/pages/WorkoutStudioPage.test.tsx`

Expected: FAIL because timeline uses direct `top`/`height` inline properties and inspector Tailwind classes.

- [ ] **Step 3: Introduce the typed data-only style contract**

In `DayTimeline.tsx`:

```tsx
import type { CSSProperties } from 'react';
type StudioPositionStyle = CSSProperties & { '--studio-item-top': string; '--studio-item-height': string };
const positionStyle = (startMinute: number, durationMinutes: number): StudioPositionStyle => ({
  '--studio-item-top': `${startMinute}px`,
  '--studio-item-height': `${durationMinutes}px`,
});
```

Apply `style={positionStyle(displayStart, item.durationMinutes)}` only to the scheduled card; its `is-preview` modifier reuses that same typed style during preview. Replace the hour loop that currently uses `style={{ top: ... }}` with `<div className="studio-hour-grid" aria-hidden="true">{hours.map((hour) => <div className="studio-hour" key={hour}><span>{String(hour).padStart(2, '0')}:00</span></div>)}</div>`. Replace presentation utilities with `studio-timeline`, `studio-hour-grid`, `studio-hour`, `studio-scheduled-item`, `is-selected`, `is-preview`, and `studio-resize-handle`.

Render `ExerciseInspector` as:

```tsx
<aside className="studio-inspector" aria-label="Thuộc tính bài tập đã chọn">
  <header className="studio-inspector-header"><h2>Lịch bài tập</h2><strong title={selected.name}>{selected.name}</strong></header>
  <div className="studio-inspector-fields">
    <label>Ngày<select aria-label="Ngày của bài tập" value={selected.dayNumber} onChange={(event) => onUpdate({ dayNumber: Number(event.target.value) })}>{days.map((day) => <option key={day} value={day}>Ngày {day}</option>)}</select></label>
    <label>Giờ bắt đầu<input aria-label="Giờ bắt đầu" placeholder="Ví dụ: 08:00" type="time" step="900" value={formatMinute(selected.startMinute)} onChange={(event) => { const [hour, minute] = event.target.value.split(':').map(Number); onUpdate({ startMinute: snapMinute(hour * 60 + minute) }); }} /></label>
  </div>
  <div className="studio-inspector-duration"><button type="button" aria-label="Giảm thời lượng 15 phút" disabled={selected.durationMinutes <= SLOT_MINUTES} onClick={() => onUpdate({ durationMinutes: selected.durationMinutes - SLOT_MINUTES })}>−</button><input aria-label="Thời lượng bài tập" placeholder="Ví dụ: 60 phút" type="number" min="15" max="1440" step="15" value={selected.durationMinutes} onChange={(event) => onUpdate({ durationMinutes: Number(event.target.value) })} /><button type="button" aria-label="Tăng thời lượng 15 phút" disabled={selected.startMinute + selected.durationMinutes >= DAY_MINUTES} onClick={() => onUpdate({ durationMinutes: selected.durationMinutes + SLOT_MINUTES })}>+</button></div>
  <button type="button" className="studio-inspector-danger" onClick={onUnscheduled}>Bỏ khỏi lịch</button>
</aside>
```

Keep the current `selected ? ... : ...` branch. The `aside` above is the selected branch; the empty branch remains a `p` with class `studio-inspector-empty` and copy `Chọn một thẻ trên timeline để chỉnh lịch.`

Use `studio-sidebar`, `studio-sidebar-tabs`, `studio-unscheduled`, and `studio-unscheduled-item` for metadata/inspector switching and the unscheduled tray. Preserve all callbacks and values.

- [ ] **Step 4: Add timeline and inspector CSS**

Use the variables in CSS:

```css
.studio-scheduled-item { position: absolute; top: var(--studio-item-top); height: var(--studio-item-height); left: 10px; right: 10px; }
.studio-scheduled-item.is-selected { border-color: var(--secondary-color); box-shadow: 0 0 0 3px rgba(0, 164, 228, .18), 0 10px 22px rgba(0, 59, 112, .12); }
.studio-scheduled-item.is-preview { opacity: .62; pointer-events: none; }
```

Complete the timeline and inspector with these exact base/state rules:

```css
.studio-timeline { position: relative; min-width: 520px; min-height: 1440px; background: #f8fbfc; }
.studio-hour-grid { position: absolute; inset: 0; display: grid; grid-template-rows: repeat(24, 60px); pointer-events: none; }
.studio-hour { position: relative; border-top: 1px solid #dbe7ee; color: #718391; font-size: .68rem; font-variant-numeric: tabular-nums; }
.studio-hour span { position: absolute; top: 0; left: 8px; width: 50px; text-align: right; transform: translateY(-50%); }
.studio-scheduled-item { position: absolute; top: var(--studio-item-top); height: var(--studio-item-height); left: 68px; right: 10px; min-height: 44px; overflow: hidden; border: 1px solid #86c7df; border-left: 4px solid var(--secondary-color); border-radius: 10px; background: #effaff; color: #16324a; box-shadow: 0 5px 16px rgba(0, 59, 112, .08); }
.studio-scheduled-item.is-selected { border-color: var(--secondary-color); box-shadow: 0 0 0 3px rgba(0, 164, 228, .18), 0 10px 22px rgba(0, 59, 112, .12); }
.studio-scheduled-item.is-preview { opacity: .62; pointer-events: none; }
.studio-resize-handle { position: absolute; right: 0; bottom: 0; left: 0; min-height: 12px; cursor: ns-resize; }
.studio-resize-handle::after { position: absolute; right: 12px; bottom: 4px; left: 12px; height: 2px; border-radius: 999px; background: #77b9d2; content: ""; }
.studio-sidebar { display: grid; gap: 12px; padding: 14px; }
.studio-sidebar-tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; padding: 4px; border-radius: 10px; background: #edf5f8; }
.studio-sidebar-tabs button { min-height: 44px; border: 0; border-radius: 8px; background: transparent; color: #526b7e; font-weight: 800; }
.studio-sidebar-tabs button[aria-selected="true"] { background: #fff; color: var(--primary-color); box-shadow: 0 2px 8px rgba(0, 59, 112, .1); }
.studio-inspector, .studio-inspector-fields { display: grid; gap: 12px; }
.studio-inspector-header { padding-bottom: 12px; border-bottom: 1px solid #e3edf3; }
.studio-inspector-duration { display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; gap: 6px; }
.studio-inspector-duration button { min-height: 44px; }
.studio-inspector-danger { min-height: 44px; border: 1px solid #fecaca; border-radius: 9px; background: #fff7f7; color: #b42318; font-weight: 800; }
.studio-unscheduled { display: grid; gap: 8px; padding-top: 12px; border-top: 1px solid #e3edf3; }
.studio-unscheduled-item { min-height: 44px; padding: 10px 12px; border: 1px dashed #b8ceda; border-radius: 9px; background: #f8fbfc; }
@media (max-width: 1023px) { .studio-inspector-region, .studio-library-region { padding-bottom: max(14px, env(safe-area-inset-bottom)); } }
@media (min-width: 1024px) { .studio-sidebar { position: sticky; top: 12px; max-height: calc(100dvh - 24px); overflow-y: auto; } }
```

- [ ] **Step 5: Verify behavior, type safety, and commit**

Run: `npm test -- frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/pages/WorkoutStudioPage.test.tsx`

Expected: all selected tests PASS, including pointer move, keyboard move, overlap prevention, resize, save payload, navigation guard, and customer snapshot behavior.

Run: `npm run typecheck`

Expected: exit code 0 and the custom properties are accepted by TypeScript.

```bash
git add frontend/src/index.css frontend/src/components/workout-studio/DayTimeline.tsx frontend/src/components/workout-studio/ExerciseInspector.tsx frontend/src/components/workout-studio/StudioSidebar.tsx frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/pages/WorkoutStudioPage.test.tsx
git commit -m "feat(studio): redesign timeline and inspector"
```

---

### Task 8: Orphan cleanup and final verification

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/tests/components/IndexCssRedesignContract.test.ts`
- Test: all frontend and backend tests through the root Vitest configuration.

**Interfaces:**
- Consumes: completed semantic contracts from Tasks 1–7.
- Produces: no orphaned legacy Studio/exercise/workout presentation selectors and a verified production build.

- [ ] **Step 1: Prove old selectors have no active consumers**

Run:

```powershell
rg -n 'className=.*(!|(?:^|\s)(?:flex|grid|rounded-|bg-|text-|p-|m-|gap-|border-|shadow-|sm:|md:|lg:|xl:))|style=\{\{' frontend/src/pages/pt/ExerciseLibraryPage.tsx frontend/src/components/exercises frontend/src/components/workouts/MyWorkoutPlans.tsx frontend/src/components/workouts/WorkoutTemplateList.tsx frontend/src/components/workouts/WorkoutTemplateCard.tsx frontend/src/components/workouts/AiWorkoutWizard.tsx frontend/src/components/workouts/CustomerWorkoutPlans.tsx frontend/src/components/workouts/CustomerWorkoutPlanModal.tsx frontend/src/components/workouts/CustomerWorkoutPlanPanel.tsx frontend/src/pages/pt/WorkoutStudioPage.tsx frontend/src/components/workout-studio
```

Expected: only the approved CSS custom-property `style` assignment in `DayTimeline.tsx`; no Tailwind/static-inline matches.

Run:

```powershell
rg -n 'studio-meta|studio-grid|studio-timeline-wrap|studio-exercise-card|exercise-video-section|exercise-video-card' frontend/src frontend/tests -g '*.tsx' -g '*.ts'
```

Expected: no active consumers for selectors scheduled for deletion.

- [ ] **Step 2: Remove only proven orphaned CSS**

Delete the old compact Studio block currently beginning at `.workout-studio { display: grid; gap: 12px; }` through its `@media (min-width: 1001px)` rule only after Step 1 proves each replaced selector has no consumer. Remove old exercise video selectors only when their TSX consumers were migrated in Task 2. Preserve `progress-*`, InBody, portal, generic form/button/modal, and unrelated legacy blocks.

- [ ] **Step 3: Run the focused contract and feature suites**

Run:

```powershell
npm test -- frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/components/exercises/ExerciseLibrary.test.tsx frontend/tests/components/workouts/MyWorkoutPlans.test.tsx frontend/tests/components/workouts/AiWorkoutWizard.test.tsx frontend/tests/components/workouts/CustomerWorkoutPlans.test.tsx frontend/tests/components/workouts/CustomerWorkoutPlanModal.test.tsx frontend/tests/components/workouts/CustomerWorkoutPlanPanel.test.tsx frontend/tests/components/workout-studio/StudioHeader.test.tsx frontend/tests/pages/WorkoutStudioPage.test.tsx
```

Expected: all selected test files PASS with zero failures.

- [ ] **Step 4: Run full verification**

Run: `npm test`

Expected: all test files and tests PASS.

Run: `npm run build`

Expected: TypeScript and Vite production build exit 0; record the existing large-chunk warning separately if it remains.

Run: `git diff --check`

Expected: exit code 0 with no whitespace errors.

- [ ] **Step 5: Review scope and commit cleanup**

Run: `git diff --stat` and `git status --short`.

Confirm that only the design spec/plan, `frontend/src/index.css`, the explicitly listed Exercise/Workout/Studio production files, and their tests changed.

```bash
git add frontend/src/index.css frontend/tests/components/IndexCssRedesignContract.test.ts
git commit -m "chore(ui): remove orphaned workout styling"
```
