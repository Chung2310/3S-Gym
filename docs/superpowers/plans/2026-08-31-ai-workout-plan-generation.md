# AI Workout Plan Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable PTs to generate a multi-week private workout template from a selected customer with AI, review it in Workout Studio, and save generated private exercises atomically with the template.

**Architecture:** A two-stage backend AI API returns a proposal first and a validated generation second without persisting data. The legacy-CSS wizard holds the draft in frontend navigation state, then Studio maps it into editable week/session schedules. The existing workout-template save endpoint performs an atomic transaction to reuse or create private exercises and persist the template.

**Tech Stack:** React 19, TypeScript, React Router, Express 5, Mongoose 9 transactions, Joi 18, Vitest, legacy CSS in `frontend/src/index.css`, OpenRouter through `backend/services/aiProvider.ts`.

## Global Constraints

- Use only legacy CSS classes from `frontend/src/index.css` for AI wizard UI; do not add Tailwind, CSS modules, or inline styles.
- Use `panel`, `form-grid`, `form-group`, `button`, `badge-tag`, `empty-state`, and modal classes before adding a narrowly scoped selector to `index.css`.
- AI calls occur only in backend; provider keys, raw prompts, and raw provider responses never reach frontend.
- `POST /api/ai/workout-proposals` and `POST /api/ai/workout-generations` must not persist data.
- Templates generated from customer context remain private PT templates and are never automatically assigned or published.
- AI-created exercises use `scope: PRIVATE` and are persisted only in the same transaction as a successful template save.
- Existing templates without `weekNumber` must read as week 1.
- New production behavior begins with a failing focused test.

---

### Task 1: AI workout contracts, context, and response validation

**Files:**
- Create: `backend/services/aiWorkoutService.ts`
- Create: `backend/validators/aiWorkoutValidator.ts`
- Create: `backend/tests/aiWorkoutService.test.ts`
- Modify: `backend/models/WorkoutTemplate.ts`
- Modify: `backend/validators/workoutValidator.ts`

**Consumes:** `CustomerProfile`, `Goal`, `InBodyRecord`, `WorkoutSession`, `Exercise`, and `generateText(prompt)`.

**Produces:** `createWorkoutProposal(user, customerId)` and `generateWorkoutDraft(user, input)` returning validated plain JSON; `weekNumber` on scheduled exercises.

- [ ] **Step 1: Write failing service tests**

```ts
it('returns a proposal using only a PT-owned customer context', async () => {
  const proposal = await createWorkoutProposal(pt, customer.id);
  expect(proposal).toMatchObject({ durationWeeks: 8, sessionsPerWeek: 4, minutesPerSession: 60 });
});

it('rejects a generation whose exercise conflicts with a health restriction', async () => {
  await expect(generateWorkoutDraft(pt, validInput)).rejects.toMatchObject({ status: 422 });
});
```

- [ ] **Step 2: Run red test**

Run: `npm test -- backend/tests/aiWorkoutService.test.ts`

Expected: fail because `aiWorkoutService.ts` and its exports do not exist.

- [ ] **Step 3: Add contracts and minimal service**

Implement Joi schemas for proposal and generation input. In `aiWorkoutService.ts`, load customer profile, latest goal/InBody, recent workout sessions and accessible exercises; reject unassigned customers with `403`. Parse provider JSON, validate the proposal/generation structure, enforce 4–12 weeks, and reject exercises matching normalized restriction terms. Return plain draft data; do not call `.create()`.

- [ ] **Step 4: Add week-aware persisted contracts**

Add optional `weekNumber` with `min: 1` to the scheduled exercise Mongoose schema and Joi schema. Update schedule overlap validation so overlap only applies when both `weekNumber` and `dayNumber` match; missing `weekNumber` is treated as `1`.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- backend/tests/aiWorkoutService.test.ts backend/tests/workoutProgress.test.ts`

Expected: pass.

### Task 2: AI workout HTTP endpoints

**Files:**
- Create: `backend/controllers/aiWorkoutController.ts`
- Create: `backend/routes/aiWorkout.ts`
- Create: `backend/tests/aiWorkoutApi.test.ts`
- Modify: `backend/app.ts`

**Consumes:** `createWorkoutProposal`, `generateWorkoutDraft`, `authenticate`, `authorize`, `requireFeature`, and Joi request schemas from Task 1.

**Produces:** authenticated PT endpoints under `/api/ai/workout-proposals` and `/api/ai/workout-generations`.

- [ ] **Step 1: Write failing endpoint tests**

```ts
it('returns a proposal without inserting a template or exercise', async () => {
  const before = await WorkoutTemplate.countDocuments();
  await request(app).post('/api/ai/workout-proposals').set('Authorization', token).send({ customerId }).expect(200);
  expect(await WorkoutTemplate.countDocuments()).toBe(before);
});

