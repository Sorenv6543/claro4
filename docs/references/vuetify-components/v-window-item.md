# VWindowItem
Source: packages/vuetify/src/components/VWindow/VWindowItem.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| value | any | Identifier for group selection matching | -- |
| transition | string or false | Custom enter transition name; `false` disables | window default |
| reverseTransition | string or false | Custom reverse transition name; `false` disables | window default |
| eager | boolean | Render content immediately instead of lazily | -- |
| disabled | boolean | Excludes from navigation | -- |
| selectedClass | string | Class when active | `v-window-item--active` |

## Slot Anatomy
- **default**: Item content; only rendered when selected (unless `eager`)

## Composable Hooks
- **useGroupItem**: Registers with parent VWindow group
- **useLazy**: Controls lazy rendering based on selection state
- **useSsrBoot**: Prevents transition on initial SSR hydration

## SASS Hooks
- Inherits transition styles from VWindow (`.v-window-x-transition`, etc.)
- Transition duration overridable via `--v-window-transition-duration` CSS variable
- Leave position: `position: absolute; top: 0; width: 100%` (prevents layout shift)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Basic window slide | `<v-window-item>content</v-window-item>` |
| Named item for v-model | `value="tab-1"` |
| Pre-rendered content | `eager` prop |
| Custom transition per item | `transition="fade-transition"` |
| No animation | `:transition="false" :reverse-transition="false"` |
| Disabled/hidden item | `disabled` prop |
