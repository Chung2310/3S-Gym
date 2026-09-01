# Customer Workout Studio Data Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make customer workout-plan snapshots accept and preserve the same multi-week Studio payload as workout templates.

**Architecture:** Extract the shared Joi schemas and schedule invariant into one validator module consumed by both template and customer-plan endpoints. Extend the customer `WorkoutPlan` scheduled-exercise schema with `weekNumber`, then prove the full create-template → assign-snapshot → no-op-save cycle retains week boundaries without mutating the source template.

**Tech Stack:** TypeScript, Express, Joi, Mongoose, Vitest, mongodb-memory-server.

## Global Constraints

- Do not change Workout Studio UI or routes.
- Do not infer missing week numbers in legacy records; missing `weekNumber` means week 1.
- Customer snapshots remain independent from their source templates.
- Keep strict validation; do not allow unknown payload fields.
- Preserve unrelated workspace changes.

---

### Task 1: Shared Studio validation contract

**Files:**
- Create: `backend/validators/workoutPlanFields.ts`
- Modify: `backend/validators/workoutValidator.ts`
- Modify: `backend/validators/customerWorkoutPlanValidator.ts`
- Test: `backend/tests/customerWorkoutStudioParity.test.ts`

**Interfaces:**
- Produces: `studioPlanFields: Record<string, Joi.Schema>` for metadata, scheduled/unscheduled exercises and sessions.
- Produces: `validateStudioSchedule(value: Record<string, unknown>, helpers: Joi.CustomHelpers)` for duration and overlap validation.
- Consumes: `commonMessages` and `objectId` from `backend/validators/commonValidator.ts`.

- [x] **Step 1: Write the failing customer PATCH validation tests**

Create `backend/tests/customerWorkoutStudioParity.test.ts` with a valid two-week Studio payload and assertions that:

```ts
const studioPayload = {
  title: 'Giáo án 2 tuần',
  goal: 'Tăng sức mạnh',
  level: 'BEGINNER',
  durationDays: 14,
  scheduledExercises: [
    { weekNumber: 1, dayNumber: 1, startMinute: 480, durationMinutes: 60, name: 'Squat', trackingType: 'STRENGTH', prescription: { sets: 3, reps: '10' } },
    { weekNumber: 2, dayNumber: 1, startMinute: 480, durationMinutes: 60, name: 'Row', trackingType: 'STRENGTH', prescription: { sets: 3, reps: '10' } },
  ],
  unscheduledExercises: [],
};

expect(updateCustomerPlanSchema.body!.validate(studioPayload).error).toBeUndefined();
expect(updateWorkoutTemplateSchema.body!.validate(studioPayload).error).toBeUndefined();
```

Add focused cases proving same-week overlap fails, cross-week same-time succeeds, and `startMinute: 481` fails the 15-minute rule.

- [x] **Step 2: Run the validator tests and verify RED**

Run:

```powershell
npx vitest run backend/tests/customerWorkoutStudioParity.test.ts
```

Expected: FAIL because `updateCustomerPlanSchema` rejects `scheduledExercises[*].weekNumber`.

- [x] **Step 3: Extract the shared Joi contract**

Create `backend/validators/workoutPlanFields.ts` exporting:

```ts
export const studioPlanFields = {
  title: Joi.string().trim(),
  goal: Joi.string().trim().min(1),
  level: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
  durationDays: Joi.number().integer().min(1).max(365),
  muscleGroups: Joi.array().items(Joi.string().trim().min(1).max(100)).max(20),
  defaultSets: Joi.number().integer().min(1).max(100),
  defaultReps: Joi.string().trim().allow('').max(100),
  defaultWeight: Joi.string().trim().allow('').max(100),
  defaultTempo: Joi.string().trim().allow('').max(100),
  technicalNotes: Joi.string().trim().allow('').max(2000),
  scheduledExercises: Joi.array().items(scheduledExercise),
  unscheduledExercises: Joi.array().items(unscheduledExercise),
  sessions: Joi.array().min(1).items(templateSession),
};
```

The shared `scheduledExercise` must define `weekNumber` with `.integer().min(1).default(1)`, `dayNumber` from 1 through 7, and time fields as multiples of 15. Export `validateStudioSchedule` using absolute day index and matching overlap only when week and day are equal.

Update `workoutValidator.ts` to compose `{ ...studioPlanFields, generatedExercises }`. Update `customerWorkoutPlanValidator.ts` to use `Joi.object(studioPlanFields).min(1).custom(validateStudioSchedule)` and remove its duplicated exercise schemas.

