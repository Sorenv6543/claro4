# VScaleTransition
Source: packages/vuetify/src/components/transitions/index.ts (createCssTransition)

CSS class: `scale-transition`

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| disabled | boolean | Disables transition entirely | -- |
| group | boolean | Uses `<TransitionGroup>` instead of `<Transition>` | -- |
| hideOnLeave | boolean | Sets `display: none !important` on leaving element | -- |
| leaveAbsolute | boolean | Makes leaving element `position: absolute` | -- |
| mode | `in-out` `out-in` `default` | Vue transition mode | -- |
| origin | string | Sets `transform-origin` on entering element | -- |

## CSS Classes
```
.scale-transition-enter-active  { transition-property: transform, opacity; duration: 250ms }
.scale-transition-leave-active  { transition-property: transform, opacity; duration: 100ms }
.scale-transition-enter-from    { opacity: 0; transform: scale(0) }
.scale-transition-leave-to      { opacity: 0 }
```

Note: Leave animation is shorter (100ms) and only fades opacity (no scale-down).

## SASS Hooks
- Enter duration: `settings.$transition-duration-root` (250ms)
- Leave duration: 100ms (via `fade-out` mixin)
- Easing: `settings.$standard-easing`
- Enter transform: `scale(0)` to `scale(1)`
- Respects `prefers-reduced-motion: no-preference`

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Pop-in element | `<v-scale-transition><div v-if="show">...</div></v-scale-transition>` |
| FAB or tooltip appear | Scale transition with `origin="center center"` |
| Badge/chip appear | Combine with `mode="out-in"` |
| Scale from corner | Set `origin="top left"` (or any transform-origin) |
