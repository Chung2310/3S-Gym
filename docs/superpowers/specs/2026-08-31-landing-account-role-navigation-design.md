# Landing Account Role Navigation Design

## Goal

Allow a signed-in user to open the correct workspace by selecting the displayed account name in the landing-page navigation.

## Scope

- Update the account-name affordance in the landing navbar on desktop and mobile.
- Preserve the existing logout behavior and all other navbar links.
- Add focused component coverage for the new navigation behavior.

## Design

The displayed account name will be a React Router link to `/portal`. The landing navbar will not duplicate role-to-route mappings. `PortalRoutes` remains the single source of truth and redirects the portal root according to the authenticated user's role:

- `ADMIN` to `/admin`
- `PT` to `/pt/customers`
- `CUSTOMER` to `/me`

The logout control remains a separate button outside the account-name link so selecting it cannot also trigger workspace navigation.

Both desktop and mobile account-name links will expose an accessible name that identifies their destination. Styling will use Tailwind utilities for hover, focus-visible, and reduced-motion states in accordance with the frontend conventions.

## Data and Navigation Flow

1. `Navbar` reads the existing authenticated user from the stored session data.
2. The user selects their displayed account name.
3. React Router navigates to `/portal` without a full-page reload.
4. `PortalRoutes` reads the session and redirects to its existing role destination.

No new API calls, session fields, or role mappings are introduced.

## Error Handling

Authentication remains protected by the existing `ProtectedRoute` around `/portal/*`. Invalid or missing sessions follow the current protected-route behavior. Unknown roles remain outside this change because the existing session validation only accepts `ADMIN`, `PT`, and `CUSTOMER`.

## Testing

Add or extend navbar component tests to verify:

- A signed-in user's account name links to `/portal` on desktop.
- The same destination is available in the opened mobile menu.
- Activating logout removes session storage and returns to `/` without relying on the account link.
- Signed-out rendering continues to show the login link.

Run the focused navbar test and TypeScript typecheck after implementation.

## Out of Scope

- Changing role destinations.
- Adding a profile dropdown or account settings page.
- Redesigning the landing navbar.
- Altering authentication or authorization behavior.
