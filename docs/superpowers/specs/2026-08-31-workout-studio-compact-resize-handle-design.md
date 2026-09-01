# Workout Studio Compact Resize Handle Design

## Goal

Prevent the horizontal resize indicator from overlapping text inside a 15-minute Workout Studio timeline card while preserving resize interaction.

## Root Cause

A 15-minute card is approximately 20px high. Its resize handle keeps a 12px interaction area and draws a 2px horizontal indicator near the bottom. The visible indicator occupies the same limited vertical space as the single-line compact content, so it can cross the text.

## Selected Approach

Keep the existing `.studio-resize-handle` element active for pointer-based resizing, but hide only its `::after` indicator when its parent card has `.is-compact`.

The change is a narrowly scoped semantic CSS rule:

```css
.studio-scheduled-item.is-compact .studio-resize-handle::after {
  display: none;
}
```

No JSX, scheduling logic, card geometry, or resize event handling changes are required.

## Alternatives Rejected

- Moving the indicator outside the compact card risks clipping and creates new overlap behavior at adjacent timeline slots.
- Hiding the entire resize handle would remove the pointer target and disable resizing from 15 minutes.

## Testing

- Add a CSS contract regression assertion proving compact scheduled cards hide the resize indicator.
- Run that assertion before implementation and confirm it fails for the missing rule.
- Apply the CSS rule and confirm the focused test passes.
- Run the relevant frontend regression suite and production build before committing the implementation.

## Acceptance Criteria

- A 15-minute timeline card no longer displays the horizontal resize indicator.
- The exercise name and duration remain unobstructed.
- The invisible resize area remains interactive.
- Cards longer than 15 minutes continue to display their resize indicator.
- Unrelated local changes remain untouched and uncommitted.
