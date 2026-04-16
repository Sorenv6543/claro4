# VAlert
Source: packages/vuetify/src/components/VAlert/VAlert.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| variant | `flat` `text` `elevated` `tonal` `outlined` `plain` | Controls background/border/elevation rendering via `.v-alert--variant-*` | tonal |
| type | `success` `info` `warning` `error` | Sets color + default icon (`$success`, `$info`, etc.) | -- |
| color | any theme color string | Applied via variant composable; overrides `type` color | -- |
| border | `true` `top` `end` `bottom` `start` | Adds thick 8px colored border on specified side | -- |
| borderColor | color string | Sets border color independently from alert color | -- |
| density | `default` `comfortable` `compact` | Adjusts vertical padding (-1px/-2px) | -- |
| elevation | 0-24 | Box shadow depth | -- |
| rounded | boolean or string | Border radius; `true` uses default root radius | true |
| prominent | boolean | Enlarges prepend icon to 44px, vertically centers it | -- |
| closable | boolean | Shows close button in top-right area | -- |
| closeIcon | IconValue | Icon for close button | `$close` |
| iconSize | string/number | Explicit icon size override | -- |
| tag | string | Root HTML element | `div` |

## Slot Anatomy
- **default**: Main content area inside `.v-alert__content`
- **prepend**: Left icon area; receives VIcon defaults when `icon`/`type` is set
- **title**: Renders inside `VAlertTitle`; replaces `title` prop
- **text**: Inline text content; replaces `text` prop
- **append**: Right-side content area before close button
- **close**: Custom close button; receives `{ props }` with `onClick` and `aria-label`

## Composable Hooks
- **useVariant**: Generates color/background classes and overlay styles
- **useDensity**: Applies density modifier classes
- **useElevation**: Adds elevation shadow classes
- **useRounded**: Adds border-radius classes
- **useDimension**: Applies width/height/min-width/min-height/max-width/max-height styles
- **useLocation**: Positions element with location styles
- **usePosition**: Adds position classes (absolute/fixed/sticky)
- **provideTheme**: Provides theme context to children
- **useIconSizes**: Calculates icon size (44px when prominent)

## SASS Hooks
- `$alert-padding`: 16px -- inner padding
- `$alert-border-thin-width`: 8px -- colored border stripe width
- `$alert-border-opacity`: 0.38 -- border color overlay opacity
- `$alert-border-radius`: settings.$border-radius-root
- `$alert-prepend-icon-size`: 1.75rem -- default icon dimensions
- `$alert-prepend-margin-inline-end`: 16px -- gap between icon and content
- `$alert-title-font-size`: headline-small typography
- `$alert-density`: padding offsets per density level

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Colored banner with icon | `type="info"` (or success/warning/error) |
| Subtle tinted background | `variant="tonal"` (Claro4 default) |
| Outlined alert | `variant="outlined"` |
| Left color stripe | `border="start"` |
| Dismissible alert | `closable` prop |
| Large centered icon | `prominent` prop |
| Custom icon size | `icon-size="32"` |
| Alert without icon | `:icon="false"` |
