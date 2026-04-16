# VAutocomplete
Source: packages/vuetify/src/components/VAutocomplete/VAutocomplete.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| variant | `'outlined'` `'filled'` `'underlined'` `'plain'` `'solo'` `'solo-inverted'` `'solo-filled'` | Field border/background style | outlined |
| density | `'default'` `'comfortable'` `'compact'` | Vertical padding/height | comfortable |
| rounded | boolean \| string \| number | Field border-radius | true |
| color | string | Focused state color | -- |
| baseColor | string | Unfocused state color | -- |
| bgColor | string | Field background-color | -- |
| hideDetails | boolean \| `'auto'` | Controls messages area visibility | auto |
| chips | boolean | Renders selections as VChip components | -- |
| closableChips | boolean | Chips get a close button | -- |
| multiple | boolean | Allows multiple selections with checkboxes | -- |
| clearable | boolean | Shows clear icon | -- |
| hideSelected | boolean | Hides selected items from dropdown | -- |
| autoSelectFirst | boolean \| `'exact'` | Auto-highlights first match; `'exact'` only on exact title match | -- |
| clearOnSelect | boolean | Clears search text after selecting (multiple mode) | -- |
| menuIcon | IconValue | Dropdown icon (default: `$dropdown`) | -- |
| menuProps | object | Props forwarded to VMenu | -- |
| menuElevation | number \| string | Dropdown sheet elevation | -- |
| itemColor | string | Color of selected items in list | -- |
| items | array | List of options | -- |
| itemTitle / itemValue | SelectItemKey | Keys for display text and value | -- |
| returnObject | boolean | Model stores full objects | -- |
| noDataText | string | Text when no items match | -- |

## Slot Anatomy
- item: Custom dropdown item; receives `{ item, internalItem, index, props }`
- selection: Custom selected value rendering
- chip: Custom chip rendering (with `chips` prop)
- prepend-item / append-item: Before/after the list
- no-data: Empty state content
- menu-header / menu-footer: Dropdown header/footer
- prepend / append / prepend-inner / append-inner: Field icon slots

## Composable Hooks
- useFilter: Filters items as user types; highlights matching text
- useItems: Transforms raw items into ListItem objects
- useScrolling: Keyboard navigation in dropdown
- useForm: Inherits disabled/readonly from VForm
- useMenuActivator: ARIA attributes for the dropdown
- useTextColor: Applies color to selected chip highlight

## SASS Hooks
- `$autocomplete-content-elevation`: Dropdown shadow (default: `2`)
- `$autocomplete-content-border-radius`: Dropdown corners (default: `4px`)
- `$autocomplete-focused-input`: Minimum input width when focused (default: `64px`)
- `$autocomplete-selection-gap`: Gap after selection chips (default: `2px`)
- `.v-autocomplete--active-menu`: Rotates dropdown icon
- `.v-autocomplete--selecting-index`: Dims non-selected chips during keyboard nav

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Searchable dropdown | `<v-autocomplete :items="options">` (Claro4 defaults apply) |
| Multi-select search with chips | `<v-autocomplete :items="opts" multiple chips closable-chips>` |
| Auto-select first match | `<v-autocomplete :items="opts" auto-select-first>` |
| Server-side search | Bind `:items` to async results, watch `@update:search` |
| Custom item with avatar | Use `#item` slot |
| Tagging with free text | Use VCombobox instead |
