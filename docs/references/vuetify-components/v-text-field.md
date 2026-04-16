# VTextField
Source: packages/vuetify/src/components/VTextField/VTextField.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| variant | `'outlined'` `'filled'` `'underlined'` `'plain'` `'solo'` `'solo-inverted'` `'solo-filled'` | Controls field border/background style via VField | outlined |
| density | `'default'` `'comfortable'` `'compact'` | Adjusts vertical padding/height via CSS density system | comfortable |
| rounded | boolean \| string \| number | Adds border-radius to the field wrapper | true |
| color | string | Sets the focused state color (border, label) | -- |
| baseColor | string | Sets the unfocused state color | -- |
| bgColor | string | Sets `background-color` of the field | -- |
| hideDetails | boolean \| `'auto'` | `true` hides messages area; `'auto'` hides when no messages | auto |
| clearable | boolean | Shows clear icon when field has value | -- |
| disabled | boolean | Grays out field, sets `--v-disabled-opacity` | -- |
| prefix | string | Renders text before input value | -- |
| suffix | string | Renders text after input value | -- |
| prependIcon | IconValue | Icon before the input wrapper | -- |
| appendIcon | IconValue | Icon after the input wrapper | -- |
| prependInnerIcon | IconValue | Icon inside the field, before input | -- |
| appendInnerIcon | IconValue | Icon inside the field, after input | -- |
| counter | boolean \| number \| string | Shows character counter in details area | -- |
| label | string | Floating label text | -- |
| placeholder | string | Input placeholder text | -- |
| singleLine | boolean | Label does not float; stays inline | -- |
| flat | boolean | Removes elevation on solo variants | -- |

## Slot Anatomy
- prepend: Before the entire input (outside field)
- append: After the entire input (outside field)
- prepend-inner: Inside the field, before input
- append-inner: Inside the field, after input
- label: Custom label content
- clear: Custom clear icon
- details: Below the field (messages area)
- counter: Custom counter content
- default: Wraps around the native `<input>`, receives `{ id }`

## Composable Hooks
- useFocus: Manages `isFocused` state and emits `update:focused`
- useProxiedModel: Two-way `modelValue` binding
- useAutocomplete: Handles browser autofill name/autocomplete attributes
- VInput (component): Provides validation, messages, prepend/append icons
- VField (component): Provides variant rendering, label, outline, background

## SASS Hooks
- `$text-field-affix-color`: Color of prefix/suffix text
- `$text-field-border-radius`: Field border radius (inherits from VField)
- `$text-field-input-flex`: Input flex property (default: `1`)
- `$text-field-input-transition`: Input opacity transition
- `.v-text-field--prefixed` / `.v-text-field--suffixed`: Modifier classes adjusting field padding

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Outlined rounded input | `<v-text-field>` (Claro4 defaults apply) |
| Search bar with icon | `<v-text-field prepend-inner-icon="mdi-magnify" clearable>` |
| Input with $ prefix | `<v-text-field prefix="$">` |
| Character-limited input | `<v-text-field counter="100" maxlength="100">` |
| Compact form field | `<v-text-field density="compact">` |
| Password field | `<v-text-field type="password">` |
