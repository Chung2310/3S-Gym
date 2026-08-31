# Local-only Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove automated test sources from Git while retaining and running them in the current local workspace.

**Architecture:** Git ignore rules define test sources as local-only. GitHub Actions stops invoking test commands because fresh checkouts will not contain those sources, while `package.json` keeps its current local test commands unchanged. Test files are removed with index-only Git operations so the working copies remain available.

**Tech Stack:** Git, GitHub Actions YAML, npm, Vitest, PowerShell

## Global Constraints

- Keep local `npm test` and `npm run test:backend` commands unchanged.
- Never delete physical test files; remove them only from the Git index.
- Do not stage or commit `frontend/src/index.css` or `frontend/src/pages/pt/WorkoutStudioPage.tsx`.
- Keep `vitest.config.ts` tracked; it is configuration, not a test source.

---

### Task 1: Establish the local test baseline

**Files:**
- Read: `backend/tests/**`
- Read: `frontend/tests/**`
- Read: `frontend/src/config/portalNavigation.test.ts`

**Interfaces:**
- Consumes: Existing Vitest configuration and local test files.
- Produces: A verified baseline count and a passing local suite before index removal.

- [ ] **Step 1: Count tracked test sources precisely**

Run:

```powershell
$testSources = @(git ls-files -- 'backend/tests/**' 'frontend/tests/**' '*.test.ts' '*.test.tsx' | Where-Object { $_ -ne 'vitest.config.ts' } | Sort-Object -Unique)
$testSources.Count
```

Expected: `146`. This consists of 72 backend tests, 73 frontend test-directory files, and one co-located frontend test.

- [ ] **Step 2: Run the complete local suite**

Run from `frontend/`:

```powershell
npm test
```

Expected: exit code `0`, with 145 test files and 469 tests passing.

---

### Task 2: Make test sources local-only and remove CI test execution

**Files:**
- Modify: `.gitignore`
- Modify: `.github/workflows/cd.yml`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Existing test paths and workflow scripts.
- Produces: Ignore rules for all test sources and CI workflows that retain non-test quality gates.

- [ ] **Step 1: Add test ignore rules**

Append this exact block to `.gitignore`:

```gitignore
# Local-only automated tests
backend/tests/
frontend/tests/
**/*.test.ts
**/*.test.tsx
```

- [ ] **Step 2: Remove the full-suite test step from CD**

Delete this exact step from `.github/workflows/cd.yml`:

```yaml
      - name: Run Tests
        run: npm test
```

- [ ] **Step 3: Preserve backend CI checks without remote tests**

Replace this step in `.github/workflows/ci.yml`:

```yaml
      - run: npm run verify:backend
```

with:

```yaml
      - run: npm run typecheck:backend
      - run: npm run lint:backend
      - run: npm run build:backend
      - run: npm run smoke:production
```

This keeps `verify:backend` unchanged for local use.

- [ ] **Step 4: Verify workflow and ignore configuration**

Run:

```powershell
rg -n "npm test|npm run verify:backend" .github/workflows
git check-ignore -v backend/tests/auth.test.ts frontend/tests/fullJourney.ui.test.tsx frontend/src/config/portalNavigation.test.ts
```

Expected: the first command finds no remote test invocation; the second prints a matching `.gitignore` rule for all three files.

---

### Task 3: Remove tests from Git index without deleting local files

**Files:**
- Remove from Git index only: `backend/tests/**`
- Remove from Git index only: `frontend/tests/**`
- Remove from Git index only: `frontend/src/config/portalNavigation.test.ts`

**Interfaces:**
- Consumes: Ignore rules from Task 2.
- Produces: Test deletions staged in Git while all physical files remain in the workspace.

- [ ] **Step 1: Record verified absolute target roots**

Run:

```powershell
$repoRoot = (git rev-parse --show-toplevel).Trim()
$backendTests = [System.IO.Path]::GetFullPath((Join-Path $repoRoot 'backend/tests'))
$frontendTests = [System.IO.Path]::GetFullPath((Join-Path $repoRoot 'frontend/tests'))
$backendTests
$frontendTests
```

Expected: both paths are children of `D:\Igen Tech\3S Gym`.

- [ ] **Step 2: Remove directory test files from the index only**

Run:

```powershell
git rm -r --cached -- backend/tests frontend/tests
```

Expected: Git stages deletions and the physical directories remain present.

- [ ] **Step 3: Remove the co-located test from the index only**

Run:

```powershell
git rm --cached -- frontend/src/config/portalNavigation.test.ts
```

Expected: Git stages one deletion and the physical file remains present.

- [ ] **Step 4: Prove all test sources remain local**

Run:

```powershell
$localTests = @(Get-ChildItem backend/tests,frontend/tests -Recurse -File; Get-Item frontend/src/config/portalNavigation.test.ts)
$localTests.Count
Test-Path backend/tests/auth.test.ts
Test-Path frontend/tests/fullJourney.ui.test.tsx
Test-Path frontend/src/config/portalNavigation.test.ts
```

Expected: count `146`, followed by three `True` values.

- [ ] **Step 5: Prove Git ignores the retained local sources**

Run:

```powershell
git status --short --ignored -- backend/tests frontend/tests frontend/src/config/portalNavigation.test.ts
```

Expected: ignored entries (`!!`) and no untracked test files.

---

### Task 4: Verify, commit, and push

**Files:**
- Commit: `.gitignore`
- Commit: `.github/workflows/cd.yml`
- Commit: `.github/workflows/ci.yml`
- Commit: `docs/superpowers/plans/2026-08-31-local-only-tests.md`
- Commit staged test-source deletions.
- Exclude: `frontend/src/index.css`
- Exclude: `frontend/src/pages/pt/WorkoutStudioPage.tsx`

**Interfaces:**
- Consumes: Local-only test setup from Tasks 1-3.
- Produces: A remote branch without test sources and a local workspace where the suite still passes.

- [ ] **Step 1: Run the retained local suite after index removal**

Run from `frontend/`:

```powershell
npm test
```

Expected: exit code `0`, with the same 145 test files and 469 tests passing.

- [ ] **Step 2: Run remaining CI-equivalent checks**

Run from `frontend/`:

```powershell
npm run lint
npm run typecheck
npm run build
npm run typecheck:backend
npm run lint:backend
npm run build:backend
npm run smoke:production
```

Expected: every command exits `0`; existing lint warnings are allowed.

- [ ] **Step 3: Review the staged scope**

Run:

```powershell
git diff --cached --check
git status --short
git diff --cached --stat
```

Expected: test deletions, the three configuration files, and this implementation plan only; the two user-owned frontend files remain unstaged.

- [ ] **Step 4: Commit**

```powershell
git add -- .gitignore .github/workflows/cd.yml .github/workflows/ci.yml docs/superpowers/plans/2026-08-31-local-only-tests.md
git commit -m "chore: keep automated tests local only"
```

- [ ] **Step 5: Push the current branch**

```powershell
git push origin feat/pt-workout-progress-enhancements
```

Expected: remote branch advances to the new commit; local test files still exist and remain ignored.
