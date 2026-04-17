# VBtnGroup
Source: packages/vuetify/src/components/VBtnGroup/VBtnGroup.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| variant | `elevated`, `flat`, `tonal`, `outlined`, `text`, `plain` | Passed to child VBtn defaults; controls button variant style | — |
| color | Any theme color string | Passed to child VBtn defaults for color | — |
| baseColor | Any theme color string | Passed to child VBtn defaults as fallback color | — |
| density | `default`, `comfortable`, `compact` | Controls group height via density offsets; passed to child buttons | — |
| elevation | `0`-`24` | Box-shadow on the group container | — |
| rounded | `boolean`, `string` (`0`, `xs`, `sm`, `lg`, `xl`, `pill`, `circle`) | Border-radius on the group; children inherit start/end radii | — |
| border | `boolean`, `string` | Adds border to the group container | — |
| divided | boolean | Adds visible divider borders between buttons | — |
| direction | `horizontal`, `vertical` | Flex direction: row (default) or column | — |

## Slot Anatomy
- **default**: Accepts VBtn children; buttons get `border-radius: 0` and inherit group border-radius on first/last child

## Composable Hooks
- **provideTheme**: Provides theme to child components
- **useDensity**: Applies density class to group container, sets group height
- **useBorder**: Applies border to group container
- **useElevation**: Applies elevation box-shadow to group
- **useRounded**: Applies border-radius to group
- **provideDefaults**: Provides defaults to child VBtn (flat=true, plus color/density/variant from group props)

## SASS Hooks
- `$btn-group-height`: Base height (48px)
- `$btn-group-border-radius`: Border-radius (settings.$border-radius-root)
- `$btn-group-elevation`: Elevation (0)
- `$btn-group-border-color`: Border color for dividers
- `$btn-group-border-style`: Border style for dividers
- `$btn-group-border-thin-width`: Divider border width (thin)
- `$btn-group-tile-border-radius`: Tile mode radius (0)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Segmented button bar | `<v-btn-group divided variant="outlined">` with VBtn children |
| Toggle group (select one) | Wrap in `<v-btn-toggle>` which extends VBtnGroup |
| Vertical button stack | `direction="vertical"` |
| Grouped outlined buttons | `variant="outlined" divided` |
| Flat grouped buttons | `variant="flat"` (child buttons are flat by default) |
| Rounded group | `rounded="pill"` or `rounded="lg"` |
