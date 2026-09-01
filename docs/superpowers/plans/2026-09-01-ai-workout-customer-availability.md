# AI Workout Customer Availability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let PTs enter recurring weekly customer availability in the AI workout wizard, deterministically place generated sessions into those windows, and warn in Studio about overflow sessions.

**Architecture:** Add strict temporary availability contracts to both AI endpoints and a pure backend scheduler that moves week/day exercise groups into fitting recurring slots while preserving exercise offsets. Mirror the temporary contract in frontend types and pure utilities, keep the editor inside the wizard, and derive Studio warnings from the current draft schedule so no availability data is persisted.

**Tech Stack:** TypeScript, React 19, Express 5, Joi 18, Mongoose 9, Vitest, Testing Library, semantic classes in `frontend/src/index.css`.

## Global Constraints

- `availabilitySlots` is required for AI proposal and generation requests but remains temporary and is never stored in MongoDB.
- Slots repeat identically for every week, use `dayNumber` 1–7, and use 15-minute `startMinute`/`endMinute` boundaries.
- Multiple slots per day are allowed; overlapping slots are rejected.
- Generated schedules contain at most one workout session per day.
- Insufficient availability does not block generation; overflow sessions are scheduled outside availability and surfaced as warnings.
- Do not create Calendar events, assign the template to the customer, or change customer/template/plan models.
- Do not send `availabilitySlots` or `scheduleWarnings` to the workout-template save API.
- New UI uses semantic `workout-*` / `studio-*` classes in `frontend/src/index.css`; no inline styles, CSS modules, or new CSS framework.
- Preserve unrelated workspace changes and do not force-push.

---

### Task 1: Temporary availability contracts and API validation

**Files:**
- Create: `backend/types/workoutAvailability.ts`
- Create: `backend/validators/aiWorkoutValidator.ts`
- Modify: `backend/routes/aiWorkout.ts`
- Create: `backend/tests/aiWorkoutAvailability.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `WorkoutAvailabilitySlot`, `WorkoutScheduleWarning`, `workoutProposalRequestSchema`, and `workoutGenerationRequestSchema`.
- Consumes: `commonMessages` and the existing Express validation middleware.

- [ ] **Step 1: Make the backend regression test trackable**

Append exact exceptions after the existing test ignore rules in `.gitignore`:

```gitignore
!backend/tests/aiWorkoutAvailability.test.ts
```

This works because `backend/tests/` is already re-included for the tracked Studio parity test.

- [ ] **Step 2: Write failing API-schema tests**

Create `backend/tests/aiWorkoutAvailability.test.ts` with focused validation cases:

```ts
import { describe, expect, it } from 'vitest';
import { workoutGenerationRequestSchema, workoutProposalRequestSchema } from '../validators/aiWorkoutValidator.js';

const proposal = {
  durationWeeks: 8,
  sessionsPerWeek: 3,
  minutesPerSession: 60,
  level: 'BEGINNER',
  trainingMethod: 'Full body',
  trainingSplit: 'Full body',
  priorityMuscleGroups: [],
  restrictions: [],
};

const availabilitySlots = [
  { dayNumber: 1, startMinute: 1080, endMinute: 1200 },
  { dayNumber: 3, startMinute: 1080, endMinute: 1200 },
];

describe('AI workout availability request validation', () => {
  it('requires availability for proposal and generation requests', () => {
    expect(workoutProposalRequestSchema.body!.validate({ customerId: '507f1f77bcf86cd799439011' }).error).toBeDefined();
    expect(workoutGenerationRequestSchema.body!.validate({ customerId: '507f1f77bcf86cd799439011', proposal }).error).toBeDefined();
  });

  it('accepts recurring non-overlapping 15-minute slots', () => {
    expect(workoutProposalRequestSchema.body!.validate({ customerId: '507f1f77bcf86cd799439011', availabilitySlots }).error).toBeUndefined();
  });

  it.each([
    [{ dayNumber: 0, startMinute: 1080, endMinute: 1200 }],
    [{ dayNumber: 1, startMinute: 1081, endMinute: 1200 }],
    [{ dayNumber: 1, startMinute: 1200, endMinute: 1080 }],
    [{ dayNumber: 1, startMinute: 1080, endMinute: 1200 }, { dayNumber: 1, startMinute: 1140, endMinute: 1260 }],
  ])('rejects invalid availability %#', (slots) => {
    expect(workoutProposalRequestSchema.body!.validate({ customerId: '507f1f77bcf86cd799439011', availabilitySlots: slots }, { abortEarly: false }).error).toBeDefined();
  });
});
```

- [ ] **Step 3: Run the schema tests and verify RED**

Run:

```powershell
npx vitest run backend/tests/aiWorkoutAvailability.test.ts
```

Expected: FAIL because `backend/validators/aiWorkoutValidator.ts` does not exist.

- [ ] **Step 4: Define temporary backend types**

Create `backend/types/workoutAvailability.ts`:

```ts
export interface WorkoutAvailabilitySlot {
  dayNumber: number;
  startMinute: number;
  endMinute: number;
}

