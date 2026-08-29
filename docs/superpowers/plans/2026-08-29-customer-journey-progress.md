# Customer Journey and Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a shared PT/customer journey that records detailed workouts, analyzes body and training progress, generates deterministic reports, and exposes safe read-only customer data.

**Architecture:** Existing domain collections remain authoritative. Pure analytics and report-generation services transform stored sessions and measurements, while `customerJourneyService` aggregates authorized records into one DTO consumed by separate PT and customer workspaces.

**Tech Stack:** TypeScript, Express 5, Mongoose 9, Joi, React 19, Tailwind CSS 4, Vitest, Testing Library.

## Global Constraints

- Use test-first implementation and observe every new test fail for the expected missing behavior before production changes.
- Customer identity for `/api/me/journey` is derived only from the authenticated user.
- Customer responses exclude internal notes, medical notes, care alerts, audit metadata, and staff-only consultation notes.
- Workout, measurement, achievement, photo, calendar, and plan data are visible immediately; reports remain publication-gated.
- Reports use deterministic Vietnamese templates and require PT review/publication.
- New or modified frontend styling uses Tailwind CSS v4 utilities and existing theme tokens.
- Preserve existing APIs and flat circumference inputs through compatibility mapping.
- Do not add a chart dependency unless accessible native SVG cannot satisfy the design.

---

## File Structure

### New files

- `frontend/src/types/progress.ts` — canonical journey, session, measurement, analytics, achievement, and report DTOs.
- `backend/services/progressAnalyticsService.ts` — pure calculations with no database access.
- `backend/services/progressReportGenerator.ts` — deterministic report text and metrics snapshot.
- `backend/services/customerJourneyService.ts` — authorization-aware journey aggregation and private-field filtering.
- `backend/controllers/customerJourneyController.ts` — HTTP adapters for staff/customer journey reads.
- `backend/routes/customerJourney.ts` — journey endpoints and validation.
- `frontend/src/components/progress/WorkoutSessionLogger.tsx` — detailed create/edit workout logger.
- `frontend/src/components/progress/WorkoutSessionDetail.tsx` — read-only session detail.
- `frontend/src/components/progress/ProgressOverview.tsx` — overview KPIs and quality warnings.
- `frontend/src/components/progress/BodyProgressCharts.tsx` — body metric chart group.
- `frontend/src/components/progress/WorkoutProgressCharts.tsx` — frequency, volume, RPE, and estimated 1RM charts.
- `frontend/src/components/progress/AchievementList.tsx` — per-exercise records.
- `frontend/src/components/progress/ProgressReportGenerator.tsx` — generate/edit/publish workflow.
- `frontend/src/components/progress/PtProgressWorkspace.tsx` — seven-tab PT UI.
- `frontend/src/components/customer-portal/CustomerJourney.tsx` — customer read-only journey UI.
- `backend/tests/progressAnalytics.test.ts` — pure analytics coverage.
- `backend/tests/customerJourney.test.ts` — journey authorization/privacy/integration coverage.
- `backend/tests/progressReportGenerator.test.ts` — deterministic report coverage.
- `frontend/tests/components/progress/WorkoutSessionLogger.test.tsx` — logger behavior.
- `frontend/tests/components/progress/ProgressWorkspace.test.tsx` — PT composition behavior.
- `frontend/tests/components/customer-portal/CustomerJourney.test.tsx` — customer behavior/privacy.

### Modified files

