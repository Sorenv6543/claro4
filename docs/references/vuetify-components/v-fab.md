# VFab
Source: packages/vuetify/src/components/VFab/VFab.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| color | Any theme color string | Passed to inner VBtn for background/text color | — |
| variant | `elevated`, `flat`, `tonal`, `outlined`, `text`, `plain` | Passed to inner VBtn; elevated gets special FAB elevation (3/4) | — |
| size | `x-small`, `small`, `default`, `large`, `x-large` | Controls VBtn size; FAB default height is 56px | — |
| icon | `boolean`, `string`, `IconValue` | Passed to inner VBtn for icon-only circular FAB | — |
| elevation | `0`-`24` | Passed to inner VBtn; FAB default elevated=3, hover=4 | — |
| rounded | `boolean`, `string` | Passed to inner VBtn for border-radius | — |
| extended | boolean | Makes FAB pill-shaped (`border-radius: 9999px`) for text+icon | — |
| location | `"top start"`, `"bottom end"`, etc. | Positions FAB when `app` or `absolute` is set; parsed as `{vertical} {horizontal}` | — |
| app | boolean | Makes FAB fixed-position in layout system with 12px margin | — |
| absolute | boolean | Positions FAB absolutely within parent | — |
| offset | boolean | Translates FAB 50% to straddle container edge | — |
| appear | boolean | Enables enter transition on mount | — |
| transition | string | Transition name (default: `fab-transition`) | — |
| modelValue | boolean | Controls visibility (default: true) | — |

Note: VFab inherits all VBtn props except `location` and `spaced` (which are overridden/omitted).

## Slot Anatomy
- **default**: Passed through to inner VBtn default slot
- **prepend**: Passed through to inner VBtn prepend slot
- **append**: Passed through to inner VBtn append slot

## Composable Hooks
- **useLayoutItem**: Integrates with Vuetify layout system when `app=true`
- **useResizeObserver**: Tracks FAB element height for layout calculations
- **useProxiedModel**: Two-way binding for `modelValue` (show/hide)
- **MaybeTransition**: Wraps VBtn in transition for show/hide animation

## SASS Hooks
- `$fab-height`: Default FAB height (56px)
- `$fab-elevation`: Elevated variant shadow (3)
- `$fab-hover-elevation`: Hover shadow (4)
- `$fab-border-radius`: Border-radius (circle)
- `$fab-transition-duration`: Show/hide transition duration (0.2s)
- `$fab-transition-timing-function`: Easing function (standard-easing)
- `$fab-size-scales`: Size multipliers (x-small: -2, small: -1, default: 0, large: 2, x-large: 5)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Circular FAB bottom-right | `<v-fab icon="mdi-plus" location="bottom end" app />` |
| Extended FAB with text | `<v-fab extended icon="mdi-plus" text="Create" location="bottom end" app />` |
| Mini/small FAB | `size="small"` |
| FAB overlapping card edge | `absolute offset location="top end"` |
| FAB that hides on scroll | Bind `model-value` to scroll watcher |
| Non-elevated FAB | `variant="flat"` or `variant="tonal"` |
| Fixed FAB in app layout | `app` prop (uses layout system, fixed position with 12px margin) |
