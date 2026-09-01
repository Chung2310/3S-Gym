# Workout Session Recorded Time Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add editable, prefilled recording date and time fields to the workout-session form and display the stored time in workout details.

**Architecture:** Keep the existing `performedAt` API and database field. A pure frontend service owns local date/time initialization, strict conversion to ISO, and Vietnamese display formatting; the form consumes that service and the detail component reuses its formatter.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest, Testing Library.

## Global Constraints

- Date and time are initialized from the device's local time when the form opens or changes customer/active plan.
- Both values remain editable and required.
- The API receives one ISO `performedAt` value; backend and database schemas do not change.
- Workout details display `dd/mm/yyyy · HH:mm`.
- All modified UI remains Tailwind-only and every input has a clear placeholder.
- Do not create commits, branches, worktrees, pushes, pull requests, or subagents without explicit user authorization.

---

### Task 1: Local workout-session time service

**Files:**
- Create: `frontend/src/services/workoutSessionTime.ts`
- Create: `frontend/tests/services/workoutSessionTime.test.ts`

**Interfaces:**
- Produces: `localWorkoutSessionTime(now?: Date): { recordedDate: string; recordedTime: string }`
- Produces: `workoutSessionIso(recordedDate: string, recordedTime: string): string | null`
- Produces: `formatWorkoutSessionTime(value: string | Date): string`

- [ ] **Step 1: Write failing service tests**

```ts
import { describe, expect, it } from 'vitest';
import { formatWorkoutSessionTime, localWorkoutSessionTime, workoutSessionIso } from '../../src/services/workoutSessionTime';

describe('workoutSessionTime', () => {
  it('creates date and time fields from local time', () => {
    expect(localWorkoutSessionTime(new Date(2026, 8, 1, 14, 5))).toEqual({ recordedDate: '2026-09-01', recordedTime: '14:05' });
  });

  it('converts valid local fields to ISO and rejects impossible values', () => {
    expect(workoutSessionIso('2026-09-02', '09:30')).toBe(new Date(2026, 8, 2, 9, 30).toISOString());
    expect(workoutSessionIso('2026-02-30', '09:30')).toBeNull();
    expect(workoutSessionIso('', '09:30')).toBeNull();
  });

  it('formats the stored time for Vietnamese workout details', () => {
    expect(formatWorkoutSessionTime(new Date(2026, 8, 1, 14, 5))).toBe('01/09/2026 · 14:05');
  });
});
```

- [ ] **Step 2: Run the service test and verify RED**

Run: `npx vitest run frontend/tests/services/workoutSessionTime.test.ts`

Expected: FAIL because `frontend/src/services/workoutSessionTime.ts` does not exist.

- [ ] **Step 3: Implement the service**

```ts
const pad = (value: number) => String(value).padStart(2, '0');

export function localWorkoutSessionTime(now = new Date()) {
  return {
    recordedDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    recordedTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
}

export function workoutSessionIso(recordedDate: string, recordedTime: string): string | null {
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(recordedDate);
  const time = /^(\d{2}):(\d{2})$/.exec(recordedTime);
  if (!date || !time) return null;
  const parts = [Number(date[1]), Number(date[2]), Number(date[3]), Number(time[1]), Number(time[2])] as const;
  const [year, month, day, hour, minute] = parts;
  const value = new Date(year, month - 1, day, hour, minute);
  if (value.getFullYear() !== year || value.getMonth() !== month - 1 || value.getDate() !== day || value.getHours() !== hour || value.getMinutes() !== minute) return null;
  return value.toISOString();
}

export function formatWorkoutSessionTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
```

- [ ] **Step 4: Run the service test and verify GREEN**

Run: `npx vitest run frontend/tests/services/workoutSessionTime.test.ts`

Expected: 3 tests PASS.

### Task 2: Prefilled editable form fields and ISO payload

**Files:**
- Modify: `frontend/src/components/progress/WorkoutSessionLogger.tsx`
- Create: `frontend/tests/components/progress/WorkoutSessionLogger.test.tsx`

**Interfaces:**
- Consumes: `localWorkoutSessionTime()` and `workoutSessionIso()` from Task 1.
- Produces: inputs named `Ngày ghi nhận` and `Giờ ghi nhận`; POST payload with ISO `performedAt`.

