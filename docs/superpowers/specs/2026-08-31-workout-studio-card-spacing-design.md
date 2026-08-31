# Workout Studio Card Spacing Design

## Goal

Improve readability in Workout Studio by giving week/day navigation cards more horizontal breathing room and ensuring a 15-minute scheduled exercise remains legible.

## Scope

- Add horizontal padding and no-wrap behavior to week and day buttons.
- Keep navigation horizontally scrollable when the viewport cannot fit every button.
- Render exactly 15-minute scheduled exercises in a compact, single-line layout.
- Preserve the existing two-line layout for exercises lasting 30 minutes or longer.
- Preserve the full exercise name and time range in the existing accessible button label.
- Do not modify the user's unrelated local changes in `frontend/src/index.css` or the existing selection-clear change in `frontend/src/pages/pt/WorkoutStudioPage.tsx`.

## Selected Approach

Use the existing semantic `.studio-*` class contract and add narrowly scoped rules to `frontend/src/index.css`. Workout Studio has a repository-enforced semantic CSS contract that is more specific than the general Tailwind-first policy.

### Week and day navigation

- Week buttons receive semantic CSS with `white-space: nowrap` and wider horizontal padding.
- Day buttons receive the same treatment for consistent visual spacing.
- Existing minimum touch size, active state, hover state, and horizontal overflow behavior remain unchanged.

### Fifteen-minute exercise cards

- `ScheduledExerciseCard` detects compact cards with `durationMinutes <= SLOT_MINUTES`.
- Compact content is a single flex row with minimal vertical padding.
- The exercise name truncates with an ellipsis when space is limited.
- The duration label `15 phút` is non-shrinking and remains visible.
- Compact cards omit the visible time range because the 20px proportional height cannot fit two lines; the complete time range remains available through the button's accessible name.
- Cards longer than 15 minutes retain the existing name plus time-range/duration presentation.

## Components

- `frontend/src/index.css`: week/day padding and compact scheduled-card rules.
- `frontend/src/pages/pt/WorkoutStudioPage.tsx`: unchanged semantic week navigation markup.
- `frontend/src/components/workout-studio/StudioDayNavigator.tsx`: unchanged semantic day navigation markup.
- `frontend/src/components/workout-studio/DayTimeline.tsx`: conditional compact scheduled-card content.
- `frontend/tests/pages/WorkoutStudioPage.test.tsx`: local-only visual contract regression coverage.

## Testing

1. Add a regression assertion for padded, no-wrap week and day buttons.
2. Add a regression case that reduces an exercise to 15 minutes and verifies the compact single-line content, visible exercise name, and visible `15 phút` label.
3. Run the focused Workout Studio test and observe it fail before implementation.
4. Apply the minimal component changes and rerun the focused test to green.
5. Run TypeScript typecheck and production build.

## Acceptance Criteria

- Week and day labels no longer sit against their card edges.
- A 15-minute pipeline card visibly contains the exercise name and `15 phút` on one line.
- Longer exercise cards keep their current detailed layout.
- Timeline geometry remains proportional: 15 minutes still equals one 20px slot.
- Existing local user changes remain uncommitted unless explicitly requested.
