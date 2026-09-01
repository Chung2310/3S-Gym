# Workout Studio Compact Resize Handle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the visible horizontal resize indicator on 15-minute Workout Studio cards without disabling their resize interaction.

**Architecture:** Preserve the existing `is-compact` state and `.studio-resize-handle` pointer target. Add one semantic CSS override that hides only the handle's `::after` decoration, with a CSS contract assertion guarding the behavior.

**Tech Stack:** React, TypeScript, CSS, Vitest

## Global Constraints

- Keep `.studio-resize-handle` present and interactive.
- Hide only the `::after` indicator on `.studio-scheduled-item.is-compact` cards.
- Keep the indicator visible on cards longer than 15 minutes.
- Do not alter JSX, scheduling logic, card geometry, or unrelated local changes.
- The regression test remains local-only under the repository's existing test-file policy.

---

### Task 1: Hide the compact-card resize indicator

**Files:**
- Modify: `frontend/tests/components/IndexCssRedesignContract.test.ts:89-91`
- Modify: `frontend/src/index.css:6782`

**Interfaces:**
- Consumes: the existing `.studio-scheduled-item.is-compact` state and `.studio-resize-handle::after` decoration.
- Produces: the semantic selector `.studio-scheduled-item.is-compact .studio-resize-handle::after` with `display: none`.

- [ ] **Step 1: Write the failing CSS contract assertion**

Add this assertion after the existing compact-content assertion:

```ts
expect(css).toMatch(/\.studio-scheduled-item\.is-compact \.studio-resize-handle::after\s*\{[^}]*display:\s*none;/s);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run from the repository root:

```powershell
npx vitest run --config vitest.config.ts frontend/tests/components/IndexCssRedesignContract.test.ts
```

Expected: the CSS contract test fails because the compact resize-indicator selector is absent.

- [ ] **Step 3: Add the minimal semantic CSS override**

Add immediately after the base `.studio-resize-handle::after` rule:

```css
.studio-scheduled-item.is-compact .studio-resize-handle::after {
  display: none;
}
```

Do not hide `.studio-resize-handle`; its transparent 12px pointer target must remain active.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
npx vitest run --config vitest.config.ts frontend/tests/components/IndexCssRedesignContract.test.ts
```

Expected: all tests in the focused file pass.

- [ ] **Step 5: Run regression verification**

Run:

```powershell
npm test
npm run build
```

Expected: the full frontend test suite and production build pass without errors.

- [ ] **Step 6: Commit only the production CSS rule and plan**

Because `frontend/src/index.css` contains unrelated local edits, stage only the exact new CSS hunk plus this plan. Do not stage local-only test files or unrelated working-tree changes.

```powershell
git diff --cached --check
git commit -m "fix(studio): hide compact resize indicator"
```

- [ ] **Step 7: Push the current branch**

```powershell
git push origin feat/pt-workout-progress-enhancements
```

Expected: the remote branch advances to the implementation commit.
