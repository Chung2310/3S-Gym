# TypeScript Migration and MongoDB Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all backend, frontend, test, and build source to strict TypeScript and centralize MongoDB configuration in `backend/config/db.ts` using the four requested environment variables.

**Architecture:** Use a root strict `tsconfig.json`, ES modules throughout, `tsx` for the Node backend runtime, Vitest for TypeScript tests, and Vite for the React frontend build. `backend/config/db.ts` is the only module that reads MongoDB environment variables and owns connect/disconnect behavior.

**Tech Stack:** TypeScript 5.x, Node.js, tsx, Express 5, Mongoose 9, React 19, Vite 8, Vitest 4, oxlint.

## Global Constraints

- Enable `strict: true` and use `tsc --noEmit` for static verification.
- Do not use `any` merely to bypass strict-mode errors; narrow `unknown` and define domain types.
- Do not intentionally change application behavior, API contracts, UI behavior, or persisted schemas.
- Do not expose or log `MONGODB_PASSWORD`.
- Use `MONGODB_URI=mongodb://localhost:27017/igen-erp`, empty user/password, and `MONGODB_AUTH_SOURCE=admin` in `.env` and `.env.example`.
- Omit authentication options when both credentials are empty, use all authentication options when both are present, and reject partial credentials.
- Leave no application or test `.js`/`.jsx` files under `backend` or `frontend`.
- Do not commit generated build output unless it was already tracked and intentionally changed.

---

## File Structure

- `tsconfig.json`: strict shared compiler configuration for Node, React, tests, and configuration files.
- `backend/types/express.d.ts`: Express request augmentation for authenticated users and request IDs.
- `backend/types/domain.ts`: shared backend domain and API utility types that are not owned by a Mongoose model.
- `frontend/src/types.ts`: frontend session, API, pagination, customer, publication, and form types.
- `backend/config/db.ts`: environment parsing and Mongoose connection lifecycle.
- `backend/config/logger.ts`: typed logger configuration.
- `backend/**/*.ts`: typed backend runtime modules.
- `frontend/src/**/*.ts` and `frontend/src/**/*.tsx`: typed frontend runtime modules and tests.
- `vite.config.ts`: typed frontend build configuration.
- `vitest.config.ts`: typed test configuration including `.test.ts` and `.test.tsx`.

---

### Task 1: Install and configure the TypeScript toolchain

**Files:**
- Create: `tsconfig.json`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `yarn.lock`
- Modify: `vitest.config.cjs`

**Interfaces:**
- Produces: `npm run typecheck`, TypeScript/TSX module resolution, and the `tsx` backend runtime used by every later task.

