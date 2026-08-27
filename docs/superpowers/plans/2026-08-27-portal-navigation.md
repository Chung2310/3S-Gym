# Portal Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver role-aware grouped portal navigation with icons, active state, breadcrumbs, mobile behavior, and an in-shell 404 recovery page.

**Architecture:** A typed navigation catalog is the single source of truth for sidebar rendering and route metadata. `AppShell` derives visible sections and breadcrumb context from the current location; `PortalPage` preserves role redirects at `/portal` and renders a not-found state for invalid portal URLs.

**Tech Stack:** React 19, React Router 7, Lucide React, TypeScript, Testing Library, Vitest.

## Global Constraints

- Keep existing route declarations, role authorization, and feature flags.
- Do not change public navigation, authentication, backend APIs, or routing libraries.
- Use `aria-current="page"`, accessible navigation labels, and responsive mobile behavior.
- Do not create a worktree, subagent, commit, or push.

---

### Task 1: Navigation catalog and shell

**Files:**
- Create: `frontend/src/config/portalNavigation.ts`
- Modify: `frontend/src/components/AppShell.tsx`
- Modify: `frontend/src/components/AppShell.test.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Produces: `portalNavigation`, `visibleNavigation(user, features)`, and `navigationForPath(pathname, user, features)`.
- Consumes: `UserRole`, `FeatureKey`, `FeatureState`, and Lucide icon components.

- [ ] **Step 1: Write failing component tests**

Assert grouped navigation labels, icons, exact/prefix active state with `aria-current="page"`, breadcrumb content, role/feature filtering, and mobile drawer close behavior.

- [ ] **Step 2: Verify RED**

Run `npm test -- frontend/src/components/AppShell.test.tsx` and confirm failures are caused by missing groups, active state, and breadcrumbs.

- [ ] **Step 3: Implement the typed catalog and shell rendering**

Move navigation metadata out of `AppShell`, use `NavLink`/location-aware matching, render section labels and icons, derive breadcrumb metadata, and add focused responsive/active CSS.

- [ ] **Step 4: Verify GREEN**

Run `npm test -- frontend/src/components/AppShell.test.tsx`; expect all tests in the file to pass.

### Task 2: Portal 404 recovery

**Files:**
- Create: `frontend/src/components/PortalNotFound.tsx`
- Modify: `frontend/src/pages/PortalPage.tsx`
- Modify: `frontend/src/pages/PortalPage.test.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: role default map `ADMIN -> /portal/admin`, `PT -> /portal/pt/customers`, `CUSTOMER -> /portal/me`.
- Produces: `PortalNotFound({ destination })` with a descriptive recovery link.

- [ ] **Step 1: Write failing routing tests**

Assert `/portal` still redirects by role and `/portal/khong-ton-tai` renders the Vietnamese not-found heading plus the correct recovery link without redirecting.

- [ ] **Step 2: Verify RED**

Run `npm test -- frontend/src/pages/PortalPage.test.tsx`; expect the unknown-route test to fail because the current wildcard redirects.

- [ ] **Step 3: Implement the in-shell not-found state**

Keep the root redirect branch and replace only the non-root wildcard redirect with `PortalNotFound` using the current role destination.

- [ ] **Step 4: Verify GREEN and quality gates**

Run the two focused test files, then `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`; all must exit 0.

- [ ] **Step 5: Runtime verification**

With `npm run dev` still serving port 3008, verify `/portal` login protection remains intact and authenticated component tests cover sidebar visibility, active state, breadcrumbs, mobile close, and recovery behavior.
