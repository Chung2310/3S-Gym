# Backend Production Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn tất các khoảng trống backend 3S Wellness để API có thể chạy staging/production an toàn với provider thật, transaction, security, migration và bằng chứng vận hành.

**Architecture:** Giữ Express/Mongoose theo Route → Controller → Service → Model/Provider; đóng băng contract canonical cho frontend và đưa route legacy về adapter có deprecation rõ ràng, tuyệt đối không sinh dữ liệu sức khỏe giả. Các mutation nhiều collection dùng MongoDB session/transaction và idempotency; provider ngoài đi qua adapter có timeout và lỗi chuẩn hóa.

**Tech Stack:** Node.js 24 ESM, TypeScript strict, Express 5, Mongoose 9, MongoDB, Vitest, Supertest, OpenRouter, PowerShell ops scripts, Docker.

## Global Constraints

- Làm trong worktree riêng: branch `feature/backend-production-hardening`; không sửa `frontend/src/**`.
- Không thay đổi response envelope hoặc endpoint public nếu chưa thêm contract test tương thích ngược.
- Mọi chức năng dùng TDD và có test ownership/RBAC/validation tương ứng.
- AI/OCR chỉ tạo draft; không auto-publish, không chẩn đoán y khoa.
- Feature beta phải tiếp tục bị chặn ở backend khi flag tắt.
- Không dùng mock trong smoke test staging; unit/integration test được phép mock provider.
- Không commit secrets, backup database hoặc output build.

---

### Task 1: Khóa production artifact, Node ESM runtime và env bootstrap

**Priority:** P0

**Files:**
- Modify: `backend/app.ts`
- Modify: `backend/server.ts`, `package.json`, `Dockerfile`
- Create: `backend/config/env.ts`, `tsconfig.backend.build.json`, `backend/tests/productionArtifact.test.ts`, `backend/tests/environment.test.ts`
- Create: `backend/tests/esmRuntime.test.ts`
- Test: `backend/tests/frontendServing.test.ts`

**Interfaces:**
- Consumes: `registerFrontend(app, frontendPath)`.
- Produces: artifact `dist/backend/server.js` chạy bằng Node 24 không cần `tsx`/devDependencies; env được load trước dependency graph; production serve đúng frontend artifact.

- [ ] **Step 1: Viết regression test chạy native ESM**

```ts
const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', "process.env.NODE_ENV='test'; await import('./backend/app.ts');"], { cwd: path.resolve('.'), encoding: 'utf8' });
expect(result.status, result.stderr || result.stdout).toBe(0);
```

- [ ] **Step 2: Chạy test để xác nhận RED**

Run: `npm test -- backend/tests/esmRuntime.test.ts`

Expected: FAIL với `ReferenceError: __dirname is not defined in ES module scope`.

- [ ] **Step 3: Sửa path theo chuẩn ESM**

```ts
import { fileURLToPath } from 'node:url';
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendPath = process.env.NODE_ENV === 'production'
  ? path.resolve(currentDirectory, '../dist')
  : path.resolve(currentDirectory, '../frontend');
```

- [ ] **Step 4: Xác minh và commit**

Build backend bằng `tsc -p tsconfig.backend.build.json`; sửa Docker copy frontend về đúng path mà `app.ts` phục vụ. Production fail-fast khi thiếu `JWT_SECRET`/`MONGODB_URI`; bỏ fallback `secret_key`, khóa issuer/audience/algorithm và xác thực lại trạng thái tài khoản trên request.

Run: `npm test -- backend/tests/esmRuntime.test.ts backend/tests/productionArtifact.test.ts backend/tests/environment.test.ts backend/tests/frontendServing.test.ts && npm run typecheck:backend`

Expected: 2 test files PASS; không còn tham chiếu `__dirname` trong `backend/**`.

Commit: `fix: resolve frontend paths in node esm runtime`

---

### Task 2: Tách route legacy Nutrition/OCR/AI theo lớp

**Priority:** P0

