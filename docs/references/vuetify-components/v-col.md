# VCol
Source: packages/vuetify/src/components/VGrid/VCol.ts

## Overview
Column component within VRow. Uses CSS custom properties for sizing. Supports responsive breakpoint sizing (sm, md, lg, xl, xxl) and offsets.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| cols | boolean/string/number | Column span (1-12), `auto`, or `true` for equal-width | -- |
| sm | boolean/string/number | Column span at sm breakpoint and up | -- |
| md | boolean/string/number | Column span at md breakpoint and up | -- |
| lg | boolean/string/number | Column span at lg breakpoint and up | -- |
| xl | boolean/string/number | Column span at xl breakpoint and up | -- |
| xxl | boolean/string/number | Column span at xxl breakpoint and up | -- |
| offset | string/number | Column offset (0-11) | -- |
| offsetSm-offsetXxl | string/number | Responsive offsets per breakpoint | -- |
| alignSelf | 'auto' / 'start' / 'end' / 'center' / 'baseline' / 'stretch' | Sets `align-self` (deprecated, use class) | -- |
| order / orderSm-orderXxl | string/number | Flex order (deprecated, use class) | -- |
| tag | string | HTML tag (default: `div`) | -- |

Fraction syntax: `cols="3/10"` means 3 columns in a 10-column grid.

## Slot Anatomy
- default: Column content

## Composable Hooks
- (none specific -- uses CSS custom property system from VGrid.sass)

## SASS Hooks
- `--v-col-size`: Column span count
- `--v-col-size-columns`: Total columns for size calculation (inherits `--v-row-columns`)
- `--v-col-gap-x`: Horizontal gap (inherited from VRow)
- `--v-col-offset`: Offset span count
- `--v-col-is-size / --v-col-is-auto / --v-col-is-grow`: CSS toggle hack for flex behavior
- `.v-col`: Flex item with computed `flex-basis: calc((size * (100% + gap)) / cols - gap)`
- `.v-col--cols-{bp}-{n}`: Breakpoint-specific sizing classes
- `.v-col--offset-{bp}-{n}`: Breakpoint-specific offset classes

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Equal-width columns | `<v-col>` (default: flex-grow) |
| 4-column-wide section | `<v-col cols="4">` |
| Full on mobile, half on desktop | `<v-col cols="12" md="6">` |
| Sidebar + main | `<v-col cols="3">` + `<v-col cols="9">` |
| Offset column | `<v-col cols="6" offset="3">` |
| Column in 10-column grid | `<v-col cols="3/10">` |
