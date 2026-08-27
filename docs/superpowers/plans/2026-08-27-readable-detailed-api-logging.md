# Readable Detailed API Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace raw Pino JSON with UTF-8 Winston text logs and add safe, correlated request/response details for every API call.

**Architecture:** A focused formatter/sanitizer module converts arbitrary metadata into bounded, redacted text. A Winston-backed compatibility logger exposes the methods used by existing application code, while an Express middleware owns request IDs, response capture, duration measurement, and API lifecycle logs.

**Tech Stack:** TypeScript, Express 5, Winston, Vitest, Supertest

## Global Constraints

- Use `[YYYY-MM-DD HH:mm:ss.SSS] [level]: [Context] message` in development and production.
- Preserve Vietnamese and other Unicode text as UTF-8.
- Never log secret contents or API-key prefixes.
- Bound depth, collection size, and string/body length; mark truncation explicitly.
- Preserve the current HTTP response contract and `x-request-id` behavior.
- Do not create commits unless the user separately authorizes commits.

---

### Task 1: Safe UTF-8 log formatting and Winston adapter

**Files:**
- Create: `backend/config/logFormatter.ts`
- Modify: `backend/config/logger.ts`
- Modify: `backend/types/express.d.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `backend/tests/logger.test.ts`

**Interfaces:**
- Produces: `sanitizeLogValue(value: unknown, options?: SanitizeOptions): unknown`
- Produces: `formatLogLine(entry: LogEntry): string`
- Produces: `logger` with `debug/info/warn/error/fatal`, `child`, and `flush` compatibility methods.

- [ ] **Step 1: Add failing formatter tests**

Test exact timestamp/context layout, raw Vietnamese preservation, multiline object formatting, nested case-insensitive redaction, error serialization, circular reference handling, buffer summarization, and `[TRUNCATED]` markers.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npx vitest run --config vitest.config.ts backend/tests/logger.test.ts`
Expected: FAIL because `logFormatter.ts` does not exist.

- [ ] **Step 3: Implement bounded sanitization and line formatting**

Implement recursive cloning with a `WeakSet`, defaults of 4 levels, 25 collection entries, and 2,000 string characters. Redact sensitive keys to `[ĐÃ ẨN]`, summarize buffers/files, serialize errors, and use `node:util.inspect` with colors disabled and UTF-8 strings unchanged.

- [ ] **Step 4: Install Winston and replace the Pino logger**

Run: `npm install winston`

Create a console transport with a custom `format.printf`. Preserve current call style such as `logger.info({ port }, 'Máy chủ đã khởi động')`, map `fatal` to an error event tagged `Fatal`, and make `flush` resolve after transports finish pending writes. Replace the Express `Request.log` type with the local logger interface.

- [ ] **Step 5: Run formatter and type tests**

Run: `npx vitest run --config vitest.config.ts backend/tests/logger.test.ts && npm run typecheck:backend`
Expected: formatter tests PASS and TypeScript exits 0.

### Task 2: Detailed request and response lifecycle logs

**Files:**
- Modify: `backend/middlewares/requestContext.ts`
- Modify: `backend/app.ts`
- Test: `backend/tests/requestLogging.test.ts`
- Test: `backend/tests/requestContext.test.ts`

**Interfaces:**
- Consumes: compatibility `logger` and `sanitizeLogValue` from Task 1.
- Produces: `requestContext(req, res, next)` assigning `req.requestId` and `req.log`.
- Produces: `captureApiResponseBody(req, res, next)` wrapping `res.json` without changing its return value.

- [ ] **Step 1: Add failing lifecycle tests**

Use an injected/captured logger to assert paired `REQUEST` and `RESPONSE` records for a Supertest call. Assert method, original URL, IP, request ID, status, duration, query/body, response body, and levels for 2xx/4xx/5xx. Assert password/token/base64 fields never appear.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npx vitest run --config vitest.config.ts backend/tests/requestLogging.test.ts`
Expected: FAIL because lifecycle fields and response capture are absent.

- [ ] **Step 3: Implement lifecycle middleware**

Generate/validate request IDs, attach a child logger containing request ID and authenticated identity when available, measure with `process.hrtime.bigint()`, and listen once to `finish` and `close`. Capture JSON response values through a transparent `res.json` wrapper. Emit `REQUEST` after JSON parsing so body exists, then emit exactly one `RESPONSE` record.

- [ ] **Step 4: Correct middleware ordering**

In `backend/app.ts`, configure security/body parsing before the detailed request record while retaining request ID availability for parsers and error handling. Ensure `trust proxy` is configured before reading `req.ip`.

- [ ] **Step 5: Run request logging regression tests**

Run: `npx vitest run --config vitest.config.ts backend/tests/requestLogging.test.ts backend/tests/requestContext.test.ts backend/tests/errorContract.test.ts`
Expected: all selected tests PASS.

### Task 3: Error integration, mojibake cleanup, configuration, and full verification

**Files:**
- Modify: `backend/middlewares/errorHandler.ts`
- Modify: `backend/config/logger.ts`
- Modify: `.env.example`
- Modify: `README.md`
- Test: `backend/tests/errorInfrastructure.test.ts`
- Test: `backend/tests/logger.test.ts`

**Interfaces:**
- Consumes: request-scoped compatibility logger and safe formatter.
- Produces: unchanged API error response schema with readable contextual error logs.

- [ ] **Step 1: Add failing error and configuration assertions**

Assert operational errors log code/name/request ID without stack, unexpected non-production errors include sanitized stack, production logs omit stack, and Vietnamese messages/censor text contain no mojibake. Assert invalid log-size environment values fall back safely.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npx vitest run --config vitest.config.ts backend/tests/errorInfrastructure.test.ts backend/tests/logger.test.ts`
Expected: at least the new assertions FAIL.

- [ ] **Step 3: Integrate error logging and document settings**

Use `[Error Handler]` context, correct existing mojibake strings, retain status-based levels, and preserve the response body. Replace obsolete `LOG_PRETTY` with documented `LOG_MAX_STRING_LENGTH`, `LOG_MAX_DEPTH`, and `LOG_MAX_COLLECTION_ITEMS` defaults in `.env.example`; document UTF-8 PowerShell guidance and sample output in `README.md`.

- [ ] **Step 4: Run focused tests until green**

Run: `npx vitest run --config vitest.config.ts backend/tests/logger.test.ts backend/tests/requestLogging.test.ts backend/tests/requestContext.test.ts backend/tests/errorInfrastructure.test.ts backend/tests/errorContract.test.ts`
Expected: all selected tests PASS.

- [ ] **Step 5: Run the backend verification suite**

Run: `npm run verify:backend`
Expected: backend tests, typecheck, lint, build, and production smoke all exit 0.

- [ ] **Step 6: Inspect a real sample log**

Start the backend in a bounded local run, request `/api/health`, and confirm the console contains readable paired lines with correct Vietnamese, request ID, status, and duration, with no JSON-only outer envelope.
