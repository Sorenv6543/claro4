# VApp
Source: packages/vuetify/src/components/VApp/VApp.tsx

## Overview
Root application wrapper. Provides theme, layout system, and RTL context to all child components. Required as the outermost Vuetify component.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| theme | string | Sets `v-theme--{name}` class, controls CSS custom properties for colors | -- |
| overlaps | string[] | Configures layout overlap between named layout items | -- |

## Slot Anatomy
- default: Main content area; typically contains VAppBar, VNavigationDrawer, VMain, VFooter

## Composable Hooks
- createLayout: Establishes the layout system (--v-layout-left/right/top/bottom CSS vars)
- provideTheme: Provides theme context (themeClasses) to all descendants
- useRtl: Provides RTL direction classes

## SASS Hooks
- `$application-background`: Background color (default: `rgb(var(--v-theme-background))`)
- `$application-color`: Text color (default: theme `on-background` with high-emphasis opacity)
- `.v-application__wrap`: Flex column container, `min-height: 100dvh`

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Full-page app shell | `<v-app>` wrapping everything |
| Dark mode | `<v-app theme="dark">` |
| Light background | Customize `--v-theme-background` via theme config |