**Files:**
- Modify: `backend/routes/nutrition.ts`, `backend/app.ts`
- Create: `backend/controllers/legacyNutritionController.ts`
- Create: `backend/services/mealImageService.ts`, `backend/services/nutritionScanService.ts`
- Test: `backend/tests/nutritionLegacyContract.test.ts`, `backend/tests/routeValidation.test.ts`

**Interfaces:**
- Consumes: `POST /api/nutrition/calculate`, `GET /api/nutrition/meal-image`, `POST /api/nutrition/scan-inbody`.
- Produces: frontend mới chỉ dùng canonical `/api/nutrition/metrics`, `/api/content-drafts/nutrition`, `/api/inbody/ocr`, `/api/inbody/:id/confirm-ocr`; endpoint legacy trả adapter/deprecation contract đã chốt và không sinh fallback health data giả.

- [ ] **Step 1: Viết contract test chụp ba endpoint hiện tại**

```ts
expect(calculate.body).toMatchObject({ success: true, data: { formula: 'MIFFLIN_ST_JEOR' } });
expect(scan.body.data).toMatchObject({ status: 'DRAFT', ocrStatus: 'REVIEW_REQUIRED' });
expect([200, 302]).toContain(mealImage.status);
```

- [ ] **Step 2: Chạy test baseline và tạo test cấu trúc RED**

Run: `npm test -- backend/tests/nutritionLegacyContract.test.ts`

Expected: contract baseline PASS; assertion source route không chứa `fetch(` FAIL.

- [ ] **Step 3: Di chuyển provider calls khỏi route**

```ts
export async function scanInBodyDraft(user: AuthenticatedUser, payload: ScanPayload) {
  const extracted = await extractInBody(payload.imageBase64, payload.mimeType);
  return createOcrDraft(user, payload.customerId, extracted);
}
```

Giữ validator và feature flags `NUTRITION_AI`, `OCR_INBODY`; xóa code gọi OpenRouter trùng khỏi route sau khi contract test xanh. Nếu OCR parse lỗi, trả lỗi/draft cần review thay vì số đo mẫu.

- [ ] **Step 4: Xác minh và commit**

Run: `npm test -- backend/tests/nutritionLegacyContract.test.ts backend/tests/inbodyOcr.test.ts backend/tests/nutritionAdvanced.test.ts`

Expected: PASS; `rg -n "fetch\(" backend/routes/nutrition.ts` không có kết quả.

Commit: `refactor: isolate legacy nutrition providers`

---

### Task 3: Transaction và idempotency cho mutation nhiều collection

**Priority:** P0

**Files:**
- Modify: `backend/services/workoutProgressService.ts`, `backend/services/transferService.ts`, `backend/services/careService.ts`, `backend/services/operationsService.ts`, `backend/services/notificationService.ts`, `backend/services/knowledgeService.ts`, `backend/services/nutritionMetricsService.ts`
- Create: `backend/services/transactionService.ts`
- Test: `backend/tests/transactionAtomicity.test.ts`, `backend/tests/workoutSessions.test.ts`, `backend/tests/transferOwnership.test.ts`

**Interfaces:**
- Produces: `withTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T>`.
- Giữ idempotency key của workout session; notification dùng `userId + type + resourceId`.

- [ ] **Step 1: Viết test fail mô phỏng write thứ hai lỗi**

```ts
await expect(createWorkoutSessionWithFailure(payload)).rejects.toThrow();
expect(await WorkoutSession.countDocuments({ idempotencyKey })).toBe(0);
expect((await PtPackage.findById(packageId))?.usedSessions).toBe(0);
```

Test bằng `MongoMemoryReplSet` để transaction thật sự được hỗ trợ. Thêm case transfer không đổi owner khi reassignment Alert/Task lỗi, knowledge document/chunks không lệch nhau, formula cũ không bị deactivate khi create mới lỗi, và report publish không lưu `PUBLISHED` khi notification/audit lỗi.

- [ ] **Step 2: Xác nhận RED**

Run: `npm test -- backend/tests/transactionAtomicity.test.ts`

Expected: FAIL vì dữ liệu lưu một phần.

