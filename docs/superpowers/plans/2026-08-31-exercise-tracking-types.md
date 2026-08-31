# Exercise Tracking Types Implementation Plan

> **Required sub-skill:** Use `superpowers:executing-plans` to implement this plan task-by-task. Apply `superpowers:test-driven-development` to every behavior change and `superpowers:verification-before-completion` before the final commit/push.

**Goal:** Replace the hard-coded weight/reps/RPE/RIR logger with exercise-type-aware prescriptions, results, history, and analytics while preserving legacy strength sessions.

**Architecture:** Define the same discriminated tracking contract at the backend and frontend boundaries. Exercise library records own a default type; plan exercise snapshots own an independently overrideable type and prescription; completed sessions own a trusted immutable plan snapshot plus a typed result. Joi validates external payloads, services normalize legacy data, and analytics aggregate only compatible metrics.

**Tech stack:** TypeScript, React 19, Express 5, Joi 18, Mongoose 9, Vitest 4, Testing Library, Tailwind CSS 4.

**Global constraints:** Existing library and plan records become `UNCLASSIFIED`; no name-based inference. A plan containing `UNCLASSIFIED` exercises cannot be saved or assigned. Existing completed sessions remain readable through `LEGACY_STRENGTH`. The backend resolves the active assigned plan and never accepts the client as the authority for the session snapshot. Migration `002` must be idempotent and report counts in dry-run/status output.

---

## Task 1: Establish the tracking contracts and compatibility helpers

**Files:**

- Create: `backend/types/exerciseTracking.ts`
- Create: `backend/services/exerciseTrackingService.ts`
- Create: `backend/tests/exerciseTrackingService.test.ts`
- Create: `frontend/src/types/exerciseTracking.ts`
- Modify: `frontend/src/types.ts`
- Modify: `frontend/src/types/workout.ts`
- Modify: `frontend/src/types/workoutStudio.ts`
- Modify: `frontend/src/types/progress.ts`

**Step 1: Write failing backend tests**

Cover these exact cases in `exerciseTrackingService.test.ts`:

- every public tracking type has an allowed metric set;
- `normalizePlanExercise` leaves missing types as `UNCLASSIFIED`;
- `normalizeSessionExerciseLog` turns a legacy `sets` log into `LEGACY_STRENGTH` without mutating it;
- incompatible result keys are rejected (for example `weight` on `CARDIO`);
- zero is preserved for valid numeric measurements and empty optional values are removed.

Run:

```powershell
npx vitest run --config vitest.config.ts backend/tests/exerciseTrackingService.test.ts --reporter=verbose
```

Expected: FAIL because the contract and helpers do not exist.

**Step 2: Implement the backend discriminated contract**

Define:

```ts
export const TRACKING_TYPES = ['UNCLASSIFIED', 'STRENGTH', 'BODYWEIGHT', 'CARDIO', 'INTERVAL', 'MOBILITY'] as const;
export type TrackingType = typeof TRACKING_TYPES[number];
export type SessionTrackingType = TrackingType | 'LEGACY_STRENGTH';

export interface StrengthPrescription { sets: number; reps?: string; targetWeight?: number; targetRpe?: number; targetRir?: number; restSeconds?: number }
export interface BodyweightPrescription { sets: number; reps?: string; addedWeight?: number; targetRpe?: number; targetRir?: number; restSeconds?: number }
export interface CardioPrescription { durationMinutes?: number; distanceKm?: number; targetPaceSecondsPerKm?: number; targetHeartRate?: number; inclinePercent?: number; targetRpe?: number }
export interface IntervalPrescription { rounds: number; workSeconds?: number; restSeconds?: number; distanceMetersPerRound?: number; repsPerRound?: number; targetRpe?: number }
export interface MobilityPrescription { durationMinutes?: number; reps?: number; side?: 'LEFT' | 'RIGHT' | 'BOTH'; targetDiscomfort?: number }
```

Add corresponding result shapes, a `TrackingPrescription` union, a `TrackingResult` union, `metricsForTrackingType`, `normalizePlanExercise`, `normalizeSessionExerciseLog`, and `assertCompatibleResult`. Reject `UNCLASSIFIED` for actionable prescriptions/results but permit it while reading old plan/library records.

