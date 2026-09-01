# SUPER_ADMIN Account Management UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated `/admin/admin-accounts` interface where only `SUPER_ADMIN` can list and manage regular `ADMIN` accounts.

**Architecture:** Add an exact-role navigation item and route, a thin page, a focused account-management view, and a dedicated admin form modal. Continue using the existing `/api/users` endpoints, but hard-code `role=ADMIN` in list/create flows so the interface cannot drift into PT, customer, or super-admin management.

**Tech Stack:** React 19, React Router, TypeScript, Tailwind CSS v4, Vitest, Testing Library, existing `api`, `ProfileFormModal`, `FormField`, `ConfirmModal`, `Pagination`, and `ToastProvider`.

## Global Constraints

- Only `SUPER_ADMIN` may see or access the new interface.
- The list and create flows always use role `ADMIN`; no role selector is rendered.
- Passwords are empty when unchanged or exactly six ASCII digits when supplied.
- New or modified UI uses Tailwind classes; do not add inline styles, CSS modules, or another CSS framework.
- Backend authorization remains authoritative.
- Do not create commits, worktrees, pushes, or pull requests without explicit user authorization.

---

### Task 1: Exact-role navigation and route

**Files:**
- Modify: `frontend/src/config/portalNavigation.ts`
- Modify: `frontend/src/routes/PortalRoutes.tsx`
- Create: `frontend/src/pages/admin/AdminAccountsPage.tsx`
- Test: `frontend/tests/config/AdminAccountNavigation.test.ts`

**Interfaces:**
- Consumes: `visibleNavigation(user, features)` and `FeatureRoute` exact-role behavior.
- Produces: navigation path `/admin/admin-accounts` and `AdminAccountsPage({ user }: { user: User })`.

- [ ] **Step 1: Write failing navigation tests**

```ts
import { describe, expect, it } from 'vitest';
import { visibleNavigation } from '../../src/config/portalNavigation';

describe('admin account navigation', () => {
  it('shows the page only to SUPER_ADMIN', () => {
    const rootItems = visibleNavigation({ _id: 'root', username: 'root', role: 'SUPER_ADMIN' });
    const adminItems = visibleNavigation({ _id: 'admin', username: 'admin', role: 'ADMIN' });
    expect(rootItems.some((item) => item.path === '/admin/admin-accounts')).toBe(true);
    expect(adminItems.some((item) => item.path === '/admin/admin-accounts')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- frontend/tests/config/AdminAccountNavigation.test.ts --run`

Expected: FAIL because the navigation entry does not exist.

- [ ] **Step 3: Add the exact-role menu and route**

Add this navigation item before the general user account entry:

```ts
{
  path: '/admin/admin-accounts',
  label: 'Tài khoản Admin',
  section: 'Vận hành',
  icon: ShieldCheck,
  roles: ['SUPER_ADMIN'],
  matchChildren: true,
}
```

Add a route before `admin/*`:

```tsx
<Route
  path="admin/admin-accounts"
  element={
    <FeatureRoute user={user} roles={['SUPER_ADMIN']}>
      <AdminAccountsPage user={user} />
    </FeatureRoute>
  }
/>
```

Create the thin page:

```tsx
import AdminAccountManagementView from '../../components/admin/AdminAccountManagementView';
import type { User } from '../../types';

export default function AdminAccountsPage({ user }: { user: User }) {
  return <AdminAccountManagementView actor={user} />;
}
```

- [ ] **Step 4: Run the navigation test and verify GREEN**

Run: `npm test -- frontend/tests/config/AdminAccountNavigation.test.ts --run`

Expected: 1 test passed.

---

### Task 2: Dedicated ADMIN account form

**Files:**
- Create: `frontend/src/types/adminAccount.ts`
- Modify: `frontend/src/types.ts`
- Create: `frontend/src/components/admin/AdminAccountFormModal.tsx`
- Test: `frontend/tests/components/AdminAccountFormModal.test.tsx`

**Interfaces:**
- Produces: `AdminAccount`, `AdminAccountFormState`, and `AdminAccountFormModalProps`.
- `AdminAccountFormModal` calls `POST /api/users` for create and `PATCH /api/users/:id` for edit.

- [ ] **Step 1: Add failing form-policy tests**

Cover these exact assertions:

```tsx
expect(screen.queryByLabelText('Vai trò tài khoản')).not.toBeInTheDocument();
expect(apiMock.post).toHaveBeenCalledWith('/api/users', expect.objectContaining({ role: 'ADMIN', password: '123456' }));
expect(apiMock.patch).toHaveBeenCalledWith('/api/users/admin-1', expect.not.objectContaining({ role: expect.anything(), username: expect.anything() }));
expect(apiMock.post).not.toHaveBeenCalled(); // after submitting password 12345a
```

Render the modal under `ToastProvider`; mock `api.post` and `api.patch` with resolved `{ data: {}, message: 'Đã lưu' }` values.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- frontend/tests/components/AdminAccountFormModal.test.tsx --run`

Expected: FAIL because the component and types do not exist.

- [ ] **Step 3: Add focused account types**

```ts
export interface AdminAccount {
  _id?: string;
  id?: string;
  username: string;
  role: 'ADMIN';
  fullName?: string;
  phone?: string;
  email?: string | null;
  status: 'ACTIVE' | 'LOCKED';
  createdAt?: string;
}

