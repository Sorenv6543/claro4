# VFileInput
Source: packages/vuetify/src/components/VFileInput/VFileInput.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| variant | `'outlined'` `'filled'` `'underlined'` `'plain'` `'solo'` `'solo-inverted'` `'solo-filled'` | Field border/background style via VField | -- |
| density | `'default'` `'comfortable'` `'compact'` | Vertical padding/height | -- |
| rounded | boolean \| string \| number | Field border-radius | -- |
| color | string | Focused state color | -- |
| baseColor | string | Unfocused state color | -- |
| bgColor | string | Field background-color | -- |
| hideDetails | boolean \| `'auto'` | Controls messages area visibility | -- |
| clearable | boolean | Shows clear icon (default: `true` for file input) | -- |
| chips | boolean | Renders file names as VChip components | -- |
| multiple | boolean | Allows selecting multiple files | -- |
| showSize | boolean \| `1000` \| `1024` | Appends file size to names; base for humanReadableFileSize | -- |
| counter | boolean | Shows file count in details area | -- |
| hideInput | boolean | Hides the field, shows only the prepend icon for icon-only upload | -- |
| prependIcon | IconValue | Icon before the field (default: `$file`) | -- |
| label | string | Floating label | -- |
| truncateLength | number \| string | Max filename length before truncation (default: `22`) | -- |
| filterByType | string | MIME type filter for file selection (also used for drag-drop filtering) | -- |
| accept | string (via attrs) | Native file input accept attribute | -- |

## Slot Anatomy
- selection: Custom rendering of selected files; receives `{ fileNames, totalBytes, totalBytesReadable }`
- prepend / append: Before/after the field wrapper
- prepend-inner / append-inner: Inside the field
- label: Custom label
- clear: Custom clear icon
- details: Messages area
- counter: Custom counter content

## Composable Hooks
- useFocus: Manages focused state
- useProxiedModel: Two-way `modelValue` binding (File[] or File)
- useLocale: Translates counter strings
- useFileDrop: Handles drag-and-drop file uploads (including folder support)
- useFileFilter: Filters files by MIME type
- VInput / VField: Validation, variant rendering

## SASS Hooks
- `.v-file-input--chips`: Modifier for chip display (adjusts floating label position at compact density)
- `.v-file-input--hide`: Hides field/control/details, centers prepend icon
- `.v-file-input--dragging`: Brings file input z-index to front during drag
- `input[type="file"]`: Absolutely positioned, opacity 0, covers entire field for click targets

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Standard file picker | `<v-file-input label="Upload file">` |
| Multi-file with chips | `<v-file-input multiple chips show-size>` |
| Icon-only upload button | `<v-file-input hide-input>` |
| Image-only upload | `<v-file-input accept="image/*">` |
| Drag-and-drop zone | Built-in: file input supports drag-drop by default |
| File count display | `<v-file-input counter multiple>` |
| Custom file display | Use `#selection` slot with `{ fileNames, totalBytesReadable }` |
