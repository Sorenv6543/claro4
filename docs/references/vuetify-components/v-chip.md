# VChip
Source: packages/vuetify/src/components/VChip/VChip.tsx

Compact element for tags, filters, and selections. Supports icons, avatars, close button, filter state, and size variants.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| rounded | boolean \| string \| number | Border radius via `useRounded` | pill |
| variant | "flat" \| "text" \| "elevated" \| "tonal" \| "outlined" \| "plain" | Background/color treatment (default: "tonal") | -- |
| color | string | Chip background/text color | -- |
| baseColor | string | Color when not selected in a group | -- |
| size | "x-small" \| "small" \| "default" \| "large" \| "x-large" | Font size + height + padding scaling | -- |
| density | "default" \| "comfortable" \| "compact" | Height adjustment via density multiplier | -- |
| elevation | number (0-24) | Box shadow | -- |
| border | boolean \| string | Border via `useBorder` | -- |
| label | boolean | Square corners via `v-chip--label` (uses `$chip-label-border-radius`) | -- |
| pill | boolean | Full avatar height; adds `v-chip--pill` class | -- |
| closable | boolean | Shows close button (`$delete` icon) | -- |
| closeIcon | IconValue | Custom close icon (default: "$delete") | -- |
| filter | boolean | Shows filter checkmark when selected in VChipGroup | -- |
| filterIcon | IconValue | Custom filter icon (default: "$complete") | -- |
| prependIcon | IconValue | Icon before content | -- |
| appendIcon | IconValue | Icon after content | -- |
| prependAvatar | string (src) | Avatar before content | -- |
| appendAvatar | string (src) | Avatar after content | -- |
| text | string | Chip label text | -- |
| disabled | boolean | Disabled state; opacity 0.3; pointer-events none | -- |
| draggable | boolean | HTML draggable attribute | -- |

## Slot Anatomy
- **default**: Chip label content (inside `.v-chip__content`)
- **prepend**: Before label (icon/avatar area)
- **append**: After label (icon/avatar area)
- **close**: Custom close button content
- **filter**: Custom filter checkmark content
- **label**: Chip label (alternative to default)

## Composable Hooks
- **useVariant**: Color classes/styles + variant classes
- **useDensity**: Height density modifier
- **useSize**: Size classes (x-small through x-large)
- **useRounded**: Border radius classes
- **useElevation**: Box shadow classes
- **useBorder**: Border classes
- **useGroupItem**: Integration with VChipGroup and VSlideGroup
- **useLink**: Router link support
- **provideTheme**: Theme propagation

## SASS Hooks
- `$chip-height`: 32px -- base height
- `$chip-border-radius`: from settings.$rounded "pill"
- `$chip-label-border-radius`: settings.$border-radius-root (square corners)
- `$chip-font-size`: from typography "label-large" size
- `$chip-font-weight`: 400
- `$chip-padding-ratio`: 2.667 -- padding = height / ratio
- `$chip-disabled-opacity`: 0.3
- `$chip-icon-size-multiplier`: calc(18/21)
- `$chip-density`: (default: 0, comfortable: -1, compact: -2)
- `--v-chip-size` / `--v-chip-height`: CSS vars set per size variant

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Rounded tag/label | Default (Claro4 rounded=pill) |
| Square-cornered chip | `label` prop |
| Dismissible chip | `closable` + listen `@click:close` |
| Avatar chip (user tag) | `prepend-avatar="url" pill` |
| Filter chip set | `<VChipGroup><VChip filter>` for each option |
| Small status indicator | `size="small" variant="tonal"` |
| Outlined chip | `variant="outlined"` |
| Icon-only chip | `prepend-icon="mdi-star"` with short text |
