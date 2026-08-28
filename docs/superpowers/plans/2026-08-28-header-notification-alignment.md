# Header Notification Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Place the portal notification button directly beside the signed-in user information in a right-aligned header action group.

**Architecture:** Add one semantic layout wrapper in `AppShell` around the existing notification bell and user information. Move right alignment from the user block to that wrapper and use Tailwind utilities for its spacing and shrink behavior, leaving notification behavior unchanged.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, Vitest, Testing Library

## Global Constraints

- Use the existing `NotificationBell` component without changing its API or behavior.
- Keep an 8px gap between the notification button and user information.
- Preserve dropdown positioning relative to the notification button.
- Keep the actions group right-aligned and non-shrinking on desktop and mobile.
- Do not add global CSS for the new wrapper; use statically discoverable Tailwind classes.

---

### Task 1: Group and align the header actions

**Files:**
- Modify: `frontend/tests/components/AppShell.test.tsx`
- Modify: `frontend/src/components/AppShell.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: existing `NotificationBell` and `.portal-header-user` markup.
- Produces: a `.portal-header-actions` wrapper containing the notification button before `.portal-header-user`.

- [x] **Step 1: Write the failing structure test**

Add this assertion to the first `AppShell` test after rendering:

```tsx
const actions = document.querySelector('.portal-header-actions');
expect(actions).toHaveClass('ml-auto', 'flex', 'shrink-0', 'items-center', 'gap-2');
expect(actions?.querySelector('[aria-label="Thông báo"]')).toBeInTheDocument();
expect(actions?.querySelector('.portal-header-user')).toHaveTextContent('PT Minh');
expect(actions?.firstElementChild).toHaveAttribute('aria-label', 'Thông báo');
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --run frontend/tests/components/AppShell.test.tsx`

Expected: FAIL because `.portal-header-actions` does not exist.

- [x] **Step 3: Implement the minimal layout change**

In `AppShell.tsx`, replace the separate bell and user nodes with:

```tsx
<div className="portal-header-actions ml-auto flex shrink-0 items-center gap-2">
  <ToastProvider><NotificationBell /></ToastProvider>
  <div className="portal-header-user">
    <strong>{user.fullName || user.username}</strong>
    <span>{roleNames[user.role]}</span>
  </div>
</div>
```

In `index.css`, remove `margin-left: auto` from `.portal-header-user` while preserving its grid and text alignment:

```css
.portal-header-user { display: grid; text-align: right; }
```

- [x] **Step 4: Run focused verification and verify GREEN**

Run: `npm test -- --run frontend/tests/components/AppShell.test.tsx frontend/tests/components/notifications/NotificationCenter.test.tsx`

Expected: all selected tests PASS.

- [x] **Step 5: Run type checking**

Run: `npm run typecheck`

Expected: exit code 0.

- [x] **Step 6: Review and commit**

Run `git diff --check` and inspect `git diff`. Then commit the test, component, CSS, and this plan with message:

```text
fix: align notification bell with user info
```