**Step 3: Mirror the public types in the frontend**

Use the same enum literals and field names. Update workout and progress DTOs so a plan exercise has `trackingType` and `prescription`, while a session log has `trackingType`, `prescribedSnapshot`, and `result`. Keep `sets?` only as an explicitly documented legacy read field.

**Step 4: Run focused tests and typecheck**

```powershell
npx vitest run --config vitest.config.ts backend/tests/exerciseTrackingService.test.ts --reporter=verbose
npm run typecheck
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add backend/types/exerciseTracking.ts backend/services/exerciseTrackingService.ts backend/tests/exerciseTrackingService.test.ts frontend/src/types/exerciseTracking.ts frontend/src/types.ts frontend/src/types/workout.ts frontend/src/types/workoutStudio.ts frontend/src/types/progress.ts
git commit -m "feat: define exercise tracking contracts"
```

## Task 2: Persist tracking defaults, plan prescriptions, and typed session results

**Files:**

- Modify: `backend/models/Exercise.ts`
- Modify: `backend/models/WorkoutTemplate.ts`
- Modify: `backend/models/WorkoutPlan.ts`
- Modify: `backend/models/WorkoutSession.ts`
- Modify: `backend/validators/contentValidator.ts`
- Modify: `backend/validators/workoutValidator.ts`
- Modify: `backend/services/customerWorkoutPlanService.ts`
- Modify: `backend/tests/exercises.test.ts`
- Modify: `backend/tests/customerWorkoutPlans.test.ts`
- Modify: `backend/tests/workoutSessions.test.ts`

**Step 1: Write failing persistence and validation tests**

Assert:

- creating a new exercise without a classified `defaultTrackingType` returns 400;
- a classified exercise round-trips through the API;
- copying an exercise into a template/plan copies its type and prescription;
- modifying the plan item type does not mutate the exercise library record;
- saving or assigning a template/plan with `UNCLASSIFIED` returns a Vietnamese validation error naming the exercise;
- a session document can persist typed results and legacy `sets` remains readable.

Run the three focused test files and confirm failure.

**Step 2: Extend Mongoose schemas**

- `Exercise.defaultTrackingType`: enum, default `UNCLASSIFIED` for existing storage compatibility.
- Template/plan exercise: `exerciseId`, `trackingType`, `prescription: Schema.Types.Mixed`; retain old strength fields during rollout.
- `WorkoutSession`: add `workoutPlanId`, `workoutPlanVersion`, and typed log fields `trackingType`, `prescribedSnapshot`, `result`; keep `templateId` and `sets` optional for legacy reads.

Add indexes for `{ customerId: 1, workoutPlanId: 1, performedAt: -1 }` without removing existing indexes.

**Step 3: Enforce boundary validation and plan invariants**

Create Joi alternatives keyed by `trackingType`. Use `.unknown(false)` inside each `prescription`/`result` object so cardio cannot silently accept strength metrics. Exercise create/update requires a public classified type. Template/plan save validates all scheduled, unscheduled, and session exercises and returns:

```text
Hãy phân loại cách ghi nhận cho bài tập "<name>" trước khi lưu giáo án.
```

**Step 4: Run tests**

```powershell
npx vitest run --config vitest.config.ts backend/tests/exercises.test.ts backend/tests/customerWorkoutPlans.test.ts backend/tests/workoutSessions.test.ts --reporter=verbose
npm run typecheck:backend
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add backend/models backend/validators backend/services/customerWorkoutPlanService.ts backend/tests
git commit -m "feat: persist exercise tracking configuration"
```

## Task 3: Add migration 002 with dry-run counts and rollback metadata

**Files:**

- Create: `backend/migrations/002-exercise-tracking-types.ts`
- Modify: `backend/services/migrationService.ts`
- Modify: `backend/scripts/migrate.ts`
- Modify: `backend/tests/migrationSeed.test.ts`
- Modify: `backend/tests/migrationConcurrency.test.ts`
- Create: `backend/tests/exerciseTrackingMigration.test.ts`

**Step 1: Write failing migration tests**

Seed records that are missing tracking fields. Verify migration 002:

- updates missing Exercise defaults to `UNCLASSIFIED`;
- updates missing template and plan item types to `UNCLASSIFIED` without inventing prescriptions;
- leaves existing explicit values unchanged;
- is idempotent;
- reports matched/modified counts for each collection in dry-run;
- records enough metadata to roll back only fields introduced by this migration;
- shares the existing lock so concurrent runners apply it once.

**Step 2: Introduce a migration registry**

Refactor `migrationService.ts` from a single hard-coded migration to an ordered registry containing `001-content-defaults` and `002-exercise-tracking-types`. Preserve the public `runMigrations`, `migrateDown`, and `getMigrationStatus` APIs. A migration's `up` receives `{ dryRun }` and returns serializable counts; `down` uses its stored metadata.

**Step 3: Implement migration 002**

Use explicit `updateMany` filters for missing/null fields. For nested exercise arrays, load only matching documents, update only missing `trackingType`, and use `bulkWrite`; do not infer from exercise names. Store modified document IDs and changed paths for reversible down migration.

Add `--dry-run` parsing to `backend/scripts/migrate.ts` and print counts without recording the migration.

**Step 4: Run migration tests**

```powershell
npx vitest run --config vitest.config.ts backend/tests/migrationSeed.test.ts backend/tests/migrationConcurrency.test.ts backend/tests/exerciseTrackingMigration.test.ts --reporter=verbose
npm run typecheck:backend
```

Expected: PASS.

**Step 5: Commit**

```powershell
git add backend/migrations backend/services/migrationService.ts backend/scripts/migrate.ts backend/tests
git commit -m "feat: migrate exercise tracking types"
```

## Task 4: Add tracking type to the exercise library

**Files:**

- Modify: `frontend/src/components/exercises/ExerciseFormModal.tsx`
- Modify: `frontend/src/components/exercises/ExerciseLibraryCard.tsx`
- Modify: `frontend/src/pages/pt/ExerciseLibraryPage.tsx`
- Modify: `frontend/tests/components/exercises/ExerciseLibrary.test.tsx`
- Create: `frontend/tests/components/exercises/ExerciseFormModal.test.tsx`

**Step 1: Write failing UI tests**

Verify the form requires “Cách ghi nhận”, exposes the five classified options in Vietnamese, sends `defaultTrackingType`, and shows API validation errors. Verify cards show a readable tracking badge and the page can filter by tracking type, including “Chưa phân loại” for migrated records.

**Step 2: Implement the form, badge, and filter**

Use a shared frontend label map:

```ts
STRENGTH: 'Sức mạnh · mức tạ'
BODYWEIGHT: 'Trọng lượng cơ thể'
CARDIO: 'Cardio · quãng đường/thời gian'
INTERVAL: 'Interval · hiệp làm/nghỉ'
MOBILITY: 'Mobility · thời lượng/biên độ'
UNCLASSIFIED: 'Chưa phân loại'
```

New forms start with no valid selection and cannot submit until classified. Editing an old record displays `UNCLASSIFIED` and requires choosing a valid type before save. Keep the visual language aligned with the current library cards and design tokens.

**Step 3: Verify and commit**

```powershell
npx vitest run --config vitest.config.ts frontend/tests/components/exercises/ExerciseLibrary.test.tsx frontend/tests/components/exercises/ExerciseFormModal.test.tsx --reporter=verbose
npm run typecheck
git add frontend/src/components/exercises frontend/src/pages/pt/ExerciseLibraryPage.tsx frontend/tests/components/exercises
git commit -m "feat: classify exercise tracking in library"
```

## Task 5: Make plan prescriptions type-aware and overrideable

**Files:**

- Create: `frontend/src/components/workouts/tracking/TrackingTypeSelect.tsx`
- Create: `frontend/src/components/workouts/tracking/PrescriptionEditor.tsx`
- Create: `frontend/src/utils/exerciseTracking.ts`
- Modify: `frontend/src/components/workouts/WorkoutBuilder.tsx`
- Modify: `frontend/src/components/workout-studio/ExercisePalette.tsx`
- Modify: `frontend/src/pages/pt/WorkoutStudioPage.tsx`
- Modify: `frontend/src/services/workoutPlanMapper.ts`
- Modify: `frontend/tests/components/workouts/WorkoutBuilder.test.tsx`
- Modify: `frontend/tests/pages/WorkoutStudioPage.test.tsx`
- Create: `frontend/tests/utils/exerciseTracking.test.ts`

