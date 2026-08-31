# Local-only tests design

## Goal

Keep all automated test source files available and runnable in the current local workspace, while temporarily removing them from Git and preventing future test files from being committed.

## Repository behavior

- Ignore `backend/tests/` and `frontend/tests/`.
- Ignore co-located files matching `*.test.ts` and `*.test.tsx` anywhere in the repository.
- Remove every currently tracked test file from the Git index with an index-only operation. The physical files must remain on disk.
- Keep the existing local `npm test` script unchanged so the retained local files continue to run normally.

## CI behavior

- Remove the `npm test` step from GitHub Actions workflows because a fresh checkout will no longer contain the test suite.
- Retain lint, typecheck, build, Docker image build, and VPS deployment steps.

## Safety and scope

- Do not stage or commit the existing local changes in `frontend/src/index.css` or `frontend/src/pages/pt/WorkoutStudioPage.tsx`.
- Verify that all test files still exist locally after their index removal.
- Verify that Git reports test files as deleted from the repository and no longer reports later edits to ignored test files.
- Run the local test suite before removing it from the Git index, then run it again afterward to prove local execution still works.

## Recovery

To restore tests to the repository, remove the test ignore rules and add the retained local test files back to Git.