export interface WorkoutScheduleWarning {
  type: 'OUTSIDE_AVAILABILITY';
  weekNumber: number;
  dayNumber: number;
  startMinute: number;
  endMinute: number;
}
```

- [ ] **Step 5: Implement reusable Joi schemas**

Create `backend/validators/aiWorkoutValidator.ts`. Use one slot schema and a custom overlap check:

```ts
import Joi from 'joi';
import type { RequestValidationSchema } from '../middlewares/validate.js';
import { commonMessages, objectId } from './commonValidator.js';

const availabilitySlot = Joi.object({
  dayNumber: Joi.number().integer().min(1).max(7).required(),
  startMinute: Joi.number().integer().min(0).max(1425).multiple(15).required(),
  endMinute: Joi.number().integer().min(15).max(1440).multiple(15).greater(Joi.ref('startMinute')).required(),
}).unknown(false).messages(commonMessages);

const availabilitySlots = Joi.array().min(1).items(availabilitySlot).custom((slots, helpers) => {
  const sorted = [...slots].sort((a, b) => a.dayNumber - b.dayNumber || a.startMinute - b.startMinute);
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (previous.dayNumber === current.dayNumber && current.startMinute < previous.endMinute) {
      return helpers.message({ custom: 'Các khung giờ rảnh trong cùng ngày không được chồng nhau.' });
    }
  }
  return slots;
}).messages({ ...commonMessages, custom: '{{#message}}' });

export const workoutProposalFields = {
  durationWeeks: Joi.number().integer().min(4).max(12).required(),
  sessionsPerWeek: Joi.number().integer().min(1).max(7).required(),
  minutesPerSession: Joi.number().integer().min(15).max(240).required(),
  level: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').required(),
  trainingMethod: Joi.string().required(),
  trainingSplit: Joi.string().required(),
  priorityMuscleGroups: Joi.array().items(Joi.string()).required(),
  restrictions: Joi.array().items(Joi.string()).required(),
};

export const workoutProposalRequestSchema: RequestValidationSchema = {
  body: Joi.object({ customerId: objectId.required(), availabilitySlots: availabilitySlots.required() }).messages(commonMessages),
};

export const workoutGenerationRequestSchema: RequestValidationSchema = {
  body: Joi.object({
    customerId: objectId.required(),
    proposal: Joi.object(workoutProposalFields).required(),
    availabilitySlots: availabilitySlots.required(),
    additionalRequest: Joi.string().allow('').max(1000),
  }).messages(commonMessages),
};
```

- [ ] **Step 6: Wire route validation to the shared schemas**

Replace inline Joi objects in `backend/routes/aiWorkout.ts`:

```ts
import { workoutGenerationRequestSchema, workoutProposalRequestSchema } from '../validators/aiWorkoutValidator.js';