- `backend/models/BodyMeasurement.ts` — typed canonical circumferences.
- `backend/services/workoutProgressService.ts` — measurement compatibility and session update.
- `backend/validators/workoutValidator.ts` — canonical measurements and update-session validation.
- `backend/routes/workoutProgress.ts` — session update endpoint.
- `backend/controllers/workoutProgressController.ts` — update-session handler.
- `backend/models/ProgressReport.ts` — warnings and generator metadata.
- `backend/services/operationsService.ts` — generate report through new services.
- `backend/controllers/operationsController.ts` — generate handler.
- `backend/routes/operations.ts` — generate endpoint.
- `backend/app.ts` — register journey router.
- `frontend/src/pages/pt/ProgressPage.tsx` — data orchestration and workspace composition.
- `frontend/src/components/workouts/WorkoutSessionHistory.tsx` — detailed history actions.
- `frontend/src/components/progress/MeasurementForm.tsx` — circumferences and canonical payload.
- `frontend/src/components/progress/ProgressCharts.tsx` — compatibility wrapper over expanded charts.
- `frontend/src/components/portal/PortalViews.tsx` — mount customer journey instead of generic progress cards.
- `frontend/src/pages/customer/CustomerPortalPage.tsx` — customer journey composition.

---

### Task 1: Canonical Progress Types and Body Measurements

**Files:**
- Create: `frontend/src/types/progress.ts`
- Modify: `frontend/src/types.ts`
- Modify: `backend/models/BodyMeasurement.ts`
- Modify: `backend/services/workoutProgressService.ts`
- Modify: `backend/validators/workoutValidator.ts`
- Test: `backend/tests/workoutProgress.test.ts`

**Interfaces:**
- Produces: `CircumferenceMeasurements`, `BodyMeasurementDto`, `WorkoutSessionDto`, `JourneyAnalytics`, `CustomerJourneyDto`.
- Produces backend helper: `normalizeMeasurements(payload): { measurements: CircumferenceMeasurements }` inside `workoutProgressService.ts`.

- [ ] **Step 1: Add failing backend tests**

Add cases that POST nested `measurements: { chest: 100, waist: 82, calf: 38 }`, assert persistence under `data.measurements`, and POST legacy flat `chest/waist/calf` fields with the same canonical result. Add an update case asserting nested values merge without deleting untouched keys.

- [ ] **Step 2: Verify the tests fail**

Run: `npx vitest run --config vitest.config.ts backend/tests/workoutProgress.test.ts`

Expected: FAIL because nested circumference validation/mapping and `calf` support do not exist.

- [ ] **Step 3: Implement canonical mapping and types**

Define the six optional circumference keys, accept `measurements` plus legacy flat keys in Joi, move all accepted circumference values into `measurements`, and merge nested updates with existing values. Do not convert missing values to zero.

- [ ] **Step 4: Add frontend DTO types and re-export them**

Define exact DTOs matching stored workout sessions, body measurements, chart points, achievements, analytics quality, journey sections, and progress reports. Re-export from `frontend/src/types.ts`.

- [ ] **Step 5: Verify Task 1**

Run: `npx vitest run --config vitest.config.ts backend/tests/workoutProgress.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: exit 0.

---

### Task 2: Pure Progress Analytics and Achievements

**Files:**
- Create: `backend/services/progressAnalyticsService.ts`
- Create: `backend/tests/progressAnalytics.test.ts`

**Interfaces:**
- Produces: `analyzeProgress(input: ProgressAnalyticsInput): ProgressAnalyticsResult`.
- Produces: `estimatedOneRepMax(weight: number, reps: number): number`.
- Consumes chronologically sortable session and measurement records without Mongoose documents.

- [ ] **Step 1: Write failing calculation tests**

Cover completed-set volume, skipped-set omission, average RPE, PRESENT/LATE/ABSENT attendance, weekly frequency, consecutive-week streak, independent body deltas with missing values, highest weight/reps/set volume/estimated 1RM per exercise, chronological series, and COMPLETE/PARTIAL/INSUFFICIENT quality reasons.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run --config vitest.config.ts backend/tests/progressAnalytics.test.ts`

Expected: FAIL because `progressAnalyticsService.ts` does not exist.

- [ ] **Step 3: Implement minimal pure analytics**

Use Epley `weight * (1 + reps / 30)`, round display metrics consistently, calculate each body metric independently, and never treat missing values as zero. Keep database and Express imports out of this service.

- [ ] **Step 4: Verify GREEN and edge cases**

