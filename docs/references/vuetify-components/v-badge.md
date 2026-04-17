# VBadge
Source: packages/vuetify/src/components/VBadge/VBadge.tsx

Overlay indicator on another element. Shows count, icon, or dot. Positioned absolutely relative to wrapped content.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| rounded | boolean \| string \| number | Border radius via `useRounded` | pill |
| color | string | Badge background color via `useBackgroundColor` | -- |
| textColor | string | Badge text color via `useTextColor` | -- |
| content | number \| string | Text/number displayed in badge | -- |
| max | number \| string | Max value; shows "{max}+" when exceeded | -- |
| icon | IconValue | Icon inside badge (replaces content text) | -- |
| dot | boolean | Small dot indicator; no content | -- |
| dotSize | number \| string | Custom dot dimensions (default: 8-9px) | -- |
| bordered | boolean | Adds outline border via `::after` pseudo-element | -- |
| floating | boolean | Adjusts offset to overlap wrapped element edge | -- |
| inline | boolean | Badge flows inline instead of absolute positioning | -- |
| location | string | Position anchor (default: "top end") | -- |
| offsetX | number \| string | Horizontal offset adjustment | -- |
| offsetY | number \| string | Vertical offset adjustment | -- |
| modelValue | boolean | Show/hide badge (default: true) | -- |
| transition | string | Enter/leave transition (default: "scale-rotate-transition") | -- |
| width | string \| number | Custom badge width via `useDimension` | -- |
| height | string \| number | Custom badge height via `useDimension` | -- |

## Slot Anatomy
- **default**: The wrapped element that the badge overlays
- **badge**: Custom badge content (replaces icon/content/dot)

## Composable Hooks
- **useBackgroundColor**: Badge background color
- **useTextColor**: Badge text color
- **useRounded**: Border radius classes
- **useLocation**: Absolute positioning (top/bottom/start/end) with offset calculation
- **useDimension**: Width/height styles
- **useTheme**: Theme classes
- **MaybeTransition**: Show/hide animation

## SASS Hooks
- `$badge-border-radius`: 10px
- `$badge-height`: 1.25rem (20px)
- `$badge-min-width`: 20px
- `$badge-font-size`: 0.75rem
- `$badge-font-weight`: 500
- `$badge-padding`: 4px 6px
- `$badge-icon-padding`: 4px 6px (when containing VIcon)
- `$badge-dot-height` / `$badge-dot-width`: 9px
- `$badge-dot-border-radius`: 50%
- `$badge-border-color`: rgb(var(--v-theme-background))
- `$badge-border-width`: 2px
- `$badge-transition`: 0.225s standard easing
- `$badge-wrapper-margin`: 0 4px (inline mode)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Notification count on icon | `<VBadge :content="3" color="error"><VIcon>` |
| Dot indicator (online status) | `<VBadge dot color="success"><VAvatar>` |
| Badge on avatar | `<VBadge><VAvatar>` or VAvatar `badge` prop |
| Max count "99+" | `:content="150" :max="99"` |
| Inline badge next to text | `inline` prop |
| Custom position | `location="bottom end"` + `offset-x` / `offset-y` |
| Icon badge | `:icon="mdi-check"` instead of content |
| Bordered badge | `bordered` for outline ring effect |
