# VSlideXTransition
Source: packages/vuetify/src/components/transitions/index.ts (createCssTransition)

CSS class: `slide-x-transition`

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
.slide-x-transition-enter-active  { transition-property: transform, opacity; duration: 250ms }
.slide-x-transition-leave-active  { transition-property: transform, opacity; duration: 250ms }
.slide-x-transition-enter-from    { opacity: 0; transform: translateX(-15px) }
.slide-x-transition-leave-to      { opacity: 0; transform: translateX(-15px) }
```

## SASS Hooks
- Duration: `settings.$transition-duration-root` (250ms)
- Easing: `settings.$standard-easing`
- Transform: `translateX(-15px)` -- slides in from the left
- Respects `prefers-reduced-motion: no-preference`
- Also available: `VSlideXReverseTransition` (slides from right, `translateX(15px)`)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Slide in from left | `<v-slide-x-transition><div v-if="show">...</div></v-slide-x-transition>` |
| Slide in from right | Use `VSlideXReverseTransition` instead |
| Menu/dropdown appear | Combine with `mode="out-in"` |
| Slide list items | `group` prop with `:key` on children |