**Step 1: Write failing mapper and component tests**

Cover:

- adding a classified library exercise copies its default tracking type and a type-specific default prescription;
- cardio does not receive `sets: 3` or `reps: '10'`;
- changing a plan item's type replaces incompatible prescription fields after confirmation;
- editing prescription affects only the plan item;
- save is blocked and the first invalid exercise is focused when any item is `UNCLASSIFIED`;
- older loaded plans normalize missing types to `UNCLASSIFIED` instead of strength.

**Step 2: Implement pure defaults and cleaning helpers**

`defaultPrescriptionFor(type)` returns:

- strength/bodyweight: `{ sets: 3, reps: '10', restSeconds: 60 }`;
- cardio: `{ durationMinutes: 20 }`;
- interval: `{ rounds: 6, workSeconds: 30, restSeconds: 30 }`;
- mobility: `{ durationMinutes: 5, side: 'BOTH' }`;
- unclassified: `{}`.

`changeTrackingType` discards incompatible keys and starts from the new defaults. `normalizePlanExercise` never classifies by name.

**Step 3: Implement plan controls**

Show the type selector and the relevant prescription editor on each selected exercise. Keep the library default visible as context, but label plan changes “Chỉ áp dụng cho giáo án này”. Serialize `trackingType` and `prescription` through `workoutPlanMapper` for scheduled, unscheduled, and session exercises.

**Step 4: Verify and commit**

```powershell
npx vitest run --config vitest.config.ts frontend/tests/utils/exerciseTracking.test.ts frontend/tests/components/workouts/WorkoutBuilder.test.tsx frontend/tests/pages/WorkoutStudioPage.test.tsx --reporter=verbose
npm run typecheck
git add frontend/src/components/workouts frontend/src/components/workout-studio frontend/src/pages/pt/WorkoutStudioPage.tsx frontend/src/services/workoutPlanMapper.ts frontend/src/utils/exerciseTracking.ts frontend/tests
git commit -m "feat: configure tracking per workout plan"
```

## Task 6: Trust the assigned plan when creating a workout session

**Files:**

- Modify: `backend/services/workoutProgressService.ts`
- Modify: `backend/services/customerWorkoutPlanService.ts`
- Modify: `backend/validators/workoutValidator.ts`
- Modify: `backend/tests/workoutSessions.test.ts`
- Modify: `backend/tests/transactionAtomicity.test.ts`
- Create: `backend/tests/workoutSessionPlanSnapshot.test.ts`

**Step 1: Write failing service tests**

Assert:

- a PT can log only against the customer's currently assigned plan;
- stale `workoutPlanVersion` is rejected with 409 and asks the UI to refresh;
- a forged client snapshot, exercise name, tracking type, or prescription is ignored/rejected;
- the service snapshots the selected plan session and each prescribed exercise;
- results must match the snapshotted tracking type;
- `ABSENT` accepts no exercise results and other attendance states require the selected session's exercises;
- the idempotency/transaction behavior from existing tests is preserved.

**Step 2: Change the command boundary**

The create payload contains only:

```ts
{
  customerId: string;
  workoutPlanId: string;
  workoutPlanVersion: number;
  sessionIndex: number;
  performedAt: string;
  attendance: 'PRESENT' | 'LATE' | 'ABSENT';
  exerciseResults: Array<{ exerciseId?: string; exerciseIndex: number; result: TrackingResult; notes?: string }>;
  feeling?: string;
  notes?: string;
}
```

Resolve the plan with PT/customer ownership, active assignment, id, and version. Build `planSnapshot` and exercise log identity/prescription entirely from that document. Save `workoutPlanId`/version on the session. Keep the old template/session reader only for existing persisted records, not for new writes.

**Step 3: Verify and commit**

```powershell
npx vitest run --config vitest.config.ts backend/tests/workoutSessions.test.ts backend/tests/workoutSessionPlanSnapshot.test.ts backend/tests/transactionAtomicity.test.ts --reporter=verbose
npm run typecheck:backend
git add backend/services backend/validators/workoutValidator.ts backend/tests
git commit -m "fix: snapshot assigned plan for workout sessions"
```

## Task 7: Replace the hard-coded logger with typed result editors

