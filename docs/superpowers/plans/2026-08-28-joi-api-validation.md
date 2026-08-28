# Joi API Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every manual API-input validator with reusable Joi schemas while preserving authorization, business behavior, successful responses, and the existing Vietnamese `VALIDATION_ERROR` response contract.

**Architecture:** `backend/middlewares/validate.ts` accepts a declarative object containing optional `body`, `params`, and `query` Joi object schemas, validates only the declared request segments, writes converted values back to Express, and converts Joi details into `ValidationIssue[]`. Domain schemas live in focused files under `backend/validators/`; routes only select a named schema and middleware, while Multer continues to parse files before upload-specific validation.

**Tech Stack:** TypeScript, Express 5, Joi, Mongoose ObjectId validation, Vitest, Supertest, oxlint.

## Global Constraints

- Source of truth: `docs/superpowers/specs/2026-08-27-joi-api-validation-design.md`.
- Apply validation to every API endpoint that accepts `body`, `params`, or `query`; do not attach empty schemas to health checks or endpoints with no input.
- Keep controllers, services, models, authorization order, success payloads, `ERROR_CODES.VALIDATION`, HTTP 400, and the message `Dữ liệu gửi lên không hợp lệ.` unchanged.
- Validate with `abortEarly: false`, `allowUnknown: false`, `stripUnknown: false`, and `convert: true`.
- Return nested fields in dotted form such as `sessions.0.exercises.1.sets`; never return Joi's default English text to clients.
- Every PATCH body schema is optional by field but uses `.min(1)`.
- System-owned fields (`ptId`, `status`, `publishedAt`, `version`, and domain equivalents) are forbidden unless the endpoint explicitly owns that transition.
- Use `mongoose.isValidObjectId` through one reusable custom Joi schema.
- Keep Multer before validation for uploads; validate `req.file` and form metadata after parsing.
- Complete and pass the tests for one domain phase before starting the next phase; each task ends in an independent commit.
- Do not refactor controllers, services, or models except where TypeScript needs to recognize Joi-normalized request values.

---

## File map

| File | Responsibility |
|---|---|
| `backend/middlewares/validate.ts` | Request-segment validation, conversion, dotted error paths, Vietnamese messages, `AppError` integration |
| `backend/validators/commonValidator.ts` | ObjectId, pagination, date/range, email, non-empty PATCH and `idParams()` primitives |
| `backend/validators/authValidator.ts` | Login schemas |
| `backend/validators/userValidator.ts` | User list/create/update/delete schemas |
| `backend/validators/customerValidator.ts` | Customer, account and PT package schemas |
| `backend/validators/transferValidator.ts` | Transfer lifecycle schemas |
| `backend/validators/contentValidator.ts` | InBody, goals, workout plans, nutrition plans, roadmaps and exercises |
| `backend/validators/workoutValidator.ts` | Workout templates, sessions, body measurements and progress queries |
| `backend/validators/nutritionValidator.ts` | Legacy nutrition tools, metrics, formulas, activities and nutrition logs |
| `backend/validators/careValidator.ts` | Care alerts, tasks, logs and today/recalculation filters |
| `backend/validators/operationsValidator.ts` | Reports, notifications, calendar and dashboards |
| `backend/validators/knowledgeValidator.ts` | Knowledge documents, assistant conversations/suggestions and content drafts |
| `backend/validators/uploadValidator.ts` | Cloudinary image and InBody OCR file/metadata validation |
| `backend/tests/validateMiddleware.test.ts` | Isolated middleware behavior |
| `backend/tests/validationCoverage.test.ts` | Static route coverage and removal of manual validators |
| Existing domain tests | Characterization and regression coverage at HTTP boundaries |

## Endpoint migration matrix

The implementer must check every row before deleting the corresponding route-local validator.

