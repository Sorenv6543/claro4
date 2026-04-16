# VCombobox
Source: packages/vuetify/src/components/VCombobox/VCombobox.tsx

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
| closableChips | boolean | Chips get close buttons | -- |
| multiple | boolean | Multi-selection with checkboxes | -- |
| clearable | boolean | Shows clear icon | -- |
| delimiters | string[] | Characters that trigger tag creation (e.g., `[',', ' ']`) | -- |
| autoSelectFirst | boolean \| `'exact'` | Auto-highlights first dropdown match | -- |
| clearOnSelect | boolean | Clears search after selection (default: `true`) | -- |
| alwaysFilter | boolean | Filters even when input is pristine | -- |
| hideNoData | boolean | Hides dropdown when no items (default: `true`) | -- |
| returnObject | boolean | Model stores full objects (default: `true`) | -- |
| menuIcon | IconValue | Dropdown icon | -- |
| items | array | Predefined option list | -- |

## Slot Anatomy
- item: Custom dropdown item; receives `{ item, internalItem, index, props }`
- selection: Custom selected value rendering
- chip: Custom chip rendering (with `chips` prop)
- prepend-item / append-item: Before/after the list
- no-data: Empty state content
- menu-header / menu-footer: Dropdown header/footer
- prepend / append / prepend-inner / append-inner: Field icon slots

## Composable Hooks
- useFilter: Filters predefined items by typed text
- useItems / transformItem: Converts free-text entries into ListItem objects
- useScrolling: Keyboard navigation in dropdown
- useForm: Inherits disabled/readonly from VForm
- useMenuActivator: ARIA attributes
- useTextColor: Highlight color for selected chip navigation

## SASS Hooks
- `$combobox-content-elevation`: Dropdown shadow (default: `2`)
- `$combobox-content-border-radius`: Dropdown corners (default: `4px`)
- `$combobox-focused-input`: Min input width when focused (default: `64px`)
- `$combobox-selection-gap`: Gap after selections (default: `2px`)
- `.v-combobox--active-menu`: Rotates dropdown icon
- `.v-combobox--selecting-index`: Dims chips during keyboard nav

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Tag input (free text + suggestions) | `<v-combobox :items="suggestions" multiple chips closable-chips>` |
| Comma-separated tag entry | `<v-combobox multiple chips :delimiters="[',']">` |
| Single free-text with suggestions | `<v-combobox :items="opts">` |
| Paste multiple tags at once | Built-in: paste comma/newline-separated text |
| Searchable select (no free text) | Use VAutocomplete instead |
