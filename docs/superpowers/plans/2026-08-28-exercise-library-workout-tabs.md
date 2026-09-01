# Exercise Library Workout Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move “Thư viện bài tập” into “Giáo án của tôi” as a URL-addressable tab while preserving the legacy exercise-library URL.

**Architecture:** `MyWorkoutPlans` becomes the tab shell and conditionally mounts either its existing template list or the existing `ExerciseLibraryPage`. React Router search params store the selected tab, navigation removes the standalone exercise item, and the old route redirects to the new tab URL.

**Tech Stack:** React 19, React Router 7, TypeScript, Tailwind CSS 4, Vitest, Testing Library

## Global Constraints

- Keep the existing exercise and workout APIs unchanged.
- Keep `/pt/my-workout-plans/new` and `/pt/my-workout-plans/:templateId/edit` unchanged.
- Use Tailwind utilities for new tab styling.
- Do not mount both tab contents simultaneously.
- Preserve unrelated staged and unstaged workspace changes.

---

### Task 1: Navigation and legacy-route compatibility

**Files:**
- Modify: `frontend/src/config/portalNavigation.ts`
- Modify: `frontend/tests/config/portalNavigation.test.ts`
- Modify: `frontend/src/routes/PortalRoutes.tsx`
- Test: `frontend/tests/pages/PortalPage.test.tsx`

**Interfaces:**
- Consumes: `portalNavigation`, `PortalRoutes`, React Router `Navigate`.
- Produces: one sidebar entry at `/pt/my-workout-plans` and a legacy redirect from `/pt/exercises` to `/pt/my-workout-plans?tab=exercises`.

- [ ] **Step 1: Write failing navigation and redirect tests**

Add assertions that visible PT navigation contains the workout entry but no `/pt/exercises` entry. Add a portal integration test with a location probe:

```tsx
it('chuyển route thư viện bài tập cũ sang tab trong Giáo án của tôi', async () => {
  function Location() {
    const location = useLocation();
    return <output data-testid="exercise-route">{`${location.pathname}${location.search}`}</output>;
  }

  render(
    <MemoryRouter initialEntries={['/pt/exercises']}>
      <ToastProvider>
        <PortalPage session={{ token: 'abc', user: { username: 'pt', role: 'PT' } }} />
        <Location />
      </ToastProvider>
    </MemoryRouter>,
  );

  expect(await screen.findByTestId('exercise-route'))
    .toHaveTextContent('/pt/my-workout-plans?tab=exercises');
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```powershell
npm test -- frontend/tests/config/portalNavigation.test.ts frontend/tests/pages/PortalPage.test.tsx
```

Expected: FAIL because `/pt/exercises` remains in navigation and renders the standalone page.

- [ ] **Step 3: Implement the navigation and redirect change**

Remove the `Dumbbell` import and `/pt/exercises` navigation item. Replace the route element with:

```tsx
<Route
  path="pt/exercises"
  element={<Navigate to="/pt/my-workout-plans?tab=exercises" replace />}
/>
```

Remove the now-unused `ExerciseLibraryPage` import from `PortalRoutes.tsx`.

- [ ] **Step 4: Run tests and verify GREEN**

Run the Task 1 test command again. Expected: all selected tests PASS.

- [ ] **Step 5: Commit Task 1**

```powershell
git add frontend/src/config/portalNavigation.ts frontend/tests/config/portalNavigation.test.ts frontend/src/routes/PortalRoutes.tsx frontend/tests/pages/PortalPage.test.tsx
git commit -m "refactor: move exercise library navigation under workouts"
```

### Task 2: URL-synchronized tabs in Giáo án của tôi

**Files:**
- Modify: `frontend/src/components/workouts/MyWorkoutPlans.tsx`
- Test: `frontend/tests/components/workouts/MyWorkoutPlans.test.tsx`

**Interfaces:**
- Consumes: `ExerciseLibraryPage`, `useSearchParams`, existing `WorkoutTemplateList`.
- Produces: `plans | exercises` tab selection represented by `?tab=plans|exercises`.

- [ ] **Step 1: Write failing tab tests**

Extend the API mock with `upload: vi.fn()`. Add tests for default selection, direct URL selection, and click-driven URL updates:

```tsx
it('mặc định hiển thị tab Giáo án của tôi', async () => {
  render(
    <MemoryRouter initialEntries={['/pt/my-workout-plans']}>
      <ToastProvider><MyWorkoutPlans /></ToastProvider>
    </MemoryRouter>,
  );

  expect(screen.getByRole('tab', { name: 'Giáo án của tôi' }))
    .toHaveAttribute('aria-selected', 'true');
  expect(await screen.findAllByText(template.title)).not.toHaveLength(0);
  expect(screen.queryByRole('heading', { name: 'Thư viện bài tập' })).not.toBeInTheDocument();
});