| Phase | Route files | Inputs that require named schemas |
|---|---|---|
| Foundation | `auth.ts`, `users.ts`, `features.ts` | login; user list/create/update/id; feature `key` params and update body |
| Customers | `customers.ts`, `transfers.ts` | customer list/id/create/update/account; package list/create/update/delete; transfer list/create/update/id/force |
| Content | `contentRouteFactory.ts`, `inbody.ts`, `goals.ts`, `workoutPlans.ts`, `nutritionPlans.ts`, `roadmaps.ts`, `exercises.ts` | shared publication list/id; resource-specific create/update; OCR confirmation; roadmap nested phases/weeks; exercise list/create/update/id |
| Workout | `workoutProgress.ts` | template list/id/create/update/archive; session list/create with nested exercise/set logs; measurement create/update/id; customer progress params |
| Nutrition | `nutrition.ts`, `nutritionMetrics.ts` | calculate, meal-image query, scan; metrics, formulas, activity list/create/update/estimate; nutrition-log list/create/update/id with macros |
| Care/operations | `careDashboard.ts`, `operations.ts` | recalculate/today; alert list/resolve; task list/id/create/update/complete; report list/id/create/update; notification list/id; calendar list/id/create/update; admin-dashboard range filters |
| Knowledge/AI | `knowledgeAssistant.ts`, `contentDrafts.ts` | search/list/id/create/update/publish/index; conversation list/id/create/message; suggestion list/id/create/actions; nutrition/workout draft bodies |
| Upload/final | `upload.ts`, `inbodyOcr.ts`, `me.ts`, `app.ts` | image file; OCR image plus metadata; remove `validate(() => [])` from input-free `/me/content`; health routes remain without schemas |

### Task 1: Lock the existing validation contract with characterization tests

**Files:**
- Create: `backend/tests/validateMiddleware.test.ts`
- Modify: `backend/tests/errorContract.test.ts`
- Modify: `backend/tests/routeValidation.test.ts`

**Interfaces:**
- Consumes: existing `validate(ValidationSchema)` middleware and `AppError` response serialization.
- Produces: regression assertions that the Joi middleware and every later domain migration must satisfy.

- [ ] **Step 1: Add failing/characterization assertions for the public error contract**

Add Supertest assertions against representative authenticated routes for this exact shape:

```ts
expect(response.status).toBe(400);
expect(response.body).toMatchObject({
  success: false,
  code: 'VALIDATION_ERROR',
  message: 'Dữ liệu gửi lên không hợp lệ.',
});
expect(response.body.errors).toEqual(expect.arrayContaining([
  expect.objectContaining({ field: expect.any(String), message: expect.any(String) }),
]));
```

Cover invalid `body`, invalid `params`, invalid `query`, empty PATCH, multiple invalid fields, unknown fields, nested paths, and both upload endpoints. Record current intentional behavior separately from gaps required by the design (unknown-field rejection, empty PATCH, complete nested validation).

- [ ] **Step 2: Add the isolated middleware test harness**

Create an Express test app with a route that echoes `req.body`, `req.params`, and `req.query`, and an error handler that serializes `AppError`. Write tests proving that normalized values reach the handler and that middleware short-circuits on errors. Use sample values `page: '2'`, `limit: '10'`, `active: 'true'`, and an ISO date.

- [ ] **Step 3: Run the baseline tests**

Run:

```powershell
npm run test:backend -- backend/tests/errorContract.test.ts backend/tests/routeValidation.test.ts backend/tests/validateMiddleware.test.ts
```

Expected: existing-contract tests pass; new design-gap tests fail for missing Joi behavior and are not weakened to accommodate the old implementation.

- [ ] **Step 4: Commit the contract tests**

```powershell
git add backend/tests/errorContract.test.ts backend/tests/routeValidation.test.ts backend/tests/validateMiddleware.test.ts
git commit -m "test: lock api validation contract"
```

### Task 2: Build the Joi validation foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `backend/middlewares/validate.ts`
- Create: `backend/validators/commonValidator.ts`
- Modify: `backend/tests/validateMiddleware.test.ts`

**Interfaces:**
- Produces: `RequestValidationSchema`, `validate(schema): RequestHandler`, `objectId`, `paginationQuery`, `dateRange(fromKey, toKey)`, `idParams(field?, label?)`, `nonEmptyPatch(schema)`, and shared Vietnamese message mappings.
- Consumers: every validator and route in Tasks 3–9.

