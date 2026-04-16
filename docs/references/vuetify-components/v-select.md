# VSelect
Source: packages/vuetify/src/components/VSelect/VSelect.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| variant | `'outlined'` `'filled'` `'underlined'` `'plain'` `'solo'` `'solo-inverted'` `'solo-filled'` | Field border/background style (via VTextField/VField) | outlined |
| density | `'default'` `'comfortable'` `'compact'` | Vertical padding/height | comfortable |
| rounded | boolean \| string \| number | Field border-radius | true |
| color | string | Focused state color (border, label, selected item highlight) | -- |
| baseColor | string | Unfocused state color | -- |
| bgColor | string | Field background-color | -- |
| hideDetails | boolean \| `'auto'` | Controls messages area visibility | auto |
| chips | boolean | Renders selected values as VChip components | -- |
| closableChips | boolean | Chips get a close button (requires `chips`) | -- |
| multiple | boolean | Allows multiple selections; adds checkboxes in list | -- |
| clearable | boolean | Shows clear icon when has value | -- |
| hideSelected | boolean | Hides already-selected items from the dropdown | -- |
| menuIcon | IconValue | Dropdown arrow icon (default: `$dropdown`); set `false` to hide | -- |
| menuProps | object | Props forwarded to the VMenu dropdown | -- |
| menuElevation | number \| string | Elevation shadow on the dropdown sheet | -- |
| itemColor | string | Color for selected list items (falls back to `color`) | -- |
| label | string | Floating label text | -- |
| items | array | List of options (strings, objects, or mixed) | -- |
| itemTitle | SelectItemKey | Key for display text | -- |
| itemValue | SelectItemKey | Key for the underlying value | -- |
| returnObject | boolean | Model value is the full object, not just itemValue | -- |
| noDataText | string | Text shown when no items match | -- |

## Slot Anatomy
- item: Custom rendering per dropdown item; receives `{ item, internalItem, index, props }`
- selection: Custom rendering per selected value; receives `{ item, internalItem, index }`
- chip: Custom chip rendering (when `chips` is true)
- prepend-item / append-item: Content before/after the list
- no-data: Shown when items list is empty
- menu-header / menu-footer: Header/footer inside the dropdown sheet
- prepend / append / prepend-inner / append-inner: Field icon slots (inherited)

## Composable Hooks
- useItems: Transforms raw items into ListItem objects
- useFilter: Filters items by search (when search prop is used)
- useScrolling: Keyboard scroll in dropdown list
- useForm: Reads disabled/readonly from parent VForm
- useMenuActivator: Manages menu ARIA attributes
- useProxiedModel: Two-way `modelValue` and `menu` binding

## SASS Hooks
- `$select-content-elevation`: Dropdown shadow depth (default: `2`)
- `$select-content-border-radius`: Dropdown corner radius (default: `4px`)
- `$select-transition`: Menu icon rotation transition
- `.v-select--active-menu`: Rotates menu icon 180deg
- `.v-select__selection`: Inline-flex container for each selected value
- `.v-select__content`: Dropdown content wrapper (overflow hidden, elevated)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Standard dropdown | `<v-select :items="options">` (Claro4 defaults apply) |
| Multi-select with chips | `<v-select :items="options" multiple chips closable-chips>` |
| Select with custom item template | Use `#item` slot with `v-list-item v-bind="props"` |
| Grouped options | Pass items with `type: 'subheader'` or `type: 'divider'` |
| Searchable select | Use VAutocomplete instead |
| Select with no border | `<v-select variant="plain">` |
