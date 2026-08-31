# Exercise, Workout Plans, and Studio Index CSS Redesign

## Goal

Redesign the Exercise Library, Workout Plans, and Workout Studio as one coherent Clinical Performance workspace while preserving every existing URL, API contract, permission rule, and business behavior. All static presentation in scope will come from semantic classes defined in `frontend/src/index.css`.

## Scope

The redesign covers:

- The PT Exercise Library page, filters, exercise cards, and create/edit modal.
- The PT workout-template list, template cards, customer-plan surfaces, and AI workout wizard.
- The Workout Studio header, week/day navigation, exercise palette, schedule timeline, unscheduled area, and inspector.
- Loading, empty, filtered-empty, error, disabled, focus, hover, pressed, and reduced-motion states for those surfaces.
- Responsive behavior across mobile, tablet, desktop, and wide desktop.

The redesign does not cover:

- InBody, Progress, Roadmap, Nutrition, Dashboard, portal navigation, or landing-page UI.
- API endpoints, DTOs, database models, permissions, routing, or feature flags.
- New functionality, drag-and-drop behavior, scheduling calculations, AI generation logic, or save semantics.
- A repository-wide Tailwind migration.

## Approved Direction

The visual direction is Clinical Performance:

- Navy and white surfaces anchored by the existing `#003b70` primary and `#00a4e4` secondary colors.
- Clear data hierarchy, restrained accents, cool neutral grays, and tinted shadows.
- Oswald for display headings and Montserrat for body copy and controls.
- Compact but readable information density suitable for professional PT workflows.
- InBody is a visual reference for hierarchy and density, not a source of inline styles to copy.

The redesign may reorganize layouts, action order, and modal or drawer presentation. It must keep all existing URLs, API behavior, authorization, data semantics, and user capabilities.

## CSS Architecture

`frontend/src/index.css` is the only stylesheet modified or extended by this work. No CSS modules, styled-components, component stylesheets, or new CSS framework will be added.

### Shared module foundation

Reusable presentation contracts use a `module-*` namespace and are limited to the three redesigned modules. Expected families include:

- `module-page`, `module-header`, `module-heading`, and `module-description`.
- `module-actions`, `module-toolbar`, and `module-filter-grid`.
- `module-card`, `module-card-header`, `module-card-body`, and `module-card-actions`.
- `module-metric`, `module-badge`, and explicit state modifiers.
- `module-form`, `module-field`, `module-field-grid`, and `module-field-error`.
- `module-modal`, `module-modal-header`, `module-modal-body`, and `module-modal-actions`.
- `module-skeleton`, `module-empty`, `module-filtered-empty`, and `module-error`.

These classes provide shared spacing, typography, surface, interaction, accessibility, and responsive behavior. Existing generic classes such as `button`, `button-primary`, `button-secondary`, and accessible modal primitives may remain where their contracts already fit.

### Domain namespaces

Feature-specific presentation remains isolated under a domain root:

- `exercise-*` for Exercise Library filters, cards, metadata, video affordances, and form sections.
- `workout-*` for template filters, template cards, customer-plan surfaces, and AI wizard steps.
- `studio-*` for the schedule workspace, navigation, palette, timeline, scheduled items, unscheduled items, and inspector.

Selectors must be rooted under `.exercise-page`, `.workout-page`, or `.workout-studio` when a rule could otherwise leak into unrelated pages. Global element selectors are not allowed for the new work.

### JSX styling contract

- In-scope JSX uses semantic class names instead of Tailwind utility strings.
- Static `style={{ ... }}` declarations are removed from in-scope JSX.
- Conditional appearance uses complete modifier classes such as `is-active`, `is-selected`, `is-loading`, `is-disabled`, `is-dirty`, and `is-published`.
- The schedule timeline may pass data-dependent values through typed CSS custom properties such as `--studio-item-top` and `--studio-item-height`.
- Dynamic timeline values are the only allowed inline style exception. Static color, spacing, typography, transition, size, and surface rules remain in `index.css`.

This scoped design intentionally overrides the repository's Tailwind-first guidance for the three named modules because the user explicitly selected centralized semantic CSS in `index.css`.

## Exercise Library Design

The page uses a three-level hierarchy:

1. A page header with title, explanatory copy, item count, and the primary “Thêm bài tập” action.
2. A command toolbar containing search, muscle group, level, ownership scope, and reset controls.
3. A responsive result grid containing exercise cards.

Each card prioritizes exercise name, muscle group, level, ownership, and video availability. Edit and delete actions remain visible and permission-aware without competing with the primary content. Cards use semantic `article` markup and keep existing callbacks.

The create/edit form is divided into short labeled sections. Required fields, validation feedback, video links, loading state, disabled state, and destructive actions are visually distinct. Failed saves keep the current form data.

## Workout Plans Design

The page header exposes two actions with clear hierarchy:

- “Tạo giáo án” is the primary action.
- “Tạo bằng AI” is the secondary action.

Search and status filtering use the shared module toolbar. Template cards display status, goal, level, duration, update context, and available actions in a stable order. Actions are bottom-aligned so cards remain scannable with varying content lengths.

The AI wizard is a multi-step modal with a persistent progress indicator:

1. Select an eligible customer.
2. Review the analysis and proposal.
3. Adjust duration, sessions, and constraints.
4. Generate and hand the draft to Studio.

The wizard keeps entered data when an API call fails, prevents duplicate submissions, and displays inline context plus the existing toast feedback.

