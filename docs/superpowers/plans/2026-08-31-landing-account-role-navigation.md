# Landing Account Role Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the signed-in account name on the landing navbar open the correct role workspace through the existing `/portal` redirect.

**Architecture:** `Navbar` will expose the desktop and mobile account names as React Router links to `/portal`. `PortalRoutes` remains the only owner of role destinations, so no role mapping or API behavior is added to the landing page.

**Tech Stack:** React 19, React Router 7, TypeScript, Tailwind CSS 4, Vitest, Testing Library

## Global Constraints

- Preserve the logout button as an independent control.
- Preserve all existing navbar links and authentication behavior.
- Use `/portal` as the account link destination on desktop and mobile.
- Use Tailwind utilities for new or modified UI styling.
- Do not add dependencies or duplicate role-to-route mappings.

---

### Task 1: Account workspace links

**Files:**
- Create: `frontend/tests/components/Navbar.test.tsx`
- Modify: `frontend/src/components/Navbar.tsx`

**Interfaces:**
- Consumes: React Router `Link`, existing local-storage keys `token` and `user`, existing `/portal` protected route.
- Produces: Two accessible links named `Mở trang làm việc của <username>` with `href="/portal"`, one for desktop and one inside the mobile menu.

- [ ] **Step 1: Write the failing desktop-link test**

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../../src/components/Navbar';

describe('Navbar account navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'token-test');
    localStorage.setItem('user', JSON.stringify({ username: 'admin', role: 'ADMIN' }));
  });

  it('links the desktop account name to the role-aware portal entry', () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>);

    expect(screen.getByRole('link', { name: 'Mở trang làm việc của admin' })).toHaveAttribute('href', '/portal');
  });
});
```

- [ ] **Step 2: Run the desktop-link test and verify RED**

Run: `npm test -- frontend/tests/components/Navbar.test.tsx`

Expected: FAIL because the account name is currently a `span`, so no matching link exists.

- [ ] **Step 3: Add the minimal desktop account link**

Replace the desktop username `span` with:

```tsx
<Link
  to="/portal"
  aria-label={`Mở trang làm việc của ${user?.username || 'admin'}`}
  className="rounded-sm text-sm font-bold text-white transition-colors hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary motion-reduce:transition-none"
>
  {user?.username || 'admin'}
</Link>
```

- [ ] **Step 4: Run the desktop-link test and verify GREEN**

Run: `npm test -- frontend/tests/components/Navbar.test.tsx`

Expected: PASS with one passing test.

- [ ] **Step 5: Write the failing mobile-link test**

Add inside the same `describe` block:

```tsx
it('links the mobile account name to the role-aware portal entry', () => {
  render(<MemoryRouter><Navbar /></MemoryRouter>);

  fireEvent.click(screen.getByRole('button', { name: 'Mở menu điều hướng' }));

  expect(screen.getAllByRole('link', { name: 'Mở trang làm việc của admin' })).toHaveLength(2);
  expect(screen.getAllByRole('link', { name: 'Mở trang làm việc của admin' })[1]).toHaveAttribute('href', '/portal');
});
```

- [ ] **Step 6: Run the mobile-link test and verify RED**

Run: `npm test -- frontend/tests/components/Navbar.test.tsx`

Expected: FAIL because the menu button has no accessible name and the mobile username is not a link.

- [ ] **Step 7: Add the mobile menu label and account link**

Add to the existing mobile menu toggle button:

```tsx
aria-label={mobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
aria-expanded={mobileMenuOpen}
```

Replace the mobile username wrapper with a layout that keeps the user icon and link together:

```tsx
<div className="flex items-center gap-2 font-bold text-white">
  <UserIcon size={18} color="#38bdf8" />
  <Link
    to="/portal"
    onClick={() => setMobileMenuOpen(false)}
    aria-label={`Mở trang làm việc của ${user?.username || 'admin'}`}
    className="rounded-sm transition-colors hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary motion-reduce:transition-none"
  >
    {user?.username || 'admin'}
  </Link>
</div>
```

- [ ] **Step 8: Run the focused test and typecheck**

Run: `npm test -- frontend/tests/components/Navbar.test.tsx`

Expected: PASS with two passing tests.

Run: `npm run typecheck`

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 9: Review the diff**

Run: `git -c safe.directory='D:/Igen Tech/3S Gym' diff -- frontend/src/components/Navbar.tsx frontend/tests/components/Navbar.test.tsx docs/superpowers/specs/2026-08-31-landing-account-role-navigation-design.md docs/superpowers/plans/2026-08-31-landing-account-role-navigation.md`

Expected: only the approved navigation behavior, its tests, and documentation are present. Do not commit because the user has not authorized commits.