- [ ] **Step 1: Install Joi as a runtime dependency**

Run `npm install joi`. Verify that Joi appears in `dependencies`, not `devDependencies`, and that only `package.json` and `package-lock.json` change.

- [ ] **Step 2: Write failing unit tests for all middleware options**

Use a schema such as:

```ts
const schema = {
  body: Joi.object({ email: Joi.string().email().required() }),
  params: Joi.object({ id: objectId.required() }),
  query: Joi.object({ page: Joi.number().integer().min(1), active: Joi.boolean() }),
};
```

Assert: all segments are checked; all errors are returned; unknown keys are rejected; `page` and `active` are converted; normalized values are assigned back; a nested array error becomes `sessions.0.exercises.1.sets`; and every returned message contains Vietnamese copy supplied by the schema/common mapper.

- [ ] **Step 3: Implement the middleware contract**

Replace function-based validation with:

```ts
export interface RequestValidationSchema {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  file?: Joi.AnySchema;
}

const OPTIONS: Joi.ValidationOptions = {
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: false,
  convert: true,
};
```

For each declared segment, call `schema.validate(req[segment], OPTIONS)`, collect every `detail.path.join('.')`, use the schema-provided Vietnamese message, and assign `value` back only if that segment is valid. Validate `file` from `req.file`. If any detail exists, call `next(new AppError({ status: 400, code: ERROR_CODES.VALIDATION, message: 'Dữ liệu gửi lên không hợp lệ.', errors }))`; otherwise call `next()`.

- [ ] **Step 4: Implement shared schemas and helpers**

`commonValidator.ts` must include:

```ts
export const objectId = Joi.string().custom((value, helpers) =>
  mongoose.isValidObjectId(value) ? value : helpers.error('string.objectId'));

export const paginationQuery = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

export const idParams = (field = 'id') => Joi.object({
  [field]: objectId.required(),
});

export const nonEmptyPatch = (fields: Joi.SchemaMap) => Joi.object(fields).min(1);
```

Add reusable email/date schemas and a range helper that reports the end field when `to <= from`. Attach explicit Vietnamese `.messages()` for `any.required`, `object.unknown`, `object.min`, number/string/date/boolean failures, and `string.objectId`.

- [ ] **Step 5: Run foundation verification**

Run `npm run test:backend -- backend/tests/validateMiddleware.test.ts backend/tests/errorContract.test.ts`, then `npm run typecheck:backend` and `npm run lint:backend`.

Expected: all pass.

- [ ] **Step 6: Commit the foundation**

```powershell
git add package.json package-lock.json backend/middlewares/validate.ts backend/validators/commonValidator.ts backend/tests/validateMiddleware.test.ts
git commit -m "feat: add joi request validation foundation"
```

### Task 3: Migrate authentication, users, and feature flags

**Files:**
- Create: `backend/validators/authValidator.ts`
- Create: `backend/validators/userValidator.ts`
- Modify: `backend/validators/operationsValidator.ts` (create now with feature schemas)
- Modify: `backend/routes/auth.ts`
- Modify: `backend/routes/users.ts`
- Modify: `backend/routes/features.ts`
- Modify: `backend/tests/auth.test.ts`
- Modify: `backend/tests/features.test.ts`
- Modify: `backend/tests/remainingCrud.test.ts`

**Interfaces:**
- Produces: `loginSchema`, `listUsersSchema`, `createUserSchema`, `updateUserSchema`, `deleteUserSchema`, `updateFeatureSchema`.
- Consumes: common ObjectId, pagination, email and PATCH helpers.

- [ ] **Step 1: Write failing route tests**

Cover login required strings; user pagination; create role enum and conditional PT `fullName`/`phone`; password minimum 8; email, avatar URL, non-future birth date, gender, experience `0..80`, certificate array and bio max 1000; update ID and non-empty body; delete ID; feature-key enum and update fields. Add an unknown field to each create/update representative and expect 400.

