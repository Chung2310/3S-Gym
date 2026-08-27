# TypeScript Migration and MongoDB Configuration Design

## Objective

Migrate the entire application from JavaScript and JSX to TypeScript and TSX in one pass with strict type checking. Consolidate MongoDB connection configuration in `backend/config/db.ts` and support URI, username, password, and authentication source environment variables.

## Scope

The migration covers:

- Backend application code, models, routes, controllers, middleware, services, and configuration.
- React frontend application code and components.
- Backend and frontend automated tests.
- Vite and Vitest configuration.
- Package scripts, TypeScript configuration, and required development dependencies.
- `.env` and `.env.example` MongoDB settings.

The migration must not intentionally change application behavior, API contracts, user interface behavior, or persisted data structures beyond the MongoDB connection configuration described below.

## TypeScript Architecture

Create a root `tsconfig.json` shared by backend, frontend, tests, and build configuration. It will enable `strict: true`, support React JSX, Node and browser environments, modern ECMAScript modules, JSON imports where needed, and `noEmit` for type checking.

All source files will use ES module imports and exports:

- Backend `.js` files become `.ts`.
- Frontend `.js` files become `.ts`.
- React `.jsx` files become `.tsx`.
- Test files become `.test.ts` or `.test.tsx`.
- Vite and Vitest configuration become TypeScript configuration files.

The backend development and production entry point becomes `backend/server.ts`. The `tsx` runtime will execute TypeScript directly during development and normal server startup. The TypeScript compiler will provide static verification through `tsc --noEmit`; Vite will continue to build the frontend.

Types should model actual domain data, request/response payloads, component props, environment configuration, and service interfaces. `any` must not be used merely to bypass strict-mode errors. Narrow `unknown` values and add focused declaration types where third-party libraries do not provide sufficient definitions.

## MongoDB Configuration

Create `backend/config/db.ts` as the single owner of MongoDB connection and disconnection behavior. It reads these environment variables:

```dotenv
MONGODB_URI=mongodb://localhost:27017/igen-erp
MONGODB_USER=
MONGODB_PASSWORD=
MONGODB_AUTH_SOURCE=admin
```

Connection behavior:

1. `MONGODB_URI` is required and identifies the server and database.
2. When both `MONGODB_USER` and `MONGODB_PASSWORD` are non-empty, pass them to Mongoose as `user` and `pass` and pass `MONGODB_AUTH_SOURCE` as `authSource`.
3. When both credentials are empty, omit all authentication options so a local MongoDB instance without authentication works.
4. When only one credential is provided, fail before connecting with a clear configuration error. This prevents silently attempting an unintended unauthenticated connection.
5. `MONGODB_AUTH_SOURCE` defaults to `admin` when authenticated credentials are present and the variable is empty or absent.
6. Preserve idempotent connection and disconnection behavior based on the Mongoose connection state.

`backend/server.ts` calls the configuration module without assembling connection options itself. Other backend modules must not read the four MongoDB variables directly.

Both `.env` and `.env.example` will contain the four variables with the local values above. Existing unrelated environment settings remain unchanged.

## Runtime and Scripts

Update package scripts to provide these stable entry points:

- `npm run dev`: run the backend TypeScript entry point with `tsx`.
- `npm run dev:backend`: run the backend TypeScript entry point with `tsx`.
- `npm run dev:frontend`: run Vite.
- `npm run typecheck`: run `tsc --noEmit`.
- `npm run build`: type-check and then build the frontend with Vite.
- `npm test`: run all Vitest suites.
- `npm run lint`: lint TypeScript and TSX sources.

Docker and other repository entry points that currently execute `backend/server.js` will be updated to execute the TypeScript server entry point consistently.

## Testing Strategy

Implementation follows test-driven development for the new MongoDB behavior:

1. Add tests that prove unauthenticated configuration omits credential options.
2. Add tests that prove complete credentials and authentication source are passed to Mongoose.
3. Add tests that prove partial credentials are rejected with a clear error.
4. Observe each new test fail for the expected missing behavior before implementing `backend/config/db.ts`.

Existing tests will be migrated without changing their assertions except where import syntax or explicit types require mechanical updates. After migration, verification requires:

- MongoDB configuration tests passing.
- The complete backend and frontend test suite passing.
- Strict TypeScript type checking passing.
- Lint passing.
- Production frontend build passing.

## Error Handling

Configuration errors occur before Mongoose attempts a connection and identify the missing or inconsistent environment variables without exposing secret values. Runtime connection errors continue through the server startup error handling and logger. Disconnect remains safe when no active connection exists.

## Migration Constraints

- Perform the migration in one branch and one implementation sequence so the repository does not end in a mixed-language state.
- Do not redesign business logic, API responses, schemas, or UI during the migration.
- Do not commit generated build output unless it is already tracked and intentionally changed by the existing build process.
- Do not log or expose `MONGODB_PASSWORD`.
- Keep both npm lockfile behavior and the existing dependency workflow consistent; dependency additions must update the canonical lockfile.

## Acceptance Criteria

- No application or test `.js`/`.jsx` source files remain under `backend` or `frontend`.
- Backend, frontend, tests, Vite, and Vitest operate from TypeScript sources.
- TypeScript strict mode reports no errors.
- MongoDB connects without authentication when credentials are empty.
- MongoDB connects with `user`, `pass`, and `authSource` when both credentials are present.
- Partial MongoDB credentials fail fast with a clear configuration error.
- `.env` and `.env.example` contain the four requested MongoDB variables and use the `igen-erp` database.
- Full tests, lint, type checking, and production build pass.