- [x] **Step 4: Run validator tests and verify GREEN**

Run:

```powershell
npx vitest run backend/tests/customerWorkoutStudioParity.test.ts backend/tests/aiWorkoutService.test.ts
```

Expected: both files PASS; template and customer validation share the same Studio behavior.

### Task 2: Preserve week numbers in customer snapshots

**Files:**
- Modify: `backend/models/WorkoutPlan.ts`
- Extend test: `backend/tests/customerWorkoutStudioParity.test.ts`

**Interfaces:**
- Consumes: `assignCustomerWorkoutPlan` and `updateCustomerWorkoutPlan` from `backend/services/customerWorkoutPlanService.ts`.
- Produces: persisted `WorkoutPlan.scheduledExercises[*].weekNumber: number`, defaulting to 1.

- [x] **Step 1: Add the failing snapshot round-trip test**

Use `MongoMemoryServer`, create a PT, assigned customer and 14-day template with exercises in weeks 1 and 2. Assert:

```ts
const assigned = await assignCustomerWorkoutPlan(actor, customer.id, template.id);
expect(assigned.scheduledExercises.map((item) => item.weekNumber)).toEqual([1, 2]);

const sourceBefore = await WorkoutTemplate.findById(template.id).lean();
await updateCustomerWorkoutPlan(actor, customer.id, assigned.id, {
  title: assigned.title,
  goal: assigned.goal,
  level: assigned.level,
  durationDays: assigned.durationDays,
  scheduledExercises: assigned.scheduledExercises.map((item) => item.toObject()),
  unscheduledExercises: [],
});

const reloaded = await WorkoutPlan.findById(assigned.id).lean();
expect(reloaded?.scheduledExercises.map((item) => item.weekNumber)).toEqual([1, 2]);
expect(await WorkoutTemplate.findById(template.id).lean()).toEqual(sourceBefore);
```

- [x] **Step 2: Run the round-trip test and verify RED**

Run:

```powershell
npx vitest run backend/tests/customerWorkoutStudioParity.test.ts
```

Expected: FAIL because `WorkoutPlan` strips `weekNumber` from assigned scheduled exercises.

- [x] **Step 3: Add weekNumber to the WorkoutPlan schema**

Modify `scheduledExerciseSchema` in `backend/models/WorkoutPlan.ts`:

```ts
weekNumber: { type: Number, min: 1, default: 1 },
dayNumber: { type: Number, required: true, min: 1, max: 7 },
```

Keep the remaining exercise/tracking fields unchanged. Do not add a migration; frontend hydration and the model default treat legacy missing values as week 1.

- [x] **Step 4: Run parity and customer-plan tests and verify GREEN**

Run:

```powershell
npx vitest run backend/tests/customerWorkoutStudioParity.test.ts backend/tests/aiWorkoutService.test.ts
```

Expected: PASS with week numbers `[1, 2]` after assignment and after no-op update.

### Task 3: Full regression verification and delivery

**Files:**
- Modify: `docs/superpowers/plans/2026-09-01-customer-workout-studio-data-parity.md` only to mark completed checkboxes if useful.

**Interfaces:**
- Consumes: the shared validator module and updated WorkoutPlan schema from Tasks 1 and 2.
- Produces: one verified implementation commit on `feat/super-admin-account-management`.

- [x] **Step 1: Run full automated verification**

Run:

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all tests pass, typecheck exits 0, lint has no errors, and Vite production build exits 0. Existing non-blocking lint and chunk-size warnings may remain.

- [x] **Step 2: Review the final diff**

Run:

```powershell
git diff --check
git status --short
git diff -- backend/validators/workoutPlanFields.ts backend/validators/workoutValidator.ts backend/validators/customerWorkoutPlanValidator.ts backend/models/WorkoutPlan.ts
```

Expected: no conflict markers or whitespace errors; no unrelated file is staged.

- [ ] **Step 3: Commit the implementation**

```powershell
git add backend/validators/workoutPlanFields.ts backend/validators/workoutValidator.ts backend/validators/customerWorkoutPlanValidator.ts backend/models/WorkoutPlan.ts docs/superpowers/plans/2026-09-01-customer-workout-studio-data-parity.md
git commit -m "fix: align customer workout studio data"
```

- [ ] **Step 4: Push the existing feature branch**

```powershell
git push origin feat/super-admin-account-management
```

Expected: remote branch advances to the implementation commit without force push.
