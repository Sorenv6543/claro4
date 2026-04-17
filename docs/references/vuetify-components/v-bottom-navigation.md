# VBottomNavigation
Source: packages/vuetify/src/components/VBottomNavigation/VBottomNavigation.tsx

## Overview
Fixed bottom navigation bar. Integrates with layout system to offset VMain. Contains VBtn children for navigation items. Supports shift mode (text hides for unselected items) and horizontal mode.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| bgColor | string | Background color via `useBackgroundColor` | -- |
| color | string | Active button color (passed to child VBtn) | -- |
| baseColor | string | Inactive button color (passed to child VBtn) | -- |
| density | 'default' / 'comfortable' / 'compact' | Height reduction: comfortable=-8px, compact=-16px | -- |
| elevation | string/number | Box-shadow (default: 2 when active) | -- |
| rounded | boolean/string | Border-radius | -- |
| border | boolean/string | Border styling | -- |
| height | number/string | Base height (default: 56px) | -- |
| grow | boolean | Buttons expand equally (`flex: 1 0 auto`) | -- |
| mode | 'horizontal' / 'shift' | horizontal: icon+text side-by-side; shift: text hidden when not selected | -- |
| active | boolean | Show/hide the navigation (default: true) | -- |
| tag | string | HTML tag (default: 'header') | -- |

## Slot Anatomy
- default: VBtn children inside `.v-bottom-navigation__content`

## Internal Defaults
Provides defaults to child VBtn: `variant: 'text'`, `stacked: true` (unless mode='horizontal'), color/baseColor/density from props.

## Composable Hooks
- useLayoutItem: Registers at bottom of layout, sets --v-layout-bottom
- useGroup: Manages selection state via VBtnToggle symbol
- useBackgroundColor: Applies background color
- useBorder: Applies border
- useDensity: Applies density class
- useElevation: Applies box-shadow
- useRounded: Applies border-radius
- useTheme: Applies theme

## SASS Hooks
- `$bottom-navigation-background`: Default bg (`rgb(var(--v-theme-surface))`)
- `$bottom-navigation-elevation`: Active elevation (2)
- `$bottom-navigation-height`: Button height (100% of container)
- `$bottom-navigation-max-width`: Per-button max (168px)
- `$bottom-navigation-min-width`: Per-button min (80px)
- `$bottom-navigation-content-font-size`: Label font size (label-small from typography)
- `$bottom-navigation-icon-font-size`: 1.5rem
- `.v-bottom-navigation--grow`: Equal-width buttons
- `.v-bottom-navigation--shift`: Hides text for unselected, translates icon up

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Bottom tab bar with icons + labels | `<v-bottom-navigation>` with VBtn children (icon + text) |
| Equal-width buttons | `<v-bottom-navigation grow>` |
| Shift animation (Material style) | `<v-bottom-navigation mode="shift">` |
| Icon + text side by side | `<v-bottom-navigation mode="horizontal">` |
| Colored active tab | `<v-bottom-navigation color="primary">` |
| Hidden bottom bar | `<v-bottom-navigation :active="false">` |
