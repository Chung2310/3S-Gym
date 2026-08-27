# Single-port development design

## Goal

Provide one development command and one browser origin for the whole application while preserving Vite hot module replacement.

Running `npm run dev` must expose:

- Frontend at `http://localhost:3008/`.
- Backend API at `http://localhost:3008/api/*`.
- Vite HMR through the same Express-owned development server.

## Architecture

Express remains the only TCP listener. In development, `registerFrontend` creates Vite in middleware mode and mounts its middleware after all `/api` routes. This preserves API routing precedence while allowing Vite to serve the SPA, source modules, and HMR endpoints from the same origin.

Production behavior remains unchanged: Express serves the built frontend as static files and falls back to `index.html` for client-side routes.

## Commands

`npm run dev` is the canonical full-stack development command and starts `backend/dev.ts` in watch mode. This development entry point forces `NODE_ENV=development` before importing `backend/bootstrap.ts`, so a production-oriented local `.env` cannot disable Vite middleware. The backend then initializes the database, registers the Vite middleware, and listens on the configured `PORT` (currently `3008` in `.env`).

Component-specific scripts may remain available for diagnostics, but documentation must direct normal development through `npm run dev`. No second Vite TCP listener is required for the full-stack workflow.

## Request flow

1. The browser connects to `http://localhost:3008`.
2. Requests under `/api/*` are handled by Express API routes and never reach Vite.
3. Frontend and HMR requests pass to Vite middleware.
4. Frontend API calls use relative `/api/*` URLs, so no development proxy or cross-origin configuration is needed.

## Failure handling

The HTTP listener starts only after the database and Vite middleware are ready. Startup failures are logged by the existing backend lifecycle and result in a non-successful process state. Unknown `/api/*` paths retain the JSON API 404 contract; SPA routes retain frontend fallback behavior.

## Verification

Automated tests will verify that development registration uses Vite middleware mode and that middleware is mounted on Express. Existing backend and frontend tests must remain green.

Runtime verification will start only `npm run dev`, confirm that port `3008` is listening and port `5173` is not, then confirm HTTP 200 responses from `/`, `/api/health`, and `/api/health/ready`.

## Scope

This change standardizes local development only. It does not change API contracts, frontend features, database configuration, production deployment, or introduce a reverse proxy.