Run: `npx vitest run --config vitest.config.ts backend/tests/progressAnalytics.test.ts`

Expected: PASS with no warnings.

---

### Task 3: Detailed Session Correction API

**Files:**
- Modify: `backend/services/workoutProgressService.ts`
- Modify: `backend/controllers/workoutProgressController.ts`
- Modify: `backend/routes/workoutProgress.ts`
- Modify: `backend/validators/workoutValidator.ts`
- Test: `backend/tests/workoutSessions.test.ts`

**Interfaces:**
- Produces: `PATCH /api/workout-sessions/:id`.
- Accepts: `performedAt`, `attendance`, `absenceReason`, `exerciseLogs`, `feeling`, and `notes`.
- Guarantees: `customerId`, `ptId`, `templateId`, `planSnapshot`, and `idempotencyKey` are immutable.

- [ ] **Step 1: Add failing authorization and correction tests**

Create a detailed session, patch its set reps/weight/RPE and feeling, and assert its original plan snapshot is unchanged. Add a foreign-PT case expecting 403 and a CUSTOMER case expecting 403.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run --config vitest.config.ts backend/tests/workoutSessions.test.ts`

Expected: FAIL with route not found.

- [ ] **Step 3: Implement validation, service, controller, and route**

Reuse the existing exercise/set Joi schemas, validate the ID, load the session, verify customer assignment, mutate only allowed fields, and save with validators.

- [ ] **Step 4: Verify Task 3**

Run: `npx vitest run --config vitest.config.ts backend/tests/workoutSessions.test.ts backend/tests/workoutProgress.test.ts`

Expected: PASS.

---

### Task 4: Journey Aggregation API and Privacy Boundary

**Files:**
- Create: `backend/services/customerJourneyService.ts`
- Create: `backend/controllers/customerJourneyController.ts`
- Create: `backend/routes/customerJourney.ts`
- Create: `backend/tests/customerJourney.test.ts`
- Modify: `backend/app.ts`

**Interfaces:**
- Produces: `GET /api/customers/:customerId/journey?from=&to=` for ADMIN/assigned PT.
- Produces: `GET /api/me/journey?from=&to=` for linked CUSTOMER.
- Consumes: `analyzeProgress` from Task 2 and existing calendar/photo/plan/report models.
- Returns: `CustomerJourneyDto` with overview, calendar, sessions, measurements, analytics, achievements, photos, plans, and reports.

- [ ] **Step 1: Write failing integration tests**

Seed two PTs and customers. Assert assigned PT access, foreign PT denial, customer self access, absence of all staff-only fields, inclusion of calendar/session/set/measurement/photo/active-plan/history data, and PUBLISHED-only reports for customer responses.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run --config vitest.config.ts backend/tests/customerJourney.test.ts`

Expected: FAIL because the journey endpoints do not exist.

- [ ] **Step 3: Implement scoped aggregation**

Resolve staff access through assigned PT rules. Resolve customer profile from `userId`. Apply optional date filters to time-based data. Load independent collections with `Promise.all`, pass plain records to analytics, sort response series, and construct an explicit DTO rather than spreading database objects.

- [ ] **Step 4: Verify privacy and integration**

Run: `npx vitest run --config vitest.config.ts backend/tests/customerJourney.test.ts backend/tests/operations.test.ts backend/tests/customerWorkoutPlans.test.ts`

Expected: PASS.

---

### Task 5: Detailed PT Workout Logger and History

**Files:**
- Create: `frontend/src/components/progress/WorkoutSessionLogger.tsx`
- Create: `frontend/src/components/progress/WorkoutSessionDetail.tsx`
- Create: `frontend/tests/components/progress/WorkoutSessionLogger.test.tsx`
- Modify: `frontend/src/components/workouts/WorkoutSessionHistory.tsx`
- Modify: `frontend/src/pages/pt/ProgressPage.tsx`

**Interfaces:**
- `WorkoutSessionLogger({ customerId, activePlan, editingSession, onSaved, onCancel })`.
- `WorkoutSessionDetail({ session, achievements, onEdit, onClose })`.
- Consumes Task 1 DTOs and existing API client.