- [ ] **Step 2: Implement schemas**

Mirror current user rules exactly. Use `Joi.when('role', { is: 'PT', then: Joi.required() })` for PT-only fields, `.uri()` for avatar URL, `.max('now')` for birth date, and `.forbidden()` for fields not writable during update. Define feature keys from the same exported constant used by `FeatureFlag`, rather than duplicating string literals.

- [ ] **Step 3: Wire routes and delete migrated manual exports**

Routes must follow:

```ts
router.post('/login', validate(loginSchema), authController.login);
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updateUserSchema), userController.update);
```

Remove `loginValidator`, `createUserValidator`, and `updateUserValidator` from `backend/middlewares/validate.ts` after all imports are gone.

- [ ] **Step 4: Verify and commit**

Run the three modified test files plus middleware tests, typecheck and lint. Commit with `feat: migrate auth and user validation to joi`.

### Task 4: Migrate customers and transfers

**Files:**
- Create: `backend/validators/customerValidator.ts`
- Create: `backend/validators/transferValidator.ts`
- Modify: `backend/routes/customers.ts`
- Modify: `backend/routes/transfers.ts`
- Modify: `backend/tests/customers.test.ts`
- Modify: `backend/tests/transfers.test.ts`
- Modify: `backend/tests/transferOwnership.test.ts`

**Interfaces:**
- Produces: named schemas for every customer/package/account/transfer row in the endpoint matrix.
- Consumes: common ObjectId, pagination, email, dates and PATCH helpers.

- [ ] **Step 1: Add failing HTTP tests for every action shape**

Test customer create/update/list/id/account; package list/create/update/delete; transfer list/create/update/delete/accept/reject/admin-force. Include invalid IDs, enums, dates, numeric limits, empty PATCH, unknown fields and role-sensitive `assignedPtId` behavior.

- [ ] **Step 2: Implement customer schemas**

Preserve mutable fields (`fullName`, `phone`, `email`, `dateOfBirth`, `gender`, `height`, `initialWeight`, notes, goal, status), current length/range rules and customer status enum. Because ADMIN and PT have different create rights, export separate `createCustomerAsAdminSchema` and `createCustomerAsPtSchema` and select between them with a small route middleware/schema selector; do not put authorization logic inside Joi.

Package schemas must validate both customer/package params, require valid start/end dates with `endDate > startDate`, require positive integer sessions, preserve status enums, and forbid changing customer ownership. Account creation accepts only username, password and optional email.

- [ ] **Step 3: Implement transfer schemas and route wiring**

Preserve status filters, ID fields, reason constraints, requested destination PT and admin-force body. Transition routes accept params only unless the current controller consumes an explicit body field discovered by the characterization tests.

- [ ] **Step 4: Remove route-local validators, verify and commit**

Run customer/transfer tests, `npm run typecheck:backend`, and `npm run lint:backend`. Commit with `feat: migrate customer and transfer validation to joi`.

### Task 5: Migrate published content, roadmaps, and exercises

**Files:**
- Create: `backend/validators/contentValidator.ts`
- Modify: `backend/routes/contentRouteFactory.ts`
- Modify: `backend/routes/inbody.ts`
- Modify: `backend/routes/goals.ts`
- Modify: `backend/routes/workoutPlans.ts`
- Modify: `backend/routes/nutritionPlans.ts`
- Modify: `backend/routes/roadmaps.ts`
- Modify: `backend/routes/exercises.ts`
- Modify: `backend/tests/publication.test.ts`
- Modify: `backend/tests/roadmaps.test.ts`
- Modify: `backend/tests/exercises.test.ts`
- Modify: `backend/tests/remainingCrud.test.ts`

**Interfaces:**
- Produces: resource create/update schemas, `contentListSchema`, content ID/action schemas, nested roadmap schemas and exercise schemas.
- Changes: `createContentRouter(resource, schemas)` accepts `{ create, update }` request schemas instead of a request callback.

- [ ] **Step 1: Add characterization tests per content resource**

