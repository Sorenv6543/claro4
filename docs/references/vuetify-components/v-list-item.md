# VListItem
Source: packages/vuetify/src/components/VList/VListItem.tsx

Individual list row. Supports prepend/append icons/avatars, title, subtitle, routing, selection, and ripple.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| rounded | boolean \| string | Border radius; auto-applied when `nav` is true | true |
| density | "default" \| "comfortable" \| "compact" | Min-height adjustment (-1px per step) | -- |
| variant | "text" \| "flat" \| "elevated" \| "tonal" \| "outlined" \| "plain" | Background/color treatment (default: "text") | -- |
| color | string | Color when active | -- |
| baseColor | string | Color when inactive | -- |
| elevation | number (0-24) | Box shadow via `useElevation` | -- |
| border | boolean \| string | Border via `useBorder` | -- |
| lines | "one" \| "two" \| "three" \| false | Controls subtitle line clamping and min-height | -- |
| nav | boolean | Applies nav styling; auto-rounds corners | -- |
| slim | boolean | Reduces prepend/append spacer widths | -- |
| prependIcon | IconValue | Icon in prepend slot | -- |
| appendIcon | IconValue | Icon in append slot | -- |
| prependAvatar | string (src) | Avatar image in prepend slot | -- |
| appendAvatar | string (src) | Avatar image in append slot | -- |
| title | string | Primary text in VListItemTitle | -- |
| subtitle | string | Secondary text in VListItemSubtitle | -- |
| active | boolean | Force active state; applies color + overlay | -- |
| disabled | boolean | Disabled state; pointer-events: none; opacity 0.6 | -- |
| ripple | boolean \| object | Ripple effect on click (default: true) | -- |

## Slot Anatomy
- **prepend**: Before content (icon/avatar area); receives `{isActive, isSelected, ...}`
- **title**: Primary text; receives `{title}`
- **subtitle**: Secondary text; receives `{subtitle}`
- **default**: Below title/subtitle inside `.v-list-item__content`
- **append**: After content (icon/avatar area); receives `{isActive, isSelected, ...}`

## Composable Hooks
- **useVariant**: Color/variant classes and styles
- **useDensity**: Density modifier classes
- **useRounded**: Rounded classes
- **useElevation**: Elevation classes
- **useBorder**: Border classes
- **useLink**: Router link integration
- **useNestedItem**: Selection/activation state from parent VList
- **provideTheme**: Theme propagation

## SASS Hooks
- `$list-item-min-height`: 40px -- base min-height
- `$list-item-padding`: 4px 16px
- `$list-item-one-line-min-height`: 48px
- `$list-item-two-line-min-height`: 64px
- `$list-item-three-line-min-height`: 88px
- `$list-item-icon-margin-start`: 32px -- gap after prepend icon
- `$list-item-avatar-margin-start`: 16px -- gap after prepend avatar
- `$list-item-icon-opacity`: var(--v-medium-emphasis-opacity)
- `$list-item-icon-active-opacity`: 1
- `$list-item-rounded-border-radius`: from settings.$rounded
- `--v-list-prepend-gap`: CSS var; override prepend/append spacer width

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Icon + label row | `prepend-icon="mdi-cog" title="Settings"` |
| Avatar + two lines | `prepend-avatar="url" title="Name" subtitle="Detail" lines="two"` |
| Active/selected highlight | `active` prop or parent VList selection |
| Clickable navigation item | `to="/path"` or `href` (renders `<a>`) |
| Custom right-side action | `#append` slot with VBtn/VIcon |
| Dense row | `density="compact"` |
