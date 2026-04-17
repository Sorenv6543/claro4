# VSheet
Source: packages/vuetify/src/components/VSheet/VSheet.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| color | color string | Background color via `useBackgroundColor` | surface theme color |
| elevation | 0-24 | Box shadow depth | 0 |
| rounded | boolean or string | Border radius; `true` uses root radius | -- |
| border | boolean or string | Border style; `true` adds thin border | -- |
| position | `static` `relative` `absolute` `fixed` `sticky` | CSS position property | -- |
| location | location string | Positioning offsets (top, left, etc.) | -- |
| tag | string | Root HTML element | `div` |
| height | number/string | Explicit height | -- |
| width | number/string | Explicit width | -- |
| maxHeight | number/string | Max height constraint | -- |
| maxWidth | number/string | Max width constraint | -- |
| minHeight | number/string | Min height constraint | -- |
| minWidth | number/string | Min width constraint | -- |

## Slot Anatomy
- **default**: All child content

## Composable Hooks
- **useBackgroundColor**: Background color from `color` prop
- **useBorder**: Border classes
- **useDimension**: Width/height/min/max dimension styles
- **useElevation**: Elevation shadow classes
- **useLocation**: Location offset styles
- **usePosition**: Position class (absolute/fixed/relative/sticky)
- **useRounded**: Border radius classes
- **provideTheme**: Theme context

## SASS Hooks
- `$sheet-background`: rgb(surface theme color)
- `$sheet-color`: on-surface with high emphasis
- `$sheet-elevation`: 0
- `$sheet-border-radius`: 0 (no rounding by default)
- `$sheet-rounded-border-radius`: root border radius (when `rounded` applied)
- `$sheet-border-width`: 0
- `$sheet-positions`: absolute fixed relative sticky

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Basic surface container | `<v-sheet>` |
| Elevated card-like surface | `elevation="2" rounded` |
| Bordered panel | `border rounded` |
| Full-width section with color | `color="surface-variant"` |
| Fixed-dimension container | `width="300" height="200"` |
| Sticky header area | `position="sticky" style="top: 0"` |
