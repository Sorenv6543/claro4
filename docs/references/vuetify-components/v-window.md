# VWindow
Source: packages/vuetify/src/components/VWindow/VWindow.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| modelValue | any | Currently selected item value | -- |
| direction | `horizontal` `vertical` | Slide axis (translateX vs translateY) | horizontal |
| reverse | boolean | Reverses transition direction | -- |
| continuous | boolean | Wraps from last to first item and vice versa | -- |
| showArrows | `true` `false` `'hover'` | Navigation arrows; `hover` shows on mouse hover only | -- |
| verticalArrows | `true` `false` `'left'` `'right'` | Stacks arrows vertically; optionally align left/right | -- |
| nextIcon | IconValue | Forward navigation icon | `$next` |
| prevIcon | IconValue | Back navigation icon | `$prev` |
| touch | boolean/object | Swipe gesture support | true |
| mandatory | boolean or `'force'` | Always keep one item selected | force |
| disabled | boolean | Disables navigation | -- |
| selectedClass | string | Class applied to active VWindowItem | `v-window-item--active` |
| crossfade | boolean | Crossfade transition instead of slide | -- |
| transitionDuration | number | Custom transition duration in ms | -- |

## Slot Anatomy
- **default**: VWindowItem children; receives `{ group }` with selection state
- **additional**: Extra content outside the container (e.g., indicators)
- **prev**: Custom previous button; receives `{ props }` with icon, class, onClick, aria-label
- **next**: Custom next button; receives `{ props }` with icon, class, onClick, aria-label

## Composable Hooks
- **useGroup**: Manages item selection (single mandatory by default)
- **useRtl**: RTL-aware direction reversal
- **provideTheme**: Theme context

## SASS Hooks
- `$window-transition`: 0.3s cubic-bezier(.25, .8, .50, 1)
- `$window-controls-padding`: 0 16px
- `$window-controls-vertical-gap`: 12px
- `$window-crossfade-blend-mode`: plus-lighter

### Transition CSS classes
- `.v-window-x-transition`: horizontal slide (enter +100%, leave -100%)
- `.v-window-x-reverse-transition`: reverse horizontal
- `.v-window-y-transition`: vertical slide (enter +100%, leave -100%)
- `.v-window-y-reverse-transition`: reverse vertical
- `.v-window-crossfade-transition`: opacity fade with `plus-lighter` blend

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Tab content panels | VWindow + VWindowItem, bound to VTabs model |
| Image carousel | `show-arrows continuous` with VWindowItem per image |
| Vertical slide content | `direction="vertical"` |
| Crossfade between views | `crossfade` |
| Arrows on hover only | `show-arrows="hover"` |
| Swipeable mobile content | Default touch is enabled |
| Custom transition speed | `transition-duration="500"` |