it('mở trực tiếp và chuyển sang tab Thư viện bài tập qua URL', async () => {
  const user = userEvent.setup();
  const { unmount } = render(
    <MemoryRouter initialEntries={['/pt/my-workout-plans?tab=exercises']}>
      <ToastProvider><MyWorkoutPlans /></ToastProvider>
    </MemoryRouter>,
  );
  expect(screen.getByRole('tab', { name: 'Thư viện bài tập' }))
    .toHaveAttribute('aria-selected', 'true');
  expect(await screen.findByRole('heading', { name: 'Thư viện bài tập' })).toBeVisible();
  unmount();

  render(
    <MemoryRouter initialEntries={['/pt/my-workout-plans']}>
      <ToastProvider>
        <MyWorkoutPlans />
        <Location />
      </ToastProvider>
    </MemoryRouter>,
  );
  await user.click(screen.getByRole('tab', { name: 'Thư viện bài tập' }));
  expect(screen.getByTestId('location'))
    .toHaveTextContent('/pt/my-workout-plans?tab=exercises');
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```powershell
npm test -- frontend/tests/components/workouts/MyWorkoutPlans.test.tsx
```

Expected: FAIL because no tablist or exercise content exists.

- [ ] **Step 3: Implement the tab shell**

Import `useSearchParams` and `ExerciseLibraryPage`. Normalize the query and conditionally render only the active content:

```tsx
const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get('tab') === 'exercises' ? 'exercises' : 'plans';
const selectTab = (tab: 'plans' | 'exercises') => setSearchParams({ tab });
```

Render a semantic tab bar with `role="tablist"`, two `role="tab"` buttons, `aria-selected`, `aria-controls`, and Tailwind focus/active states. Render the existing workout header/list only for `plans`; render `<ExerciseLibraryPage />` only for `exercises`. Give each content wrapper `role="tabpanel"` and the corresponding `aria-labelledby`.

- [ ] **Step 4: Add invalid-query normalization coverage**

Add a test opening `/pt/my-workout-plans?tab=unknown` and assert the plans tab is selected and workout content is visible. The implementation must treat every value other than `exercises` as `plans`.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```powershell
npm test -- frontend/tests/components/workouts/MyWorkoutPlans.test.tsx frontend/tests/components/exercises/ExerciseLibrary.test.tsx
```

Expected: all selected tests PASS and the existing exercise CRUD tests remain green.

- [ ] **Step 6: Run integration verification**

Run:

```powershell
npm test -- frontend/tests/config/portalNavigation.test.ts frontend/tests/pages/PortalPage.test.tsx frontend/tests/components/workouts/MyWorkoutPlans.test.tsx frontend/tests/components/exercises/ExerciseLibrary.test.tsx
npx oxlint frontend/src/config/portalNavigation.ts frontend/src/routes/PortalRoutes.tsx frontend/src/components/workouts/MyWorkoutPlans.tsx frontend/tests/config/portalNavigation.test.ts frontend/tests/pages/PortalPage.test.tsx frontend/tests/components/workouts/MyWorkoutPlans.test.tsx
npx vite build
```

Expected: focused tests and lint PASS; frontend build exits 0. Record any unrelated pre-existing warning separately.

- [ ] **Step 7: Commit Task 2**

```powershell
git add frontend/src/components/workouts/MyWorkoutPlans.tsx frontend/tests/components/workouts/MyWorkoutPlans.test.tsx
git commit -m "feat: add exercise library tab to my workout plans"
```