it('allows only PT users with the exercise-library feature to generate a draft', async () => {
  await request(app).post('/api/ai/workout-generations').set('Authorization', memberToken).send(payload).expect(403);
});
```

- [ ] **Step 2: Run red test**

Run: `npm test -- backend/tests/aiWorkoutApi.test.ts`

Expected: fail with endpoint not found.

- [ ] **Step 3: Implement route and controller**

Mount `aiWorkoutRouter` in `backend/app.ts`. Both endpoints require `authenticate`, `authorize('PT')`, and `requireFeature('EXERCISE_LIBRARY')`. The proposal controller returns `{ data: proposal }`; the generation controller returns `{ data: draft }`. Use existing `success` and `asyncHandler` conventions.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- backend/tests/aiWorkoutApi.test.ts`

Expected: pass.

### Task 3: Atomic generated-exercise save for templates

**Files:**
- Modify: `backend/routes/workoutTemplates.ts`
- Modify: `backend/validators/workoutValidator.ts`
- Create: `backend/tests/aiWorkoutTemplateSave.test.ts`

**Consumes:** template save payload with `generatedExercises`, `Exercise`, and Mongoose sessions.

**Produces:** no duplicate private exercises; generated temporary exercise references resolve to real `exerciseId` values before template persistence.

- [ ] **Step 1: Write failing persistence tests**

```ts
it('creates generated private exercises and links them to the saved template atomically', async () => {
  const response = await request(app).post('/api/workout-templates').set('Authorization', token).send(aiTemplatePayload).expect(201);
  expect(response.body.data.scheduledExercises[0].exerciseId).toBeDefined();
  expect(await Exercise.countDocuments({ ownerPtId: pt.id, scope: 'PRIVATE' })).toBe(1);
});

it('reuses an existing private exercise with the same normalized name', async () => {
  // seed “Goblet Squat”, save AI template with “goblet squat”, assert count remains one
});
```

- [ ] **Step 2: Run red test**

Run: `npm test -- backend/tests/aiWorkoutTemplateSave.test.ts`

Expected: fail because `generatedExercises` is rejected or temporary references remain unresolved.

- [ ] **Step 3: Implement transaction**

Extend the create/update validator with `generatedExercises`. In the template route, call `mongoose.startSession().withTransaction()`: normalize names, find accessible global/private matches, create missing private exercises with `ownerPtId`, replace draft keys in `scheduledExercises` and `unscheduledExercises`, derive sessions, then create/save template using the same session. Preserve current route responses and rollback on any error.

- [ ] **Step 4: Add rollback assertion and run tests**

Add a test that forces invalid template data after generated exercises are supplied, then assert no exercise persists. Run: `npm test -- backend/tests/aiWorkoutTemplateSave.test.ts backend/tests/exercises.test.ts`

Expected: pass.

### Task 4: Frontend AI data service and legacy wizard

**Files:**
- Create: `frontend/src/types/aiWorkout.ts`
- Create: `frontend/src/services/aiWorkout.ts`
- Create: `frontend/src/components/workouts/AiWorkoutWizard.tsx`
- Create: `frontend/tests/components/workouts/AiWorkoutWizard.test.tsx`
- Modify: `frontend/src/index.css`

**Consumes:** generic `api` service and response types from Tasks 1–2.

**Produces:** a three-step controlled `AiWorkoutWizard` that returns a generated draft through `onGenerated(draft)`.

- [ ] **Step 1: Write failing wizard tests**

```tsx
it('lets the PT edit AI frequency and duration before generating', async () => {
  render(<AiWorkoutWizard open onClose={vi.fn()} onGenerated={onGenerated} />);
  await user.selectOptions(screen.getByLabelText('Học viên'), customerId);
  await user.click(screen.getByRole('button', { name: 'Phân tích bằng AI' }));
  await user.clear(screen.getByLabelText('Số buổi mỗi tuần'));
  await user.type(screen.getByLabelText('Số buổi mỗi tuần'), '5');
  expect(screen.getByDisplayValue('5')).toBeVisible();
});
```

- [ ] **Step 2: Run red test**

Run: `npm test -- frontend/tests/components/workouts/AiWorkoutWizard.test.tsx`

Expected: fail because component does not exist.

- [ ] **Step 3: Implement API service and component**

