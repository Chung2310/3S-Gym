# Customer Journey and Progress Design

## Goal

Build one complete customer-journey feature shared by the PT and customer experiences. It covers workout attendance and set logs, schedules, body measurements, achievements, progress photos, workout-plan history, charts, and deterministic progress reports.

## Product Decisions

- Keep the existing MongoDB collections and introduce a journey aggregation service instead of duplicating all activity into a new event collection.
- Show workout logs, measurements, achievements, photos, schedules, and workout-plan history to the customer immediately after the PT saves them.
- Keep `internalNotes`, medical notes, care alerts, and other staff-only fields private. The backend must remove them from customer responses.
- Progress reports use deterministic metrics and Vietnamese templates. A PT may edit the generated draft and must publish it before the customer can view it.
- The PT and customer screens consume the same journey response shapes. Authorization, mutation permissions, and private-field filtering differ by role.

## Architecture

Existing domain models remain the system of record:

- `WorkoutSession`: attendance, immutable workout-plan snapshot, exercise logs, set logs, feeling, and notes.
- `CalendarEvent`: scheduled workout and status.
- `BodyMeasurement`: weight, body-fat percentage, muscle mass, and circumference measurements.
- `ProgressPhoto`: dated Before, After, and Progress photos.
- `WorkoutPlan`: active assignment and archived plan history.
- `ProgressReport`: generated metrics, editable summary, draft/publication state.

Add three focused backend units:

1. `progressAnalyticsService` calculates workout, attendance, body, achievement, and data-quality metrics without HTTP or database dependencies.
2. `progressReportGenerator` converts analytics into deterministic Vietnamese report text and a versioned metrics snapshot.
3. `customerJourneyService` loads authorized records, removes private fields, invokes analytics, and returns stable PT/customer DTOs.

The journey API exposes a staff endpoint scoped by an explicit customer ID and a customer endpoint whose customer ID is always derived from the authenticated account.

## Data Model

### Workout session

Keep the existing session and set-log shape. Each completed or skipped set records:

- `reps?: number`
- `weight?: number`
- `rpe?: number` in the inclusive range 0–10
- `rir?: number`
- `completed: boolean`

Each exercise log records the exercise identity/name, ordered sets, and an optional note. Each session records attendance, absence reason, overall feeling, customer-visible notes, and the immutable plan snapshot.

Add update support for correcting a session while preserving its ID and audit history. The plan snapshot is never refreshed from the current template.

### Body measurement

Use a single canonical nested `measurements` object:

```ts
interface CircumferenceMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  arm?: number;
  thigh?: number;
  calf?: number;
}
```

The API accepts this nested shape. A compatibility mapper converts existing flat measurement inputs into the nested object until all callers have migrated. Missing metrics stay missing and are never converted to zero.

### Achievements

Achievements are derived from workout sessions rather than manually entered. The first version calculates per exercise:

- highest weight;
- highest reps in a completed set;
- highest set volume (`weight × reps`);
- highest estimated 1RM using Epley (`weight × (1 + reps / 30)`).

The journey response includes the current record, record date, source session, and whether the record occurred inside the selected comparison period. A separate achievement collection is not required in the first version.

## Analytics Rules

- Total volume is the sum of `weight × reps` for completed sets with valid numeric weight and reps.
- Average RPE uses only completed sets with a valid RPE.
- Attendance includes PRESENT, LATE, and ABSENT counts. Attendance rate is `(PRESENT + LATE) / all recorded sessions`.
- Workout frequency is completed/late sessions grouped by week.
- A training streak is the number of consecutive calendar weeks, ending with the latest active week, that contain at least one PRESENT or LATE session.
- Body deltas compare the earliest and latest valid values inside the requested period. Each metric is calculated independently.
- Body, workout, and achievement series are returned in chronological order.
- Every analytics block includes `dataQuality`: `COMPLETE`, `PARTIAL`, or `INSUFFICIENT`, plus human-readable reasons.
- Invalid or missing values are omitted from calculations and never treated as zero.

## Journey API

### Staff

`GET /api/customers/:customerId/journey?from=&to=`

Available to ADMIN and the assigned PT. It returns:

- overview KPIs and data quality;
- upcoming and historical calendar events;
- workout sessions with detailed exercise/set logs;
- body-measurement history and chart series;
- achievements;
- progress photos;
- active workout plan and archived history;
- progress reports.

### Customer

`GET /api/me/journey?from=&to=`

Available only to CUSTOMER. The backend resolves the linked `CustomerProfile` from `req.user.id`. It ignores any caller-supplied customer ID and returns the same read DTO without staff-only fields.

### Reports

`POST /api/progress-reports/generate` accepts `customerId`, `periodStart`, and `periodEnd` for staff. It validates access and dates, calculates analytics, and returns a persisted DRAFT report with:

- deterministic summary;
- versioned metric snapshot;
- source-record identifiers/versions;
- data-quality warnings.

Existing update and publish endpoints remain. Only PUBLISHED reports appear in customer journey responses.

## PT Experience

The PT progress page uses a customer selector followed by seven tabs:

1. **Tổng quan** — body deltas, attendance, frequency, average RPE, new achievements, and data-quality warnings.
2. **Buổi tập** — session logger and complete history.
3. **Chỉ số cơ thể** — measurement form/history and metric charts.
4. **Thành tích** — per-exercise records and record timeline.
5. **Ảnh tiến độ** — existing Before/After/Progress manager and comparison experience.
6. **Giáo án** — active plan and immutable archived history.
7. **Báo cáo** — period picker, generated draft preview, editing, and publication.

The workout logger selects the customer's active plan and one of its sessions. It materializes the planned exercises and sets, then allows the PT to enter weight, reps, RPE, RIR, completion, exercise notes, overall feeling, and customer-visible session notes. A missing active plan is an explicit empty state, not a raw template-ID input.

Workout history opens a detail view containing the plan/session name, every exercise and set, total volume, average RPE, achievements created by that session, feeling, and notes. Staff can correct an erroneous session through the same logger in edit mode.

## Customer Experience

Create a dedicated “Hành trình của tôi” progress workspace with:

- upcoming schedule;
- workout timeline and detailed read-only session views;
- body metric charts;
- achievements;
- progress-photo comparison;
- active workout plan and archived history;
- published PT reports.

Workout sessions, measurements, photos, schedules, achievements, and plan history appear immediately. Reports remain publication-gated. Staff-only notes and fields are absent from the API response.

## Charts

Charts support 30 days, 90 days, 6 months, 1 year, and all time. The first release includes:

- weight;
- body-fat percentage;
- muscle mass;
- each available circumference;
- workout volume by week;
- average RPE by week;
- workout frequency by week;
- estimated 1RM history per selected exercise.

Charts show an explicit insufficient-data state when fewer than two relevant data points exist. They share accessible tabular summaries and tooltip labels; no new chart dependency is required unless the native SVG implementation cannot meet these requirements.

## Deterministic Reports

The generator produces an editable Vietnamese summary from facts only. It includes, when data exists:

- completed versus scheduled/recorded sessions and attendance rate;
- total workout volume and average RPE;
- new personal records;
- body metric changes;
- first/latest progress-photo availability;
- workout plans used during the period.

Sentence fragments with insufficient data are omitted. The draft explicitly mentions incomplete data when it materially limits the report. Metrics and source versions are saved so a published report remains historically stable when later records change.

## Security and Privacy

- Staff endpoints verify assigned-PT access using the existing customer-access pattern.
- Customer endpoints derive identity from the authenticated user and never trust a customer ID in params, query, or body.
- Customer DTOs exclude internal customer notes, medical notes, care alerts, staff-only consultation notes, and audit metadata.
- Session notes are customer-visible. Existing internal notes remain private.
- Mutation endpoints remain unavailable to CUSTOMER.
- Photo URLs follow current storage behavior; authorization applies to photo metadata and listing APIs.

## Validation and Failure Handling

- Reject end dates before start dates.
- Reject negative reps, weights, RIR, and measurements; constrain RPE to 0–10 and body fat to 0–100.
- Preserve the existing idempotency key behavior for session creation.
- Return an explicit empty state when no active plan exists.
- Continue returning partial journey data when an analytics series lacks sufficient points; use `dataQuality` rather than failing the whole request.
- Treat missing linked customer profiles as not found and foreign-customer access as forbidden.
- Report generation fails if the requested period contains no usable workout, body, plan, photo, or calendar data.

## Testing Strategy

### Unit tests

- Total volume, average RPE, attendance, frequency, and streak calculations.
- Epley estimated 1RM and each PR category.
- Independent body-metric deltas with missing values.
- Data-quality classifications.
- Deterministic report sentences and omission of unavailable facts.
- Private-field DTO filtering.

### Backend integration tests

- PT can create and correct a detailed session for an assigned customer.
- PT cannot access another PT's customer.
- Customer can read only their own journey and cannot mutate it.
- Customer journey responses contain no internal fields.
- Flat legacy circumference input maps to the canonical nested object.
- Generated reports preserve metric snapshots and require publication for customer visibility.
- Calendar events, photos, workout-plan history, and session details appear in the journey response.

### Frontend tests

- Workout logger loads the active plan and posts detailed set logs.
- Session history and detail render weights, reps, RPE, feeling, and notes.
- Measurement form submits canonical circumference data.
- Each chart renders values and insufficient-data states.
- Report preview renders generated metrics and supports edit/publish.
- PT and customer workspaces consume the journey DTO consistently.
- Customer screens never render staff-only fields.

### Verification

Run focused Vitest tests during each TDD cycle, then run the affected backend/frontend suites, TypeScript typecheck, Oxlint, and the production build before completion.

## Delivery Sequence

1. Canonical journey types, body-measurement compatibility, and analytics services.
2. Detailed session create/update APIs and PT workout logger/history.
3. Journey aggregation endpoints and authorization/privacy tests.
4. Body, workout, and achievement charts.
5. Deterministic report generation and publication workflow.
6. Customer journey workspace.
7. Full regression, accessibility, responsive-state, typecheck, lint, and production-build verification.

Each sequence item must leave the application in a working, testable state and use test-first implementation.
