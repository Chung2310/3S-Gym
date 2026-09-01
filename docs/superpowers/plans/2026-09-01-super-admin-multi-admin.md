# Super Admin and Multi-Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add exactly one bootstrap SUPER_ADMIN that can manage multiple regular ADMIN accounts while regular ADMIN accounts retain operational permissions but cannot manage administrator accounts.

**Architecture:** Introduce `SUPER_ADMIN` as a persisted role and centralize role hierarchy checks so it satisfies existing ADMIN guards. Enforce the singleton with a partial unique MongoDB index, isolate account-management authorization in `userService`, and reflect the same policy through pure frontend role helpers.

**Tech Stack:** TypeScript, Express, Mongoose, Joi, React 19, MongoDB migrations, Vitest, Testing Library.

## Global Constraints

- There is exactly one `SUPER_ADMIN` after non-test startup and any number of regular `ADMIN` accounts.
- `SUPER_ADMIN` inherits all operational permissions currently granted to `ADMIN`.
- Only `SUPER_ADMIN` may create, update, lock, or delete regular `ADMIN` accounts.
- No API or UI may create a second `SUPER_ADMIN`.
- `SUPER_ADMIN` cannot delete itself, lock itself, or change its role.
- Replace `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_FULL_NAME` completely with `SUPER_ADMIN_USERNAME`, `SUPER_ADMIN_PASSWORD`, and `SUPER_ADMIN_FULL_NAME`; do not provide legacy fallback.
- Preserve unrelated dirty-worktree changes and do not commit, create a worktree, or use subagents without explicit authorization.

---

### Task 1: Persisted role, hierarchy, and singleton index

**Files:**
- Create: `backend/services/roles.ts`
- Create: `backend/migrations/003-super-admin-role.ts`
- Create: `backend/tests/superAdminRole.test.ts`
- Modify: `backend/models/User.ts`
- Modify: `backend/models/AuditLog.ts`
- Modify: `backend/types/express.d.ts`
- Modify: `backend/services/migrationService.ts`
- Modify: `backend/middlewares/auth.ts`
- Modify: `backend/services/featureFlagService.ts`
- Modify: every active backend service/controller that compares `user.role` directly with `ADMIN`.

**Interfaces:**
- Produces: `isAdminRole(role: UserRole): boolean` and `hasRequiredRole(actual: UserRole, allowed: UserRole[]): boolean`.
- Produces: MongoDB index `unique_super_admin_role` with `{ unique: true, partialFilterExpression: { role: 'SUPER_ADMIN' } }`.

- [ ] **Step 1: Write failing role hierarchy tests**

```ts
import { describe, expect, it } from 'vitest';
import User from '../models/User.js';
import { hasRequiredRole, isAdminRole } from '../services/roles.js';

describe('SUPER_ADMIN role hierarchy', () => {
  it('treats SUPER_ADMIN as an ADMIN permission holder', () => {
    expect(isAdminRole('SUPER_ADMIN')).toBe(true);
    expect(hasRequiredRole('SUPER_ADMIN', ['ADMIN'])).toBe(true);
    expect(hasRequiredRole('ADMIN', ['SUPER_ADMIN'])).toBe(false);
  });

  it('declares a unique partial index for SUPER_ADMIN', () => {
    expect(User.schema.indexes()).toContainEqual([
      { role: 1 },
      expect.objectContaining({
        name: 'unique_super_admin_role',
        unique: true,
        partialFilterExpression: { role: 'SUPER_ADMIN' },
      }),
    ]);
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npx vitest run --config vitest.config.ts backend/tests/superAdminRole.test.ts`

Expected: FAIL because `SUPER_ADMIN`, the role helpers, and the singleton index do not exist.

- [ ] **Step 3: Implement the role helper and persisted enums**

```ts
export function isAdminRole(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function hasRequiredRole(actual: UserRole, allowed: UserRole[]): boolean {
  return allowed.includes(actual) || (actual === 'SUPER_ADMIN' && allowed.includes('ADMIN'));
}
```

Add `SUPER_ADMIN` to `UserRole`, User/AuditLog enums, and `AuthenticatedUser`. Make `authorize` call `hasRequiredRole`. Replace direct operational ADMIN comparisons in `exerciseService`, `customerService`, `contentDraftService`, `operationsService`, `nutritionMetricsController`, and `featureFlagService` with `isAdminRole`.

- [ ] **Step 4: Implement and register migration 003**

`upSuperAdminRole` creates `unique_super_admin_role` on `users`; dry-run reports whether the index is missing. `downSuperAdminRole` drops that named index only when present. Register version `003-super-admin-role` after existing migrations.

- [ ] **Step 5: Run GREEN**

Run: `npx vitest run --config vitest.config.ts backend/tests/superAdminRole.test.ts`

Expected: PASS.

### Task 2: Strict SUPER_ADMIN environment and bootstrap