For InBody, goals, workout plans and nutrition plans, test create, PATCH, list, ID and publish/unpublish. Assert that `ptId`, `status`, `publishedAt` and `version` are rejected on ordinary updates. Add nested invalid-path tests for workout-plan sessions/exercises and nutrition-plan macros.

- [ ] **Step 2: Implement content resource schemas**

Create child schemas for InBody measurements, goals, workout-plan sessions/exercises and nutrition macros. Match model/service enums and numeric limits. Keep `contentListSchema` reusable with pagination, `status` and `customerId`; build resource-specific create and non-empty update schemas without system fields.

- [ ] **Step 3: Refactor the content route factory contract**

Use this interface:

```ts
interface ContentSchemas {
  create: RequestValidationSchema;
  update: RequestValidationSchema;
}

function createContentRouter(resource: ContentResource, schemas: ContentSchemas) { /* route-only wiring */ }
```

Factory-owned list, ID, publish and unpublish schemas remain named exports from `contentValidator.ts`. Resource route files provide only their create/update schemas.

- [ ] **Step 4: Implement roadmap and exercise schemas**

Roadmaps validate unique phase `order`, positive duration/week numbers, nested weeks and string goals. Exercises validate level (`BEGINNER|INTERMEDIATE|ADVANCED`), scope (`GLOBAL|PRIVATE`), equipment string arrays, query filters, IDs and non-empty updates. Preserve service-level role restrictions on `GLOBAL` as authorization/business rules.

- [ ] **Step 5: Verify and commit**

Run publication, roadmap, exercise and remaining CRUD tests plus typecheck/lint. Commit with `feat: migrate content validation to joi`.

### Task 6: Migrate workout templates, sessions, measurements, and progress

**Files:**
- Create: `backend/validators/workoutValidator.ts`
- Modify: `backend/routes/workoutProgress.ts`
- Modify: `backend/tests/workoutProgress.test.ts`
- Modify: `backend/tests/workoutSessions.test.ts`

**Interfaces:**
- Produces: `createWorkoutTemplateSchema`, `listWorkoutTemplatesSchema`, `updateWorkoutTemplateSchema`, `workoutTemplateIdSchema`, `createWorkoutSessionSchema`, `listWorkoutSessionsSchema`, `createBodyMeasurementSchema`, `updateBodyMeasurementSchema`, `bodyMeasurementIdSchema`, `customerProgressSchema`.

- [ ] **Step 1: Add failing nested-payload tests**

Exercise every nested level: template `sessions[] -> exercises[]`; workout session `exerciseLogs[] -> sets[]`; `planSnapshot`; measurement values. Verify dotted paths, invalid ObjectIds, attendance enum, RPE `0..10`, non-negative reps/weight/RIR/rest, required idempotency key, invalid date, empty PATCH and forbidden customer reassignment.

- [ ] **Step 2: Implement reusable child schemas**

Define `templateExercise`, `templateSession`, `setLog`, `exerciseLog`, and measurement child schemas once. Arrays must validate each member rather than only calling `.array()`. Preserve current defaults only when they are part of the API contract; do not invent defaults that change controller behavior.

- [ ] **Step 3: Wire all workout routes**

Replace every inline callback in `workoutProgress.ts` with a named schema. Params-only archive/delete routes share the same template ID schema. `listWorkoutSessionsSchema` requires `customerId` because the current validator does.

- [ ] **Step 4: Verify and commit**

Run both workout test files, middleware tests, typecheck and lint. Commit with `feat: migrate workout validation to joi`.

### Task 7: Migrate nutrition tools, metrics, logs, formulas, and activities

**Files:**
- Create: `backend/validators/nutritionValidator.ts`
- Modify: `backend/routes/nutrition.ts`
- Modify: `backend/routes/nutritionMetrics.ts`
- Modify: `backend/tests/nutritionLegacyContract.test.ts`
- Modify: `backend/tests/nutritionMetrics.test.ts`
- Modify: `backend/tests/nutritionLogs.test.ts`

**Interfaces:**
- Produces: schemas for every nutrition and activity row in the endpoint matrix.

- [ ] **Step 1: Add failing route tests**