- [ ] **Step 3: Bọc transaction và truyền session tới mọi write**

```ts
export async function withTransaction<T>(work: (session: ClientSession) => Promise<T>) {
  const session = await mongoose.startSession();
  try { return await session.withTransaction(() => work(session)) as T; }
  finally { await session.endSession(); }
}
```

Mọi `create/save/updateMany/findOneAndUpdate` trong cùng use case phải nhận `{ session }`.

- [ ] **Step 4: Xác minh retry và commit**

Run: `npm test -- backend/tests/transactionAtomicity.test.ts backend/tests/workoutSessions.test.ts backend/tests/transferOwnership.test.ts backend/tests/careCalendarNotifications.test.ts`

Expected: rollback sạch và retry không tạo duplicate.

Commit: `feat: make multi-document workflows atomic`

---

### Task 4: Security hardening và giới hạn provider/upload

**Priority:** P0

**Files:**
- Modify: `package.json`, `backend/app.ts`, `.env.example`
- Create: `backend/middlewares/security.ts`, `backend/middlewares/rateLimit.ts`, `backend/services/providerRequest.ts`
- Modify: `backend/services/aiProvider.ts`, `backend/services/ocrProvider.ts`, `backend/routes/inbodyOcr.ts`
- Test: `backend/tests/securityHardening.test.ts`, `backend/tests/providerTimeout.test.ts`

**Interfaces:**
- Produces: `fetchWithTimeout(url, init, timeoutMs)`; rate buckets `AUTH`, `AI`, `OCR`, `GENERAL`.
- Env: `PROVIDER_TIMEOUT_MS=15000`, `AUTH_RATE_LIMIT_PER_15M=20`, `AI_RATE_LIMIT_PER_MINUTE=10`, `OCR_MAX_FILE_BYTES=8388608`.

- [ ] **Step 1: Viết test RED**

```ts
expect(loginAttempt21.status).toBe(429);
expect(response.headers['x-content-type-options']).toBe('nosniff');
await expect(fetchWithTimeout(url, {}, 10)).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE_ERROR' });
```

Thêm upload sai MIME, file quá 8 MiB và JSON body vượt giới hạn nghiệp vụ.

- [ ] **Step 2: Chạy test RED**

Run: `npm test -- backend/tests/securityHardening.test.ts backend/tests/providerTimeout.test.ts`

Expected: thiếu header/rate limit/timeout.

- [ ] **Step 3: Implement middleware và provider wrapper**

```ts
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), timeoutMs);
try { return await fetch(url, { ...init, signal: controller.signal }); }
finally { clearTimeout(timer); }
```

Dùng Helmet; CORS allowlist từ `CORS_ORIGINS`; trust proxy chỉ bật qua env; không log Authorization/body ảnh.

- [ ] **Step 4: Xác minh và commit**

Run: `npm test -- backend/tests/securityHardening.test.ts backend/tests/providerTimeout.test.ts && npm audit --omit=dev`

Expected: PASS; không còn high/critical dependency vulnerability chưa có quyết định.

Commit: `feat: harden api and external providers`

---

### Task 5: Phủ audit và notification matrix

**Priority:** P1

**Files:**
- Modify: `backend/services/exerciseService.ts`, `backend/services/workoutTemplateService.ts`, `backend/services/workoutSessionService.ts`, `backend/services/progressService.ts`, `backend/services/nutritionMetricsService.ts`, `backend/services/knowledgeService.ts`, `backend/services/careService.ts`, `backend/services/operationsService.ts`
- Create: `backend/tests/auditMatrix.test.ts`, `backend/tests/notificationLifecycle.test.ts`

**Interfaces:**
- Audit actions: `EXERCISE_*`, `WORKOUT_TEMPLATE_*`, `WORKOUT_SESSION_CREATED`, `BODY_MEASUREMENT_*`, `NUTRITION_*`, `KNOWLEDGE_*`, `CARE_ALERT_RESOLVED`.
- Notification bổ sung: `CALENDAR_EVENT_UPDATED`, `CALENDAR_EVENT_CANCELLED`, `CARE_TASK_OVERDUE`, `CARE_ALERT_RESOLVED`.