- [ ] **Step 1: Write failing component tests**

Assert the logger shows an empty state without an active plan, lets the PT select a planned session, materializes its exercises/sets, edits reps/weight/RPE/RIR/completion, captures feeling and notes, POSTs a new detailed session, PATCHes an edited session, and prevents double submission.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/progress/WorkoutSessionLogger.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement logger and detail UI**

Use Tailwind utilities, semantic fieldsets/tables, complete static class strings, responsive layouts, focus-visible states, and motion-reduce-safe interactions. Replace raw template ID/session index entry on the progress page.

- [ ] **Step 4: Expand history**

Render plan/session names, total volume, average RPE, feeling, and an action that opens full set detail. Wire edit mode to the PATCH endpoint.

- [ ] **Step 5: Verify Task 5**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/progress/WorkoutSessionLogger.test.tsx frontend/tests/components/workouts/WorkoutCheckIn.test.tsx`

Expected: PASS.

---

### Task 6: Measurement Form, Analytics Charts, and Achievements

**Files:**
- Modify: `frontend/src/components/progress/MeasurementForm.tsx`
- Create: `frontend/src/components/progress/BodyProgressCharts.tsx`
- Create: `frontend/src/components/progress/WorkoutProgressCharts.tsx`
- Create: `frontend/src/components/progress/AchievementList.tsx`
- Create: `frontend/src/components/progress/ProgressOverview.tsx`
- Modify: `frontend/src/components/progress/ProgressCharts.tsx`
- Modify: `frontend/tests/components/progress/ProgressCharts.test.tsx`
- Create: `frontend/tests/components/progress/ProgressWorkspace.test.tsx`

**Interfaces:**
- Charts consume the `analytics` and `measurements` sections of `CustomerJourneyDto`.
- Measurement form posts `measurements: { chest, waist, hips, arm, thigh, calf }`.

- [ ] **Step 1: Write failing form/chart tests**

Assert all circumference fields submit nested canonical data. Assert each body series, weekly volume/RPE/frequency series, selected-exercise 1RM series, achievements, range controls, accessible labels, tabular summaries, and insufficient-data states.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/progress/ProgressCharts.test.tsx frontend/tests/components/progress/ProgressWorkspace.test.tsx`

Expected: FAIL for missing charts and fields.

- [ ] **Step 3: Implement native accessible charts and overview**

Create reusable SVG primitives inside the focused chart files, keep numeric/date formatting centralized, expose text/table summaries, and avoid a new dependency. Add Tailwind-based responsive range controls for 30d, 90d, 6m, 1y, and all.

- [ ] **Step 4: Verify Task 6**

Run the two Task 6 test files and `npm run typecheck`.

Expected: PASS and exit 0.

---

### Task 7: Deterministic Report Generation

**Files:**
- Create: `backend/services/progressReportGenerator.ts`
- Create: `backend/tests/progressReportGenerator.test.ts`
- Modify: `backend/models/ProgressReport.ts`
- Modify: `backend/services/operationsService.ts`
- Modify: `backend/controllers/operationsController.ts`
- Modify: `backend/routes/operations.ts`
- Modify: `backend/validators/operationsValidator.ts`
- Create: `frontend/src/components/progress/ProgressReportGenerator.tsx`
- Modify: `frontend/tests/components/progress/ProgressReportEditor.test.tsx`

**Interfaces:**
- Produces: `generateProgressReport(analytics, context): GeneratedProgressReport`.
- Produces: `POST /api/progress-reports/generate` with `customerId`, `periodStart`, `periodEnd`.
- Persists: summary, metrics snapshot, source versions, generator version, and quality warnings as DRAFT.

- [ ] **Step 1: Write failing generator tests**

Assert exact Vietnamese output for complete data, omission of missing facts, warnings for partial data, stable metrics snapshots, and rejection when no usable journey data exists.

- [ ] **Step 2: Verify backend RED**

