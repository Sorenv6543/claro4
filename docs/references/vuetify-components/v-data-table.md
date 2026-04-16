# VDataTable
Source: packages/vuetify/src/components/VDataTable/VDataTable.tsx

Wraps VTable. Client-side sorting, filtering, pagination, grouping built in.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| density | "default" \| "comfortable" \| "compact" | Adjusts row height via `v-table--density-{x}` | -- |
| fixedHeader | boolean | Sticky `<thead>` via `v-table--fixed-header`; uses `z-index: 2` on fixed columns | -- |
| fixedFooter | boolean | Sticky `<tfoot>` via `v-table--fixed-footer` | -- |
| hover | boolean | Row hover highlight via `v-table--hover` | -- |
| striped | "odd" \| "even" \| null | Alternating row backgrounds via `v-table--striped-{odd\|even}` | -- |
| height | string \| number | Sets `max-height` on `.v-table__wrapper`; enables scroll | -- |
| loading | boolean | Adds `v-data-table--loading`; reduces body opacity to `var(--v-disabled-opacity)` | -- |
| hideDefaultHeader | boolean | Removes the built-in `<thead>` with VDataTableHeaders | -- |
| hideDefaultBody | boolean | Removes the built-in `<tbody>` with VDataTableRows | -- |
| hideDefaultFooter | boolean | Removes the built-in VDataTableFooter + VDivider | -- |
| showSelect | boolean | Adds checkbox column; adds `v-data-table--show-select` class | -- |
| width | string \| number | Sets table width | -- |

## Slot Anatomy
- **top**: Renders above the table wrapper (toolbar area)
- **default**: Replaces entire table interior (receives full slotProps)
- **thead**: Extra `<thead>` after default header
- **tbody**: Extra `<tbody>` after default body
- **tfoot**: Extra `<tfoot>` content
- **body**: Replaces default `<tbody>` rows
- **body.prepend / body.append**: Content before/after rows inside `<tbody>`
- **bottom**: Replaces footer area (pagination)
- **footer.prepend**: Prepended inside VDataTableFooter
- **colgroup**: Column group definitions
- **item.\{key\}**: Per-column cell customization
- **header.\{key\}**: Per-column header customization

## Composable Hooks
- **provideSort**: Sort state (sortBy, toggleSort, multiSort, mustSort)
- **provideGroupBy**: Group expansion state
- **providePagination**: Page, itemsPerPage, pageCount
- **provideSelection**: Row selection (isSelected, select, selectAll, toggleSelect)
- **provideExpanded**: Row expansion (isExpanded, toggleExpand)
- **useFilter**: Client-side search/filter
- **provideDefaults**: Passes loading/noData props to VDataTableRows

## SASS Hooks
- `$data-table-header-sort-badge-size`: 20px -- sort indicator badge
- `$data-table-header-sort-icon-hover-opacity`: 0.5 -- icon on hover
- `$data-table-loading-opacity`: var(--v-disabled-opacity) -- body opacity when loading
- `$data-table-footer-padding`: 8px 4px -- footer area padding
- `$data-table-footer-select-width`: 90px -- items-per-page select width
- `.v-data-table-column--fixed`: Sticky columns with `position: sticky`
- `.v-data-table-column--align-end / --align-center`: Text alignment

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Compact data grid | `density="compact"` |
| Scrollable table with sticky header | `:height="400" fixed-header` |
| Alternating row shading | `striped="odd"` |
| Row hover highlight | `hover` |
| Skeleton/loading state | `loading` |
| Custom toolbar above table | `#top` slot |
| Custom pagination | `#bottom` slot or `hide-default-footer` + VPagination |
| Checkbox selection column | `show-select` |
