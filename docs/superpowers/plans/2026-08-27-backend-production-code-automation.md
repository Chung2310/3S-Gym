# Backend Production Code and Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện backend production trong phạm vi code và automated tests, không cần staging hoặc credential provider thật.

**Architecture:** Giữ Route → Controller → Service → Model/Provider. Xây env, security, provider request và transaction boundaries dùng chung trước; sau đó chuyển từng workflow hiện có sang các boundary này và khóa hành vi bằng contract/integration tests.

**Tech Stack:** Node.js 24 ESM, TypeScript strict, Express 5, Mongoose 9, MongoDB Memory ReplSet, Vitest, Supertest, Docker.

## Global Constraints

- Chỉ làm trong worktree `feature/backend-new-feature`; không sửa `frontend/src/**`.
- Không đổi response envelope hoặc endpoint public nếu chưa có backward-compatibility contract test.
- Mọi thay đổi nghiệp vụ dùng TDD và có ownership/RBAC/validation test tương ứng.
- AI/OCR chỉ tạo draft; không auto-publish, không chẩn đoán y khoa, không tạo dữ liệu sức khỏe mẫu.
- Feature beta vẫn bị chặn ở backend khi flag tắt.
- Automated tests không gọi provider, Atlas hoặc staging thật và không cần secret thật.
- Không commit secrets, backup database hoặc build output.
- Các lệnh commit trong plan chỉ là đề xuất; chỉ commit khi người dùng cấp quyền.

---

### Task 1: Ổn định baseline ESM test

**Files:**
- Modify: `backend/tests/esmRuntime.test.ts`
- Modify: `vitest.config.ts`

**Interfaces:**
- Consumes: default export từ `backend/app.ts`.
- Produces: test import ESM kết thúc deterministic, không phụ thuộc MongoDB hoặc open handle.

- [ ] **Step 1: Viết assertion cô lập process**

Thay child script bằng import có timeout nội bộ và kết thúc rõ ràng:

```ts
const script = `
  process.env.NODE_ENV = 'test';
  await import('./backend/app.ts');
  process.stdout.write('APP_IMPORTED');
  process.exit(0);
`;
const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', script], {
  cwd: path.resolve('.'), encoding: 'utf8', timeout: 10_000,
});
expect(result.error).toBeUndefined();
expect(result.status, result.stderr).toBe(0);
expect(result.stdout).toContain('APP_IMPORTED');
```

- [ ] **Step 2: Chạy test và xác nhận lỗi hiện tại**

Run: `npm test -- backend/tests/esmRuntime.test.ts`

Expected trước sửa: FAIL do timeout 15 giây. Expected sau test rewrite nhưng trước cleanup: lỗi cụ thể nếu app giữ open handle hoặc import thất bại.

- [ ] **Step 3: Giới hạn test suite backend**

Thêm script vào `package.json` ở Task 2; tại task này chỉ tăng timeout riêng của test lên 20 giây nếu Windows cold start cần thiết, không tăng global `testTimeout`.

- [ ] **Step 4: Xác minh**

Run: `npm test -- backend/tests/esmRuntime.test.ts backend/tests/frontendServing.test.ts`

Expected: 2 files PASS, process con thoát code 0.

- [ ] **Step 5: Commit suggestion**

`git commit -m "test: stabilize native esm runtime check"`

---

### Task 2: Env bootstrap, JWT hardening và production artifact

**Files:**
- Create: `backend/config/env.ts`
- Create: `backend/bootstrap.ts`
- Create: `tsconfig.backend.build.json`
- Create: `backend/tests/environment.test.ts`
- Create: `backend/tests/productionArtifact.test.ts`
- Modify: `backend/server.ts`
- Modify: `backend/services/authService.ts`
- Modify: `backend/middlewares/auth.ts`
- Modify: `package.json`
- Modify: `Dockerfile`
- Modify: `.env.example`

**Interfaces:**
- Produces: `loadEnv(source?: NodeJS.ProcessEnv): AppEnv`, `getEnv(): AppEnv`.
- Produces: JWT claims `{ id, role }` với `HS256`, issuer `3s-gym`, audience `3s-gym-api`.
- Produces: `dist/backend/server.js` chạy bằng `node`.

