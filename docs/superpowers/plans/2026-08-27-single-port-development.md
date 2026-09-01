# Single-port Development Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `npm run dev` the unambiguous full-stack development entry point serving frontend and backend from port 3008 with Vite HMR.

**Architecture:** Express remains the only TCP listener. Vite continues to run as Express middleware after the API routes, and package/documentation defaults stop advertising a second frontend port.

**Tech Stack:** Node.js, Express 5, Vite 8, TypeScript, Vitest.

## Global Constraints

- Preserve Vite HMR through middleware mode.
- Preserve `/api/*` route precedence and production static serving.
- Do not introduce a reverse proxy or change API contracts.
- Do not create a worktree, commit, or push.

---

### Task 1: Lock the single-port development contract

**Files:**
- Modify: `backend/tests/frontendServing.test.ts`
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `README.md`

**Interfaces:**
- Consumes: `registerFrontend(app, frontendPath, options)` and `npm run dev`.
- Produces: One documented development origin, `http://localhost:3008`, started through `backend/dev.ts`.

- [ ] **Step 1: Write the failing contract test**

Add a test that reads `package.json` and `.env.example`, then asserts that `dev` and `dev:backend` start `backend/dev.ts`, no `dev:frontend` script starts a standalone Vite listener, and the sample CORS origin uses port 3008.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- backend/tests/frontendServing.test.ts`

Expected: FAIL because `dev:frontend` is `vite` and `CORS_ORIGINS` points to port 5173.

- [ ] **Step 3: Apply the minimal configuration and documentation change**

Add `backend/dev.ts` to force development mode before importing the existing bootstrap, remove the standalone `dev:frontend` script, point `dev` and `dev:backend` at the development entry point, change the sample CORS origin to `http://localhost:3008`, and document that `npm run dev` serves both UI and API with HMR from the same origin.

- [ ] **Step 4: Verify GREEN and the complete quality gate**

Run the focused test, then `npm test`, `npm run typecheck`, and `npm run build`.

Expected: all commands exit 0.

- [ ] **Step 5: Verify runtime topology**

Stop the previously started standalone frontend/backend processes. Run only `npm run dev`; confirm port 3008 listens, port 5173 does not, and `/`, `/api/health`, and `/api/health/ready` return HTTP 200.
