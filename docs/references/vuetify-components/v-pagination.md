# VPagination
Source: packages/vuetify/src/components/VPagination/VPagination.tsx

Page navigation control. Renders prev/next buttons and numbered page buttons using VBtn internally. Auto-calculates visible page range with ellipsis.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| variant | "text" \| "flat" \| "elevated" \| "tonal" \| "outlined" \| "plain" | Button variant (default: "text") | -- |
| color | string | Color of page buttons | -- |
| activeColor | string | Color of the active/current page button | -- |
| size | "x-small" \| "small" \| "default" \| "large" \| "x-large" | Button size | -- |
| density | "default" \| "comfortable" \| "compact" | Button density | -- |
| rounded | boolean \| string \| number | Button border radius | -- |
| elevation | number (0-24) | Button elevation | -- |
| border | boolean \| string | Button border | -- |
| disabled | boolean | Disables all buttons | -- |
| length | number | Total number of pages | -- |
| totalVisible | number \| string | Max visible page buttons (auto-calculated from width if omitted) | -- |
| showFirstLastPage | boolean | Show first/last page buttons | -- |
| ellipsis | string | Ellipsis string (default: "...") | -- |
| prevIcon | IconValue | Previous button icon (default: "$prev") | -- |
| nextIcon | IconValue | Next button icon (default: "$next") | -- |
| firstIcon | IconValue | First page button icon (default: "$first") | -- |
| lastIcon | IconValue | Last page button icon (default: "$last") | -- |

## Slot Anatomy
- **item**: Custom page button; receives `{isActive, key, page, props}`
- **first**: Custom first-page button; receives `{icon, onClick, disabled, ...}`
- **prev**: Custom previous button; receives `{icon, onClick, disabled, ...}`
- **next**: Custom next button; receives `{icon, onClick, disabled, ...}`
- **last**: Custom last-page button; receives `{icon, onClick, disabled, ...}`

## Composable Hooks
- **provideTheme**: Theme propagation
- **provideDefaults**: Provides color, border, density, size, variant, rounded, elevation to VPaginationBtn (VBtn alias)
- **useResizeObserver**: Auto-calculates `maxButtons` from container width
- **useProxiedModel**: Two-way page binding
- **useLocale / useRtl**: RTL icon direction swap

## SASS Hooks
- `$pagination-item-margin`: 0.3rem -- spacing between buttons
- `.v-pagination__list`: inline-flex, centered, full width
- `.v-pagination__item--is-active`: Class on the active page `<li>`
- `.v-pagination__first / __prev / __next / __last`: Navigation button wrappers

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Basic pagination | `<VPagination v-model="page" :length="10" />` |
| Rounded pill buttons | `rounded="pill"` |
| Outlined page buttons | `variant="outlined"` |
| Compact pagination | `density="compact" size="small"` |
| First/last buttons | `show-first-last-page` |
| Active page highlight | `active-color="primary"` |
| Limited visible pages | `:total-visible="5"` |
| Custom page button | `#item="{ props, page }"` slot |
| Paired with data table | Use VDataTable's `#bottom` slot + VPagination |