- [ ] **Step 1: Viết environment và auth tests RED**

```ts
expect(() => loadEnv({ NODE_ENV: 'production', MONGODB_URI: '', JWT_SECRET: '' })).toThrow(/MONGODB_URI.*JWT_SECRET/);
const decoded = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: '3s-gym', audience: '3s-gym-api' });
expect(decoded).toMatchObject({ id: user.id, role: 'PT' });
```

Thêm integration case: login, đổi `User.status` thành `LOCKED`, gọi protected endpoint với token cũ và nhận 403.

- [ ] **Step 2: Chạy RED**

Run: `npm test -- backend/tests/environment.test.ts backend/tests/auth.test.ts`

Expected: FAIL vì chưa có `loadEnv`, JWT thiếu claims policy và middleware chưa reload user.

- [ ] **Step 3: Implement env module và bootstrap**

```ts
export interface AppEnv {
  NODE_ENV: 'development' | 'test' | 'production';
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  PORT: number;
}

let current: AppEnv | undefined;
export function loadEnv(source = process.env): AppEnv {
  const mode = source.NODE_ENV === 'production' ? 'production' : source.NODE_ENV === 'test' ? 'test' : 'development';
  const missing = mode === 'production' ? ['MONGODB_URI', 'JWT_SECRET'].filter((key) => !source[key]) : [];
  if (missing.length) throw new Error(`Thiếu biến môi trường bắt buộc: ${missing.join(', ')}`);
  current = {
    NODE_ENV: mode,
    MONGODB_URI: source.MONGODB_URI || 'mongodb://127.0.0.1:27017/3s-gym-test',
    JWT_SECRET: source.JWT_SECRET || (mode === 'test' ? 'test-only-secret-at-least-32-characters' : ''),
    JWT_ISSUER: source.JWT_ISSUER || '3s-gym', JWT_AUDIENCE: source.JWT_AUDIENCE || '3s-gym-api',
    PORT: Number(source.PORT || 5000),
  };
  return current;
}
export function getEnv() { if (!current) throw new Error('Environment chưa được khởi tạo.'); return current; }
```

`backend/bootstrap.ts` gọi `dotenv.config()`, `loadEnv()`, rồi dynamic-import `server.ts`. `server.ts` không còn tự load dotenv.

- [ ] **Step 4: Harden JWT và auth middleware**

Sign/verify bằng `getEnv()` và exact options. Sau verify, query `User.findById(payload.id).select('role status username fullName')`; chỉ gắn `req.user` khi user còn `ACTIVE`, dùng role từ database thay vì role cũ trong token.

- [ ] **Step 5: Build artifact và Docker**

`tsconfig.backend.build.json` đặt `noEmit: false`, `rootDir: backend`, `outDir: dist/backend`, `sourceMap: true`. Thêm scripts:

```json
"build:backend": "tsc -p tsconfig.backend.build.json",
"start:production": "node dist/backend/bootstrap.js",
"test:backend": "vitest run --config vitest.config.ts backend/tests"
```

Docker builder chạy frontend build và backend build; runner chạy `npm ci --omit=dev`, copy `dist/backend` và frontend `dist` vào path mà compiled `app.js` phục vụ.

- [ ] **Step 6: Xác minh**

Run: `npm test -- backend/tests/environment.test.ts backend/tests/auth.test.ts backend/tests/productionArtifact.test.ts backend/tests/frontendServing.test.ts && npm run typecheck:backend && npm run build:backend`

Expected: PASS; `node dist/backend/bootstrap.js` là command production duy nhất.

- [ ] **Step 7: Commit suggestion**

`git commit -m "feat: build and validate production backend runtime"`

---

### Task 3: Security middleware, rate limiting và provider request wrapper

**Files:**
- Create: `backend/middlewares/security.ts`
- Create: `backend/middlewares/rateLimit.ts`
- Create: `backend/services/providerRequest.ts`
- Create: `backend/tests/securityHardening.test.ts`
- Create: `backend/tests/providerTimeout.test.ts`
- Modify: `backend/app.ts`
- Modify: `backend/routes/auth.ts`
- Modify: `backend/routes/inbodyOcr.ts`
- Modify: `backend/config/logger.ts`
- Modify: `backend/config/env.ts`
- Modify: `.env.example`
- Modify: `package.json`

