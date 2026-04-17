# VBtn
Source: packages/vuetify/src/components/VBtn/VBtn.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| variant | `elevated`, `flat`, `tonal`, `outlined`, `text`, `plain` | Controls background, border, and elevation via `.v-btn--variant-*` classes | flat |
| color | Any theme color string | Sets `background-color` (elevated/flat/tonal) or `color` (outlined/text/plain) | — |
| baseColor | Any theme color string | Fallback color when not active | — |
| activeColor | Any theme color string | Color applied when `active` is true | — |
| density | `default`, `comfortable`, `compact` | Adjusts height: default=0, comfortable=-2, compact=-3 spacer offsets | — |
| size | `x-small`, `small`, `default`, `large`, `x-large` | Sets `--v-btn-height` and `font-size` via size scale mixins | — |
| elevation | `0`-`24` | Applies `box-shadow` via `.elevation-N` class | 1 |
| rounded | `boolean`, `string` (`0`, `xs`, `sm`, `lg`, `xl`, `pill`, `circle`) | Sets `border-radius`; `true` maps to `xl` | true |
| flat | boolean | Removes box-shadow entirely (`.v-btn--flat`) | — |
| block | boolean | Makes button full-width (`display: flex; min-width: 100%`) | — |
| icon | `boolean`, `string`, `IconValue` | Circle button with icon only; sets `border-radius: 50%`, removes padding | — |
| stacked | boolean | Vertical layout (`flex-direction: column`), taller height (72px default) | — |
| slim | boolean | Reduces padding to `0 8px` | — |
| border | `boolean`, `string` | Adds border via border composable | — |
| prependIcon | IconValue | Renders icon in `.v-btn__prepend` before content | — |
| appendIcon | IconValue | Renders icon in `.v-btn__append` after content | — |
| ripple | `boolean`, `object` | Controls Material ripple effect on click | — |

## Slot Anatomy
- **default**: Main button label content inside `.v-btn__content`
- **prepend**: Custom content before label in `.v-btn__prepend` (replaces `prependIcon`)
- **append**: Custom content after label in `.v-btn__append` (replaces `appendIcon`)
- **loader**: Custom loading indicator inside `.v-btn__loader` (replaces default VProgressCircular)

## Composable Hooks
- **useVariant**: Generates color classes/styles and variant classes (elevated/flat/tonal/outlined/text/plain)
- **useDensity**: Applies density class affecting computed height
- **useSize**: Generates `--v-btn-size` and `--v-btn-height` CSS custom properties
- **useElevation**: Applies `.elevation-N` class for box-shadow
- **useRounded**: Applies border-radius classes
- **useBorder**: Applies border width/style/color
- **useLoader**: Manages loading overlay state
- **useLocation**: Applies position offset styles (top, left, etc.)
- **usePosition**: Applies `position: absolute|fixed` class
- **provideTheme**: Provides/injects theme for color resolution
- **useGroupItem**: Integrates with VBtnToggle group selection
- **useLink**: Router link integration (renders `<a>` tag when link)

## SASS Hooks
- `$button-height`: Base height (default: 36px)
- `$button-border-radius`: Base border-radius (settings.$border-radius-root)
- `$button-icon-border-radius`: Icon mode border-radius (circle)
- `$button-rounded-border-radius`: Rounded mode radius (xl)
- `$button-font-weight`: Font weight (from typography label-large)
- `$button-text-transform`: Text transform (default: none)
- `$button-text-letter-spacing`: Letter spacing (from typography label-large)
- `$button-elevation`: Map with default/hover/active values (1/2/1)
- `$button-density`: Height offsets per density (default: 0, comfortable: -2, compact: -3)
- `$button-slim-padding`: Padding for slim mode (0 8px)
- `$button-disabled-opacity`: Disabled state opacity (0.26)
- `$button-plain-opacity`: Plain variant opacity (0.62)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Filled/solid button | `variant="flat"` with `color` (Claro4 default) |
| Outlined button | `variant="outlined"` with `color` |
| Ghost/text-only button | `variant="text"` |
| Icon-only circle button | `icon="mdi-icon-name"` |
| Button with left icon + text | `prepend-icon="mdi-icon-name"` |
| Button with right icon + text | `append-icon="mdi-icon-name"` |
| Full-width button | `block` prop |
| Small/large button | `size="small"` or `size="large"` |
| Pill-shaped button | `rounded="pill"` |
| Compact dense button | `density="compact"` |
| Loading state | `loading` prop (shows circular progress) |
| Elevated with shadow | `variant="elevated"` or `elevation="2"` |
