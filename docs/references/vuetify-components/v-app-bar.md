# VAppBar
Source: packages/vuetify/src/components/VAppBar/VAppBar.tsx

## Overview
Application bar that integrates with the layout system. Extends VToolbar with scroll behavior, layout positioning, and collapse support. Registers as a layout item that offsets VMain.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| color | string | Background color via `useBackgroundColor` | -- |
| density | 'prominent' / 'default' / 'comfortable' / 'compact' | Height adjustment: prominent=2x, comfortable=-8px, compact=-16px | -- |
| elevation | string/number | Box-shadow depth (default for app-bar: 2) | -- |
| flat | boolean | Removes elevation (elevation 0) | -- |
| rounded | boolean/string | Border-radius (`true` = default radius, or 'sm'/'lg'/'xl'/'pill' etc.) | -- |
| border | boolean/string | Adds border styling | -- |
| height | number/string | Base height in px (default: 64) | -- |
| image | string | Background image URL | -- |
| floating | boolean | `display: inline-flex; width: auto` | -- |
| collapse | boolean | Collapses to narrow width (112px) | -- |
| location | 'top' / 'bottom' | Positions at top or bottom of layout | -- |
| title | string | Renders VToolbarTitle with text | -- |
| extended | boolean | Shows extension row (height: 48px default) | -- |
| scrollBehavior | 'hide' / 'fully-hide' / 'inverted' / 'collapse' / 'elevate' / 'fade-image' | Scroll-reactive behaviors (combinable with space) | -- |

## Slot Anatomy
- default: Main content area within `.v-toolbar__content`
- prepend: Left side of toolbar (wrapped in `.v-toolbar__prepend`)
- append: Right side of toolbar (wrapped in `.v-toolbar__append`)
- title: Custom title content (replaces `title` prop text)
- image: Custom background image (receives VImg defaults)
- extension: Extension row below main content

## Sub-components
- **VAppBarNavIcon**: Menu button (icon="$menu", variant="text")
- **VAppBarTitle**: Styled toolbar title

## Composable Hooks
- useLayoutItem: Registers with layout system, sets --v-layout-top/bottom
- useScroll: Scroll-reactive behavior (hide, elevate, collapse on scroll)
- provideTheme: Provides theme context
- useBackgroundColor: Applies background color
- useElevation: Applies box-shadow
- useRounded: Applies border-radius
- useBorder: Applies border

## SASS Hooks
- `$app-bar-elevation`: Default elevation (2)
- `$app-bar-flat-elevation`: Flat elevation (0)
- `$app-bar-background`: Background color (`rgb(var(--v-theme-surface))`)
- `$app-bar-color`: Text color (on-surface with high-emphasis)
- `$app-bar-collapsed-max-width`: Collapsed width (112px)
- `$app-bar-prominent-height`: Prominent mode height (128px)
- `.v-app-bar`: Display flex, themed background/color
- `--v-toolbar-image-opacity`: Controls background image fade on scroll

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Standard top bar with title | `<v-app-bar title="App Name">` |
| Bar with hamburger + title | `<v-app-bar>` with `<template #prepend><v-app-bar-nav-icon /></template>` |
| Flat top bar (no shadow) | `<v-app-bar flat>` |
| Bar with background image | `<v-app-bar image="/hero.jpg">` |
| Compact bar | `<v-app-bar density="compact">` (48px) |
| Hide on scroll down | `<v-app-bar scroll-behavior="hide">` |
| Elevate on scroll | `<v-app-bar flat scroll-behavior="elevate">` |
| Bottom-positioned bar | `<v-app-bar location="bottom">` |
| Bar with tabs in extension | `<v-app-bar extended>` with `<template #extension><v-tabs /></template>` |