**Interfaces:**
- Produces: `configureSecurity(app, env): void`.
- Produces: `rateLimit(bucket: 'AUTH'|'AI'|'OCR'|'GENERAL'): RequestHandler`.
- Produces: `fetchWithTimeout(url, init, timeoutMs): Promise<Response>`.

- [ ] **Step 1: Viết security/provider tests RED**

```ts
expect(response.headers['x-content-type-options']).toBe('nosniff');
expect(disallowedOrigin.status).toBe(403);
expect(loginAttempt21.status).toBe(429);
await expect(fetchWithTimeout('https://provider.test', {}, 10)).rejects.toMatchObject({ code: ERROR_CODES.EXTERNAL });
```

Thêm test MIME không hợp lệ, file lớn hơn `OCR_MAX_FILE_BYTES`, JSON lớn hơn `JSON_BODY_LIMIT`, caller signal abort và redaction cho `imageBase64`.

- [ ] **Step 2: Chạy RED**

Run: `npm test -- backend/tests/securityHardening.test.ts backend/tests/providerTimeout.test.ts`

Expected: FAIL do thiếu modules và headers/rate limit.

- [ ] **Step 3: Implement security và limiter**

Dùng `helmet` và `express-rate-limit`. CORS callback chỉ chấp nhận origin trong `CORS_ORIGINS`; request không có Origin vẫn được phép cho server-to-server/test. `app.set('trust proxy', env.TRUST_PROXY)` chỉ khi giá trị khác `false`. Limiter key dùng `req.ip`; export factory/reset hook để test không chia sẻ state.

- [ ] **Step 4: Implement provider wrapper**

```ts
export async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const onAbort = () => controller.abort(init.signal?.reason);
  init.signal?.addEventListener('abort', onAbort, { once: true });
  const timer = setTimeout(() => controller.abort(new Error('PROVIDER_TIMEOUT')), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw providerHttpError(response.status);
    return response;
  } catch (cause) { throw normalizeProviderError(cause); }
  finally { clearTimeout(timer); init.signal?.removeEventListener('abort', onAbort); }
}
```

- [ ] **Step 5: Wire app/routes/env**

Đặt request context trước logger, security/CORS/body limits trước routes, general limiter trước `/api`, bucket limiter tại login/AI/OCR routes. Env exact defaults: `PROVIDER_TIMEOUT_MS=15000`, `AUTH_RATE_LIMIT_PER_15M=20`, `AI_RATE_LIMIT_PER_MINUTE=10`, `OCR_MAX_FILE_BYTES=8388608`, `JSON_BODY_LIMIT=1mb`.

- [ ] **Step 6: Xác minh**

Run: `npm test -- backend/tests/securityHardening.test.ts backend/tests/providerTimeout.test.ts backend/tests/errorContract.test.ts backend/tests/inbodyOcr.test.ts && npm run typecheck:backend`

Expected: PASS; logger redacts auth/cookie/password/token/base64/image fields.

- [ ] **Step 7: Commit suggestion**

`git commit -m "feat: harden api and provider requests"`

---

### Task 4: Tách legacy Nutrition/OCR khỏi route

**Files:**
- Create: `backend/controllers/legacyNutritionController.ts`
- Create: `backend/services/mealImageService.ts`
- Create: `backend/services/nutritionScanService.ts`
- Create: `backend/tests/nutritionLegacyContract.test.ts`
- Modify: `backend/routes/nutrition.ts`
- Modify: `backend/services/ocrProvider.ts`
- Modify: `backend/services/aiProvider.ts`

**Interfaces:**
- Consumes: legacy `POST /api/nutrition/calculate`, `GET /api/nutrition/meal-image`, `POST /api/nutrition/scan-inbody`.
- Produces: `scanInBodyDraft(user, payload)` trả draft xác thực hoặc ném `AppError`; không trả sample health values.

- [ ] **Step 1: Chụp contract legacy và invariant RED**

