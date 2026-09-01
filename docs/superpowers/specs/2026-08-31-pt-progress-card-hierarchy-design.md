# PT Progress Card Hierarchy Design

## Goal

Reduce visual clutter on the PT progress screen by removing nested rounded cards and establishing a clearer information hierarchy.

## Scope

- Restyle the summary metrics at the top of the PT progress dashboard.
- Restyle the four overview values inside each customer card.
- Preserve all data, search behavior, responsive behavior, and actions.

## Design

### Summary metrics

The four dashboard metrics will sit inside one shared white surface with a single outer border and radius. Each metric becomes a flat segment rather than an independent rounded card. Subtle responsive dividers separate adjacent values: horizontal dividers on narrow screens and vertical/grid dividers where multiple columns fit.

Labels, icons, and values retain the existing typography and colors. More internal spacing will keep the content from touching dividers or neighboring values.

### Customer cards

Each customer remains represented by one primary card. The card header continues to show the customer name, phone number, and status.

The four values below the header will lose their individual backgrounds, borders, and rounded corners. They will form a flat two-column definition grid separated with subtle dividing lines. Additional vertical spacing will distinguish the header, information grid, and action area.

The “Xem tiến độ” and “Ghi nhận” actions remain unchanged in purpose and accessibility. Hover and focus behavior on the primary customer card and buttons remains intact.

## Responsive Behavior

- The summary surface uses two columns on small screens and four columns on wide screens.
- Customer information remains a two-column grid where space allows and collapses cleanly on very narrow widths.
- Dividers adapt to the grid so they do not create doubled borders or boxed-in cells.
- Touch targets retain their current minimum height.

## Data Flow and Error Handling

No data flow, API request, filtering logic, empty state, or error handling changes are required. `ProgressDashboard` continues to receive `CustomerProgressOverview[]` and invoke the existing `onView` and `onLogWorkout` callbacks.

## Testing

Update the focused `ProgressDashboard` component test to verify:

- Summary metrics share one labelled summary region instead of rendering as separate bordered cards.
- Customer overview values live in a labelled flat information group.
- Existing search, “Xem tiến độ”, and “Ghi nhận” interactions continue to work.

Run the focused component test and TypeScript typecheck after implementation.

## Out of Scope

- Changing progress calculations or displayed values.
- Changing modal content or progress detail tabs.
- Converting the customer list into a table.
- Redesigning unrelated PT screens.
