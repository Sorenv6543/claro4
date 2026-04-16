# VIcon
Source: packages/vuetify/src/components/VIcon/VIcon.tsx

Renders an icon from the configured icon set (mdi, fa, etc.). Supports sizing, coloring, and start/end margin utilities.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| icon | IconValue | The icon identifier (e.g., "mdi-home") | -- |
| size | "x-small" \| "small" \| "default" \| "large" \| "x-large" \| number | Font-size/width/height via `useSize` or inline styles | -- |
| color | string | Text color via `useTextColor` | -- |
| opacity | string \| number | Sets `--v-icon-opacity` CSS var | -- |
| disabled | boolean | Opacity 0.38; pointer-events: none | -- |
| start | boolean | Adds margin-inline-end (8px) | -- |
| end | boolean | Adds margin-inline-start (8px) | -- |
| tag | string | HTML element tag (default: "i") | -- |

## Slot Anatomy
- **default**: Text content parsed as icon name (alternative to `icon` prop)

## Composable Hooks
- **useIcon**: Resolves icon value to component + icon data
- **useSize**: Size classes (x-small through x-large)
- **useTextColor**: Color classes/styles
- **useTheme**: Theme classes

## SASS Hooks
- `$icon-size`: 1em -- base size (scales with parent font-size)
- `$icon-sizes`: map (x-small: 1em, small: 1.25em, default: 1.5em, large: 1.75em, x-large: 2em)
- `$icon-disabled-opacity`: 0.38
- `$icon-margin-start` / `$icon-margin-end`: 8px (for start/end)
- `$icon-letter-spacing`: normal
- `$icon-line-height`: 1
- `$icon-vertical-align`: middle
- `--v-icon-size-multiplier`: 1 (overridden by parent components like VChip)
- `--v-icon-opacity`: Custom opacity CSS var

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Standard icon | `<VIcon icon="mdi-home" />` |
| Colored icon | `<VIcon icon="mdi-star" color="warning" />` |
| Small icon | `size="small"` or `size="x-small"` |
| Large decorative icon | `size="x-large"` or `:size="48"` |
| Icon button | Wrap in `<VBtn icon>` or use VBtn `icon` prop |
| Clickable icon | Add `@click` handler (auto-adds `role="button"` + cursor) |
| Semi-transparent icon | `opacity="0.5"` |
| Leading icon in input | `start` prop for correct margin |
| Trailing icon in input | `end` prop for correct margin |