Test calculate response, meal image response và scan response. Đọc source route và assert không có `fetch(`, OpenRouter URL hoặc object fallback chứa `weight/bodyFatPercentage`.

- [ ] **Step 2: Chạy RED**

Run: `npm test -- backend/tests/nutritionLegacyContract.test.ts`

Expected: contract hiện tại có thể PASS nhưng structural invariants FAIL.

- [ ] **Step 3: Move calculate/meal-image/scan handlers**

Route giữ validators, `authenticate`, `authorize`, `requireFeature`, rồi gọi controller. Controller đặt `Deprecation: true` và `Sunset`/`Link` tới canonical endpoint. `mealImageService` sở hữu mapping/prompt/remote image logic; mọi remote request qua `fetchWithTimeout`.

- [ ] **Step 4: Loại dữ liệu OCR giả**

`nutritionScanService` gọi `extractInBody`, validate numeric ranges và chỉ tạo `REVIEW_REQUIRED` draft khi có tối thiểu customer identity + weight hợp lệ. Malformed/insufficient output ném `AppError` code `EXTERNAL_SERVICE_ERROR`/`VALIDATION_ERROR`; không catch rồi điền số mẫu.

- [ ] **Step 5: Xác minh**

Run: `npm test -- backend/tests/nutritionLegacyContract.test.ts backend/tests/inbodyOcr.test.ts backend/tests/routeValidation.test.ts`

Run: `rg -n "fetch\(|openrouter|using safe fallback" backend/routes/nutrition.ts`

Expected: tests PASS; ripgrep không có kết quả.

- [ ] **Step 6: Commit suggestion**

`git commit -m "refactor: isolate legacy nutrition providers"`

---

### Task 5: Transaction foundation và workout idempotency

**Files:**
- Create: `backend/services/transactionService.ts`
- Create: `backend/tests/transactionAtomicity.test.ts`
- Create: `backend/tests/workoutSessions.test.ts`
- Modify: `backend/services/workoutProgressService.ts`
- Modify: `backend/models/WorkoutSession.ts`

**Interfaces:**
- Produces: `withTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T>`.
- Produces: atomic `createSession`; unique key `{ ptId, idempotencyKey }` trả cùng session khi retry.

- [ ] **Step 1: Viết rollback/concurrency tests RED**

Dùng `MongoMemoryReplSet`. Spy/failpoint làm package update thất bại sau session insert; assert session count và package counters không đổi. Gửi hai `createSession` đồng thời với cùng key; assert một session và package chỉ bị trừ một lần.

- [ ] **Step 2: Chạy RED**

Run: `npm test -- backend/tests/transactionAtomicity.test.ts backend/tests/workoutSessions.test.ts`

Expected: partial session tồn tại hoặc package counter sai.

- [ ] **Step 3: Implement transaction wrapper**

```ts
export async function withTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let value!: T;
    await session.withTransaction(async () => { value = await work(session); });
    return value;
  } finally { await session.endSession(); }
}
```

- [ ] **Step 4: Make createSession atomic**

Trong transaction: tìm existing với session; validate customer/template; insert session bằng array form `WorkoutSession.create([doc], { session })`; update package với conditional filter và `{ session }`. Catch duplicate key, đọc record đã tồn tại ngoài transaction và trả `{ created: false }`.

- [ ] **Step 5: Xác minh**

Run: `npm test -- backend/tests/transactionAtomicity.test.ts backend/tests/workoutSessions.test.ts backend/tests/workoutProgress.test.ts`

Expected: rollback sạch, concurrent retry chỉ một side effect.

- [ ] **Step 6: Commit suggestion**

`git commit -m "feat: make workout sessions atomic and idempotent"`

---

### Task 6: Transaction cho transfer, knowledge, formula và publication

**Files:**
- Create: `backend/tests/transferOwnership.test.ts`
- Modify: `backend/tests/transactionAtomicity.test.ts`
- Modify: `backend/services/transferService.ts`
- Modify: `backend/services/knowledgeService.ts`
- Modify: `backend/services/nutritionMetricsService.ts`
- Modify: `backend/services/publicationService.ts`
- Modify: `backend/services/auditService.ts`
- Modify: `backend/services/notificationService.ts`

