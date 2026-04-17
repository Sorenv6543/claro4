# VCard
Source: packages/vuetify/src/components/VCard/VCard.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| variant | `elevated`, `flat`, `tonal`, `outlined`, `text`, `plain` | Controls background, border, and elevation via variant classes | — |
| color | Any theme color string | Sets card background/text color | — |
| elevation | `0`-`24` | Box-shadow depth (default elevated=1, hover=3) | 0 |
| rounded | `boolean`, `string` (`0`, `xs`, `sm`, `lg`, `xl`, `pill`, `circle`) | Border-radius on card | true |
| border | `boolean`, `string` | Adds border via border composable | — |
| density | `default`, `comfortable`, `compact` | Adjusts line-height of title/subtitle/text children | — |
| flat | boolean | Removes box-shadow (`.v-card--flat`) | — |
| hover | boolean | Adds hover elevation transition (1 -> 3 on hover) with cursor pointer | — |
| image | string (URL) | Renders VImg as absolute background in `.v-card__image` | — |
| title | `string`, `number`, `boolean` | Renders VCardTitle inside VCardItem | — |
| subtitle | `string`, `number`, `boolean` | Renders VCardSubtitle inside VCardItem | — |
| text | `string`, `number`, `boolean` | Renders VCardText section | — |
| prependIcon | IconValue | Renders icon in VCardItem prepend area | — |
| appendIcon | IconValue | Renders icon in VCardItem append area | — |
| prependAvatar | string (URL) | Renders VAvatar in VCardItem prepend area | — |
| appendAvatar | string (URL) | Renders VAvatar in VCardItem append area | — |
| loading | `boolean`, `string` | Shows linear progress bar at top of card | — |
| disabled | boolean | Reduces opacity (0.6), disables pointer events | — |
| ripple | `boolean`, `object` | Ripple effect when card is clickable | — |

## Slot Anatomy
- **default**: Main content area, rendered after VCardText and before VCardActions
- **title**: Custom title content inside VCardItem > VCardTitle
- **subtitle**: Custom subtitle content inside VCardItem > VCardSubtitle
- **text**: Custom text content inside VCardText
- **prepend**: Custom prepend area inside VCardItem (replaces prependIcon/prependAvatar)
- **append**: Custom append area inside VCardItem (replaces appendIcon/appendAvatar)
- **image**: Custom background image layer in `.v-card__image`
- **item**: Replaces default content of VCardItem
- **actions**: Content inside VCardActions (auto-wraps in VCardActions)
- **loader**: Custom loader replacing default progress bar

## Composable Hooks
- **useVariant**: Background/text color and variant class
- **useDensity**: Density class for child line-height adjustments
- **useElevation**: Box-shadow class
- **useRounded**: Border-radius class
- **useBorder**: Border class
- **useLoader**: Loading state management
- **useLocation**: Position offset styles
- **usePosition**: Absolute/fixed position class
- **useDimension**: Width/height/min-width/max-width styles
- **provideTheme**: Theme provision for children
- **useLink**: Router link support (renders `<a>` when linked)

## SASS Hooks
- `$card-border-radius`: Base border-radius (settings.$border-radius-root)
- `$card-elevation`: Default elevation (1)
- `$card-hover-elevation`: Hover elevation (3)
- `$card-padding`: Card padding (0 - children provide their own padding)
- `$card-disabled-opacity`: Disabled opacity (0.6)
- `$card-plain-opacity`: Plain variant opacity (0.62)
- `$card-transition-property`: Animated properties (box-shadow, opacity, background)
- `$card-transition-duration`: Transition speed (0.28s)
- `$card-item-padding`: VCardItem padding (0.625rem 1rem)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Basic card with title + body | `<v-card title="..." text="..." />` |
| Card with no shadow | `elevation="0"` or `flat` (Claro4 default elevation=0) |
| Outlined card | `variant="outlined"` |
| Card with header icon + title | `prepend-icon="mdi-icon" title="..."` |
| Card with avatar header | `prepend-avatar="/img.jpg" title="..." subtitle="..."` |
| Card with background image | `image="/photo.jpg"` with content in default slot |
| Card with action buttons | Use `actions` slot or nest `<v-card-actions>` |
| Clickable/linked card | `href="/path"` or `to="/route"` |
| Card with hover shadow | `hover` prop |
| Loading card | `loading` prop or `loading="primary"` |
