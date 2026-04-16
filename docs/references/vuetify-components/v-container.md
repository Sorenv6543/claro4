# VContainer
Source: packages/vuetify/src/components/VGrid/VContainer.tsx

## Overview
Centered, max-width content container. Part of the grid system (VContainer > VRow > VCol). Sets responsive max-widths at breakpoints.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| fluid | boolean | Sets `max-width: 100%`, removing breakpoint max-widths | -- |
| tag | string | HTML tag to render (default: `div`) | -- |
| height | string/number | Sets explicit height | -- |
| width | string/number | Sets explicit width | -- |

## Slot Anatomy
- default: Content, typically VRow children

## Composable Hooks
- useRtl: Applies RTL direction classes
- useDimension: Applies dimension styles (height/width)

## SASS Hooks
- `$container-padding-x`: Horizontal padding (from settings)
- `$container-max-widths`: Responsive max-widths per breakpoint (sm, md, lg, xl, xxl)
- `.v-container`: `width: 100%`, `margin: 0 auto`, padding from settings
- `.v-container--fluid`: Overrides max-width to 100%

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Centered content with max-width | `<v-container>` |
| Full-width content | `<v-container fluid>` |
| Content area with specific width | `<v-container :width="800">` |