- [ ] **Step 1: Viết matrix test RED**

```ts
it.each(expectedActions)('%s is audited once', async (action) => {
  await executeMutation(action);
  expect(await AuditLog.countDocuments({ action })).toBe(1);
});
```

- [ ] **Step 2: Chạy RED**

Run: `npm test -- backend/tests/auditMatrix.test.ts backend/tests/notificationLifecycle.test.ts`

Expected: các action còn thiếu trả count 0.

- [ ] **Step 3: Ghi audit sau write thành công và notification idempotent**

Mọi audit gồm actor, role, resource type/id, customerId nếu có; metadata không chứa medical note, token hoặc ảnh OCR.

- [ ] **Step 4: Xác minh và commit**

Run: `npm test -- backend/tests/auditMatrix.test.ts backend/tests/notificationLifecycle.test.ts backend/tests/sensitiveMutationAudit.test.ts`

Commit: `feat: complete audit and notification coverage`

---

### Task 6: Production adapters cho AI, OCR và Vector Search

**Priority:** P1

**Files:**
- Modify: `backend/services/aiProvider.ts`, `backend/services/ocrProvider.ts`, `backend/services/embeddingProvider.ts`, `backend/services/knowledgeService.ts`, `.env.example`
- Create: `backend/services/vectorSearchProvider.ts`
- Test: `backend/tests/providerContract.test.ts`, `backend/tests/vectorSearchProvider.test.ts`

**Interfaces:**
- `generateText(prompt): Promise<string>` và `extractInBody(...)` giữ signature.
- Produces: `searchVectors(query, filters, limit)` chọn Atlas khi `VECTOR_SEARCH_MODE=atlas`, local cosine khi `local`.

- [ ] **Step 1: Viết provider contract test RED**

```ts
expect(await searchVectors('squat', { status: 'PUBLISHED' }, 5)).toEqual(expect.arrayContaining([expect.objectContaining({ score: expect.any(Number) })]));
expect(searchPipeline[0]).toHaveProperty('$vectorSearch');
```

Thêm contract response rỗng/malformed/429/timeout cho AI và OCR.

- [ ] **Step 2: Chạy RED**

Run: `npm test -- backend/tests/providerContract.test.ts backend/tests/vectorSearchProvider.test.ts`

- [ ] **Step 3: Implement adapter có fallback rõ ràng**

Atlas mode không âm thầm fallback khi cấu hình sai; trả `503 UNAVAILABLE`. Local mode chỉ dành development/test và ghi `searchMode: 'local'` trong diagnostics.

- [ ] **Step 4: Xác minh và commit**

Run: `npm test -- backend/tests/providerContract.test.ts backend/tests/vectorSearchProvider.test.ts backend/tests/vectorRag.test.ts backend/tests/assistant.test.ts`

Commit: `feat: add production ai ocr and vector adapters`

---

### Task 7: Migration lock và rollback runbook

**Priority:** P1

**Files:**
- Modify: `backend/models/MigrationRecord.ts`, `backend/services/migrationService.ts`, `backend/scripts/migrate.ts`, `docs/runbooks/3s-wellness-rollback.md`
- Test: `backend/tests/migrationConcurrency.test.ts`, `backend/tests/migrationSeed.test.ts`

**Interfaces:**
- Migration states: `RUNNING`, `APPLIED`, `ROLLED_BACK`, `FAILED`.
- Lock có `ownerId`, `lockedAt`, `expiresAt`; chỉ một runner được thực thi cùng version.

- [ ] **Step 1: Viết concurrency test RED**

```ts
const [a, b] = await Promise.all([runMigrations(), runMigrations()]);
expect([...a.applied, ...b.applied]).toEqual(['001-content-defaults']);
expect(await MigrationRecord.countDocuments({ version: '001-content-defaults', status: 'APPLIED' })).toBe(1);
```

- [ ] **Step 2: Chạy RED**

Run: `npm test -- backend/tests/migrationConcurrency.test.ts`

