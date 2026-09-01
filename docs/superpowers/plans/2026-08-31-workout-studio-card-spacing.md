# Workout Studio Card Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comfortable week/day button padding and keep 15-minute timeline cards readable without changing proportional timeline geometry.

**Architecture:** Preserve the repository-enforced semantic `.studio-*` styling contract and add narrowly scoped rules to `frontend/src/index.css`. `ScheduledExerciseCard` derives a compact state from `durationMinutes <= SLOT_MINUTES` and switches only its visible content; its geometry and accessible label remain unchanged.

**Tech Stack:** React, TypeScript, semantic CSS, Vitest, Testing Library

## Global Constraints

- Stage only the new semantic rules from `frontend/src/index.css`; preserve all unrelated local changes.
- Preserve the existing selection-clear change in `frontend/src/pages/pt/WorkoutStudioPage.tsx` and do not stage that hunk.
- Keep test sources local-only and ignored by Git.
- Keep 15 minutes equal to one 20px timeline slot.
- Do not add Tailwind utility classes to Workout Studio controls; the local contract requires semantic `.studio-*` selectors.

---

### Task 1: Add focused visual and semantic CSS regression contracts

**Files:**
- Test: `frontend/tests/pages/WorkoutStudioPage.test.tsx`
- Test: `frontend/tests/components/IndexCssRedesignContract.test.ts`

**Interfaces:**
- Consumes: Existing `WorkoutStudioPage`, `ScheduledExerciseCard`, `frontend/src/index.css`, and Testing Library.
- Produces: Local-only regression coverage for semantic navigation controls, exact 15-minute content, 16px horizontal padding, and compact flex layout.

- [ ] **Step 1: Add the page behavior test**

```tsx
it('uses semantic week and day controls and keeps a 15-minute card readable', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [{ _id: 'squat', name: 'Squat', muscleGroup: 'LEGS', level: 'BEGINNER', scope: 'PRIVATE' }], message: '' });
  const user = userEvent.setup();
  render(<MemoryRouter><ToastProvider><WorkoutStudioPage /></ToastProvider></MemoryRouter>);

  expect(screen.getByRole('button', { name: 'Tuần 1' }).parentElement).toHaveClass('studio-week-list');
  expect(screen.getByRole('button', { name: 'Ngày 1' }).parentElement).toHaveClass('studio-day-list');
  await user.click(await screen.findByRole('button', { name: 'Thêm bài Squat' }));
  fireEvent.change(screen.getByLabelText('Thời lượng bài tập'), { target: { value: '15' } });

  const card = getScheduledCard(/Squat.*08:00–08:15/);
  expect(card).toHaveClass('is-compact');
  expect(within(card).getByText('Squat').parentElement).toHaveClass('studio-scheduled-content');
  expect(within(card).getByText('15 phút')).toBeVisible();
});
```

- [ ] **Step 2: Extend the semantic CSS contract**

Require these selectors and declarations in `IndexCssRedesignContract.test.ts`:

```tsx
expect(css).toMatch(/\.studio-week-list button,\s*\.studio-day-list button\s*\{[^}]*padding:\s*0 16px;[^}]*white-space:\s*nowrap;/s);
expect(css).toMatch(/\.studio-scheduled-item\.is-compact \.studio-scheduled-content\s*\{[^}]*display:\s*flex;[^}]*padding:\s*0 8px;/s);
```

- [ ] **Step 3: Run tests to verify RED**

Run from the repository root:

```powershell
npx vitest run --config vitest.config.ts frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/pages/WorkoutStudioPage.test.tsx
```

Expected: FAIL because the semantic padding/compact rules do not exist yet; any Studio Tailwind utilities also violate the existing contract.

---

### Task 2: Implement semantic padding and compact timeline content

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/components/workout-studio/DayTimeline.tsx`
- Test: `frontend/tests/pages/WorkoutStudioPage.test.tsx`
- Test: `frontend/tests/components/IndexCssRedesignContract.test.ts`

**Interfaces:**
- Consumes: `ScheduledExercise.durationMinutes`, `SLOT_MINUTES`, and existing `.studio-week-list`, `.studio-day-list`, and `.studio-scheduled-content` structures.
- Produces: Semantic navigation padding and an `is-compact` scheduled card whose visible content is `exercise name + duration` on one line.

- [ ] **Step 1: Add semantic navigation spacing**

Add to `frontend/src/index.css`:

```css
.studio-week-list button,
.studio-day-list button {
  padding: 0 16px;
  white-space: nowrap;
}
```

- [ ] **Step 2: Add the compact scheduled-card rules**

```css
.studio-scheduled-item.is-compact .studio-scheduled-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 8px;
}

.studio-scheduled-item.is-compact .studio-scheduled-content strong {
  min-width: 0;
  line-height: 1rem;
}

.studio-scheduled-item.is-compact .studio-scheduled-content > span {
  flex: 0 0 auto;
  line-height: 1;
  white-space: nowrap;
}
```

- [ ] **Step 3: Render compact content without utility classes**

Inside `ScheduledExerciseCard`, derive `const compact = item.durationMinutes <= SLOT_MINUTES`, add conditional `is-compact`, retain the full time range in `aria-label`, and render only `{item.durationMinutes} phút` as the compact secondary text.

- [ ] **Step 4: Run focused tests to verify GREEN**

```powershell
npx vitest run --config vitest.config.ts frontend/tests/components/IndexCssRedesignContract.test.ts frontend/tests/pages/WorkoutStudioPage.test.tsx
```

Expected: `2` files and `22` tests pass.

- [ ] **Step 5: Run typecheck, build, and full suite**

Run from `frontend/`:

```powershell
npm run typecheck
npm run build
npm test
```

Expected: each command exits `0`; existing Mongoose deprecation and bundle-size warnings are allowed.

---

### Task 3: Amend and publish the scoped implementation

**Files:**
- Commit: `frontend/src/index.css` — new semantic rules only.
- Commit: `frontend/src/components/workout-studio/DayTimeline.tsx`
- Commit: `docs/superpowers/specs/2026-08-31-workout-studio-card-spacing-design.md`
- Commit: `docs/superpowers/plans/2026-08-31-workout-studio-card-spacing.md`
- Exclude: unrelated local changes in `frontend/src/index.css`.
- Exclude: the pre-existing selection-clear hunk in `frontend/src/pages/pt/WorkoutStudioPage.tsx`.
- Exclude: ignored local test sources.

**Interfaces:**
- Consumes: Verified semantic implementation from Task 2.
- Produces: A scoped unpublished commit amended in place on `feat/pt-workout-progress-enhancements`.

- [ ] **Step 1: Stage clean files and only the narrow CSS additions**

Stage `DayTimeline.tsx` and both documents normally. Apply a narrow cached patch for the new `index.css` selectors so the user's large unrelated CSS worktree diff stays unstaged.

- [ ] **Step 2: Verify staged scope**

```powershell
git diff --cached --check
git diff --cached --stat
git diff --cached -- frontend/src/index.css frontend/src/components/workout-studio/DayTimeline.tsx
```

Expected: only the semantic rules, compact component behavior, and documentation are staged.

- [ ] **Step 3: Amend the unpublished implementation commit**

```powershell
git commit --amend --no-edit
```

- [ ] **Step 4: Push the current branch**

```powershell
git push origin feat/pt-workout-progress-enhancements
```

Expected: remote branch advances to the corrected implementation commit.
