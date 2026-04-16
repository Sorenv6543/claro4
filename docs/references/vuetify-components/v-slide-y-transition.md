# VSlideYTransition
Source: packages/vuetify/src/components/transitions/index.ts (createCssTransition)

CSS class: `slide-y-transition`

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
.slide-y-transition-enter-active  { transition-property: transform, opacity; duration: 250ms }
.slide-y-transition-leave-active  { transition-property: transform, opacity; duration: 250ms }
.slide-y-transition-enter-from    { opacity: 0; transform: translateY(-15px) }
.slide-y-transition-leave-to      { opacity: 0; transform: translateY(-15px) }
```

## SASS Hooks
- Duration: `settings.$transition-duration-root` (250ms)
- Easing: `settings.$standard-easing`
- Transform: `translateY(-15px)` -- slides in from above
- Respects `prefers-reduced-motion: no-preference`
- Also available: `VSlideYReverseTransition` (slides from below, `translateY(15px)`)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Drop down from above | `<v-slide-y-transition><div v-if="show">...</div></v-slide-y-transition>` |
| Slide up from below | Use `VSlideYReverseTransition` instead |
| Dropdown menu content | Combine with `mode="out-in"` |
| Animated list additions | `group` prop with `:key` on children |
