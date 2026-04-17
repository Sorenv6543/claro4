# VDataTableServer
Source: packages/vuetify/src/components/VDataTable/VDataTableServer.tsx

Server-side data table. No client-side filtering/sorting -- emits events for the server to handle. Requires `items-length` prop. Shares visual structure and most design props with VDataTable.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| density | "default" \| "comfortable" \| "compact" | Adjusts row height via `v-table--density-{x}` | -- |
| fixedHeader | boolean | Sticky thead via `v-table--fixed-header` | -- |
| fixedFooter | boolean | Sticky tfoot via `v-table--fixed-footer` | -- |
| hover | boolean | Row hover highlight via `v-table--hover` | -- |
| striped | "odd" \| "even" \| null | Alternating row backgrounds | -- |
| height | string \| number | Sets max-height on wrapper; enables scroll | -- |
| loading | boolean | Adds `v-data-table--loading`; reduces body opacity | -- |
| hideDefaultHeader | boolean | Removes built-in thead | -- |
| hideDefaultBody | boolean | Removes built-in tbody | -- |
| hideDefaultFooter | boolean | Removes built-in footer + divider | -- |
| showSelect | boolean | Adds checkbox column | -- |
| itemsLength | number (required) | Drives pagination; total server-side count | -- |

## Slot Anatomy
Same as VDataTable:
- **top / bottom**: Above/below table
- **thead / tbody / tfoot**: Extra table sections
- **body / body.prepend / body.append**: Body customization
- **footer.prepend**: Footer prepend area
- **colgroup**: Column groups
- **item.\{key\} / header.\{key\}**: Per-column customization

## Composable Hooks
- **provideSort**: Sort state emitted to server
- **provideGroupBy**: Group expansion state
- **providePagination**: Page/itemsPerPage (emitted, not applied locally)
- **provideSelection**: Row selection
- **provideExpanded**: Row expansion
- **useOptions**: Emits `update:options` on any state change

## SASS Hooks
Uses the same VDataTable styles -- see v-data-table.md for SASS variables.

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Server-paginated table | `VDataTableServer` with `:items-length="total"` |
| Loading spinner while fetching | `loading` prop |
| Custom pagination controls | `#bottom` slot |
| Sticky header with scroll | `:height="400" fixed-header` |
| Same visual as client table | Identical styling; only data flow differs |
