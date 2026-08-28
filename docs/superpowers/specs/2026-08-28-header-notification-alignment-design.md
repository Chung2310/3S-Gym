# Header Notification Alignment Design

## Goal

Place the notification button at the far-right side of the portal header, directly beside the signed-in user's information.

## Design

- Group `NotificationBell` and `.portal-header-user` in one right-aligned header-actions container.
- Apply `margin-left: auto` to that container instead of the user-information block.
- Keep an 8px gap between the notification button and user information.
- Preserve the existing notification dropdown alignment relative to its button.
- Keep the breadcrumb flexible and truncated so long page labels do not push the right-side actions out of the header.
- On mobile, retain the same ordering and prevent the actions group from shrinking.

## Scope

Only the portal header composition and its layout styling change. Notification loading, unread state, dropdown behavior, navigation, and API calls remain unchanged.

## Verification

- Run the focused `AppShell` and notification tests.
- Run frontend type checking.
- Confirm the notification button precedes and sits adjacent to the user-information block in the rendered header structure.
