# VDivider
Source: packages/vuetify/src/components/VDivider/VDivider.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| vertical | boolean | Switches from horizontal (border-top) to vertical (border-right) | -- |
| inset | boolean | Adds margin-inline-start: 72px (horizontal) or margin-top/bottom: 8px (vertical) | -- |
| color | color string | Divider line color | -- |
| opacity | number/string | Sets `--v-border-opacity` CSS variable | -- |
| thickness | number/string | Border width override | thin (~1px) |
| length | number/string | Explicit width (horizontal) or height (vertical) | -- |
| variant | `solid` `dotted` `dashed` `double` | `border-style` property | solid |
| gradient | boolean | Applies a fade-to-transparent mask on both ends | -- |
| contentOffset | number/string/array | Shifts content label position (margin + transform) | -- |

## Slot Anatomy
- **default**: When provided, divider splits into two lines with centered content label between them. Wraps in `.v-divider__wrapper` with `.v-divider__content`.

## Composable Hooks
- **useTextColor**: Line color from `color` prop
- **provideTheme**: Theme context

## SASS Hooks
- `$divider-border-style`: root border style
- `$divider-border-width`: thin 0 0 0 (horizontal top border)
- `$divider-vertical-border-width`: 0 thin 0 0 (vertical right border)
- `$divider-opacity`: var(--v-border-opacity)
- `$divider-flex`: 1 1 100%
- `$divider-inset-margin`: 72px
- `$divider-gradient-mask`: linear-gradient(90deg, transparent, #000, transparent)
- `$divider-content-padding`: 0 16px
- `$divider-margin`: 8px

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Simple horizontal line | `<v-divider />` |
| Vertical separator | `vertical` |
| Indented list divider | `inset` |
| Colored divider | `color="primary"` |
| Dashed line | `variant="dashed"` |
| Fading gradient line | `gradient` |
| Divider with "OR" label | `<v-divider>OR</v-divider>` |
| Thicker line | `thickness="2"` |
| Shorter divider | `length="200"` |
