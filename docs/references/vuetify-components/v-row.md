# VRow
Source: packages/vuetify/src/components/VGrid/VRow.ts

## Overview
Flex row container in the grid system. Uses CSS `gap` for gutters. Wraps VCol children and provides alignment/justification.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| noGutters | boolean | Sets `--v-col-gap-x: 0px; --v-col-gap-y: 0px` | -- |
| density | 'default' / 'compact' / 'comfortable' | Controls gap size via density modifier | -- |
| gap | number/string/[x,y] | Sets `--v-col-gap-x` and `--v-col-gap-y` CSS vars directly | -- |
| size | number/string | Sets `--v-row-columns` (default grid is 12 columns) | -- |
| align | 'start' / 'end' / 'center' / 'baseline' / 'stretch' | Sets `align-items` via utility class (deprecated, use class) | -- |
| justify | 'start' / 'end' / 'center' / 'space-between' / 'space-around' / 'space-evenly' | Sets `justify-content` via utility class (deprecated, use class) | -- |
| alignContent | 'start' / 'end' / 'center' / 'space-between' / 'space-around' / 'space-evenly' / 'stretch' | Sets `align-content` via utility class (deprecated, use class) | -- |
| tag | string | HTML tag to render (default: `div`) | -- |

Note: `align*`, `justify*`, `alignContent*` props also accept breakpoint variants (e.g., `alignSm`, `justifyMd`), but all are deprecated in favor of utility classes.

## Slot Anatomy
- default: VCol children

## Composable Hooks
- makeDensityProps: Controls gutter density

## SASS Hooks
- `$grid-columns`: Default column count (default: 12), set via `--v-row-columns`
- `$grid-gutter`: Base gutter width (from settings)
- `$grid-density`: Density map for gutter adjustments
- `.v-row`: `display: flex; flex-wrap: wrap; gap: var(--v-col-gap-y) var(--v-col-gap-x)`
- `.v-row--no-gutters`: Zero gaps
- `.v-row--density-default/compact/comfortable`: Gap sizes per density

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Columns with standard gutter | `<v-row>` |
| No spacing between columns | `<v-row no-gutters>` |
| Tight column spacing | `<v-row density="compact">` |
| Custom gap | `<v-row :gap="16">` or `<v-row :gap="[16, 8]">` for x,y |
| Centered columns | `<v-row class="justify-center">` |
| Custom column count (e.g., 10) | `<v-row :size="10">` |
