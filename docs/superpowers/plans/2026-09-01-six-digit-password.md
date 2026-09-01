# Six-Digit Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce exactly six numeric digits whenever an ADMIN, PT, or CUSTOMER password is created or changed, with matching hints and client feedback.

**Architecture:** Define one reusable Joi password schema for backend request validators and one reusable frontend password-rule module for React forms. Keep login validation unchanged so accounts with legacy passwords can still authenticate.

**Tech Stack:** TypeScript, Joi, React 19, Vitest, Testing Library.

## Global Constraints

- A valid password matches `^\d{6}$`.
- Creating a password requires exactly six numeric digits; updating may omit the password or send an empty value to leave it unchanged.
- Apply the rule consistently to ADMIN, PT, and CUSTOMER account-management flows.
- Do not add the six-digit format check to login.
- Do not migrate existing password hashes.
- Do not commit, create a worktree, or use subagents without explicit user authorization.

---

### Task 1: Backend password contract

**Files:**
- Create: `backend/tests/passwordValidator.test.ts`
- Modify: `backend/validators/commonValidator.ts`
- Modify: `backend/validators/userValidator.ts`
- Modify: `backend/validators/customerValidator.ts`

**Interfaces:**
- Produces: `sixDigitPassword`, a Joi string schema accepting only `^\d{6}$` and returning `Mật khẩu phải gồm đúng 6 chữ số.` for pattern failures.
- Consumes: Existing `createUserSchema`, `updateUserSchema`, and `createCustomerAccountSchema` request schemas.

- [ ] **Step 1: Write failing backend schema tests**

Create tests that exercise the real request schemas:

```ts
import { describe, expect, it } from 'vitest';
import { createCustomerAccountSchema } from '../validators/customerValidator.js';
import { createUserSchema, updateUserSchema } from '../validators/userValidator.js';

const userBody = createUserSchema.body!;
const updateBody = updateUserSchema.body!;
const customerAccountBody = createCustomerAccountSchema.body!;

describe('six-digit account password validation', () => {
  it.each(['ADMIN', 'PT', 'CUSTOMER'])('accepts exactly six digits for %s', (role) => {
    const value = { username: `user-${role.toLowerCase()}`, password: '123456', role };
    if (role === 'PT') Object.assign(value, { fullName: 'PT Test', phone: '0900000000' });
    expect(userBody.validate(value).error).toBeUndefined();
  });

  it.each(['12345', '1234567', '12345a', ' 123456', '123 45', '12345!'])(
    'rejects invalid password %s',
    (password) => expect(userBody.validate({ username: 'admin-test', password, role: 'ADMIN' }).error).toBeDefined(),
  );

  it('allows an omitted or empty password on user update', () => {
    expect(updateBody.validate({ fullName: 'Updated' }).error).toBeUndefined();
    expect(updateBody.validate({ password: '' }).error).toBeUndefined();
  });

  it('uses the same rule for customer account creation', () => {
    expect(customerAccountBody.validate({ username: 'customer-test', password: '123456' }).error).toBeUndefined();
    expect(customerAccountBody.validate({ username: 'customer-test', password: '12345a' }).error).toBeDefined();
  });
});
```

- [ ] **Step 2: Run the backend test and verify RED**

Run: `npx vitest run --config vitest.config.ts backend/tests/passwordValidator.test.ts`

Expected: FAIL because current schemas require only a minimum of eight characters and reject `123456` while accepting some non-six-digit values.

- [ ] **Step 3: Add the shared Joi schema and wire it into both validators**

Add to `backend/validators/commonValidator.ts`:

```ts
export const sixDigitPassword = Joi.string().pattern(/^\d{6}$/).messages({
  ...commonMessages,
  'string.pattern.base': 'Mật khẩu phải gồm đúng 6 chữ số.',
});
```

Import `sixDigitPassword` in both validator files. Use `sixDigitPassword` in `profileFields.password` and `createCustomerAccountSchema`; use `sixDigitPassword.allow('', null)` in the update schema.

- [ ] **Step 4: Run the backend test and verify GREEN**

Run: `npx vitest run --config vitest.config.ts backend/tests/passwordValidator.test.ts`

Expected: all password schema tests PASS.

### Task 2: Frontend password rule and form behavior

**Files:**
- Create: `frontend/src/services/passwordValidation.ts`
- Create: `frontend/tests/services/passwordValidation.test.ts`
- Create: `frontend/tests/components/AccountPasswordFields.test.tsx`
- Modify: `frontend/src/components/ui/UserFormModal.tsx`
- Modify: `frontend/src/components/ui/PtFormModal.tsx`
- Modify: `frontend/src/components/ui/CustomerAccountModal.tsx`

**Interfaces:**
- Produces: `PASSWORD_ERROR`, `PASSWORD_HINT`, `PASSWORD_INPUT_PATTERN`, and `isSixDigitPassword(value: string): boolean`.
- Consumes: `FormField`, `ToastProvider`, and the existing `api` service.

- [ ] **Step 1: Write failing unit tests for the frontend rule**

```ts
import { describe, expect, it } from 'vitest';
import { isSixDigitPassword } from '../../src/services/passwordValidation';

describe('isSixDigitPassword', () => {
  it('accepts exactly six ASCII digits', () => expect(isSixDigitPassword('123456')).toBe(true));
  it.each(['12345', '1234567', '12345a', ' 123456', '123 45', '12345!'])(
    'rejects %s',
    (value) => expect(isSixDigitPassword(value)).toBe(false),
  );
});
```

- [ ] **Step 2: Run the unit test and verify RED**