- [ ] **Step 1: Add the compiler configuration**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals", "@testing-library/jest-dom"],
    "forceConsistentCasingInFileNames": true
  },
  "include": ["backend/**/*.ts", "frontend/**/*.ts", "frontend/**/*.tsx", "vite.config.ts", "vitest.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 2: Install TypeScript runtime and missing declaration packages**

Run:

```powershell
npm install --save-dev typescript tsx @types/node @types/express @types/cors @types/jsonwebtoken @types/bcryptjs @types/supertest
```

Expected: exit code 0 and both lockfiles updated consistently. If npm does not update `yarn.lock`, run `yarn install --mode=update-lockfile` with the installed Yarn version and verify dependency versions agree.

- [ ] **Step 3: Update package scripts without changing module mode yet**

Keep the current package module mode during the mixed JS/TS transition and use these scripts:

```json
{
  "scripts": {
    "dev": "tsx watch backend/server.ts",
    "dev:frontend": "vite",
    "dev:backend": "tsx watch backend/server.ts",
    "start": "tsx backend/server.ts",
    "build": "npm run typecheck && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "oxlint backend frontend vite.config.ts vitest.config.ts",
    "test": "vitest run --config vitest.config.cjs"
  }
}
```

Update the existing `vitest.config.cjs` include patterns so both legacy and migrated tests run during the transition:

```js
include: [
  'backend/tests/**/*.test.{js,ts}',
  'frontend/src/**/*.test.{js,jsx,ts,tsx}',
],
```

- [ ] **Step 4: Confirm the compiler runs and reports the expected pre-migration gap**

Run: `npm run typecheck`

Expected: FAIL because the included `.ts/.tsx` application files do not exist yet. This is a scaffold check, not the feature RED test.

- [ ] **Step 5: Commit the toolchain**

```powershell
git add tsconfig.json package.json package-lock.json yarn.lock vitest.config.cjs
git commit -m "chore: configure strict TypeScript toolchain"
```

---

### Task 2: Specify MongoDB configuration behavior with failing tests

**Files:**
- Rename: `backend/tests/database.test.js` → `backend/tests/database.test.ts`
- Create: `backend/config/db.ts` only after RED is observed
- Delete after replacement: `backend/services/databaseService.js`
- Modify: `.env`
- Modify: `.env.example`

**Interfaces:**
- Produces: `MongoEnvironment`, `buildMongoConnectionOptions(env)`, `connectDatabase(env?)`, and `disconnectDatabase()`.
- Exact signatures:

```ts
export type MongoEnvironment = Pick<NodeJS.ProcessEnv,
  'MONGODB_URI' | 'MONGODB_USER' | 'MONGODB_PASSWORD' | 'MONGODB_AUTH_SOURCE'>;
export function buildMongoConnectionOptions(env: MongoEnvironment): {
  uri: string;
  options: mongoose.ConnectOptions;
};
export async function connectDatabase(env?: MongoEnvironment): Promise<typeof mongoose.connection>;
export async function disconnectDatabase(): Promise<void>;
```

- [ ] **Step 1: Rename the database test and write environment parsing tests**

Replace its contents with tests covering real option construction and the in-memory connection lifecycle:

```ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  buildMongoConnectionOptions,
  connectDatabase,
  disconnectDatabase,
} from '../config/db.js';

describe('MongoDB configuration', () => {
  it('omits authentication options when credentials are empty', () => {
    expect(buildMongoConnectionOptions({
      MONGODB_URI: 'mongodb://localhost:27017/igen-erp',
      MONGODB_USER: '',
      MONGODB_PASSWORD: '',
      MONGODB_AUTH_SOURCE: 'admin',
    })).toEqual({ uri: 'mongodb://localhost:27017/igen-erp', options: {} });
  });

  it('uses complete authentication settings', () => {
    expect(buildMongoConnectionOptions({
      MONGODB_URI: 'mongodb://localhost:27017/igen-erp',
      MONGODB_USER: 'igen',
      MONGODB_PASSWORD: 'secret',
      MONGODB_AUTH_SOURCE: 'admin',
    })).toEqual({
      uri: 'mongodb://localhost:27017/igen-erp',
      options: { user: 'igen', pass: 'secret', authSource: 'admin' },
    });
  });

  it.each([
    { MONGODB_USER: 'igen', MONGODB_PASSWORD: '' },
    { MONGODB_USER: '', MONGODB_PASSWORD: 'secret' },
  ])('rejects partial credentials', (credentials) => {
    expect(() => buildMongoConnectionOptions({
      MONGODB_URI: 'mongodb://localhost:27017/igen-erp',
      MONGODB_AUTH_SOURCE: 'admin',
      ...credentials,
    })).toThrow('MONGODB_USER và MONGODB_PASSWORD phải được cấu hình cùng nhau.');
  });

  it('connects and disconnects with the configured URI', async () => {
    const mongo = await MongoMemoryServer.create();
    await connectDatabase({ MONGODB_URI: mongo.getUri() });
    expect(mongoose.connection.readyState).toBe(1);
    await disconnectDatabase();
    expect(mongoose.connection.readyState).toBe(0);
    await mongo.stop();
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- backend/tests/database.test.ts`

Expected: FAIL because `backend/config/db.ts` does not exist.

- [ ] **Step 3: Implement the minimal typed database module**

Create `backend/config/db.ts`:

```ts
import mongoose, { type ConnectOptions } from 'mongoose';

export type MongoEnvironment = Pick<NodeJS.ProcessEnv,
  'MONGODB_URI' | 'MONGODB_USER' | 'MONGODB_PASSWORD' | 'MONGODB_AUTH_SOURCE'>;

export function buildMongoConnectionOptions(env: MongoEnvironment): {
  uri: string;
  options: ConnectOptions;
} {
  const uri = env.MONGODB_URI?.trim();
  if (!uri) throw new Error('MONGODB_URI là bắt buộc.');

  const user = env.MONGODB_USER?.trim();
  const password = env.MONGODB_PASSWORD?.trim();
  if (Boolean(user) !== Boolean(password)) {
    throw new Error('MONGODB_USER và MONGODB_PASSWORD phải được cấu hình cùng nhau.');
  }

  return user && password
    ? { uri, options: { user, pass: password, authSource: env.MONGODB_AUTH_SOURCE?.trim() || 'admin' } }
    : { uri, options: {} };
}

export async function connectDatabase(
  env: MongoEnvironment = process.env,
): Promise<typeof mongoose.connection> {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  const { uri, options } = buildMongoConnectionOptions(env);
  await mongoose.connect(uri, options);
  return mongoose.connection;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
```

- [ ] **Step 4: Update local and example environment files**

Ensure both files contain exactly these MongoDB entries while preserving other settings:

```dotenv
MONGODB_URI=mongodb://localhost:27017/igen-erp
MONGODB_USER=
MONGODB_PASSWORD=
MONGODB_AUTH_SOURCE=admin
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `npm test -- backend/tests/database.test.ts`

Expected: 1 test file and 4 tests pass.

- [ ] **Step 6: Commit the MongoDB configuration**

```powershell
git add backend/config/db.ts backend/tests/database.test.ts backend/services/databaseService.js .env .env.example
git commit -m "feat: centralize typed MongoDB configuration"
```

---

### Task 3: Migrate backend foundations and shared types

**Files:**
- Create: `backend/types/express.d.ts`
- Create: `backend/types/domain.ts`
- Rename to `.ts`: `backend/app.js`, `backend/server.js`, `backend/config/logger.js`
- Rename to `.ts`: every file in `backend/errors`, `backend/middlewares`, and `backend/models`
- Rename to `.ts`: `backend/services/lifecycleService.js`, `backend/services/frontendService.js`, `backend/services/telemetryService.js`

**Interfaces:**
- Consumes: `connectDatabase()` and `disconnectDatabase()` from `backend/config/db.ts`.
- Produces: typed Express request augmentation, typed error contract, typed Mongoose models, and typed server lifecycle helpers for Tasks 4 and 5.

- [ ] **Step 1: Mechanically rename the foundation files**

Run this deterministic rename script for the listed foundation files:

```powershell
$foundationFiles = @(
  'backend/app.js', 'backend/server.js', 'backend/config/logger.js',
  'backend/errors/normalizeError.js', 'backend/errors/errorCodes.js', 'backend/errors/AppError.js',
  'backend/middlewares/validate.js', 'backend/middlewares/response.js',
  'backend/middlewares/requestContext.js', 'backend/middlewares/errorHandler.js',
  'backend/middlewares/auth.js', 'backend/middlewares/asyncHandler.js',
  'backend/models/WorkoutPlan.js', 'backend/models/User.js', 'backend/models/TransferRequest.js',
  'backend/models/PtPackage.js', 'backend/models/NutritionPlan.js', 'backend/models/InBodyRecord.js',
  'backend/models/Goal.js', 'backend/models/CustomerProfile.js',
  'backend/services/lifecycleService.js', 'backend/services/frontendService.js',
  'backend/services/telemetryService.js'
)
foreach ($sourcePath in $foundationFiles) {
  git mv $sourcePath ([System.IO.Path]::ChangeExtension($sourcePath, '.ts'))
}
```

Update imports to ES module syntax and `.js` runtime specifiers, for example:

```ts
import express from 'express';
import { connectDatabase, disconnectDatabase } from './config/db.js';
```

- [ ] **Step 2: Define Express request augmentation**

Create `backend/types/express.d.ts` with the exact fields already assigned by authentication and request-context middleware:

```ts
import type { HydratedDocument } from 'mongoose';
import type { IUser } from '../models/User.js';

declare global {
  namespace Express {
    interface Request {
      user?: HydratedDocument<IUser>;
      requestId?: string;
    }
  }
}

export {};
```

- [ ] **Step 3: Add explicit model and middleware types**

For each Mongoose model, export an interface such as:

```ts
export interface IUser {
  username: string;
  password: string;
  role: 'ADMIN' | 'PT' | 'CUSTOMER';
  fullName: string;
  isActive: boolean;
}
```

Use `Request`, `Response`, `NextFunction`, `ErrorRequestHandler`, `RequestHandler`, `Server`, and `Logger` types at module boundaries. Preserve the current schema fields and runtime validators exactly.

- [ ] **Step 4: Wire server startup to `backend/config/db.ts`**

In `backend/server.ts`, replace URI argument assembly with:

```ts
await connectDatabase();
```

Keep startup, shutdown, telemetry, bootstrap admin, and signal behavior unchanged.

- [ ] **Step 5: Type-check backend foundations**

Run: `npm run typecheck`

Expected: errors may remain only in not-yet-migrated controllers, routes, services, frontend, and tests; no errors may point to files completed in this task.

- [ ] **Step 6: Run foundation tests**

After renaming their direct tests to `.test.ts`, run:

```powershell
npm test -- backend/tests/database.test.ts backend/tests/errorInfrastructure.test.ts backend/tests/lifecycle.test.ts backend/tests/health.test.ts backend/tests/requestContext.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 7: Commit backend foundations**

```powershell
git add backend/app.ts backend/server.ts backend/config backend/types backend/errors backend/middlewares backend/models backend/services/lifecycleService.ts backend/services/frontendService.ts backend/services/telemetryService.ts backend/tests
git commit -m "refactor: migrate backend foundations to TypeScript"
```

---

### Task 4: Migrate backend services, controllers, and routes

**Files:**
- Rename to `.ts`: remaining files in `backend/services`
- Rename to `.ts`: every file in `backend/controllers`
- Rename to `.ts`: every file in `backend/routes`
- Rename to `.test.ts`: remaining files in `backend/tests`

**Interfaces:**
- Consumes: model interfaces and Express augmentation from Task 3.
- Produces: fully typed backend handlers, service inputs/results, and API route modules.

- [ ] **Step 1: Rename service modules and type their public contracts**

Replace CommonJS exports with named ES exports. Define explicit input types from the fields each service currently reads, for example:

```ts
export interface CreateCustomerInput {
  fullName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}
```

Return typed Mongoose documents or purpose-built result objects matching current runtime output.

- [ ] **Step 2: Rename controllers and type request boundaries**

Use typed parameter dictionaries, response bodies, request bodies, and query values:

```ts
type IdParams = { id: string };
type PaginationQuery = { page?: string; limit?: string; search?: string };

export const getUser: RequestHandler<IdParams> = asyncHandler(async (req, res) => {
  // Preserve the existing controller body and response contract.
});
```

Parsing functions must narrow `req.query` strings before converting them to numbers.

- [ ] **Step 3: Rename route modules and type route factories**

Use `Router`, `RequestHandler`, and model/service generic types. Preserve route paths, middleware order, authorization, validation, and response behavior exactly.

- [ ] **Step 4: Rename all backend tests and fix typed fixtures**

Change `.test.js` to `.test.ts`, replace `require` with imports, type mock requests/responses, and use `as unknown as Request` only at external Express test seams where a complete Request object is intentionally not constructed.

- [ ] **Step 5: Run the complete backend suite**

Run: `npm test -- backend/tests`

Expected: every backend test passes with no unhandled rejection.

- [ ] **Step 6: Type-check the backend**

Run:

```powershell
npx tsc --noEmit --pretty false 2>&1 | Select-String 'backend/'
```

Expected: no output and TypeScript produces no backend diagnostics.

- [ ] **Step 7: Commit the backend migration**

```powershell
git add backend
git commit -m "refactor: migrate backend application to TypeScript"
```

---

### Task 5: Migrate frontend services, application, and shared domain types

**Files:**
- Create: `frontend/src/types.ts`
- Rename: `frontend/src/config.js` → `frontend/src/config.ts`
- Rename: `frontend/src/services/api.js` → `frontend/src/services/api.ts`
- Rename: `frontend/src/services/session.js` → `frontend/src/services/session.ts`
- Rename: `frontend/src/main.jsx` → `frontend/src/main.tsx`
- Rename: `frontend/src/App.jsx` → `frontend/src/App.tsx`
- Rename to `.tsx`: every runtime file in `frontend/src/pages` and `frontend/src/components`

**Interfaces:**
- Produces: `ApiResponse<T>`, `ApiErrorBody`, `PaginationMeta`, `Session`, `User`, `Customer`, content entity types, and typed React component props.

- [ ] **Step 1: Define shared frontend types**

Create `frontend/src/types.ts` with types matching the current API payloads. The common wrappers must use these signatures:

```ts
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface Session {
  token: string;
  user: User;
}

export type UserRole = 'ADMIN' | 'PT' | 'CUSTOMER';
```

Add exact interfaces for every object currently accessed by pages and forms; optional fields must reflect actual API optionality.

- [ ] **Step 2: Migrate the API client with generics**

Expose a typed API boundary:

```ts
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>>;
```

Parse JSON as `unknown`, narrow the response envelope before returning, and preserve current Vietnamese error selection and authentication headers.

- [ ] **Step 3: Migrate session and app entry modules**

Use `Session | null` for stored session data and guard the root element:

```ts
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Không tìm thấy phần tử gốc của ứng dụng.');
createRoot(rootElement).render(/* existing application tree */);
```

- [ ] **Step 4: Migrate components and pages**

For every component, declare a named props interface and type state from `frontend/src/types.ts`. Type form events as `FormEvent<HTMLFormElement>` and input changes as `ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>`. Preserve JSX, labels, handlers, endpoint paths, and visual behavior.

- [ ] **Step 5: Run frontend type checking**

Run: `npm run typecheck`

Expected: diagnostics may remain only in frontend test/config files not yet migrated; runtime frontend files produce no errors.

- [ ] **Step 6: Build the frontend**

Run: `npx vite build`

Expected: production bundle builds successfully.

- [ ] **Step 7: Commit frontend runtime migration**

```powershell
git add frontend/src
git commit -m "refactor: migrate frontend application to TypeScript"
```

---

### Task 6: Migrate frontend tests and build/test configuration

**Files:**
- Rename to `.test.ts`: `frontend/src/services/api.test.js`, `frontend/src/services/session.test.js`
- Rename to `.test.tsx`: every `.test.jsx` file under `frontend/src`
- Rename: `vite.config.mjs` → `vite.config.ts`
- Rename: `vitest.config.cjs` → `vitest.config.ts`
- Modify: `frontend/index.html`

**Interfaces:**
- Consumes: typed frontend modules from Task 5.
- Produces: a TypeScript-native test and build configuration with no JS/JSX source references.

- [ ] **Step 1: Enable ES module package mode and point scripts to TypeScript config**

Set `"type": "module"` in `package.json` and change the test script to `vitest run --config vitest.config.ts` only after all CommonJS backend modules and tests have been migrated.

- [ ] **Step 2: Convert Vite configuration**

Use typed ES module configuration and preserve the existing root/output behavior:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'frontend',
  plugins: [react()],
  build: { outDir: '../dist', emptyOutDir: true },
});
```

- [ ] **Step 3: Convert Vitest configuration**

Use:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['backend/tests/**/*.test.ts', 'frontend/src/**/*.test.{ts,tsx}'],
    environment: 'node',
    globals: true,
  },
});
```