## Workout Studio Design

### Desktop and wide desktop

The workspace uses three regions:

- Exercise palette: approximately `17rem–18rem`.
- Timeline canvas: flexible and always the dominant region.
- Inspector: approximately `18rem–20rem`.

The sticky header contains back navigation, template identity, dirty/saved status, and save action. Week and day navigation sits directly above the timeline to reduce eye travel. Palette and inspector may be sticky within the available viewport but must not clip their contents.

### Tablet

The timeline remains primary. Palette and inspector open as controlled side panels or drawers around it. Closing a panel never clears the selected exercise or draft state.

### Mobile

The workspace uses three explicit views: “Lịch tập”, “Bài tập”, and “Thuộc tính”. This avoids stacking all desktop columns into one long page. Switching views preserves active week, active day, selected exercise, unscheduled exercises, and unsaved changes.

Drag, drop, resize, move, and update behavior remains unchanged. Touch-accessible placement controls remain available when direct dragging is impractical.

## Responsive Contract

- Mobile: below `640px`.
- Tablet: `640px–1023px`.
- Desktop: `1024px` and above.
- Wide desktop: `1280px` and above, used only to expand the Studio workspace.

The implementation should retain one semantic DOM structure wherever practical. CSS changes the layout at breakpoints instead of duplicating desktop and mobile content.

All interactive targets are at least `44px` on touch layouts. Mobile modals become bottom sheets or full-height sheets and respect safe-area insets. Filters may wrap, scroll, or collapse without losing their values.

## Interaction and Accessibility

- Every control has a visible `focus-visible` state.
- Hover is supplemental; actions remain available to touch and keyboard users.
- Buttons include pressed, disabled, loading, and reduced-motion behavior.
- Active tabs and selected schedule items expose semantic state with `aria-current`, `aria-selected`, or `aria-pressed` where appropriate.
- Modal focus management, Escape handling, backdrop behavior, and accessible titles continue to use the established UI primitives.
- Meaningful icons have accessible names through surrounding text or labels; decorative icons are hidden from assistive technology.
- Motion uses opacity and transform and is disabled or reduced under `prefers-reduced-motion`.

## Loading, Empty, and Error States

- Initial loading uses skeletons matching the final card or workspace shape.
- “No data yet” and “no results for current filters” are separate empty states with different recovery actions.
- Field validation appears beside the relevant field.
- API failures preserve form and selection state and use the existing toast system.
- Save and generation actions prevent duplicate requests and expose an in-progress label.
- Studio dirty state remains visible until the existing save operation succeeds.

## Data Flow and Boundaries

Pages continue to own routing state, API orchestration, loading, and error handling. Feature components continue to receive domain data and callbacks through props. Service and type layers remain unchanged unless a presentation-only type is required for CSS custom properties or view-state labels.

The redesign does not move business calculations into components or CSS. It does not introduce new endpoints, role mappings, persistence behavior, or dependencies.

## Migration Strategy

Implementation is split into independently testable vertical slices:

1. Add the shared `module-*` foundation and a static-style contract test.
2. Redesign Exercise Library and its form.
3. Redesign the workout-template list, cards, customer-plan surfaces, and AI wizard.
4. Redesign Studio header and week/day navigation.
5. Redesign Studio palette and unscheduled exercise surfaces.
6. Redesign Studio timeline and dynamic CSS-variable contract.
7. Redesign Studio inspector and responsive tablet/mobile navigation.
8. Remove only orphaned legacy selectors after proving they have no consumers.
9. Run focused tests after every slice, followed by the full test suite and production build.

Existing selectors are removed only after `rg` confirms that no active TSX consumer remains. InBody, Progress, portal, and unrelated legacy CSS are preserved.

## Testing Strategy

### Contract tests

Add a focused frontend test that scans the in-scope files and fails when it finds:

- Tailwind presentation utilities in `className` values.
- Static `style={{ ... }}` usage.
- Unapproved domain class prefixes.

The test explicitly allows only the typed CSS custom properties used for dynamic timeline coordinates.

### Component and interaction tests

Retain and update existing tests for:

- Search, filters, reset, permissions, edit, delete, and pagination in Exercise Library.
- Template filtering, card actions, AI wizard steps, failure recovery, and draft handoff.
- Week/day switching, placement, selection, resize, unscheduled items, inspector editing, dirty state, and save behavior in Studio.
- Keyboard-accessible tabs, modal close behavior, and visible semantic labels.

Tests should assert behavior and accessibility rather than exact color or pixel values. CSS contract tests may assert class families and the absence of forbidden styling mechanisms.

### Verification

Each migration slice runs its focused Vitest files and TypeScript typecheck. Final verification runs:

- `npm test`
- `npm run build`
- `git diff --check`
- Targeted `rg` checks for Tailwind utilities, static inline styles, and orphaned selectors.

## Success Criteria

- Exercise Library, Workout Plans, and Workout Studio present one consistent Clinical Performance system across mobile, tablet, desktop, and wide desktop.
- All existing workflows, URLs, API contracts, permissions, and persistence behavior still work.
- Static presentation in scope comes exclusively from semantic classes in `frontend/src/index.css`.
- Only data-dependent timeline CSS custom properties remain inline.
- Loading, empty, filtered-empty, error, disabled, focus, pressed, and reduced-motion states are covered.
- Focused tests, the full test suite, production build, and diff checks pass.

