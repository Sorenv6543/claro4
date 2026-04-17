# VExpandTransition
Source: packages/vuetify/src/components/transitions/index.ts (createJavascriptTransition + expand-transition.ts)

CSS class: `expand-transition`
Type: JavaScript-driven transition (measures and animates height)

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| disabled | boolean | Disables transition; defaults to `true` when `prefers-reduced-motion` | -- |
| group | boolean | Uses `<TransitionGroup>` instead of `<Transition>` | -- |
| hideOnLeave | boolean | Sets `display: none !important` on leaving element | -- |
| mode | `in-out` `out-in` `default` | Vue transition mode | in-out |

## How It Works
1. **Enter**: Measures element's `offsetHeight`, sets `height: 0`, then animates to measured height
2. **Leave**: Captures current `offsetHeight`, then animates to `height: 0`
3. Temporarily sets `overflow: hidden` during animation
4. Resets all inline styles after transition completes
5. Can optionally add a parent class during the transition

## CSS Classes
```
.expand-transition-enter-active  { transition-property: height; duration: 250ms }
.expand-transition-leave-active  { transition-property: height; duration: 250ms }
```

## SASS Hooks
- Duration: `settings.$transition-duration-root` (250ms)
- Easing: `settings.$standard-easing`
- Transition property: `height`
- Also available: `VExpandXTransition` (animates `width`) and `VExpandBothTransition` (animates both)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Collapsible content panel | `<v-expand-transition><div v-show="open">...</div></v-expand-transition>` |
| Accordion expand/collapse | Used internally by VExpansionPanelText |
| Horizontal expand | Use `VExpandXTransition` instead |
| Expand width and height | Use `VExpandBothTransition` instead |
