# AI Exercise Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reviewed single and batch AI exercise generation, with atomic saving of up to 10 selected drafts into the shared exercise library.

**Architecture:** A dedicated AI endpoint returns sanitized exercise drafts without persistence and bills through `TEXT_WORKOUT`. A separate bulk endpoint validates every selected draft, rejects duplicates, and persists atomically. A focused React wizard owns configuration, review, editing, selection, and save state.

**Tech Stack:** TypeScript, Express 5, Joi, Mongoose 9, React 19, Vitest, Testing Library, existing `api` client and CSS design system.

## Global Constraints

- Authorize ADMIN and PT through `EXERCISE_LIBRARY`.
- Generate one exercise or 2–10 exercises in batch mode.
- Never persist AI output before explicit review and confirmation.
- Allow only `name`, `muscleGroup`, `level`, `defaultTrackingType`, `equipment`, `description`, `technique`, `commonMistakes`, `contraindications`, and `variants` from AI.
- Never generate videos, IDs, scope, owner, or system fields.
- Bill generation as `TEXT_WORKOUT`; add no billing type.
- Make bulk persistence all-or-nothing and reject normalized duplicate names.
- Preserve current working-tree edits in the exercise service, form, and card.
- Do not create commits because the user did not explicitly authorize commits.

## File Map

- Create `backend/services/aiExerciseService.ts` for prompting, parsing, and draft sanitization.
- Create `backend/validators/aiExerciseValidator.ts` for generation input.
- Modify the existing AI controller/router to expose exercise generation.
- Modify exercise validator/service/controller/router for atomic bulk creation.
- Create `backend/tests/aiExerciseService.test.ts` and `backend/tests/aiExerciseApi.test.ts`.
- Extend `frontend/src/types/exercise.ts` with AI request/draft types.
- Create `frontend/src/components/exercises/AiExerciseWizard.tsx` and its component test.
- Modify `ExerciseLibraryPage.tsx` to expose the wizard; style new UI with statically discoverable Tailwind v4 classes.

---

### Task 1: AI Draft Service

**Files:**
- Create: `backend/services/aiExerciseService.ts`
- Create: `backend/validators/aiExerciseValidator.ts`
- Test: `backend/tests/aiExerciseService.test.ts`

**Interfaces:**
- Consumes: `generateText(context, prompt)` from `aiProvider.ts`.
- Produces: `generateExerciseDrafts(user, input, requestKey): Promise<{ drafts: AiExerciseDraft[]; discardedCount: number }>`.
- Produces: `exerciseGenerationRequestSchema`.

- [ ] **Step 1: Write failing service tests**

Mock `generateText` and cover plain/fenced JSON, forbidden-field removal, enum rejection, normalized name de-duplication, quantity limiting, and all-invalid output:

```ts
const result = await generateExerciseDrafts(
  { id: 'pt-1', role: 'PT' },
  { mode: 'SINGLE', muscleGroup: 'Chân', level: 'BEGINNER', defaultTrackingType: 'STRENGTH', equipment: ['Tạ đơn'], quantity: 1, additionalRequest: '' },
  'request-1',
);
expect(generateText).toHaveBeenCalledWith(
  expect.objectContaining({ userId: 'pt-1', taskType: 'TEXT_WORKOUT', requestKey: 'request-1:text-exercise-generation' }),
  expect.any(String),
);
expect(result.drafts[0]).not.toHaveProperty('videos');
expect(result.drafts[0]).not.toHaveProperty('scope');
```

- [ ] **Step 2: Verify the tests fail**

Run: `npx vitest run --config vitest.config.ts backend/tests/aiExerciseService.test.ts`

Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement the request schema**

```ts
export const exerciseGenerationRequestSchema: RequestValidationSchema = {
  body: Joi.object({
    mode: Joi.string().valid('SINGLE', 'BATCH').required(),
    muscleGroup: Joi.string().trim().required(),
    level: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').required(),
    defaultTrackingType: Joi.string().valid('STRENGTH', 'BODYWEIGHT', 'CARDIO', 'INTERVAL', 'MOBILITY').required(),
    equipment: Joi.array().items(Joi.string().trim()).max(20).default([]),
    quantity: Joi.when('mode', { is: 'SINGLE', then: Joi.number().integer().valid(1).required(), otherwise: Joi.number().integer().min(2).max(10).required() }),
    additionalRequest: Joi.string().trim().allow('').max(1000).default(''),
  }).messages(commonMessages),
};
```

- [ ] **Step 4: Implement generation and sanitization**

Define the exact draft interface with the ten allowed fields. Build a Vietnamese JSON-only prompt from all input fields. Call:

```ts
const raw = await generateText(
  { userId: user.id, taskType: 'TEXT_WORKOUT', requestKey: `${requestKey}:text-exercise-generation` },
  buildPrompt(input),
);
```

