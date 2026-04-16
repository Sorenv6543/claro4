# VAvatar
Source: packages/vuetify/src/components/VAvatar/VAvatar.tsx

Circular or rounded container for images, icons, or initials. Commonly used in lists, chips, and cards.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| size | "x-small" \| "small" \| "default" \| "large" \| "x-large" \| number | Width/height via `useSize` | -- |
| rounded | boolean \| string \| number | Border radius via `useRounded`; default is circle | -- |
| variant | "flat" \| "text" \| "elevated" \| "tonal" \| "outlined" \| "plain" | Background treatment (default: "flat") | -- |
| color | string | Background color | -- |
| density | "default" \| "comfortable" \| "compact" | Size reduction via density multiplier | -- |
| border | boolean \| string | Border via `useBorder` | -- |
| image | string (src) | Renders VImg as avatar content | -- |
| icon | IconValue | Renders VIcon as avatar content | -- |
| text | string | Text/initials displayed in avatar | -- |
| start | boolean | Adds margin-inline-end (8px) for left-side placement | -- |
| end | boolean | Adds margin-inline-start (8px) for right-side placement | -- |
| badge | boolean \| object (VBadge props) | Wraps avatar in VBadge; dot by default, or pass props | -- |

## Slot Anatomy
- **default**: Custom avatar content (replaces image/icon/text); receives VDefaultsProvider for VImg and VIcon
- **badge**: Custom VBadge content when `badge` prop is used

## Composable Hooks
- **useVariant**: Color classes/styles + variant classes
- **useDensity**: Size density modifier
- **useSize**: Size classes and inline styles
- **useRounded**: Border radius classes
- **useBorder**: Border classes
- **provideTheme**: Theme propagation

## SASS Hooks
- `$avatar-height` / `$avatar-width`: 40px -- default size
- `$avatar-border-radius`: from settings.$rounded (0 = circle by default mapping)
- `$avatar-rounded-border-radius`: settings.$border-radius-root (when --rounded)
- `$avatar-line-height`: normal
- `$avatar-vertical-align`: middle
- `$avatar-margin-start` / `$avatar-margin-end`: 8px (for start/end positioning)
- `$avatar-density`: (default: 0, comfortable: -1, compact: -2)
- `.v-avatar .v-img`: 100% width/height (image fills container)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| User photo circle | `<VAvatar image="url" />` |
| Initials avatar | `<VAvatar color="primary">JD</VAvatar>` or `text="JD"` |
| Icon avatar | `<VAvatar icon="mdi-account" />` |
| Small avatar in list | `size="small"` or parent density |
| Avatar with status dot | `<VAvatar image="url" badge />` or `:badge="{ color: 'success' }"` |
| Square avatar | `rounded="0"` or `rounded="sm"` |
| Large profile avatar | `size="x-large"` or `:size="80"` |
| Avatar in chip | VChip `prepend-avatar="url"` (auto-sized) |
