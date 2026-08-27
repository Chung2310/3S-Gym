# Minimal Environment Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the supported environment interface to the 16 approved keys and move stable application policy into typed code constants.

**Architecture:** `backend/config/env.ts` remains the single configuration boundary, exposing validated deployment values plus immutable application policy. Providers and infrastructure consume those constants instead of reading removed environment keys, while secret-bearing services continue reading only approved secret keys.

**Tech Stack:** TypeScript, Node.js, Express, Vitest

## Global Constraints

- Supported keys are exactly `NODE_ENV`, `PORT`, `MONGODB_URI`, `MONGODB_USER`, `MONGODB_PASSWORD`, `MONGODB_AUTH_SOURCE`, `JWT_SECRET`, `CORS_ORIGINS`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME`, `OPENROUTER_API_KEY`, `APP_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Do not commit `.env` or expose any existing secret.
- `.env.example` must leave passwords and API credentials empty.
- Stable policy values must not be overridable through removed environment keys.
- Preserve existing HTTP and service contracts.

---

### Task 1: Typed fixed application policy

**Files:**
- Modify: `backend/config/env.ts`
- Modify: `backend/tests/environment.test.ts`

**Interfaces:**
- Produces: `APP_POLICY` immutable object with JWT, limits, timeout, model, vector, logging, and debug constants.
- Produces: `loadEnv(source): AppEnv` where supported deployment fields are parsed and policy fields come only from `APP_POLICY`.

- [ ] **Step 1: Add failing tests**

Add a test that passes removed keys with hostile override values and asserts `loadEnv()` returns `JWT_ISSUER: '3s-gym'`, `JWT_AUDIENCE: '3s-gym-api'`, `TRUST_PROXY: false`, `JSON_BODY_LIMIT: '1mb'`, `PROVIDER_TIMEOUT_MS: 15000`, `AUTH_RATE_LIMIT_PER_15M: 20`, `AI_RATE_LIMIT_PER_MINUTE: 10`, and `OCR_MAX_FILE_BYTES: 8388608`.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run --config vitest.config.ts backend/tests/environment.test.ts`
Expected: FAIL because removed environment keys still override policy.

- [ ] **Step 3: Implement immutable policy**

Define `APP_POLICY` with the exact values in the spec, reference it from `loadEnv()`, and export its inferred readonly type. Keep production validation for MongoDB URI, JWT secret length, and port.

- [ ] **Step 4: Verify GREEN**

Run: `npx vitest run --config vitest.config.ts backend/tests/environment.test.ts`
Expected: all environment tests PASS.

### Task 2: Remove legacy environment reads

**Files:**
- Modify: `backend/config/logger.ts`
- Modify: `backend/config/logFormatter.ts`
- Modify: `backend/server.ts`
- Modify: `backend/services/aiProvider.ts`
- Modify: `backend/services/ocrProvider.ts`
- Modify: `backend/services/vectorSearchProvider.ts`
- Modify: `backend/services/telemetryService.ts`
- Modify: `backend/middlewares/errorHandler.ts`
- Modify: `backend/tests/logger.test.ts`
- Modify: `backend/tests/providerContract.test.ts`
- Modify: `backend/tests/vectorSearchProvider.test.ts`
- Modify: `backend/tests/errorInfrastructure.test.ts`

**Interfaces:**
- Consumes: `APP_POLICY` from Task 1.
- Preserves: `generateText`, `extractInBody`, `searchVectors`, `initTelemetry`, `captureError`, and `flushTelemetry` signatures.

- [ ] **Step 1: Add failing provider/infrastructure tests**

Assert `AI_MODEL`, `OCR_MODEL`, `VECTOR_SEARCH_MODE`, `VECTOR_SEARCH_INDEX`, `LOG_LEVEL`, `LOG_MAX_*`, `ERROR_DEBUG`, and `SHUTDOWN_TIMEOUT_MS` cannot override behavior. Update vector tests to stub `NODE_ENV` instead of removed vector variables and assert Atlas index `knowledge-vector`.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run --config vitest.config.ts backend/tests/logger.test.ts backend/tests/providerContract.test.ts backend/tests/vectorSearchProvider.test.ts backend/tests/errorInfrastructure.test.ts`
Expected: new assertions FAIL while services still read removed keys.

- [ ] **Step 3: Replace environment reads**

Import `APP_POLICY` into logger, log formatter, server, providers, and error middleware. Make telemetry functions no-op without importing Sentry at runtime. Select vector mode solely from normalized `NODE_ENV`, always use `knowledge-vector` in production, and use the fixed Gemini model and timeouts.

- [ ] **Step 4: Remove unused Sentry dependency**

Run: `npm uninstall @sentry/node`
Expected: `package.json`, `package-lock.json`, and installed modules no longer contain the direct dependency; synchronize `yarn.lock` with `yarn install --mode=update-lockfile`.

- [ ] **Step 5: Verify GREEN**

Run: `npx vitest run --config vitest.config.ts backend/tests/logger.test.ts backend/tests/providerContract.test.ts backend/tests/vectorSearchProvider.test.ts backend/tests/errorInfrastructure.test.ts backend/tests/lifecycle.test.ts`
Expected: all selected tests PASS.

### Task 3: Minimize environment files and verify contract

**Files:**
- Modify locally, never stage: `.env`
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `backend/tests/environment.test.ts`

**Interfaces:**
- Produces: documented 16-key environment contract matching the spec exactly.

- [ ] **Step 1: Add failing `.env.example` contract test**

Read `.env.example`, extract assignment keys, and assert deep equality with the approved ordered key list. Assert secret assignments are empty and `ADMIN_PASSWORD=adminpassword` is absent.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run --config vitest.config.ts backend/tests/environment.test.ts`
Expected: FAIL because `.env.example` still contains removed keys.

- [ ] **Step 3: Rewrite `.env.example` and local `.env`**

Keep only the approved keys. Preserve current secret values in local `.env`, set the requested non-secret local values, and never print or stage `.env`. Document fixed policy and the post-deployment admin-password rotation warning in `README.md`.

- [ ] **Step 4: Verify focused contract**

Run: `npx vitest run --config vitest.config.ts backend/tests/environment.test.ts`
Expected: all environment contract tests PASS.

- [ ] **Step 5: Scan for forbidden environment reads**

Run: `rg -n "JWT_ISSUER|JWT_AUDIENCE|TRUST_PROXY|JSON_BODY_LIMIT|PROVIDER_TIMEOUT_MS|AUTH_RATE_LIMIT_PER_15M|AI_RATE_LIMIT_PER_MINUTE|OCR_MAX_FILE_BYTES|VECTOR_SEARCH_MODE|VECTOR_SEARCH_INDEX|LOG_LEVEL|LOG_PRETTY|LOG_MAX_|ERROR_DEBUG|SENTRY_DSN|SENTRY_ENVIRONMENT|APP_RELEASE|SHUTDOWN_TIMEOUT_MS|AI_MODEL|OCR_MODEL" backend --glob '!backend/tests/**'`
Expected: matches only typed `APP_POLICY` property names in `backend/config/env.ts` and imports/usages of those properties; no `process.env.<removed-key>` remains.

- [ ] **Step 6: Full verification and commit**

Run: `npm run verify:backend`
Expected: tests, typecheck, lint, build, and production smoke exit 0. Stage every changed tracked file except `.env`, inspect staged names, commit with `refactor: simplify environment configuration`, and push `feature/readable-api-logging`.