Accept a root array or `{ exercises: [] }`, strip markdown fences, and construct fresh objects rather than spreading AI data. Trim strings; default optional arrays to `[]`; reject missing required strings and invalid enums; de-duplicate with `name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi')`; slice to `quantity`. Throw status 502 `AppError` with `ERROR_CODES.EXTERNAL` if no item survives.

- [ ] **Step 5: Verify service tests pass**

Run: `npx vitest run --config vitest.config.ts backend/tests/aiExerciseService.test.ts`

Expected: PASS.

### Task 2: Generation API

**Files:**
- Modify: `backend/controllers/aiWorkoutController.ts`
- Modify: `backend/routes/aiWorkout.ts`
- Test: `backend/tests/aiExerciseApi.test.ts`

**Interfaces:**
- Consumes Task 1 exports.
- Produces `POST /api/ai/exercise-generations` returning `{ drafts, discardedCount }`.

- [ ] **Step 1: Write failing API tests**

Create ADMIN, PT, CUSTOMER and `EXERCISE_LIBRARY` fixtures. Assert ADMIN/PT receive drafts, CUSTOMER receives 403, a disabled feature receives 403, batch quantity 11 receives 400, SINGLE quantity 2 receives 400, and generation does not change `Exercise.countDocuments()`.

```ts
const response = await request(app)
  .post('/api/ai/exercise-generations')
  .set('Authorization', `Bearer ${token}`)
  .send({ mode: 'BATCH', muscleGroup: 'Lưng', level: 'INTERMEDIATE', defaultTrackingType: 'STRENGTH', equipment: ['Cáp'], quantity: 2, additionalRequest: '' });
expect(response.status).toBe(200);
expect(response.body.data.drafts).toHaveLength(2);
```

- [ ] **Step 2: Verify API tests fail**

Run: `npx vitest run --config vitest.config.ts backend/tests/aiExerciseApi.test.ts`

Expected: FAIL with route not found.

- [ ] **Step 3: Add handler and route**

```ts
export const exerciseGeneration = asyncHandler(async (req, res) => success(res, {
  message: 'AI đã tạo bản nháp bài tập. Hãy kiểm tra trước khi lưu.',
  data: await generateExerciseDrafts(req.user!, req.body, req.requestId!),
}));
```

Register `/exercise-generations` with `authenticate`, `authorize('ADMIN', 'PT')`, `requireFeature('EXERCISE_LIBRARY')`, the new validator, and the handler.

- [ ] **Step 4: Verify generation API tests pass**

Run the same focused API command. Expected: PASS.

### Task 3: Atomic Bulk Save

**Files:**
- Modify: `backend/validators/contentValidator.ts`
- Modify: `backend/services/exerciseService.ts`
- Modify: `backend/controllers/exerciseController.ts`
- Modify: `backend/routes/exercises.ts`
- Test: `backend/tests/aiExerciseApi.test.ts`

**Interfaces:**
- Produces `bulkCreateExercisesSchema` for `{ exercises: AiExerciseDraft[] }` with 1–10 items.
- Produces `createBulk(user, exercises)` and `POST /api/exercises/bulk`.

- [ ] **Step 1: Add failing bulk tests**

Assert two valid drafts persist, duplicate normalized names inside the request fail, a case/whitespace-insensitive database duplicate fails, an invalid second item prevents the first from saving, and 11 items fail. For every failure compare document counts before and after.

```ts
expect(await Exercise.countDocuments()).toBe(before);
expect(response.status).toBe(400);
expect(response.body.message).toContain('Goblet Squat');
```

- [ ] **Step 2: Verify bulk tests fail**

Run the API test file. Expected: FAIL because `/api/exercises/bulk` is absent.

- [ ] **Step 3: Add bulk Joi validation**

Create an `.unknown(false)` item schema containing only the ten allowed fields. Require the four core fields, default the six array/text fields, and wrap it with `Joi.array().min(1).max(10).required()`.

- [ ] **Step 4: Implement transaction and shared creation policy**

Extract the current single-create policy:

```ts
function creationPayload(user: AuthenticatedUser, payload: Partial<IExercise>) {
  return { ...payload, scope: 'GLOBAL' as const, ownerPtId: user.role === 'PT' ? user.id : undefined };
}
```

Normalize names with trimmed collapsed whitespace and Vietnamese-aware lowercase. Reject duplicates in memory. Query existing names with escaped anchored case-insensitive regular expressions. Use `mongoose.startSession()` and `withTransaction`; insert all exercises and write one audit per exercise in the same transaction. Extend `recordAudit` with an optional session only if required. Return normalized exercise responses after commit.

- [ ] **Step 5: Register bulk controller and route**