Run: `npx vitest run --config vitest.config.ts frontend/tests/services/passwordValidation.test.ts`

Expected: FAIL because `frontend/src/services/passwordValidation.ts` does not exist.

- [ ] **Step 3: Implement the minimal frontend rule**

```ts
export const PASSWORD_ERROR = 'Mật khẩu phải gồm đúng 6 chữ số.';
export const PASSWORD_HINT = 'Nhập đúng 6 chữ số';
export const PASSWORD_INPUT_PATTERN = '[0-9]{6}';

export function isSixDigitPassword(value: string): boolean {
  return /^\d{6}$/.test(value);
}
```

- [ ] **Step 4: Run the unit test and verify GREEN**

Run: `npx vitest run --config vitest.config.ts frontend/tests/services/passwordValidation.test.ts`

Expected: all helper tests PASS.

- [ ] **Step 5: Write failing component contract and submit tests**

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CustomerAccountModal from '../../src/components/ui/CustomerAccountModal';
import PtFormModal from '../../src/components/ui/PtFormModal';
import { ToastProvider } from '../../src/components/ui/ToastProvider';
import UserFormModal from '../../src/components/ui/UserFormModal';

const apiMock = vi.hoisted(() => ({
  post: vi.fn(),
  patch: vi.fn(),
  upload: vi.fn(),
}));

vi.mock('../../src/services/api', () => ({ api: apiMock }));

const cases = [
  {
    name: 'general user',
    renderModal: () => render(
      <ToastProvider>
        <UserFormModal open onClose={vi.fn()} onSaved={vi.fn()} />
      </ToastProvider>,
    ),
  },
  {
    name: 'PT',
    renderModal: () => render(
      <ToastProvider>
        <PtFormModal open onClose={vi.fn()} onSaved={vi.fn()} />
      </ToastProvider>,
    ),
  },
  {
    name: 'customer',
    renderModal: () => render(
      <ToastProvider>
        <CustomerAccountModal
          open
          customer={{ _id: 'customer-1', fullName: 'Khách Test' }}
          onClose={vi.fn()}
          onSaved={vi.fn()}
        />
      </ToastProvider>,
    ),
  },
];

describe.each(cases)('$name password field', ({ renderModal }) => {
  beforeEach(() => vi.clearAllMocks());

  it('advertises and enforces the six-digit input contract before API submission', async () => {
    renderModal();
    const input = screen.getByLabelText('Mật khẩu ban đầu');

    expect(input).toHaveAttribute('minlength', '6');
    expect(input).toHaveAttribute('maxlength', '6');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('pattern', '[0-9]{6}');
    expect(input).toHaveAttribute('placeholder', 'Nhập đúng 6 chữ số');

    fireEvent.change(input, { target: { value: '12345a' } });
    fireEvent.submit(input.closest('form')!);

    expect(await screen.findByText('Mật khẩu phải gồm đúng 6 chữ số.')).toBeInTheDocument();
    expect(apiMock.post).not.toHaveBeenCalled();
    expect(apiMock.patch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Run the component test and verify RED**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/AccountPasswordFields.test.tsx`

Expected: FAIL because the current inputs still expose the eight-character contract and PT/customer forms do not perform the new submit check.

- [ ] **Step 7: Wire the shared rule into all three forms**

For each password `FormField`, set:

```tsx
minLength={6}
maxLength={6}
inputMode="numeric"
pattern={PASSWORD_INPUT_PATTERN}
placeholder={PASSWORD_HINT}
```

Before any API call, reject a non-empty invalid password with:

```ts
if (!isSixDigitPassword(form.password)) {
  toast.error(PASSWORD_ERROR);
  return;
}
```

In `UserFormModal`, do not trim the password before validation so surrounding whitespace is rejected. Keep the edit behavior optional: skip validation and omit the payload field when the password is empty. Use the editing placeholder `Để trống nếu không đổi; nếu đổi, nhập đúng 6 chữ số`.

- [ ] **Step 8: Run frontend tests and verify GREEN**

Run: `npx vitest run --config vitest.config.ts frontend/tests/services/passwordValidation.test.ts frontend/tests/components/AccountPasswordFields.test.tsx`

Expected: all helper and component tests PASS.

### Task 3: Regression verification

**Files:**
- Verify all files modified in Tasks 1 and 2.

**Interfaces:**
- Consumes: Backend schemas and frontend form contract completed above.
- Produces: Evidence that active account-management code no longer uses the old eight-character rule.

- [ ] **Step 1: Scan active code for stale password copy or validators**

Run: `rg -n "minLength=\{8\}|min\(8\)|tối thiểu 8|ít nhất 8" frontend/src backend/validators`

Expected: no matches in active account-management forms or Joi validators.

- [ ] **Step 2: Run targeted tests**

Run: `npx vitest run --config vitest.config.ts backend/tests/passwordValidator.test.ts frontend/tests/services/passwordValidation.test.ts frontend/tests/components/AccountPasswordFields.test.tsx`

Expected: all targeted tests PASS without warnings or unhandled errors.

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`

Expected: exit code 0.

- [ ] **Step 4: Run lint on changed source and test files**

Run: `npx oxlint backend/validators/commonValidator.ts backend/validators/userValidator.ts backend/validators/customerValidator.ts backend/tests/passwordValidator.test.ts frontend/src/services/passwordValidation.ts frontend/src/components/ui/UserFormModal.tsx frontend/src/components/ui/PtFormModal.tsx frontend/src/components/ui/CustomerAccountModal.tsx frontend/tests/services/passwordValidation.test.ts frontend/tests/components/AccountPasswordFields.test.tsx`

Expected: exit code 0 with no new diagnostics.
