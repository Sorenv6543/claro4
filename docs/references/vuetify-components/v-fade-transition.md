# VFadeTransition
Source: packages/vuetify/src/components/transitions/index.ts (createCssTransition)

CSS class: `fade-transition`

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| disabled | boolean | Disables transition entirely (no animation) | -- |
| group | boolean | Uses `<TransitionGroup>` instead of `<Transition>` | -- |
| hideOnLeave | boolean | Sets `display: none !important` on leaving element | -- |
| leaveAbsolute | boolean | Makes leaving element `position: absolute` to prevent layout shift | -- |
| mode | `in-out` `out-in` `default` | Vue transition mode | -- |
| origin | string | Sets `transform-origin` on entering element | -- |

## CSS Classes
```
.fade-transition-enter-active   { transition-property: opacity; duration: 250ms }
.fade-transition-leave-active   { transition-property: opacity; duration: 250ms }
.fade-transition-enter-from     { opacity: 0 }
.fade-transition-leave-to       { opacity: 0 }
```

## SASS Hooks
- Duration: `settings.$transition-duration-root` (250ms)
- Easing: `settings.$standard-easing`
- Transition property: `opacity` only
- Respects `prefers-reduced-motion: no-preference`

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Fade in/out content | `<v-fade-transition><div v-if="show">...</div></v-fade-transition>` |
| Fade swap (one out, one in) | `mode="out-in"` |
| Fade list items | `group` prop with `:key` on children |
| Fade without layout jump | `leave-absolute` |