```ts
const createBulk = asyncHandler(async (req, res) => success(res, {
  status: 201,
  message: `Đã lưu ${req.body.exercises.length} bài tập vào thư viện.`,
  data: await service.createBulk(req.user!, req.body.exercises),
}));
```

Register `POST /bulk` before `GET /:id` so `bulk` is never parsed as an ID.

- [ ] **Step 6: Verify all backend feature tests**

Run: `npx vitest run --config vitest.config.ts backend/tests/aiExerciseService.test.ts backend/tests/aiExerciseApi.test.ts`

Expected: PASS.

### Task 4: Review Wizard

**Files:**
- Modify: `frontend/src/types/exercise.ts`
- Create: `frontend/src/components/exercises/AiExerciseWizard.tsx`
- Create: `frontend/tests/components/exercises/AiExerciseWizard.test.tsx`

**Interfaces:**
- Calls generation and bulk APIs.
- Exports `AiExerciseWizard({ open, onClose, onSaved })`.

- [ ] **Step 1: Write failing interaction tests**

Cover SINGLE quantity fixed to 1, BATCH limited to 2–10, request payload construction, draft rendering, editing, select-all/per-item selection, disabled save with zero/invalid selections, save of selected items only, generation error preserving configuration, and save error preserving reviewed drafts.

```tsx
await user.click(screen.getByRole('button', { name: 'Tạo bản nháp' }));
expect(api.post).toHaveBeenNthCalledWith(1, '/api/ai/exercise-generations', expect.objectContaining({ mode: 'BATCH', quantity: 2 }));
await user.click(screen.getByLabelText('Chọn bài tập 2'));
await user.click(screen.getByRole('button', { name: 'Lưu 1 bài tập' }));
expect(api.post).toHaveBeenNthCalledWith(2, '/api/exercises/bulk', { exercises: [expect.any(Object)] });
```

- [ ] **Step 2: Verify wizard tests fail**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/exercises/AiExerciseWizard.test.tsx`

Expected: FAIL because the component is absent.

- [ ] **Step 3: Implement configuration and generation**

Define and export `AiExerciseDraft`, `AiExerciseGenerationMode`, and `AiExerciseGenerationRequest` from `types/exercise.ts`. Use two steps, `Cấu hình` and `Duyệt & lưu`. Use existing Vietnamese labels and exercise enums. Split equipment by commas. Lock buttons while requests run. Only replace drafts and selections after successful generation. Show `discardedCount` as a warning when positive.

- [ ] **Step 4: Implement review and save**

Render a checkbox and editable fields for every draft. Edit array values as newline-delimited text and normalize with `split(/\r?\n/).map(trim).filter(Boolean)`. Provide select-all. Submit only selected valid drafts. On success toast, reset, call `onSaved`; on error show the message while retaining state.

- [ ] **Step 5: Verify wizard tests pass**

Run the focused frontend test command. Expected: PASS.

### Task 5: Page Integration and Verification

**Files:**
- Modify: `frontend/src/pages/pt/ExerciseLibraryPage.tsx`
- Test: `frontend/tests/components/exercises/AiExerciseWizard.test.tsx`

- [ ] **Step 1: Add a failing page integration test**

Render `ExerciseLibraryPage`, click `Tạo bằng AI`, and assert the `Tạo bài tập bằng AI` dialog appears.

- [ ] **Step 2: Wire the page**

Import `Sparkles` and `AiExerciseWizard`, add `aiOpen`, render the secondary AI button beside manual creation, and mount:

```tsx
<AiExerciseWizard open={aiOpen} onClose={() => setAiOpen(false)} onSaved={() => {
  setAiOpen(false);
  void load(meta.page || 1);
}} />
```

Do not change the existing form, deletion, pagination, or shared-library behavior.

- [ ] **Step 3: Apply responsive Tailwind v4 styling**

Use complete, statically discoverable Tailwind v4 class strings in the wizard. Reuse the existing `module-modal`, `module-field`, `module-actions`, and button primitives where they already provide behavior, then use responsive grid, border, spacing, focus-visible, disabled, and motion-reduce utilities for the new layout. Add no global CSS, inline styles, gradient, or dependency.

- [ ] **Step 4: Run focused frontend tests**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/exercises/AiExerciseWizard.test.tsx`

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run `npm run typecheck`, `npm test -- --run`, and `npm run lint` separately. Expected: all exit 0. If unrelated pre-existing failures occur, retain focused feature evidence and report the exact failures separately.

- [ ] **Step 6: Review the diff without staging**

Run `git -c safe.directory='D:/Igen Tech/3S Gym' diff --check`, `git -c safe.directory='D:/Igen Tech/3S Gym' status --short`, and a scoped `git diff` for every file in this plan. Expected: no whitespace errors and no overwritten user changes. Do not stage or commit.