router.post('/workout-proposals', authenticate, authorize('PT'), requireFeature('EXERCISE_LIBRARY'), validate(workoutProposalRequestSchema), proposal);
router.post('/workout-generations', authenticate, authorize('PT'), requireFeature('EXERCISE_LIBRARY'), validate(workoutGenerationRequestSchema), generation);
```

Remove the unused direct `Joi` import.

- [ ] **Step 7: Run tests and commit the contract**

Run:

```powershell
npx vitest run backend/tests/aiWorkoutAvailability.test.ts backend/tests/aiWorkoutService.test.ts
npm run typecheck:backend
```

Expected: schema tests PASS; the existing AI service tests still PASS because they call services directly rather than route validation.

Commit:

```powershell
git add .gitignore backend/types/workoutAvailability.ts backend/validators/aiWorkoutValidator.ts backend/routes/aiWorkout.ts backend/tests/aiWorkoutAvailability.test.ts
git commit -m "feat: validate AI workout availability"
```

### Task 2: Deterministic backend session scheduling

**Files:**
- Create: `backend/services/workoutAvailabilityScheduler.ts`
- Modify: `backend/services/aiWorkoutService.ts`
- Modify: `backend/controllers/aiWorkoutController.ts`
- Extend test: `backend/tests/aiWorkoutAvailability.test.ts`
- Modify test: `backend/tests/aiWorkoutService.test.ts`

**Interfaces:**
- Consumes: `WorkoutAvailabilitySlot`, `WorkoutScheduleWarning`, AI scheduled exercise records, and `proposal.sessionsPerWeek`.
- Produces: `scheduleWorkoutSessions(items, availabilitySlots, sessionsPerWeek)` returning `{ scheduledExercises, scheduleWarnings }`.

- [ ] **Step 1: Write failing pure scheduler tests**

Extend `backend/tests/aiWorkoutAvailability.test.ts` with exercises grouped into two sessions. Assert exact placement and offsets:

```ts
import { scheduleWorkoutSessions } from '../services/workoutAvailabilityScheduler.js';

const items = [
  { name: 'Squat', weekNumber: 1, dayNumber: 2, startMinute: 480, durationMinutes: 30 },
  { name: 'Row', weekNumber: 1, dayNumber: 2, startMinute: 510, durationMinutes: 30 },
  { name: 'Run', weekNumber: 1, dayNumber: 4, startMinute: 600, durationMinutes: 60 },
];

it('moves whole sessions into fitting recurring slots and preserves offsets', () => {
  const result = scheduleWorkoutSessions(items, [
    { dayNumber: 1, startMinute: 1080, endMinute: 1140 },
    { dayNumber: 3, startMinute: 1080, endMinute: 1200 },
  ], 2);
  expect(result.scheduledExercises).toEqual([
    expect.objectContaining({ name: 'Squat', dayNumber: 1, startMinute: 1080 }),
    expect.objectContaining({ name: 'Row', dayNumber: 1, startMinute: 1110 }),
    expect.objectContaining({ name: 'Run', dayNumber: 3, startMinute: 1080 }),
  ]);
  expect(result.scheduleWarnings).toEqual([]);
});

it('uses at most one slot per day and warns for overflow sessions', () => {
  const result = scheduleWorkoutSessions(items, [
    { dayNumber: 1, startMinute: 1080, endMinute: 1200 },
    { dayNumber: 1, startMinute: 1200, endMinute: 1320 },
  ], 2);
  expect(new Set(result.scheduledExercises.map((item) => item.dayNumber)).size).toBe(2);
  expect(result.scheduleWarnings).toEqual([expect.objectContaining({ type: 'OUTSIDE_AVAILABILITY', weekNumber: 1 })]);
});
```

Add these exact boundary cases:

```ts
it('reuses recurring availability in every week', () => {
  const result = scheduleWorkoutSessions([
    { name: 'Week 1', weekNumber: 1, dayNumber: 2, startMinute: 480, durationMinutes: 60 },
    { name: 'Week 2', weekNumber: 2, dayNumber: 4, startMinute: 480, durationMinutes: 60 },
  ], [{ dayNumber: 1, startMinute: 1080, endMinute: 1140 }], 1);
  expect(result.scheduledExercises.map((item) => [item.weekNumber, item.dayNumber, item.startMinute])).toEqual([
    [1, 1, 1080],
    [2, 1, 1080],
  ]);
});

it('falls back when the only slot is too short', () => {
  const result = scheduleWorkoutSessions([
    { name: 'Long session', weekNumber: 1, dayNumber: 2, startMinute: 480, durationMinutes: 60 },
  ], [{ dayNumber: 1, startMinute: 1080, endMinute: 1110 }], 1);
  expect(result.scheduleWarnings).toHaveLength(1);
});

it('rejects more sessions than the approved weekly frequency', () => {
  expect(() => scheduleWorkoutSessions([
    { name: 'A', weekNumber: 1, dayNumber: 1, startMinute: 480, durationMinutes: 60 },
    { name: 'B', weekNumber: 1, dayNumber: 2, startMinute: 480, durationMinutes: 60 },
  ], [{ dayNumber: 1, startMinute: 1080, endMinute: 1200 }], 1)).toThrow(/số buổi/i);
});

