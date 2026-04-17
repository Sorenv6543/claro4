# VTextarea
Source: packages/vuetify/src/components/VTextarea/VTextarea.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| variant | `'outlined'` `'filled'` `'underlined'` `'plain'` `'solo'` `'solo-inverted'` `'solo-filled'` | Controls field border/background style via VField | outlined |
| density | `'default'` `'comfortable'` `'compact'` | Adjusts vertical padding/height | -- |
| rounded | boolean \| string \| number | Adds border-radius to the field wrapper | true |
| color | string | Focused state color (border, label) | -- |
| baseColor | string | Unfocused state color | -- |
| bgColor | string | Field background-color | -- |
| hideDetails | boolean \| `'auto'` | Controls messages area visibility | auto |
| autoGrow | boolean | Textarea height grows with content; adds `.v-textarea--auto-grow` | -- |
| noResize | boolean | Disables manual resize handle; sets `resize: none` | -- |
| rows | number \| string | Sets initial textarea rows (default: 5) | -- |
| maxHeight | number \| string | CSS `--v-textarea-max-height` for auto-grow cap | -- |
| maxRows | number \| string | Maximum rows for auto-grow (converted to maxHeight) | -- |
| clearable | boolean | Shows clear icon | -- |
| counter | boolean \| number \| string | Character counter in details area | -- |
| prefix | string | Text before textarea | -- |
| suffix | string | Text after textarea | -- |
| label | string | Floating label | -- |
| placeholder | string | Textarea placeholder | -- |

## Slot Anatomy
- prepend / append: Outside the field wrapper
- prepend-inner / append-inner: Inside the field
- label: Custom label content
- clear: Custom clear icon
- details: Messages/counter area
- counter: Custom counter

## Composable Hooks
- useFocus: Manages focused state
- useProxiedModel: Two-way `modelValue` binding
- useDisplay: Platform detection (Firefox scrollbar width fix)
- VInput / VField: Inherited validation, variant rendering

## SASS Hooks
- `--v-textarea-control-height`: Controls field height (set by auto-grow)
- `--v-textarea-max-height`: Maximum height for scrollable textarea
- `--v-textarea-scroll-bar-width`: Compensates for scrollbar in mask
- `.v-textarea--auto-grow`: Enables auto-grow behavior
- `.v-textarea--no-resize`: Disables resize handle (`resize: none`)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Standard outlined textarea | `<v-textarea>` (Claro4 defaults apply) |
| Auto-growing comment box | `<v-textarea auto-grow rows="3" max-rows="8">` |
| Fixed-size textarea | `<v-textarea no-resize rows="6">` |
| Textarea with char limit | `<v-textarea counter="500" maxlength="500">` |
| Compact notes field | `<v-textarea density="compact" rows="3">` |
