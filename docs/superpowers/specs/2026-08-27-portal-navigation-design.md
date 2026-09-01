# Portal navigation design

## Goal

Make portal navigation visible, understandable, and consistent after login for ADMIN, PT, and CUSTOMER users. The sidebar must communicate the current location, the header must provide route context, and invalid portal URLs must produce a useful recovery screen.

## Architecture

Create one typed navigation configuration as the source of truth for sidebar entries and route metadata. Each entry defines its path, label, icon, role access, optional feature flag, section, and matching behavior. `AppShell` consumes the configuration to render the filtered sidebar and derive the active item. A breadcrumb component consumes the same route metadata, preventing sidebar labels and page titles from drifting apart.

Existing React Router route declarations and `FeatureRoute` authorization remain in place. This change does not migrate the application to data routers or change API behavior.

## Sidebar

The sidebar groups visible links under role-appropriate sections:

- `Tổng quan` for dashboard, notifications, and calendar destinations.
- `Vận hành` for customer, measurements, roadmaps, exercise, workout, progress, nutrition, and care workflows.
- `Tri thức & trợ lý` for knowledge and assistant tools.
- `Tài khoản` for the customer journey destination where applicable.

Every link has a Lucide icon, visible text, and an active style. Active matching is exact by default and may include nested child paths for entries explicitly marked as prefixes. Selecting a link closes the mobile drawer. Feature-disabled or role-inaccessible entries are not rendered.

## Header and breadcrumbs

The portal header displays a breadcrumb beginning with `Portal`, followed by the section and current navigation label. The final item is exposed as the page title context. User identity and role remain visible. On small screens, the menu control stays available and the breadcrumb truncates safely rather than overflowing.

## Invalid routes

Unknown URLs under `/portal/*` render an in-shell not-found state instead of silently redirecting. The state includes a clear Vietnamese message and a button linking to the role default:

- ADMIN: `/portal/admin`
- PT: `/portal/pt/customers`
- CUSTOMER: `/portal/me`

The `/portal` root continues redirecting to the role default.

## Accessibility

The active navigation link uses `aria-current="page"`. Navigation sections have readable labels. Mobile open and close controls retain accessible names. Breadcrumbs use a `nav` landmark with an accessible label, and the not-found recovery link has descriptive text.

## Testing

Component tests verify:

- Role and feature filtering.
- Active link styling and `aria-current` for exact and nested routes.
- Icon and section rendering.
- Breadcrumb output for representative ADMIN, PT, and CUSTOMER routes.
- Mobile drawer closes after link selection.
- `/portal` redirects by role while an unknown portal URL renders the not-found state and recovery destination.

The full frontend/backend suite, typecheck, lint, and production build must remain green.

## Scope

This work changes authenticated portal navigation only. It does not redesign the public navbar, change authentication, add new feature pages, alter backend routes, or introduce a new routing library.