- [ ] **Step 4: Point the HTML entry to TypeScript**

In `frontend/index.html`, change the module entry from `/src/main.jsx` to `/src/main.tsx` without changing other markup.

- [ ] **Step 5: Convert frontend tests**

Rename test extensions, use ES imports, and type fixtures with `Partial<T>` builders. Preserve all existing assertions. Use `vi.mocked(functionName)` for typed mocks rather than casting mocks to `any`.

- [ ] **Step 6: Run the frontend tests**

Run: `npm test -- frontend/src`

Expected: every frontend test passes.

- [ ] **Step 7: Run strict type checking**

Run: `npm run typecheck`

Expected: exit code 0 with no diagnostics.

- [ ] **Step 8: Commit test and configuration migration**

```powershell
git add frontend vite.config.ts vite.config.mjs vitest.config.ts vitest.config.cjs
git commit -m "test: migrate test and build configuration to TypeScript"
```

---

### Task 7: Update Docker/runtime references and complete repository verification

**Files:**
- Modify: `Dockerfile`
- Modify: `docker-compose.yml`
- Modify: `docker-compose.override.yml`
- Modify: `README.md`
- Modify: `.github/workflows/cd.yml`

**Interfaces:**
- Consumes: `npm start`, `npm run dev:backend`, `npm run typecheck`, and TypeScript entry points from prior tasks.
- Produces: consistent local, Docker, and CI execution paths.