**Files:**

- Create: `frontend/src/components/progress/tracking/StrengthResultEditor.tsx`
- Create: `frontend/src/components/progress/tracking/BodyweightResultEditor.tsx`
- Create: `frontend/src/components/progress/tracking/CardioResultEditor.tsx`
- Create: `frontend/src/components/progress/tracking/IntervalResultEditor.tsx`
- Create: `frontend/src/components/progress/tracking/MobilityResultEditor.tsx`
- Modify: `frontend/src/components/progress/WorkoutSessionLogger.tsx`
- Modify: `frontend/tests/components/progress/WorkoutSessionLogger.test.tsx`
- Create: `frontend/tests/components/progress/TrackingResultEditors.test.tsx`

**Step 1: Write failing interaction tests**

Test each editor's visible fields. Specifically prove running/cardio has no “Mức tạ”, strength renders explicit “Set 1/2/3”, add/remove set updates the result, bodyweight added weight is optional, interval supports rounds and work/rest, mobility supports side/discomfort, and `ABSENT` hides result editors. Verify submission sends plan id/version/session index and result-only payload, not a client snapshot.

**Step 2: Implement controlled editors**

Each editor receives `{ prescription, value, onChange }` and emits only its compatible result shape. Numeric inputs convert empty strings to `undefined`, preserve zero where valid, and use metric units in labels. Strength/bodyweight sets have stable client IDs for rendering but strip them before POST.

For `UNCLASSIFIED`, render a blocking callout:

```text
Bài tập này chưa có cách ghi nhận. Hãy cập nhật giáo án trước khi ghi buổi tập.
```

Do not silently fall back to strength.

**Step 3: Verify and commit**

```powershell
npx vitest run --config vitest.config.ts frontend/tests/components/progress/WorkoutSessionLogger.test.tsx frontend/tests/components/progress/TrackingResultEditors.test.tsx --reporter=verbose
npm run typecheck
git add frontend/src/components/progress frontend/tests/components/progress
git commit -m "feat: log exercise results by tracking type"
```

## Task 8: Render typed and legacy workout history

**Files:**

- Create: `frontend/src/components/progress/tracking/TrackingResultSummary.tsx`
- Modify: `frontend/src/components/progress/WorkoutSessionDetail.tsx`
- Modify: `frontend/src/components/customer-portal/CustomerSessions.tsx`
- Modify: `frontend/src/components/customer-portal/CustomerJourney.tsx`
- Modify: `frontend/tests/components/progress/WorkoutSessionLogger.test.tsx`
- Create: `frontend/tests/components/progress/TrackingResultSummary.test.tsx`

**Step 1: Write failing rendering tests**

Create one fixture per type plus one old `sets` fixture. Assert each summary displays only meaningful metrics and correct units. The old fixture must be labeled as legacy strength and preserve weight, reps, RPE, and volume; zero values must remain visible.

**Step 2: Implement the summary switch**

Normalize session DTOs at the display boundary. Render compact metric cards/rows by `trackingType`, share the same component in PT and customer portals, and include a subtle “Dữ liệu cũ” badge only for `LEGACY_STRENGTH`.

**Step 3: Verify and commit**

```powershell
npx vitest run --config vitest.config.ts frontend/tests/components/progress/WorkoutSessionLogger.test.tsx frontend/tests/components/progress/TrackingResultSummary.test.tsx --reporter=verbose
npm run typecheck
git add frontend/src/components/progress frontend/src/components/customer-portal frontend/tests/components/progress
git commit -m "feat: render typed workout session history"
```

## Task 9: Aggregate useful metrics without mixing units

**Files:**

- Modify: `backend/services/progressAnalyticsService.ts`
- Modify: `backend/services/customerJourneyService.ts`
- Modify: `backend/tests/progressAnalytics.test.ts`
- Create: `backend/tests/trackingAnalytics.test.ts`
- Modify: `frontend/src/types/progress.ts`
- Modify: `frontend/src/components/progress/ProgressOverview.tsx`
- Modify: `frontend/src/components/progress/ProgressSnapshot.tsx`
- Create: `frontend/src/components/progress/TrackingAnalytics.tsx`
- Modify: `frontend/tests/components/progress/ProgressPrimitives.test.tsx`
- Create: `frontend/tests/components/progress/TrackingAnalytics.test.tsx`