export interface AdminAccountFormState {
  username: string;
  password: string;
  fullName: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'LOCKED';
}
```

Re-export them from `frontend/src/types.ts` with `export * from './types/adminAccount';`.

- [ ] **Step 4: Implement the dedicated modal**

The create payload is exact:

```ts
const payload = {
  role: 'ADMIN' as const,
  username: form.username.trim(),
  password: form.password,
  fullName: form.fullName.trim(),
  phone: form.phone.trim() || undefined,
  email: form.email.trim() || null,
  status: form.status,
};
```

The edit payload omits immutable fields:

```ts
const payload = {
  fullName: form.fullName.trim(),
  phone: form.phone.trim() || undefined,
  email: form.email.trim() || null,
  status: form.status,
  ...(form.password ? { password: form.password } : {}),
};
```

Before either request, reject a supplied password unless `isSixDigitPassword(form.password)` is true. Use `ProfileFormModal`, `FormField`, `PASSWORD_HINT`, `PASSWORD_INPUT_PATTERN`, `PASSWORD_ERROR`, dirty-state detection, loading state, and placeholders for every input. Do not render a role field.

- [ ] **Step 5: Run the modal tests and verify GREEN**

Run: `npm test -- frontend/tests/components/AdminAccountFormModal.test.tsx --run`

Expected: all form-policy tests passed.

---

### Task 3: ADMIN-only management view

**Files:**
- Create: `frontend/src/components/admin/AdminAccountManagementView.tsx`
- Test: `frontend/tests/components/AdminAccountManagementView.test.tsx`

**Interfaces:**
- Consumes: `AdminAccount`, `AdminAccountFormModal`, `api`, `Pagination`, `StatusBadge`, `ConfirmModal`, `useToast`.
- Produces: `AdminAccountManagementView({ actor }: { actor: User })`.

- [ ] **Step 1: Write failing list and CRUD orchestration tests**

The tests must verify:

```ts
await waitFor(() => expect(apiMock.get).toHaveBeenCalledWith(
  expect.stringContaining('role=ADMIN'),
));
expect(screen.getByRole('heading', { name: 'Quản lý tài khoản Admin' })).toBeInTheDocument();
expect(screen.getByRole('button', { name: 'Thêm Admin' })).toBeInTheDocument();
```

Also submit a keyword, change status, and navigate pages; every captured GET URL must contain `role=ADMIN`. Open delete confirmation, confirm, and assert `api.delete('/api/users/admin-1')`, then assert the list is fetched again.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- frontend/tests/components/AdminAccountManagementView.test.tsx --run`

Expected: FAIL because the view does not exist.

- [ ] **Step 3: Implement fixed-role data loading**

Build every list URL from this invariant:

```ts
const params = new URLSearchParams({
  role: 'ADMIN',
  page: String(page),
  limit: '20',
});
if (keyword.trim()) params.set('keyword', keyword.trim());
if (status) params.set('status', status);
const result = await api.get<AdminAccount[]>(`/api/users?${params.toString()}`);
```

Store list data, pagination metadata, loading state, keyword, status, selected edit account, create-modal state, delete target, and delete-loading state. After create/edit/delete, refetch `meta.page || 1`.

- [ ] **Step 4: Implement the Tailwind interface**

Use a responsive structure with:

- Header and “Thêm Admin” button.
- Search input with placeholder `Tìm theo tên, tên đăng nhập hoặc email...`.
- Status select with `Tất cả trạng thái`, `Đang hoạt động`, and `Đã khóa`.
- Responsive table for user, contact, status, created date, and edit/delete actions.
- Loading and empty states.
- `AdminAccountFormModal` and destructive `ConfirmModal`.

Use complete Tailwind class strings such as `rounded-2xl border border-slate-200 bg-white`, `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary`, and disabled states. Do not add inline style.

- [ ] **Step 5: Run view tests and verify GREEN**

Run: `npm test -- frontend/tests/components/AdminAccountManagementView.test.tsx --run`

Expected: all view tests passed.

---

### Task 4: Regression and build verification

**Files:**
- Verify all files from Tasks 1-3.

**Interfaces:**
- Consumes the completed route, navigation, modal, and view.
- Produces verification evidence only; no unrelated fixes.

- [ ] **Step 1: Run focused tests**

Run:

```powershell
npm test -- frontend/tests/config/AdminAccountNavigation.test.ts frontend/tests/components/AdminAccountFormModal.test.tsx frontend/tests/components/AdminAccountManagementView.test.tsx frontend/tests/services/roles.test.ts frontend/tests/components/AdminUserManagement.test.tsx --run
```

Expected: all targeted test files passed.

- [ ] **Step 2: Lint changed files**

Run:

```powershell
npx oxlint frontend/src/types/adminAccount.ts frontend/src/types.ts frontend/src/config/portalNavigation.ts frontend/src/routes/PortalRoutes.tsx frontend/src/pages/admin/AdminAccountsPage.tsx frontend/src/components/admin/AdminAccountFormModal.tsx frontend/src/components/admin/AdminAccountManagementView.tsx frontend/tests/config/AdminAccountNavigation.test.ts frontend/tests/components/AdminAccountFormModal.test.tsx frontend/tests/components/AdminAccountManagementView.test.tsx
```

Expected: exit code 0 with no warnings in changed files.

- [ ] **Step 3: Run repository typecheck**

Run: `npm run typecheck`

Expected: report whether it passes. If it still reports the existing progress fixture errors, confirm no new error points to the files changed by this plan and report those unrelated failures separately.

- [ ] **Step 4: Re-read the design acceptance criteria**

Confirm menu visibility, exact-role route guard, fixed ADMIN list/create role, six-digit password validation, CRUD refresh behavior, Tailwind-only new UI, and absence of a SUPER_ADMIN row or role selector.