Define proposal, generated exercise, scheduled exercise, and generation draft TypeScript types. Build a modal wizard with only legacy CSS classes (`modal-*`, `panel`, `form-*`, `button-*`, `badge-tag`, `empty-state`). Step 1 loads eligible customers, step 2 calls proposal and exposes editable fields, step 3 calls generation and invokes `onGenerated`. Disable duplicate submissions and retain input state after errors. Add minimal selectors in `index.css` only for wizard progress/loading/warnings.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- frontend/tests/components/workouts/AiWorkoutWizard.test.tsx`

Expected: pass.

### Task 5: Launch wizard and hydrate Workout Studio draft

**Files:**
- Modify: `frontend/src/components/workouts/MyWorkoutPlans.tsx`
- Modify: `frontend/src/pages/pt/WorkoutStudioPage.tsx`
- Modify: `frontend/src/types/workoutStudio.ts`
- Create: `frontend/tests/pages/AiWorkoutStudioFlow.test.tsx`

**Consumes:** `AiWorkoutWizard`, generated draft types, Studio schedule data.

**Produces:** `Tạo bằng AI` launch control and editable generated draft in Studio before persistence.

- [ ] **Step 1: Write failing integration test**

```tsx
it('opens the generated draft in Studio without posting a template', async () => {
  renderWithRouter('/pt/my-workout-plans');
  await user.click(screen.getByRole('button', { name: 'Tạo bằng AI' }));
  await completeWizard(user);
  expect(screen.getByRole('region', { name: 'Workout Studio' })).toBeVisible();
  expect(api.post).not.toHaveBeenCalledWith('/api/workout-templates', expect.anything());
});
```

- [ ] **Step 2: Run red test**

Run: `npm test -- frontend/tests/pages/AiWorkoutStudioFlow.test.tsx`

Expected: fail because the AI button and navigation state are absent.

- [ ] **Step 3: Implement navigation-state handoff**

Add `Tạo bằng AI` beside the current manual create button. On `onGenerated`, navigate to `/pt/my-workout-plans/new` with a typed state draft. In Studio, initialize title, goal, level, schedule, metadata, generated exercises, and draft status from navigation state only when creating a new template. Include `generatedExercises` in the existing save payload. If the page reloads, show the normal empty Studio rather than pretending a draft exists.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- frontend/tests/pages/AiWorkoutStudioFlow.test.tsx frontend/tests/pages/WorkoutStudioPage.test.tsx`

Expected: pass.

### Task 6: Week/session navigation in Workout Studio

**Files:**
- Modify: `frontend/src/components/workout-studio/StudioDayNavigator.tsx`
- Modify: `frontend/src/pages/pt/WorkoutStudioPage.tsx`
- Modify: `frontend/src/types/workoutStudio.ts`
- Modify: `frontend/src/index.css`
- Create: `frontend/tests/components/workout-studio/StudioWeekNavigator.test.tsx`

**Consumes:** optional `weekNumber` schedule field from Task 1.

**Produces:** week selector plus existing day selector restricted to the selected week; old schedules display as week 1.

- [ ] **Step 1: Write failing navigation test**

```tsx
it('shows only selected-week exercises and treats legacy exercises as week one', async () => {
  render(<WorkoutStudioPage />, { routeState: multiWeekDraft });
  expect(screen.getByText('Back squat')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Tuần 2' }));
  expect(screen.queryByText('Back squat')).not.toBeInTheDocument();
  expect(screen.getByText('Romanian deadlift')).toBeVisible();
});
```

- [ ] **Step 2: Run red test**

Run: `npm test -- frontend/tests/components/workout-studio/StudioWeekNavigator.test.tsx`

Expected: fail because no week selector exists.

- [ ] **Step 3: Implement week-aware Studio state**

Add `weekNumber?: number` to frontend schedule types and normalize missing values to 1 on load. Derive available weeks from template duration and schedule. Render week buttons using legacy `studio-days` styling, filter day buttons and timeline items by `activeWeek`, and ensure place/move/update retains the active week. Use CSS selectors in `index.css` only if the existing Studio classes need a week-row layout.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- frontend/tests/components/workout-studio/StudioWeekNavigator.test.tsx frontend/tests/pages/WorkoutStudioPage.test.tsx`

Expected: pass.

### Task 7: Regression verification

**Files:**
- Modify: relevant tests only if regressions reveal legitimate contract adjustments.

- [ ] **Step 1: Run backend AI and workout regression suite**

Run: `npm test -- backend/tests/aiWorkoutService.test.ts backend/tests/aiWorkoutApi.test.ts backend/tests/aiWorkoutTemplateSave.test.ts backend/tests/workoutProgress.test.ts backend/tests/exercises.test.ts`

Expected: pass.

- [ ] **Step 2: Run frontend AI and Studio regression suite**

Run: `npm test -- frontend/tests/components/workouts/AiWorkoutWizard.test.tsx frontend/tests/pages/AiWorkoutStudioFlow.test.tsx frontend/tests/components/workout-studio/StudioWeekNavigator.test.tsx frontend/tests/pages/WorkoutStudioPage.test.tsx frontend/tests/components/workouts/MyWorkoutPlans.test.tsx`

Expected: pass.

- [ ] **Step 3: Run type and production checks**

Run: `npm run typecheck:backend`, `npm run typecheck`, `npm run build`

Expected: all exit 0; record any existing bundle-size warning separately.
