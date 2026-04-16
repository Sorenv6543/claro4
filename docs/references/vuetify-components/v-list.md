# VList
Source: packages/vuetify/src/components/VList/VList.tsx

Container for VListItem, VListGroup, VListSubheader. Handles selection, activation, keyboard navigation, and nesting.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| bgColor | string (color) | Sets background via `useBackgroundColor` | transparent |
| rounded | boolean \| string | Border radius via `useRounded` | true |
| density | "default" \| "comfortable" \| "compact" | Adjusts min-height of items; density modifier -1/-2 | -- |
| elevation | number (0-24) | Box shadow | -- |
| border | boolean \| string | Border via `useBorder` | -- |
| variant | "text" \| "flat" \| "elevated" \| "tonal" \| "outlined" \| "plain" | Visual variant for list items (default: "text") | -- |
| lines | "one" \| "two" \| "three" \| false | Controls line clamping; adds `v-list--{x}-line` class | -- |
| nav | boolean | Adds `v-list--nav`; extra padding, margin between items | -- |
| slim | boolean | Adds `v-list--slim`; reduces prepend/append spacing | -- |
| disabled | boolean | Disables all items; pointer-events: none | -- |
| color | string | Active item color | -- |
| baseColor | string | Inactive item color | -- |

## Slot Anatomy
- **default**: Direct children (VListItem, VListGroup, VListSubheader)
- **header**: Slot for VListChildren header rendering
- **item**: Custom item renderer (receives `{props}` for each item)
- **divider / subheader**: Separator/group header slots

## Composable Hooks
- **useNested**: Selection, activation, open/close for nested groups
- **useDensity**: Density classes
- **useBackgroundColor**: Background color classes/styles
- **useElevation**: Elevation classes
- **useRounded**: Rounded classes
- **useBorder**: Border classes
- **provideTheme**: Theme propagation
- **provideDefaults**: Provides density, color, variant, lines, nav, slim to child VListItems

## SASS Hooks
- `$list-padding`: 8px 0 -- vertical padding
- `$list-nav-padding`: 8px -- nav mode inline padding
- `$list-border-radius`: 0 -- default border radius
- `$list-rounded-border-radius`: from settings.$rounded map
- `$list-background`: rgba(var(--v-theme-surface))
- `$list-color`: theme on-surface with high-emphasis opacity
- `$list-density`: map (default: 0, comfortable: -1, compact: -2)
- `$list-indent-size`: 16px -- nested group indent
- `--v-list-indent`: CSS var for custom indent override

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Navigation sidebar | `nav` prop on VList |
| Transparent list over card | `bg-color="transparent"` (Claro4 default) |
| Dense settings list | `density="compact"` |
| Rounded list items | `rounded` (Claro4 default: true) |
| Two-line item list | `lines="two"` |
| Nested expandable groups | VListGroup inside VList |
| Slim icon list | `slim` prop |