Lock the legacy calculation/meal-image/scan contracts. Cover metrics sex, goal, weight/height/age/activity-factor ranges; formula name and factor limits; activity create/update/estimate; log list date range/type/customer; log create/update with conditional activity duration and nested macros; unknown and forbidden ownership fields.

- [ ] **Step 2: Implement nutrition schemas**

Use `.when('type', ...)` so `durationMinutes` is required for `ACTIVITY` and absent/optional according to the current FOOD contract. Macros validate `protein`, `carbs`, and `fat` individually from `0..2000`. Logs validate calories `0..10000`, duration `1..1440`, dates and ObjectIds. Date-list schemas reject `to <= from`.

- [ ] **Step 3: Wire routes, verify and commit**

Delete manual validators/imports from both nutrition route files. Run the three nutrition test files plus typecheck/lint. Commit with `feat: migrate nutrition validation to joi`.

### Task 8: Migrate care, operations, knowledge assistant, and content drafts

**Files:**
- Create: `backend/validators/careValidator.ts`
- Complete: `backend/validators/operationsValidator.ts`
- Create: `backend/validators/knowledgeValidator.ts`
- Modify: `backend/routes/careDashboard.ts`
- Modify: `backend/routes/operations.ts`
- Modify: `backend/routes/knowledgeAssistant.ts`
- Modify: `backend/routes/contentDrafts.ts`
- Modify: `backend/tests/careDashboard.test.ts`
- Modify: `backend/tests/careCalendarNotifications.test.ts`
- Modify: `backend/tests/operations.test.ts`
- Modify: `backend/tests/adminDashboardFilters.test.ts`
- Modify: `backend/tests/knowledgeAssistant.test.ts`
- Modify: `backend/tests/knowledgeCrudConversation.test.ts`
- Modify: `backend/tests/contentDrafts.test.ts`

**Interfaces:**
- Produces: named schemas for all care, report, notification, calendar, dashboard, knowledge, conversation, suggestion and draft endpoints.

- [ ] **Step 1: Add route-level negative tests by subsystem**

Cover invalid IDs, pagination, status enums, dates/ranges, required result/title/content fields, empty PATCH and unknown fields. Calendar requires `endsAt > startsAt`; reports require `periodEnd > periodStart`; admin dashboard requires `toDate > fromDate`. Content drafts require customer ObjectId and request length >= 10.

- [ ] **Step 2: Implement care and operations schemas**

Keep no-input `/dashboard/pt` without `validate()`. Reuse params, pagination and date-range helpers. Treat `metrics` and `sourceVersions` as explicitly shaped API objects if controllers/tests define their keys; otherwise use `Joi.object().unknown(true)` only when they are intentionally extensible domain maps, documenting that exception next to the schema.

- [ ] **Step 3: Implement knowledge and assistant schemas**

Validate document status, search text, customer/document/conversation/suggestion IDs, review status, conversation title/message/request type, suggestion payload and content-draft input. Publish/index/action endpoints use params-only schemas and never empty body schemas.

- [ ] **Step 4: Wire routes, verify and commit**

Run all seven listed test files plus typecheck/lint. Commit with `feat: migrate care operations and assistant validation to joi`.

### Task 9: Migrate uploads and enforce complete route coverage

**Files:**
- Create: `backend/validators/uploadValidator.ts`
- Modify: `backend/routes/upload.ts`
- Modify: `backend/routes/inbodyOcr.ts`
- Modify: `backend/routes/me.ts`
- Create: `backend/tests/validationCoverage.test.ts`
- Modify: `backend/tests/inbodyOcr.test.ts`
- Modify: `backend/tests/routeValidation.test.ts`

**Interfaces:**
- Produces: `imageUploadSchema`, `inbodyOcrUploadSchema`, static coverage test.
- Consumes: middleware `file` support and all named schemas from previous tasks.

- [ ] **Step 1: Add upload validation tests**

Test absent file, wrong mimetype, size behavior (Multer limit remains authoritative), valid file, and invalid/unknown metadata. Confirm middleware ordering remains `upload.single('image')` then `validate(schema)`.