**Step 1: Write failing backend aggregation tests**

Expected analytics shape:

```ts
{
  totalSessions: number;
  averageRpe: number | null;
  attendance: { present: number; late: number; absent: number; rate: number | null };
  streakWeeks: number;
  tracking: {
    strength: { totalVolumeKg: number; maxWeightKg: number | null; maxReps: number | null; estimated1RmKg: number | null };
    bodyweight: { totalReps: number; maxReps: number | null; maxAddedWeightKg: number | null };
    cardio: { durationMinutes: number; distanceKm: number; bestPaceSecondsPerKm: number | null; averageHeartRate: number | null };
    interval: { totalRounds: number; workSeconds: number; restSeconds: number };
    mobility: { durationMinutes: number; completedReps: number; averageDiscomfort: number | null };
  };
}
```

Verify absent sessions do not enter exercise aggregates, legacy strength contributes only to strength, pace uses the lowest positive value, average values ignore missing data but include zero where valid, and different units are never combined.

**Step 2: Implement typed aggregators and achievements**

Split pure reducers by tracking type. Keep existing general attendance/streak behavior. Extend achievements with `trackingType`, `unit`, and typed kinds for strength max, bodyweight reps, cardio distance/duration/pace, interval rounds, and mobility duration. Preserve existing strength achievements for legacy sessions.

**Step 3: Update Progress UI**

The four general KPI cards become total sessions, attendance, average RPE, and streak. Add `TrackingAnalytics` below them with sections only for types that have data. Avoid showing zero-valued empty sections and label every unit.

**Step 4: Verify and commit**

```powershell
npx vitest run --config vitest.config.ts backend/tests/progressAnalytics.test.ts backend/tests/trackingAnalytics.test.ts frontend/tests/components/progress/ProgressPrimitives.test.tsx frontend/tests/components/progress/TrackingAnalytics.test.tsx --reporter=verbose
npm run typecheck
git add backend/services backend/tests frontend/src/types/progress.ts frontend/src/components/progress frontend/tests/components/progress
git commit -m "feat: add tracking-specific progress analytics"
```

## Task 10: Run migration and end-to-end regression verification

**Files:**

- Modify as failures require; do not weaken assertions or remove legacy compatibility.
- Update: `docs/superpowers/specs/2026-08-31-exercise-tracking-types-design.md` only if implementation uncovered an approved factual correction.

**Step 1: Inspect migration status and dry run**

Against the configured development database only:

```powershell
npm run db:migrate:status
npm run db:migrate -- --dry-run
```

Record the reported counts. Do not run the mutating migration against any shared/production database without separate user authorization.

**Step 2: Run all quality gates**

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all tests/typecheck/build pass; lint has no new warnings relative to the branch baseline.

**Step 3: Review the full diff**

```powershell
git diff --check
git status --short
git diff --stat origin/develop...HEAD
git log --oneline --decorate -12
```

Confirm all design acceptance criteria: no name inference; no hard-coded strength fields for cardio; plans block unclassified items; snapshots come from the assigned plan; legacy sessions render; analytics do not mix units.

**Step 4: Commit any verification fixes**

```powershell
git add backend frontend docs/superpowers/specs/2026-08-31-exercise-tracking-types-design.md
git commit -m "test: verify exercise tracking workflow"
```

Skip this commit if verification made no changes.

**Step 5: Push the authorized feature branch**

```powershell
git push origin chore/develop-sandbox-20260831
```

Report commit hashes, verification results, migration dry-run counts, and any baseline warnings. Do not merge or create a pull request unless the user separately asks.

---

## Plan self-review checklist

- Every approved tracking type appears in persistence, validation, plan editing, logging, history, and analytics.
- Existing Exercise/plan records become `UNCLASSIFIED`; only existing completed set logs adapt to `LEGACY_STRENGTH`.
- Plan type overrides are snapshots and cannot mutate library defaults.
- New session creation trusts the assigned plan id/version and ignores client-authored snapshot data.
- `ABSENT` is handled independently of exercise results.
- TDD precedes implementation in every task and focused tests precede the full suite.
- All file paths, payload fields, metric names, commands, and commit boundaries are explicit; there are no implementation placeholders.
