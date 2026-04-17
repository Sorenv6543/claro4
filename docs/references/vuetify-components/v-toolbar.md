# VToolbar
Source: packages/vuetify/src/components/VToolbar/VToolbar.tsx

## Overview
Standalone toolbar component. Does NOT participate in the layout system (use VAppBar for that). Provides a content bar with prepend/append slots, title, optional extension, and background image.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| color | string | Background color via `useBackgroundColor` | -- |
| density | 'prominent' / 'default' / 'comfortable' / 'compact' / null | Height modifier: prominent=2x, comfortable=-8px, compact=-16px | -- |
| elevation | string/number | Box-shadow depth (default: 0) | -- |
| flat | boolean | Forces elevation to 0 | -- |
| rounded | boolean/string | Border-radius | -- |
| border | boolean/string | Border styling | -- |
| height | number/string | Base height (default: 64px) | -- |
| floating | boolean | `display: inline-flex; width: auto` | -- |
| collapse | boolean | Narrows to 112px, hides title | -- |
| collapsePosition | 'start' / 'end' | Which side collapse anchors to (default: 'start') | -- |
| absolute | boolean | `position: absolute` | -- |
| image | string | Background image URL | -- |
| title | string | Title text (renders VToolbarTitle) | -- |
| extended | boolean/null | Shows extension row | -- |
| extensionHeight | number/string | Extension height (default: 48px) | -- |
| tag | string | HTML tag (default: `header`) | -- |

## Slot Anatomy
- default: Main content in `.v-toolbar__content`
- prepend: Left area (`.v-toolbar__prepend`)
- append: Right area (`.v-toolbar__append`)
- title: Custom title (replaces `title` prop)
- image: Custom background image
- extension: Extension row below content (`.v-toolbar__extension`)

## Sub-components
- **VToolbarTitle**: Title with typography, flex: 1 1, ellipsis overflow
- **VToolbarItems**: Flex container for action buttons (removes border-radius)

## Internal Defaults
VToolbar provides defaults to child VBtn: `variant: 'text'`

## Composable Hooks
- useBackgroundColor: Applies background color
- useBorder: Applies border
- useElevation: Applies box-shadow
- useRounded: Applies border-radius
- provideTheme: Provides theme context
- useLocation: Applies location styles

## SASS Hooks
- `$toolbar-background`: Default bg (`rgb(var(--v-theme-surface-light))`)
- `$toolbar-color`: Text color (on-surface-light with high-emphasis)
- `$toolbar-elevation`: Default elevation (0)
- `$toolbar-title-font-size`: 1.25rem
- `$toolbar-prominent-title-font-size`: 1.5rem (in prominent mode)
- `$toolbar-collapsed-max-width`: 112px
- `$toolbar-collapsed-border-radius`: 24px
- `$toolbar-prepend-btn-margin-start`: 4px
- `$toolbar-append-btn-margin-end`: 4px
- `--v-toolbar-image-opacity`: Image layer opacity (for fade effects)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Inline toolbar (not app bar) | `<v-toolbar>` |
| Toolbar with title | `<v-toolbar title="Section">` |
| Prominent toolbar (tall + bottom-aligned title) | `<v-toolbar density="prominent">` |
| Compact toolbar | `<v-toolbar density="compact">` (48px) |
| Toolbar with left/right actions | prepend + append slots with VBtn icons |
| Card header toolbar | `<v-toolbar flat color="primary">` inside VCard |