- [ ] **Step 2: Implement upload schemas**

Validate `req.file` with a custom Joi schema checking presence and allowed image MIME types. Keep the actual maximum byte limit in Multer/environment configuration. Validate OCR metadata in `body` using named fields from the existing controller contract; do not accept arbitrary form fields.

- [ ] **Step 3: Remove empty validation from no-input routes**

Change `/api/me/content` to omit `validate(() => [])`. Confirm `/api/health`, `/api/health/live`, `/api/health/ready`, `/api/features/me`, `/api/dashboard/pt` and other truly input-free endpoints also remain schema-free.

- [ ] **Step 4: Add the static coverage test**

Scan `backend/routes/**/*.ts` and fail when:

```ts
const forbiddenPatterns = [
  /type ValidationIssue/,
  /ValidationSchema/,
  /listValidator/,
  /mongoose\.isValidObjectId/,
  /validate\(\s*\(req/,
  /validate\(\s*\(\)\s*=>\s*\[\]/,
];
```

Also maintain an explicit inventory of input-bearing route signatures and assert each route line contains `validate(<namedSchema>)` or is a documented Multer route with named validation after parsing. The only allowed validator imports in route files are `validate` and named schemas from `backend/validators`.

- [ ] **Step 5: Verify and commit**

Run upload/OCR/coverage tests, then all route-related tests. Commit with `feat: complete joi validation coverage`.

### Task 10: Full regression, cleanup, and production verification

**Files:**
- Modify only if verification exposes a migration regression: relevant validator, route or test file from Tasks 1–9.
- Review: all `backend/routes/*.ts`, `backend/validators/*.ts`, `backend/middlewares/validate.ts`.

**Interfaces:**
- Produces: a verified backend with no route-local manual validation and no uncovered input-bearing endpoint.

- [ ] **Step 1: Run static cleanup searches**

Run:

```powershell
rg -n "ValidationIssue|ValidationSchema|listValidator|mongoose\.isValidObjectId|validate\(\(req|validate\(\(\) => \[\]" backend/routes
rg -n "req\.(body|params|query)" backend/routes
```

Expected: first command has no matches; every second-command match belongs to middleware wiring or is covered by a named schema and coverage-test inventory.

- [ ] **Step 2: Run focused validation tests**

```powershell
npm run test:backend -- backend/tests/validateMiddleware.test.ts backend/tests/validationCoverage.test.ts backend/tests/routeValidation.test.ts backend/tests/errorContract.test.ts
```

Expected: PASS, including unknown fields, coercion, dotted nested fields, Vietnamese messages and empty PATCH rejection.

- [ ] **Step 3: Run the complete backend gate**

```powershell
npm run verify:backend
```

Expected: backend tests, backend typecheck, backend lint, production build and smoke test all pass.

- [ ] **Step 4: Run the repository-wide regression suite**

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all pass. If an existing unrelated failure occurs, record its exact command/output and do not weaken validation tests to hide it.

- [ ] **Step 5: Review the final diff against the design**

Confirm every endpoint-matrix row is checked, all client messages are Vietnamese, no success response changed, no authorization middleware moved, no service/model business validation was removed, and only intentional extensible maps use `.unknown(true)`.

- [ ] **Step 6: Commit verification-only fixes**

```powershell
git add backend package.json package-lock.json
git commit -m "test: verify joi validation across all api routes"
```

## Plan self-review

- Spec coverage: middleware options, normalized assignment, error compatibility, schema organization, nested payloads, upload order, PATCH behavior, static coverage and all verification gates are mapped to Tasks 1–10.
- Scope: one master plan, split into independently testable domain commits in the sequence approved by the user.
- Type consistency: every route consumes `RequestValidationSchema`; common helpers are created before domain consumers; upload-only `file` support is created at the foundation and used only in Task 9.
- Ambiguity resolved: no-input endpoints omit validation; role-dependent customer creation uses explicit schemas selected outside Joi; intentionally extensible maps are the only exception to unknown-field rejection.
