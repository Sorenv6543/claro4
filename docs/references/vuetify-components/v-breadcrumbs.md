# VBreadcrumbs
Source: packages/vuetify/src/components/VBreadcrumbs/VBreadcrumbs.tsx

## Overview
Breadcrumb navigation list. Renders items as `<ul>` with dividers between items. Last item is automatically disabled (current page). Supports programmatic items array or manual slot usage.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| bgColor | string | Background color via `useBackgroundColor` | -- |
| color | string | Text color for items (passed to VBreadcrumbsItem) | -- |
| activeColor | string | Text color for active item | -- |
| density | 'default' / 'comfortable' / 'compact' | Padding reduction via density system | -- |
| rounded | boolean/string | Border-radius | -- |
| divider | string | Divider character between items (default: '/') | -- |
| icon | IconValue | Prepend icon before breadcrumbs | -- |
| items | BreadcrumbItem[] | Array of items (string or `{title, href, disabled, to}`) | -- |
| disabled | boolean | Disables all items | -- |
| tag | string | HTML tag (default: 'ul') | -- |

## Slot Anatomy
- default: Additional content after items
- prepend: Before breadcrumb items (replaces icon prop)
- title: Custom title rendering per item `({ item, index })`
- divider: Custom divider between items `({ item, index })`
- item: Full custom item rendering `({ item, index })`

## Sub-components
- **VBreadcrumbsItem**: Individual breadcrumb (supports `to`, `href`, `active`, `activeColor`, `color`, `disabled`, `title`)
- **VBreadcrumbsDivider**: Divider element (`aria-hidden="true"`)

## Composable Hooks
- useBackgroundColor: Applies background color
- useDensity: Applies density padding
- useRounded: Applies border-radius
- provideDefaults: Passes divider, activeClass, activeColor, color, disabled to children

## SASS Hooks
- `$breadcrumbs-padding-y`: Vertical padding (16px)
- `$breadcrumbs-padding-x`: Horizontal padding (12px)
- `$breadcrumbs-density`: Density map (default: 0, comfortable: -1, compact: -2)
- `$breadcrumbs-line-height`: From body-large typography
- `$breadcrumbs-divider-padding`: Divider spacing (0 8px)
- `$breadcrumbs-item-disabled-opacity`: Disabled opacity (--v-disabled-opacity)
- `$breadcrumbs-item-link-text-decoration`: Hover underline
- `$breadcrumbs-rounded-border-radius`: Root border radius

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Simple text breadcrumbs | `<v-breadcrumbs :items="['Home', 'Section', 'Page']">` |
| Linked breadcrumbs | `<v-breadcrumbs :items="[{title: 'Home', to: '/'}, ...]">` |
| Custom divider (chevron) | `<v-breadcrumbs divider=">">` or use divider slot with VIcon |
| Breadcrumbs with icon | `<v-breadcrumbs icon="mdi-home" :items="[...]">` |
| Compact breadcrumbs | `<v-breadcrumbs density="compact">` |