it('rejects a session footprint that cannot fit inside 24 hours', () => {
  expect(() => scheduleWorkoutSessions([
    { name: 'A', weekNumber: 1, dayNumber: 1, startMinute: 1380, durationMinutes: 120 },
  ], [{ dayNumber: 1, startMinute: 1080, endMinute: 1200 }], 1)).toThrow(/24 giờ/i);
});
```

- [ ] **Step 2: Run scheduler tests and verify RED**

Run:

```powershell
npx vitest run backend/tests/aiWorkoutAvailability.test.ts
```

Expected: FAIL because the scheduler module does not exist.

- [ ] **Step 3: Implement the pure scheduler**

Create `backend/services/workoutAvailabilityScheduler.ts` with this public shape:

```ts
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { WorkoutAvailabilitySlot, WorkoutScheduleWarning } from '../types/workoutAvailability.js';

export interface SchedulableExercise extends Record<string, unknown> {
  weekNumber: number;
  dayNumber: number;
  startMinute: number;
  durationMinutes: number;
}

export function scheduleWorkoutSessions<T extends SchedulableExercise>(
  items: T[],
  availabilitySlots: WorkoutAvailabilitySlot[],
  sessionsPerWeek: number,
): { scheduledExercises: T[]; scheduleWarnings: WorkoutScheduleWarning[] };
```

Implementation requirements:

1. Group by `${weekNumber}:${dayNumber}` and sort exercises by `startMinute`.
2. Compute each group start, end, duration, and per-exercise offset.
3. Reject a week with more groups than `sessionsPerWeek` using `AppError` status 502 / `ERROR_CODES.EXTERNAL`.
4. For each week, sort groups and slots; assign the earliest unused day whose slot duration fits the group.
5. Move every exercise in the group to `slot.startMinute + offset`.
6. If no slot fits, choose the original unused day or the earliest unused day, clamp/snap the original start to a legal 15-minute value, and append one `OUTSIDE_AVAILABILITY` warning for the whole group.
7. Sort the returned exercises by week/day/start and warnings by week/day/start.

- [ ] **Step 4: Extend AI service inputs and prompts**

Modify `backend/services/aiWorkoutService.ts`:

```ts
import type { WorkoutAvailabilitySlot } from '../types/workoutAvailability.js';
import { scheduleWorkoutSessions } from './workoutAvailabilityScheduler.js';

export interface WorkoutGenerationInput {
  customerId: string;
  proposal: WorkoutProposal;
  availabilitySlots: WorkoutAvailabilitySlot[];
  additionalRequest?: string;
}

export async function createWorkoutProposal(
  user: AuthenticatedUser,
  customerId: string,
  availabilitySlots: WorkoutAvailabilitySlot[],
  requestKey: string,
): Promise<WorkoutProposal>;
```

Include `JSON.stringify(availabilitySlots)` and explicit recurring/one-session-per-day instructions in both provider prompts. After mapping/validating the AI exercises, call:

```ts
const scheduled = scheduleWorkoutSessions(scheduledExercises, input.availabilitySlots, proposal.sessionsPerWeek);
return {
  ...draft,
  scheduledExercises: scheduled.scheduledExercises,
  availabilitySlots: input.availabilitySlots,
  scheduleWarnings: scheduled.scheduleWarnings,
  generatedExercises,
};
```

- [ ] **Step 5: Pass availability through the proposal controller**

Modify `backend/controllers/aiWorkoutController.ts`:

```ts
export const proposal = asyncHandler(async (req, res) => success(res, {
  message: 'AI đã tạo đề xuất giáo án. PT hãy kiểm tra trước khi tạo chi tiết.',
  data: await createWorkoutProposal(req.user!, req.body.customerId, req.body.availabilitySlots, req.requestId!),
}));
```

Generation already passes the complete body to `generateWorkoutDraft`.

- [ ] **Step 6: Update and extend service tests**

Update direct calls in `backend/tests/aiWorkoutService.test.ts` to pass `availabilitySlots`. Capture mocked provider calls and assert both prompts include the exact slots. Make the generation mock contain two distinct day groups and assert the result is relocated into the supplied windows and echoes warnings/availability.

- [ ] **Step 7: Run backend tests and commit the scheduler**

Run:

```powershell
npx vitest run backend/tests/aiWorkoutAvailability.test.ts backend/tests/aiWorkoutService.test.ts backend/tests/aiWorkoutApi.test.ts
npm run typecheck:backend
npm run lint:backend
```

Expected: all selected tests PASS; typecheck/lint exit 0.

Commit:

```powershell
git add backend/services/workoutAvailabilityScheduler.ts backend/services/aiWorkoutService.ts backend/controllers/aiWorkoutController.ts backend/tests/aiWorkoutAvailability.test.ts backend/tests/aiWorkoutService.test.ts
git commit -m "feat: schedule AI workouts around availability"
```

### Task 3: Wizard availability editor and request flow

**Files:**
- Create: `frontend/src/types/workoutAvailability.ts`
- Modify: `frontend/src/types.ts`
- Create: `frontend/src/services/workoutAvailability.ts`
- Create: `frontend/src/components/workouts/WorkoutAvailabilityEditor.tsx`
- Modify: `frontend/src/components/workouts/AiWorkoutWizard.tsx`
- Modify: `frontend/src/index.css`
- Create: `frontend/tests/services/workoutAvailability.test.ts`
- Modify: `frontend/tests/components/workouts/AiWorkoutWizard.test.tsx`
- Modify: `frontend/tests/components/IndexCssRedesignContract.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: frontend `WorkoutAvailabilitySlot`, `WorkoutScheduleWarning`, `availabilityError`, `availabilitySummary`, `outsideAvailabilityWarnings`, and the editor component.
- Consumes: AI API endpoints and existing wizard state.