**Interfaces:**
- `recordAudit(input, session?)` và `createNotificationOnce(input, session?)` nhận optional `ClientSession`.
- Mỗi listed workflow commit hoặc rollback toàn bộ domain write + required audit/notification.

- [ ] **Step 1: Mở rộng atomicity tests RED**

Thêm bốn failure cases: care reassignment lỗi không đổi owner/transfer status; chunk insert lỗi không thay document/chunks; formula create lỗi không deactivate formula cũ; audit/notification lỗi không để report ở `PUBLISHED`.

- [ ] **Step 2: Chạy RED**

Run: `npm test -- backend/tests/transactionAtomicity.test.ts backend/tests/transferOwnership.test.ts`

Expected: ít nhất một workflow lưu một phần.

- [ ] **Step 3: Thread session qua helper writes**

Đổi `recordAudit` sang `AuditLog.create([doc], session ? { session } : {})`. `createNotificationOnce` truyền `{ upsert: true, returnDocument: 'after', session }`. `replaceChunks`, `reassignOpenCare` và customer access queries nhận session explicit.

- [ ] **Step 4: Wrap four workflows**

`resolveTransfer`/`forceTransfer`, knowledge publish/update chunks, nutrition formula activation và publication state/audit chạy trong `withTransaction`. External AI/embedding work được chuẩn bị trước transaction; transaction chỉ chứa database operations.

- [ ] **Step 5: Xác minh**

Run: `npm test -- backend/tests/transactionAtomicity.test.ts backend/tests/transferOwnership.test.ts backend/tests/transfers.test.ts backend/tests/knowledgeCrudConversation.test.ts backend/tests/nutritionMetrics.test.ts backend/tests/publication.test.ts`

Expected: PASS, không partial writes.

- [ ] **Step 6: Commit suggestion**

`git commit -m "feat: make multi-document workflows atomic"`

---

### Task 7: Audit và notification matrix

**Files:**
- Create: `backend/tests/auditMatrix.test.ts`
- Create: `backend/tests/notificationLifecycle.test.ts`
- Modify: `backend/services/exerciseService.ts`
- Modify: `backend/services/workoutProgressService.ts`
- Modify: `backend/services/nutritionMetricsService.ts`
- Modify: `backend/services/knowledgeService.ts`
- Modify: `backend/services/careService.ts`
- Modify: `backend/services/operationsService.ts`
- Modify: `backend/services/auditService.ts`
- Modify: `backend/services/notificationService.ts`
- Modify: `backend/models/Notification.ts`

**Interfaces:**
- Audit actions: `EXERCISE_*`, `WORKOUT_TEMPLATE_*`, `WORKOUT_SESSION_CREATED`, `BODY_MEASUREMENT_*`, `NUTRITION_*`, `KNOWLEDGE_*`, `CARE_ALERT_RESOLVED`.
- Notification types: `CALENDAR_EVENT_UPDATED`, `CALENDAR_EVENT_CANCELLED`, `CARE_TASK_OVERDUE`, `CARE_ALERT_RESOLVED`.

- [ ] **Step 1: Viết matrix tests RED**

```ts
it.each(cases)('$action is audited exactly once', async ({ action, execute }) => {
  await execute();
  expect(await AuditLog.countDocuments({ action })).toBe(1);
});
```

Notification tests gọi lifecycle hai lần và assert một record theo `{ userId, type, resourceType, resourceId }`.

- [ ] **Step 2: Chạy RED**

Run: `npm test -- backend/tests/auditMatrix.test.ts backend/tests/notificationLifecycle.test.ts`

Expected: missing actions/types có count 0 hoặc duplicate.

- [ ] **Step 3: Add audit allowlist và missing calls**

`recordAudit` chỉ giữ metadata scalar allowlist (`fromPtId`, `toPtId`, `version`, `reasonCode`); loại keys khớp `/token|secret|password|image|base64|note/i`. Gọi audit sau domain validation và trong transaction khi workflow atomic.

- [ ] **Step 4: Enforce notification dedup**

Thêm unique compound index `{ userId: 1, type: 1, resourceType: 1, resourceId: 1 }`; catch duplicate key và đọc record hiện có. Bổ sung lifecycle notification tại operations/care services.