Run: `npx vitest run --config vitest.config.ts backend/tests/progressReportGenerator.test.ts`

Expected: FAIL because the generator is missing.

- [ ] **Step 3: Implement pure generator and API**

Build sentences only from calculated facts, store generator version `1`, persist a DRAFT through the existing access/audit patterns, and retain existing edit/publish behavior.

- [ ] **Step 4: Write and verify failing frontend test**

Extend the report component test to request generation, preview metrics/warnings, edit the generated summary, save, and publish.

- [ ] **Step 5: Implement report generation UI**

Replace the blank manual report form with period selection and generation, while retaining explicit PT editing and publication.

- [ ] **Step 6: Verify Task 7**

Run backend generator/operations tests and the frontend report component test.

Expected: PASS.

---

### Task 8: PT Workspace and Customer Journey Workspace

**Files:**
- Create: `frontend/src/components/progress/PtProgressWorkspace.tsx`
- Create: `frontend/src/components/customer-portal/CustomerJourney.tsx`
- Create: `frontend/tests/components/customer-portal/CustomerJourney.test.tsx`
- Modify: `frontend/src/pages/pt/ProgressPage.tsx`
- Modify: `frontend/src/pages/customer/CustomerPortalPage.tsx`
- Modify: `frontend/src/components/portal/PortalViews.tsx`

**Interfaces:**
- PT page fetches `/api/customers/:id/journey` and passes the DTO to the seven-tab workspace.
- Customer page fetches `/api/me/journey` and passes the DTO to a read-only workspace.

- [ ] **Step 1: Write failing customer workspace tests**

Assert upcoming schedules, session/set detail, body charts, achievements, photos, active/history plans, and published reports render. Assert staff-only fields do not render. Assert empty and API-error states.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/customer-portal/CustomerJourney.test.tsx frontend/tests/components/progress/ProgressWorkspace.test.tsx`

Expected: FAIL because the workspaces do not exist.

- [ ] **Step 3: Implement PT seven-tab composition**

Use URL search params for stable tab selection, preserve the selected customer, fetch by range, and compose only focused components. Keep page JSX small and state/data orchestration in the page.

- [ ] **Step 4: Implement customer read-only composition**

Replace the generic progress-report card group with the dedicated journey workspace and the existing specialized progress-report presentation. Keep internal fields absent from props and DOM.

- [ ] **Step 5: Verify Task 8**

Run both workspace test files plus existing portal, notification, photo, calendar, and workout-plan component tests.

Expected: PASS.

---

### Task 9: Full Verification and Focused Cleanup

**Files:**
- Modify only files implicated by failing verification.
- Update: `docs/superpowers/specs/2026-08-29-customer-journey-progress-design.md` only if verified behavior required an approved clarification.

**Interfaces:**
- Produces a buildable, lint-clean, tested feature without compatibility regressions.

- [ ] **Step 1: Run affected test suites**

Run: `npx vitest run --config vitest.config.ts backend/tests/progressAnalytics.test.ts backend/tests/customerJourney.test.ts backend/tests/progressReportGenerator.test.ts backend/tests/workoutProgress.test.ts backend/tests/workoutSessions.test.ts backend/tests/operations.test.ts backend/tests/customerWorkoutPlans.test.ts frontend/tests/components/progress frontend/tests/components/customer-portal frontend/tests/components/workouts frontend/tests/components/customers/CustomerWorkoutPlanTab.test.tsx frontend/tests/components/calendar/InternalCalendar.test.tsx`

Expected: all selected tests pass.

- [ ] **Step 2: Run static verification**

Run: `npm run typecheck`

Run: `npm run lint`

Expected: both exit 0 without new warnings.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: exit 0 and Vite produces the production bundle.

- [ ] **Step 4: Inspect the final diff**

Confirm no internal fields enter customer DTOs, no unrelated user changes were overwritten, no global/component CSS or inline styles were added, and every production behavior added in Tasks 1–8 has a test that was observed failing first.

