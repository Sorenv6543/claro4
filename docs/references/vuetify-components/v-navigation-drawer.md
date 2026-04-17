# VNavigationDrawer
Source: packages/vuetify/src/components/VNavigationDrawer/VNavigationDrawer.tsx

## Overview
Side/bottom navigation drawer that integrates with the layout system. Supports permanent, temporary, rail (mini), expand-on-hover, and sticky modes.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| color | string | Background color via `useBackgroundColor` | -- |
| elevation | string/number | Box-shadow depth (default: 0; temporary active: 4) | 3 |
| rounded | boolean/string | Border-radius | true |
| border | boolean/string | Border styling (default: thin border on edge facing content) | -- |
| width | number/string | Drawer width (default: 256px) | -- |
| location | 'start' / 'end' / 'left' / 'right' / 'top' / 'bottom' | Position (default: 'start') | -- |
| floating | boolean | Removes border, overlaps content edge | -- |
| rail | boolean | Mini/collapsed mode using `railWidth` | -- |
| railWidth | number/string | Width in rail mode (default: 56px) | -- |
| expandOnHover | boolean | Expands from rail width on hover | -- |
| temporary | boolean | Overlays content with scrim, doesn't push layout | -- |
| permanent | boolean | Always visible, ignores mobile breakpoint | -- |
| sticky | boolean | Uses `position: sticky` instead of absolute | -- |
| image | string | Background image URL | -- |
| scrim | boolean/string | Scrim overlay for temporary mode (true=black, or color string) | -- |
| tag | string | HTML tag (default: 'nav') | -- |

## Slot Anatomy
- default: Main scrollable content (`.v-navigation-drawer__content`)
- prepend: Fixed top section (`.v-navigation-drawer__prepend`)
- append: Fixed bottom section (`.v-navigation-drawer__append`)
- image: Custom background image (receives VImg defaults)

## Internal Defaults
Provides defaults to child VList: `bgColor: 'transparent'`

## Composable Hooks
- useLayoutItem: Registers with layout, pushes VMain via --v-layout-left/right
- useBackgroundColor: Applies background color
- useBorder: Applies border
- useElevation: Applies box-shadow
- useRounded: Applies border-radius
- provideTheme: Provides theme context
- useDisplay: Responsive mobile detection for auto-temporary mode
- useTouch: Swipe gesture support for open/close
- useSticky: Sticky positioning logic
- useFocusTrap: Focus trapping in temporary mode

## SASS Hooks
- `$navigation-drawer-background`: Default bg (`rgb(var(--v-theme-surface))`)
- `$navigation-drawer-color`: Text color (on-surface with high-emphasis)
- `$navigation-drawer-elevation`: Default elevation (0)
- `$navigation-drawer-temporary-elevation`: Temporary mode elevation (4)
- `$navigation-drawer-border-thin-width`: Border width on content-facing edge (thin)
- `$navigation-drawer-scrim-opacity`: Scrim darkness (0.2)
- `$navigation-drawer-transition-duration`: 0.2s
- `.v-navigation-drawer__content`: `overflow-y: auto; overflow-x: hidden`
- `.v-navigation-drawer--floating`: No border
- `.v-navigation-drawer--rounded`: Uses `$border-radius-root`

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Permanent sidebar | `<v-navigation-drawer permanent>` |
| Hamburger-toggled drawer | `<v-navigation-drawer v-model="drawer">` |
| Right-side drawer | `<v-navigation-drawer location="end">` |
| Mini/rail sidebar | `<v-navigation-drawer rail>` |
| Mini that expands on hover | `<v-navigation-drawer rail expand-on-hover>` |
| Floating drawer (no border) | `<v-navigation-drawer floating>` |
| Drawer with logo + nav + footer | prepend (logo) + default (VList nav) + append (footer) |
| Claro4 styled drawer | `rounded` and `elevation="3"` applied via global defaults |