- [ ] **Step 5: Xác minh**

Run: `npm test -- backend/tests/auditMatrix.test.ts backend/tests/notificationLifecycle.test.ts backend/tests/sensitiveMutationAudit.test.ts backend/tests/careCalendarNotifications.test.ts`

Expected: mỗi action/notification đúng một record, metadata không có key nhạy cảm.

- [ ] **Step 6: Commit suggestion**

`git commit -m "feat: complete audit and notification coverage"`

---

### Task 8: AI, OCR và vector provider contracts

**Files:**
- Create: `backend/services/vectorSearchProvider.ts`
- Create: `backend/tests/providerContract.test.ts`
- Create: `backend/tests/vectorSearchProvider.test.ts`
- Modify: `backend/services/aiProvider.ts`
- Modify: `backend/services/ocrProvider.ts`
- Modify: `backend/services/embeddingProvider.ts`
- Modify: `backend/services/knowledgeService.ts`
- Modify: `backend/config/env.ts`
- Modify: `.env.example`

**Interfaces:**
- Giữ `generateText(prompt): Promise<string>` và `extractInBody(file): Promise<InBodyExtraction>`.
- Produces: `searchVectors(query: string, filters: VectorFilters, limit: number): Promise<VectorHit[]>`.

- [ ] **Step 1: Viết provider contract tests RED**

Stub `global.fetch` cho 200 valid, empty choices, malformed JSON, 429, 500 và never-resolving timeout. Với vector provider, assert local hits có numeric score và Atlas aggregation bắt đầu bằng `$vectorSearch` với configured index/filter/limit.

- [ ] **Step 2: Chạy RED**

Run: `npm test -- backend/tests/providerContract.test.ts backend/tests/vectorSearchProvider.test.ts`

Expected: AI thiếu timeout wrapper, vector module chưa tồn tại.

- [ ] **Step 3: Migrate AI/OCR to wrapper**

Dùng `fetchWithTimeout(..., env.PROVIDER_TIMEOUT_MS)`, parse response qua narrow type guards, map malformed/empty thành `AppError` external. Không log raw content hoặc base64.

- [ ] **Step 4: Implement vector modes**

`local` dùng `embedText` + cosine trên published chunks. `atlas` gọi `KnowledgeChunk.aggregate([{ $vectorSearch: { index, path: 'embedding', queryVector, numCandidates, limit, filter } }, { $project: { content: 1, topic: 1, documentId: 1, score: { $meta: 'vectorSearchScore' } } }])`. Thiếu `VECTOR_SEARCH_INDEX` trong atlas mode ném 503; không catch để fallback local.

- [ ] **Step 5: Wire knowledge search**

`knowledgeService` gọi `searchVectors` và giữ response contract hiện có; diagnostics chỉ thêm `searchMode: 'local'|'atlas'` nếu endpoint hiện có hỗ trợ field này.

- [ ] **Step 6: Xác minh**

Run: `npm test -- backend/tests/providerContract.test.ts backend/tests/vectorSearchProvider.test.ts backend/tests/vectorRag.test.ts backend/tests/knowledgeAssistant.test.ts`

Expected: PASS và không có network thật.

- [ ] **Step 7: Commit suggestion**

`git commit -m "feat: add production provider adapters"`

---

### Task 9: Migration concurrency và index coverage

**Files:**
- Create: `backend/tests/migrationConcurrency.test.ts`
- Create: `backend/tests/indexCoverage.test.ts`
- Modify: `backend/models/MigrationRecord.ts`
- Modify: `backend/services/migrationService.ts`
- Modify: `backend/models/CustomerProfile.ts`
- Modify: `backend/models/CareAlert.ts`
- Modify: `backend/models/CareTask.ts`
- Modify: `backend/models/CalendarEvent.ts`
- Modify: `backend/models/KnowledgeChunk.ts`

**Interfaces:**
- Migration states: `RUNNING`, `APPLIED`, `FAILED`, `ROLLED_BACK`.
- Lock fields: `ownerId`, `lockedAt`, `expiresAt`; one owner applies one version.