**Files:**
- Create: `backend/tests/superAdminBootstrap.test.ts`
- Modify: `backend/config/env.ts`
- Modify: `backend/server.ts`
- Modify: `backend/services/userService.ts`
- Modify: `.env.example`
- Modify: `README.md`

**Interfaces:**
- Produces: `AppEnv.SUPER_ADMIN_USERNAME`, `AppEnv.SUPER_ADMIN_PASSWORD`, and optional `AppEnv.SUPER_ADMIN_FULL_NAME`.
- Produces: `ensureBootstrapSuperAdmin({ username, password, fullName })`.

- [ ] **Step 1: Write failing environment and bootstrap tests**

Test that non-test `loadEnv` rejects missing new variables, ignores legacy `ADMIN_*`, and accepts the complete new set. With MongoDB memory server, test that bootstrap creates a SUPER_ADMIN, promotes a matching ADMIN, preserves an existing password, rejects PT/CUSTOMER username conflicts, and rejects a configured username different from the existing SUPER_ADMIN.

- [ ] **Step 2: Run RED**

Run: `npx vitest run --config vitest.config.ts backend/tests/superAdminBootstrap.test.ts`

Expected: FAIL because the new environment keys and bootstrap function do not exist.

- [ ] **Step 3: Implement strict environment loading**

For environments other than `test`, include `SUPER_ADMIN_USERNAME` and `SUPER_ADMIN_PASSWORD` in the required-key check. Add trimmed values to `AppEnv`; never read `ADMIN_*`.

- [ ] **Step 4: Implement bootstrap state transitions**

`ensureBootstrapSuperAdmin` must query the existing SUPER_ADMIN and configured username separately, enforce the conflict rules from the spec, promote only a matching regular ADMIN, call `ensureWallet`, and use the supplied password only when creating a new user.

- [ ] **Step 5: Update runtime configuration documentation**

Replace the three old keys in `.env.example`, update README bootstrap wording, and make `server.ts` consume the typed values returned by `getEnv()`.

- [ ] **Step 6: Run GREEN**

Run: `npx vitest run --config vitest.config.ts backend/tests/superAdminBootstrap.test.ts`

Expected: PASS.

### Task 3: Actor-aware account management and audit

**Files:**
- Create: `backend/tests/adminAccountManagement.test.ts`
- Modify: `backend/services/userService.ts`
- Modify: `backend/controllers/userController.ts`
- Modify: `backend/validators/userValidator.ts`

**Interfaces:**
- Produces: `createManagedUser(actor, payload)`, `updateManagedUser(actor, id, payload)`, and `deleteManagedUser(actor, id)`.
- Consumes: existing internal `createUser(payload)`, PT deletion protections, `recordAudit`, and `AuthenticatedUser`.

- [ ] **Step 1: Write failing service authorization tests**

Cover these cases with real database documents: ADMIN creates PT/CUSTOMER but not ADMIN; SUPER_ADMIN creates ADMIN but not SUPER_ADMIN; ADMIN cannot update/delete ADMIN or SUPER_ADMIN; SUPER_ADMIN updates/deletes ADMIN; SUPER_ADMIN updates its own profile/password but cannot set `LOCKED`, change role, or delete itself. Assert `ADMIN_CREATED`, `ADMIN_UPDATED`, and `ADMIN_DELETED` audit rows.

- [ ] **Step 2: Run RED**

Run: `npx vitest run --config vitest.config.ts backend/tests/adminAccountManagement.test.ts`

Expected: FAIL because actor-aware service functions do not exist.

- [ ] **Step 3: Implement create authorization**

`createManagedUser` accepts `ADMIN`, `PT`, or `CUSTOMER` payload roles only. Reject `SUPER_ADMIN` always; reject `ADMIN` unless actor is `SUPER_ADMIN`; call internal `createUser`; record an audit when the created role is ADMIN.

- [ ] **Step 4: Implement update authorization**

Load target first. Reject regular ADMIN against ADMIN/SUPER_ADMIN. Allow SUPER_ADMIN against regular ADMIN/PT/CUSTOMER and against itself only for profile/password fields. Forbid role mutation in Joi update schema, prevent self-locking, reuse password hashing and profile field updates, and record ADMIN audit changes.

- [ ] **Step 5: Implement delete authorization**

Never delete SUPER_ADMIN. Regular ADMIN may delete PT/CUSTOMER; SUPER_ADMIN may additionally delete ADMIN. Preserve existing PT content-transfer checks. When deleting a CUSTOMER login account, unset `CustomerProfile.userId` before deleting the User. Record ADMIN deletion audit.

- [ ] **Step 6: Pass actor through controller**

Call the managed service methods with `req.user!` and replace PT-specific response copy with generic account messages.

- [ ] **Step 7: Run GREEN**

Run: `npx vitest run --config vitest.config.ts backend/tests/adminAccountManagement.test.ts`