- [ ] **Step 1: Make the frontend tests trackable**

Append exact ordered exceptions to `.gitignore`:

```gitignore
!frontend/tests/
frontend/tests/*
!frontend/tests/services/
frontend/tests/services/*
!frontend/tests/services/workoutAvailability.test.ts
!frontend/tests/components/
frontend/tests/components/*
!frontend/tests/components/workouts/
frontend/tests/components/workouts/*
!frontend/tests/components/workouts/AiWorkoutWizard.test.tsx
!frontend/tests/components/IndexCssRedesignContract.test.ts
!frontend/tests/pages/
frontend/tests/pages/*
!frontend/tests/pages/pt/
frontend/tests/pages/pt/*
!frontend/tests/pages/pt/WorkoutStudioAvailability.test.tsx
```

- [ ] **Step 2: Write failing pure frontend tests**

Create `frontend/tests/services/workoutAvailability.test.ts` for:

```ts
import { availabilityError, availabilitySummary, outsideAvailabilityWarnings } from '../../src/services/workoutAvailability';

it('rejects empty and overlapping availability', () => {
  expect(availabilityError([])).toContain('ít nhất một');
  expect(availabilityError([
    { dayNumber: 1, startMinute: 1080, endMinute: 1200 },
    { dayNumber: 1, startMinute: 1140, endMinute: 1260 },
  ])).toContain('chồng');
});

it('summarizes unique days and total slots', () => {
  expect(availabilitySummary([
    { dayNumber: 1, startMinute: 1080, endMinute: 1200 },
    { dayNumber: 1, startMinute: 1200, endMinute: 1320 },
    { dayNumber: 3, startMinute: 1080, endMinute: 1200 },
  ])).toEqual({ dayCount: 2, slotCount: 3 });
});

it('finds session envelopes outside recurring availability', () => {
  const warnings = outsideAvailabilityWarnings([
    { weekNumber: 1, dayNumber: 1, startMinute: 1080, durationMinutes: 30 },
    { weekNumber: 1, dayNumber: 1, startMinute: 1110, durationMinutes: 30 },
    { weekNumber: 2, dayNumber: 2, startMinute: 1080, durationMinutes: 60 },
  ], [{ dayNumber: 1, startMinute: 1080, endMinute: 1200 }]);
  expect(warnings).toEqual([expect.objectContaining({ weekNumber: 2, dayNumber: 2 })]);
});
```

- [ ] **Step 3: Run frontend service tests and verify RED**

Run:

```powershell
npx vitest run frontend/tests/services/workoutAvailability.test.ts
```

Expected: FAIL because the type/service modules do not exist.

- [ ] **Step 4: Implement frontend types and pure utilities**

Create `frontend/src/types/workoutAvailability.ts` matching backend types and export it from `frontend/src/types.ts`:

```ts
export interface WorkoutAvailabilitySlot { dayNumber: number; startMinute: number; endMinute: number }
export interface WorkoutScheduleWarning { type: 'OUTSIDE_AVAILABILITY'; weekNumber: number; dayNumber: number; startMinute: number; endMinute: number }
```

Create `frontend/src/services/workoutAvailability.ts` exporting:

```ts
export function availabilityError(slots: WorkoutAvailabilitySlot[]): string | undefined;
export function availabilitySummary(slots: WorkoutAvailabilitySlot[]): { dayCount: number; slotCount: number };
export function outsideAvailabilityWarnings(
  items: Array<Pick<ScheduledExercise, 'weekNumber' | 'dayNumber' | 'startMinute' | 'durationMinutes'>>,
  slots: WorkoutAvailabilitySlot[],
): WorkoutScheduleWarning[];
export function minuteLabel(value: number): string;
export function weekdayLabel(dayNumber: number): string;
```

Use the same sort, 15-minute, overlap and session-envelope rules as backend.

- [ ] **Step 5: Write failing wizard interaction tests**

Extend `frontend/tests/components/workouts/AiWorkoutWizard.test.tsx` with explicit interactions:

1. clicking analyze without slots shows the required error and does not call `api.post`;
2. PT can add a Monday slot, select `18:00` and `20:00`, and the proposal request contains `availabilitySlots`;
3. the same slots are preserved through back/next and included in generation request;
4. a rejected request leaves the customer and slots intact;
5. review/configuration steps display `2 ngày rảnh · 3 khung giờ` for a multi-slot schedule.

Use this request assertion pattern after selecting a customer and adding Monday `18:00–20:00`:

```ts
await user.click(screen.getByRole('button', { name: 'Thêm khung giờ Thứ 2' }));
await user.clear(screen.getByLabelText('Bắt đầu Thứ 2, khung 1'));
await user.type(screen.getByLabelText('Bắt đầu Thứ 2, khung 1'), '18:00');
await user.clear(screen.getByLabelText('Kết thúc Thứ 2, khung 1'));
await user.type(screen.getByLabelText('Kết thúc Thứ 2, khung 1'), '20:00');
await user.click(screen.getByRole('button', { name: 'Phân tích bằng AI' }));
expect(api.post).toHaveBeenNthCalledWith(1, '/api/ai/workout-proposals', {
  customerId: 'customer-1',
  availabilitySlots: [{ dayNumber: 1, startMinute: 1080, endMinute: 1200 }],
});
```

After advancing through configuration and generation, assert:

```ts
expect(api.post).toHaveBeenNthCalledWith(2, '/api/ai/workout-generations', expect.objectContaining({
  customerId: 'customer-1',
  availabilitySlots: [{ dayNumber: 1, startMinute: 1080, endMinute: 1200 }],
}));
```

- [ ] **Step 6: Implement the editor and wizard integration**

Create `WorkoutAvailabilityEditor.tsx` as a controlled component:

```ts
interface Props {
  value: WorkoutAvailabilitySlot[];
  disabled?: boolean;
  onChange(value: WorkoutAvailabilitySlot[]): void;
}
```

Render seven semantic day rows, an `Thêm khung giờ Thứ N` button, `<input type="time" step="900">` controls, and an accessible delete button per slot. Convert between `HH:mm` and minutes in the frontend service; new slots default to `18:00–19:00`.

Modify `AiWorkoutWizard.tsx` to:

- hold `availabilitySlots` in state;
- render the editor in step 0 below customer selection;
- call `availabilityError` before proposal;
- post `{ customerId, availabilitySlots }` to proposals;
- post `{ customerId, proposal, availabilitySlots, additionalRequest: '' }` to generations;
- show availability summary in steps 1 and 3;
- keep slots unchanged on errors and back navigation.

- [ ] **Step 7: Add semantic responsive styles and CSS contract coverage**

Add selectors such as:

```css
.workout-availability { display: grid; gap: 12px; }
.workout-availability-day { border: 1px solid #dce8f0; border-radius: 12px; padding: 12px; background: #fff; }
.workout-availability-slot { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto; gap: 8px; align-items: end; }
```