- [ ] **Step 1: Viết migration/index tests RED**

Chạy `Promise.all([runMigrations(), runMigrations()])`, assert tổng `applied` chỉ chứa version một lần và một `APPLIED` record. Thêm cases failed summary sanitized và expired lock takeover. Index test đọc `Model.schema.indexes()` và assert exact compound keys cho các filter/sort hot paths thực tế.

- [ ] **Step 2: Chạy RED**

Run: `npm test -- backend/tests/migrationConcurrency.test.ts backend/tests/indexCoverage.test.ts`

Expected: duplicate apply race hoặc thiếu states/indexes.

- [ ] **Step 3: Implement atomic lock**

Dùng `findOneAndUpdate` với filter version và `$or` gồm record chưa tồn tại/lock hết hạn/owner hiện tại; set `RUNNING`, owner/timestamps. Sau apply set `APPLIED` và unset lock. Catch set `FAILED` với `{ name, message }` đã loại URI/token và rethrow.

- [ ] **Step 4: Add evidence-based indexes**

Thêm compound indexes đúng filter/sort đang dùng, tối thiểu customer assignment/status, care PT/status/dueAt, calendar owner/status/startsAt và knowledge document/version/position. Không thêm index chỉ vì field tồn tại.

- [ ] **Step 5: Xác minh**

Run: `npm test -- backend/tests/migrationConcurrency.test.ts backend/tests/indexCoverage.test.ts backend/tests/migrationSeed.test.ts backend/tests/opsScripts.test.ts`

Expected: PASS, concurrent runner chỉ apply một lần.

- [ ] **Step 6: Commit suggestion**

`git commit -m "feat: serialize migrations and cover query indexes"`

---

### Task 10: Production smoke và CI quality gate

**Files:**
- Create: `backend/tests/productionSmoke.test.ts`
- Create: `scripts/production-smoke.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `backend/config/logger.ts`
- Modify: `backend/server.ts`

**Interfaces:**
- Produces: `npm run verify:backend` không cần external network/secret.
- Produces: smoke khởi động compiled artifact, kiểm tra live/ready/login/protected representative endpoint và đóng sạch.

- [ ] **Step 1: Viết production smoke RED**

Test build artifact vào temp output, khởi động child Node process với `NODE_ENV=test`, MongoMemory URI, random port và test JWT/admin env. Poll `/api/health/ready`, login, gọi customer list bằng token, gửi SIGTERM và assert exit code 0 trong timeout.

- [ ] **Step 2: Chạy RED**

Run: `npm test -- backend/tests/productionSmoke.test.ts`

Expected: FAIL trước khi artifact/bootstrap/shutdown contract hoàn chỉnh.

- [ ] **Step 3: Add deterministic smoke command**

`scripts/production-smoke.mjs` spawn compiled bootstrap với env được truyền từ caller, prefix child logs, timeout 30 giây và luôn terminate child trong `finally`. Không hard-code URI, token hoặc credentials.

- [ ] **Step 4: Add backend quality scripts/CI**

```json
"lint:backend": "oxlint backend vitest.config.ts",
"smoke:production": "node scripts/production-smoke.mjs",
"verify:backend": "npm run test:backend && npm run typecheck:backend && npm run lint:backend && npm run build:backend && npm run smoke:production"
```

CI gọi `npm ci` rồi `npm run verify:backend`; provider tests tiếp tục dùng stubs và không đọc secret CI.

- [ ] **Step 5: Chạy targeted verification**

Run: `npm test -- backend/tests/productionSmoke.test.ts backend/tests/lifecycle.test.ts backend/tests/health.test.ts`

Expected: PASS và child process không còn open handles.

- [ ] **Step 6: Chạy full gate**

Run: `npm run verify:backend`

Expected: toàn bộ backend tests PASS, typecheck/lint/build/smoke exit 0. Baseline không còn known failure.

- [ ] **Step 7: Kiểm tra phạm vi**

Run: `git status --short && git diff --check && git diff --name-only -- frontend/src`

Expected: không có whitespace error; lệnh cuối không có output.

- [ ] **Step 8: Commit suggestion**

`git commit -m "ci: verify production backend automatically"`
