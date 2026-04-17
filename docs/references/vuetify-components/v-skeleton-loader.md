# VSkeletonLoader
Source: packages/vuetify/src/components/VSkeletonLoader/VSkeletonLoader.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| type | see type list below, or array | Generates bone structure matching the skeleton shape | `ossein` |
| loading | boolean | When true, shows skeleton; when false, renders default slot | -- |
| boilerplate | boolean | Disables shimmer animation (static grey shapes) | -- |
| color | color string | Background color of the loader container | -- |
| elevation | 0-24 | Box shadow | -- |
| height | number/string | Explicit container height | -- |
| width | number/string | Explicit container width | -- |
| maxHeight | number/string | Max height constraint | -- |
| maxWidth | number/string | Max width constraint | -- |

### Available `type` Values
| Type | Composition |
|------|-------------|
| `actions` | button x2 |
| `article` | heading, paragraph |
| `avatar` | circular avatar shape |
| `button` | single button shape |
| `card` | image, heading |
| `card-avatar` | image, list-item-avatar |
| `chip` | rounded chip shape |
| `divider` | thin horizontal line |
| `heading` | wide rounded bar |
| `image` | tall rectangle (150px) |
| `list-item` | single text line |
| `list-item-avatar` | avatar + text |
| `list-item-two-line` | two text lines |
| `list-item-avatar-two-line` | avatar + two text lines |
| `list-item-three-line` | three text lines |
| `list-item-avatar-three-line` | avatar + three text lines |
| `ossein` | minimal rectangular bone |
| `paragraph` | text x3 |
| `sentences` | text x2 |
| `subtitle` | narrow text |
| `table` | table-heading, thead, tbody, tfoot |
| `text` | single text line |

Types can be combined: `type="heading, paragraph"` or repeated: `type="text@3"`.

## Slot Anatomy
- **default**: Actual content; shown when `loading` is false (or always if `loading` not set and slot exists)

## Composable Hooks
- **useBackgroundColor**: Container background
- **useDimension**: Width/height styles
- **useElevation**: Shadow classes
- **provideTheme**: Theme context

## SASS Hooks
- `$skeleton-loader-background`: rgb(surface theme color)
- `$skeleton-loader-text-background`: on-surface with border-opacity
- `$skeleton-loader-bone-background`: shimmer gradient (surface color, 3-stop)
- `$skeleton-loader-loading-animation`: loading 1.5s infinite -- shimmer keyframe
- `$skeleton-loader-border-radius`: root border radius
- `$skeleton-loader-gutter`: 16px -- spacing between bones
- `$skeleton-loader-avatar-height/width`: 48px
- `$skeleton-loader-button-height`: 36px
- `$skeleton-loader-heading-height`: 24px
- `$skeleton-loader-image-height`: 150px
- `$skeleton-loader-text-height`: 12px
- `$skeleton-loader-chip-height`: 32px

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Card placeholder | `type="card"` |
| List loading state | `type="list-item-avatar-two-line@3"` |
| Article placeholder | `type="article"` |
| Table loading state | `type="table"` |
| Content with loading toggle | `<v-skeleton-loader :loading="isLoading" type="article">...content...</v-skeleton-loader>` |
| Static wireframe (no shimmer) | `boilerplate` |
| Custom composite | `type="heading, paragraph, actions"` |