- [ ] **Step 1: Find every stale JavaScript entry reference**

Run:

```powershell
rg -n "server\.js|main\.jsx|vitest\.config\.cjs|vite\.config\.mjs|\.test\.(js|jsx)" Dockerfile docker-compose*.yml README.md .github backend frontend package.json
```

Expected: report all stale references that must be changed; do not ignore matches in documentation or CI.

- [ ] **Step 2: Update runtime and documentation references**

Use `npm start` for production backend execution and `npm run dev:backend` for watch mode. Document the four MongoDB variables and the commands `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build`.

- [ ] **Step 3: Prove no JS/JSX application or test files remain**

Run:

```powershell
rg --files backend frontend -g '*.js' -g '*.jsx'
```

Expected: no output and exit code 1 from `rg` because no files match.

- [ ] **Step 4: Run the complete verification suite**

Run each command independently and require exit code 0:

```powershell
npm run typecheck
npm run lint
npm test -- --reporter=verbose
npm run build
```

Expected: zero TypeScript diagnostics, zero lint errors, all 29+ test files and 94+ tests pass, and Vite produces the production bundle.

- [ ] **Step 5: Verify the environment contract without exposing secrets**

Run:

```powershell
rg -n "^MONGODB_(URI|USER|PASSWORD|AUTH_SOURCE)=" .env .env.example
```

Expected: four entries in each file; visually confirm URI database `igen-erp` and auth source `admin`, but do not print or quote a non-empty password in commit messages or final reporting.

- [ ] **Step 6: Review repository state**

Run:

```powershell
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors; only intended migration, environment, lockfile, Docker, CI, and documentation changes are present.

- [ ] **Step 7: Commit runtime references and final fixes**

```powershell
git add Dockerfile docker-compose.yml docker-compose.override.yml README.md .github package.json package-lock.json yarn.lock
git commit -m "chore: complete TypeScript runtime migration"
```

- [ ] **Step 8: Perform post-commit verification**

Run:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
git status --short --branch
```

Expected: all commands pass and the worktree is clean on `feature/dot-1-crm-popup-crud`.