- [ ] **Step 3: Implement atomic lock và FAILED state**

Dùng `findOneAndUpdate` với điều kiện lock hết hạn; lưu error summary không chứa URI/secret; rollback chỉ dùng journal ID/field đã ghi.

- [ ] **Step 4: Xác minh và commit**

Run: `npm test -- backend/tests/migrationConcurrency.test.ts backend/tests/migrationSeed.test.ts backend/tests/opsScripts.test.ts`

Commit: `feat: serialize migrations and document rollback`

---

### Task 8: Index review, load test và observability

**Priority:** P1

**Files:**
- Create: `scripts/load-smoke.mjs`, `backend/tests/indexCoverage.test.ts`, `docs/runbooks/3s-wellness-performance.md`
- Modify: `backend/config/logger.ts`, `backend/server.ts`

**Interfaces:**
- Load scenarios: login, customer list, Care Today, PT dashboard, knowledge search.
- SLO smoke: p95 list/dashboard dưới 500 ms ở 20 virtual users; error rate dưới 1% trên staging seed.

- [ ] **Step 1: Viết index test RED**

```ts
expect(indexes).toEqual(expect.arrayContaining([expect.objectContaining({ key: { assignedPtId: 1, status: 1 } })]));
```

- [ ] **Step 2: Chạy RED và ghi baseline explain**

Run: `npm test -- backend/tests/indexCoverage.test.ts`

Expected: chỉ ra collection thiếu compound index; không thêm index không được query sử dụng.

- [ ] **Step 3: Thêm metrics/logging**

Log requestId, route template, status, duration; Sentry capture error 5xx; không log PII. Script load đọc `BASE_URL`, `PT_TOKEN`, không hard-code credentials.

- [ ] **Step 4: Xác minh và commit**

Run: `node scripts/load-smoke.mjs`

Expected staging: SLO đạt hoặc runbook ghi endpoint vượt SLO cùng explain/index được sửa trước commit.

Commit: `perf: add index gates and staging load smoke`

---

### Task 9: Release rehearsal và bằng chứng Go/No-Go

**Priority:** P2

**Files:**
- Create: `docs/releases/backend-staging-rehearsal.md`, `docs/releases/backend-known-issues.md`
- Modify: `docs/runbooks/3s-wellness-release.md`, `.github/workflows/ci.yml` nếu workflow tồn tại

**Interfaces:**
- Gate: test, typecheck, lint, build, migration status, backup/restore, health, three-role smoke, provider smoke, load smoke.

- [ ] **Step 1: Chạy quality gate cục bộ**

Run: `npm test && npm run typecheck && npm run lint && npm run build`

Expected: toàn bộ PASS, output không có unhandled rejection.

- [ ] **Step 2: Chạy staging rehearsal**

Run:

```powershell
npm run db:migrate
npm run db:migrate:status
powershell -File scripts/backup-mongodb.ps1 -Environment staging -OutputPath backups/rehearsal -MongoUri $env:MONGODB_URI
powershell -File scripts/restore-mongodb.ps1 -Environment staging -BackupPath backups/rehearsal -MongoUri $env:MONGODB_URI
```

Expected: manifest/count/checksum khớp, migration APPLIED, health live/ready 200.

- [ ] **Step 3: Smoke provider thật và ba role**

Xác minh AI/OCR tạo draft, PT confirm, customer chỉ thấy published; lưu requestId và kết quả, không lưu ảnh/token trong tài liệu.

- [ ] **Step 4: Chốt tài liệu và commit**

Known issues phải có severity, impact, workaround và owner; bất kỳ P0/P1 chưa đóng làm trạng thái No-Go.

Commit: `docs: record backend staging readiness`

## Worktree Handoff

```powershell
$baseBranch = git branch --show-current
git worktree add '..\3S-Gym-backend' -b feature/backend-production-hardening $baseBranch
```

Agent backend chỉ làm plan này. Trước khi merge, rebase/merge base branch, chạy lại quality gate và không lấy các thay đổi `frontend/src/**` từ worktree frontend bằng cherry-pick thủ công.