Expected: PASS.

### Task 4: Frontend role hierarchy and routing

**Files:**
- Create: `frontend/src/services/roles.ts`
- Create: `frontend/tests/services/roles.test.ts`
- Modify: `frontend/src/types.ts`
- Modify: `frontend/src/services/session.ts`
- Modify: `frontend/src/components/FeatureRoute.tsx`
- Modify: `frontend/src/config/portalNavigation.ts`
- Modify: `frontend/src/routes/PortalRoutes.tsx`
- Modify: `frontend/src/components/AppShell.tsx`
- Modify: `frontend/src/components/ui/RoleBadge.tsx`

**Interfaces:**
- Produces: `isAdminRole`, `hasRequiredRole`, `creatableRoles`, `canEditAccount`, and `canDeleteAccount` pure helpers.

- [ ] **Step 1: Write failing frontend role tests**

Test SUPER_ADMIN → `/admin`, session acceptance, ADMIN guard inheritance, admin navigation visibility, creatable role sets, and edit/delete policy for SUPER_ADMIN/ADMIN/PT/CUSTOMER targets.

- [ ] **Step 2: Run RED**

Run: `npx vitest run --config vitest.config.ts frontend/tests/services/roles.test.ts`

Expected: FAIL because frontend types and role helpers lack SUPER_ADMIN.

- [ ] **Step 3: Implement pure helpers and wire consumers**

Add SUPER_ADMIN to `UserRole`; use `hasRequiredRole` in FeatureRoute and navigation; accept it in session parsing; add `/admin` destination/label and AppShell label; add the SUPER_ADMIN badge.

- [ ] **Step 4: Run GREEN**

Run: `npx vitest run --config vitest.config.ts frontend/tests/services/roles.test.ts`

Expected: PASS.

### Task 5: Account-management UI policy

**Files:**
- Create: `frontend/tests/components/AdminUserManagement.test.tsx`
- Modify: `frontend/src/pages/admin/AdminUsersPage.tsx`
- Modify: `frontend/src/routes/PortalRoutes.tsx`
- Modify: `frontend/src/components/admin/UserManagementView.tsx`
- Modify: `frontend/src/components/ui/UserFormModal.tsx`

**Interfaces:**
- `AdminUsersPage` consumes current `user` from PortalRoutes.
- `UserManagementView` consumes `actor: User` and uses the pure frontend role helpers.
- `UserFormModal` consumes `actorRole: UserRole`.

- [ ] **Step 1: Write failing UI policy tests**

Mock the user-list API and verify: regular ADMIN cannot select ADMIN when creating and sees no actions for ADMIN/SUPER_ADMIN rows; SUPER_ADMIN can select ADMIN and edit/delete regular ADMIN; neither actor can delete SUPER_ADMIN; SUPER_ADMIN may edit its own row but the modal does not permit `LOCKED` or role changes.

- [ ] **Step 2: Run RED**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/AdminUserManagement.test.tsx`

Expected: FAIL because the UI has no actor-aware policy.

- [ ] **Step 3: Pass actor data and enforce role options/actions**

Pass `user` from PortalRoutes → AdminUsersPage → UserManagementView. Use `creatableRoles`, `canEditAccount`, and `canDeleteAccount` for role options and action buttons. Display a SUPER_ADMIN filter/badge. When editing SUPER_ADMIN, show only its immutable role and disable/remove the LOCKED option.

- [ ] **Step 4: Run GREEN**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/AdminUserManagement.test.tsx`

Expected: PASS.

### Task 6: Regression verification

**Files:** Verify every file modified above plus the six-digit password changes already present in the worktree.

- [ ] **Step 1: Scan removed environment names and incomplete role unions**

Run: `rg -n "ADMIN_USERNAME|ADMIN_PASSWORD|ADMIN_FULL_NAME" backend frontend/src .env.example README.md`

Expected: no active references.

Run: `rg -n "'ADMIN' \| 'PT' \| 'CUSTOMER'|enum: \['ADMIN', 'PT', 'CUSTOMER'\]" backend frontend/src`

Expected: no stale closed role unions/enums.

- [ ] **Step 2: Run all targeted tests**

Run: `npx vitest run --config vitest.config.ts backend/tests/superAdminRole.test.ts backend/tests/superAdminBootstrap.test.ts backend/tests/adminAccountManagement.test.ts backend/tests/passwordValidator.test.ts frontend/tests/services/roles.test.ts frontend/tests/components/AdminUserManagement.test.tsx frontend/tests/components/AccountPasswordFields.test.tsx`

Expected: PASS.

- [ ] **Step 3: Run typecheck and lint**

Run: `npm run typecheck:backend`

Run: `npm run typecheck`

Run: `npm run lint`

Expected: changed files have no errors. Report unrelated pre-existing failures separately without modifying their files.