- [ ] **Step 1: Write failing component tests**

Create a test that freezes time at `new Date(2026, 8, 1, 14, 5)`, renders `WorkoutSessionLogger` inside `ToastProvider`, and asserts:

```ts
expect(screen.getByLabelText('Ngày ghi nhận')).toHaveValue('2026-09-01');
expect(screen.getByLabelText('Giờ ghi nhận')).toHaveValue('14:05');
```

Add a second test that changes the values to `2026-09-02` and `09:30`, submits the form, then verifies:

```ts
expect(api.post).toHaveBeenCalledWith('/api/workout-sessions', expect.objectContaining({
  performedAt: new Date(2026, 8, 2, 9, 30).toISOString(),
}));
```

- [ ] **Step 2: Run the component test and verify RED**

Run: `npx vitest run frontend/tests/components/progress/WorkoutSessionLogger.test.tsx`

Expected: FAIL because the form has only an empty `Ngày tập` input and no time input.

- [ ] **Step 3: Implement the form behavior**

Initialize one state object with `localWorkoutSessionTime()`, reset it when `customerId`, `activePlan._id`, or `activePlan.version` changes, and render:

```tsx
<input aria-label="Ngày ghi nhận" type="date" placeholder="Chọn ngày ghi nhận" value={recordedAt.recordedDate} required />
<input aria-label="Giờ ghi nhận" type="time" step={60} placeholder="Chọn giờ ghi nhận" value={recordedAt.recordedTime} required />
```

Before starting submission, calculate:

```ts
const performedAt = workoutSessionIso(recordedAt.recordedDate, recordedAt.recordedTime);
if (!performedAt) {
  toast.error('Ngày hoặc giờ ghi nhận không hợp lệ.');
  return;
}
```

Use this ISO value in the existing POST payload. Expand the header grid to four responsive columns and retain existing attendance/session behavior.

- [ ] **Step 4: Run focused component and page tests**

Run: `npx vitest run frontend/tests/components/progress/WorkoutSessionLogger.test.tsx frontend/tests/pages/pt/ProgressPage.test.tsx`

Expected: all tests PASS.

### Task 3: Date-and-time workout detail display

**Files:**
- Modify: `frontend/src/components/progress/WorkoutSessionDetail.tsx`
- Create: `frontend/tests/components/progress/WorkoutSessionDetail.test.tsx`

**Interfaces:**
- Consumes: `formatWorkoutSessionTime()` from Task 1.
- Produces: visible `dd/mm/yyyy · HH:mm` session timestamp.

- [ ] **Step 1: Write the failing detail test**

Render `WorkoutSessionDetail` with `performedAt: new Date(2026, 8, 1, 14, 5).toISOString()` and assert:

```ts
expect(screen.getByText('01/09/2026 · 14:05')).toBeVisible();
```

- [ ] **Step 2: Run the detail test and verify RED**

Run: `npx vitest run frontend/tests/components/progress/WorkoutSessionDetail.test.tsx`

Expected: FAIL because the component currently renders the date only.

- [ ] **Step 3: Reuse the formatter in the detail component**

Import `formatWorkoutSessionTime` and replace `toLocaleDateString('vi-VN')` with:

```tsx
<p className="mt-1 text-sm text-slate-500">{formatWorkoutSessionTime(session.performedAt)}</p>
```

- [ ] **Step 4: Run all feature tests**

Run: `npx vitest run frontend/tests/services/workoutSessionTime.test.ts frontend/tests/components/progress/WorkoutSessionLogger.test.tsx frontend/tests/components/progress/WorkoutSessionDetail.test.tsx frontend/tests/pages/pt/ProgressPage.test.tsx frontend/tests/services/dailyProgressReports.test.ts frontend/tests/components/progress/DailyProgressReports.test.tsx`

Expected: all tests PASS.

### Task 4: Static verification

**Files:**
- Verify all files changed in Tasks 1–3.

- [ ] **Step 1: Run targeted TypeScript checking**

Run `npx tsc` with the repository's frontend compiler options and all changed production/test files. Expected: exit code 0.

- [ ] **Step 2: Run lint**

Run `npx oxlint` on the changed production and test files. Expected: exit code 0.

- [ ] **Step 3: Inspect the working tree**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors; only intended feature files plus previously existing user changes remain. Do not commit.
