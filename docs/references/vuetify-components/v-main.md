# VMain
Source: packages/vuetify/src/components/VMain/VMain.tsx

## Overview
Main content area that auto-adjusts padding based on layout items (app bars, drawers, footers). Renders as `<main>` by default.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| scrollable | boolean | When true, makes VMain a scrollable container with `position: absolute` and `overflow-y: auto` | -- |
| tag | string | HTML tag to render (default: `main`) | -- |
| height | string/number | Sets explicit height via inline style | -- |
| width | string/number | Sets explicit width via inline style | -- |

## Slot Anatomy
- default: Page content; when `scrollable` is true, wraps in `.v-main__scroller`

## Composable Hooks
- useLayout: Reads layout CSS variables (--v-layout-left/right/top/bottom) for auto-padding
- useDimension: Applies height/width/maxHeight/maxWidth styles
- useSsrBoot: Manages SSR transition styles

## SASS Hooks
- `$main-transition`: Transition for padding changes (default: `0.2s standard-easing`)
- `.v-main`: `flex: 1 0 auto`, padding from layout vars
- `.v-main--scrollable`: Absolute positioning with internal scroller
- `.v-main__scroller`: Overflow container when scrollable, resets layout vars to 0

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Standard page content area | `<v-main>` inside `<v-app>` |
| Scrollable content with fixed bars | `<v-main scrollable>` |
| Content filling remaining space | Default behavior -- VMain auto-fills space left by layout items |