Use `#dce8f0`, `#f8fbfc`, `#fff`, `var(--primary-color)`, and `var(--secondary-color)` to match the adjacent wizard styles. Under the existing `@media (max-width: 639px)` block, change `.workout-availability-slot` to a two-column layout and place its delete action on the second row. Extend `workoutFlowSources` in `IndexCssRedesignContract.test.ts` with `WorkoutAvailabilityEditor.tsx` and require `.workout-availability`, `.workout-availability-day`, and `.workout-availability-slot`.

- [ ] **Step 8: Run wizard/service tests and commit**

Run:

```powershell
npx vitest run frontend/tests/services/workoutAvailability.test.ts frontend/tests/components/workouts/AiWorkoutWizard.test.tsx frontend/tests/components/IndexCssRedesignContract.test.ts
npm run typecheck
```

Expected: selected tests and typecheck PASS.

Commit:

```powershell
git add .gitignore frontend/src/types/workoutAvailability.ts frontend/src/types.ts frontend/src/services/workoutAvailability.ts frontend/src/components/workouts/WorkoutAvailabilityEditor.tsx frontend/src/components/workouts/AiWorkoutWizard.tsx frontend/src/index.css frontend/tests/services/workoutAvailability.test.ts frontend/tests/components/workouts/AiWorkoutWizard.test.tsx frontend/tests/components/IndexCssRedesignContract.test.ts
git commit -m "feat: collect customer availability for AI workouts"
```

### Task 4: Dynamic availability warnings in Workout Studio

**Files:**
- Create: `frontend/src/components/workout-studio/AvailabilityWarningBanner.tsx`
- Modify: `frontend/src/pages/pt/WorkoutStudioPage.tsx`
- Modify: `frontend/src/types/workoutStudio.ts`
- Modify: `frontend/src/index.css`
- Create: `frontend/tests/pages/pt/WorkoutStudioAvailability.test.tsx`
- Modify: `frontend/tests/components/IndexCssRedesignContract.test.ts`

**Interfaces:**
- Consumes: AI draft `availabilitySlots` and current `ScheduledExercise[]`.
- Produces: a live warning banner; persisted workout payload remains unchanged.

- [ ] **Step 1: Write failing Studio integration tests**

Create `frontend/tests/pages/pt/WorkoutStudioAvailability.test.tsx`. Mock API/library loading, router location state and toast provider following existing page-test patterns. Cover:

```ts
const aiWorkoutDraft = {
  title: 'AI 8 tuần',
  goal: 'Tăng sức mạnh',
  level: 'BEGINNER',
  durationWeeks: 8,
  availabilitySlots: [{ dayNumber: 1, startMinute: 1080, endMinute: 1200 }],
  scheduledExercises: [
    { weekNumber: 1, dayNumber: 1, startMinute: 1020, durationMinutes: 60, name: 'Squat', trackingType: 'STRENGTH', prescription: {} },
  ],
  generatedExercises: [],
};
```

Assertions:

- Studio renders `Tuần 1 · Thứ 2 · 17:00–18:00` in an alert banner;
- Studio duration becomes `56` days for an 8-week draft;
- focus the scheduled-item button and press `ArrowDown` four times; after it reaches Monday 18:00, the warning disappears;
- clicking save posts a body that does not have `availabilitySlots` or `scheduleWarnings`.

Use this exact keyboard assertion:

```ts
const scheduled = screen.getByRole('button', { name: /Squat, 17:00–18:00/ });
scheduled.focus();
await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
expect(screen.queryByRole('alert')).not.toBeInTheDocument();
```

- [ ] **Step 2: Run Studio tests and verify RED**

Run:

```powershell
npx vitest run frontend/tests/pages/pt/WorkoutStudioAvailability.test.tsx
```

Expected: FAIL because the banner is missing and AI drafts still initialize `durationDays` to 7.

- [ ] **Step 3: Define the typed AI draft shape**

Extend `frontend/src/types/workoutStudio.ts`:

```ts
import type { WorkoutAvailabilitySlot, WorkoutScheduleWarning } from './workoutAvailability';

export interface AiWorkoutStudioDraft extends Partial<StudioTemplate> {
  title: string;
  goal: string;
  level: string;
  durationWeeks: number;
  scheduledExercises: Omit<ScheduledExercise, 'id'>[];
  generatedExercises: unknown[];
  availabilitySlots: WorkoutAvailabilitySlot[];
  scheduleWarnings?: WorkoutScheduleWarning[];
}
```

- [ ] **Step 4: Implement the warning banner**

Create `AvailabilityWarningBanner.tsx`:

```ts
interface Props { warnings: WorkoutScheduleWarning[] }
```

Return `null` when empty. Otherwise render a semantic `role="alert"` banner with a heading, count, and list formatted using `weekdayLabel` and `minuteLabel`. Use only `studio-availability-warning*` classes.

- [ ] **Step 5: Integrate transient availability into Studio**

Modify `WorkoutStudioPage.tsx`:

```ts
const [availabilitySlots, setAvailabilitySlots] = useState<WorkoutAvailabilitySlot[]>([]);
const availabilityWarnings = useMemo(
  () => outsideAvailabilityWarnings(items, availabilitySlots),
  [items, availabilitySlots],
);
```

Read a typed `AiWorkoutStudioDraft` from `location.state`, set `durationDays` to `draft.durationWeeks * 7`, and set temporary slots. Clear slots when loading an existing template/customer plan so warnings only belong to the unsaved AI draft. Render `<AvailabilityWarningBanner warnings={availabilityWarnings} />` between `StudioHeader` and period navigation.

Keep the save payload exactly limited to template metadata, scheduled/unscheduled exercises and generated exercises; do not spread the full draft or availability state.

- [ ] **Step 6: Style and contract-test the banner**

Add `.studio-availability-warning`, heading, and list selectors to `frontend/src/index.css`, with responsive wrapping and no horizontal overflow. Add `AvailabilityWarningBanner.tsx` to `workoutStudioControlSources` and require the root selector in `IndexCssRedesignContract.test.ts`.

- [ ] **Step 7: Run Studio/frontend regression tests and commit**

Run:

```powershell
npx vitest run frontend/tests/pages/pt/WorkoutStudioAvailability.test.tsx frontend/tests/services/workoutAvailability.test.ts frontend/tests/components/workouts/AiWorkoutWizard.test.tsx frontend/tests/components/IndexCssRedesignContract.test.ts
npm run typecheck
npm run lint
```

Expected: selected tests/typecheck PASS; lint exits 0 with only existing unrelated warnings.

Commit:

```powershell
git add frontend/src/components/workout-studio/AvailabilityWarningBanner.tsx frontend/src/pages/pt/WorkoutStudioPage.tsx frontend/src/types/workoutStudio.ts frontend/src/index.css frontend/tests/pages/pt/WorkoutStudioAvailability.test.tsx frontend/tests/components/IndexCssRedesignContract.test.ts
git commit -m "feat: warn about AI workouts outside availability"
```

### Task 5: Full verification and delivery

**Files:**
- Modify: `docs/superpowers/plans/2026-09-01-ai-workout-customer-availability.md` only if marking completed checkboxes.

**Interfaces:**
- Consumes: all backend/frontend deliverables from Tasks 1–4.
- Produces: verified commits pushed to `feat/super-admin-account-management` without force push.

- [ ] **Step 1: Run focused end-to-end regression commands**

Run:

```powershell
npx vitest run backend/tests/aiWorkoutAvailability.test.ts backend/tests/aiWorkoutService.test.ts backend/tests/aiWorkoutApi.test.ts frontend/tests/services/workoutAvailability.test.ts frontend/tests/components/workouts/AiWorkoutWizard.test.tsx frontend/tests/pages/pt/WorkoutStudioAvailability.test.tsx frontend/tests/components/IndexCssRedesignContract.test.ts
```

Expected: all selected files PASS, including request payloads, scheduler placement/fallback and dynamic warnings.

- [ ] **Step 2: Run full project verification**

Run:

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all tests pass, typecheck exits 0, lint has no errors, and Vite build exits 0. Existing unrelated lint and bundle-size warnings may remain.

- [ ] **Step 3: Review the final branch diff**

Run:

```powershell
git diff --check
git status --short
git log --oneline --decorate -8
```

Verify every spec acceptance criterion maps to a passing test and no database model/migration changed.

- [ ] **Step 4: Request independent code review and resolve findings**

Review exact changed files against `docs/superpowers/specs/2026-09-01-ai-workout-customer-availability-design.md`. Fix every Critical/Important finding, then rerun the focused and full verification commands.

- [ ] **Step 5: Push the existing feature branch**

Run:

```powershell
git push origin feat/super-admin-account-management
```

Expected: remote advances normally; local `HEAD` equals `origin/feat/super-admin-account-management` and the worktree is clean.
