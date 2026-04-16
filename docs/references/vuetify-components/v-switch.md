# VSwitch
Source: packages/vuetify/src/components/VSwitch/VSwitch.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| color | string | Track/thumb color when toggled on | -- |
| baseColor | string | Color when toggled off | -- |
| density | `'default'` `'comfortable'` `'compact'` | Adjusts control height via density system | -- |
| inset | boolean | Switches to inset style: larger track (52x32px), thumb inside track | -- |
| flat | boolean | Removes thumb elevation shadow; uses `surface-variant` colors | -- |
| disabled | boolean | Grays out, prevents interaction | -- |
| error | boolean | Applies error background/color on track and thumb | -- |
| loading | boolean \| string | Shows a VProgressCircular inside thumb; string value sets loader color | -- |
| indeterminate | boolean | Shows thumb at center, scaled down | -- |
| label | string | Text label next to the switch | -- |
| hideDetails | boolean \| `'auto'` | Controls messages area visibility | -- |
| ripple | boolean \| object | Enables/disables ripple (default: `true`) | -- |
| readonly | boolean | Prevents changes without disabling | -- |
| trueIcon | IconValue | Icon shown in thumb when on | -- |
| falseIcon | IconValue | Icon shown in thumb when off | -- |

## Slot Anatomy
- label: Custom label content
- input: Custom input area; receives `{ inputNode, icon, backgroundColorClasses, backgroundColorStyles }`
- thumb: Custom thumb content; receives `{ model, isValid, icon }`
- track-true: Content inside track visible when on
- track-false: Content inside track visible when off
- loader: Custom loading indicator; receives `{ isActive, color }`
- prepend / append: Before/after the entire input (from VInput)

## Composable Hooks
- useFocus: Manages focused state
- useProxiedModel: Two-way `modelValue` and `indeterminate` binding
- useLoader: Manages loading state CSS classes
- VInput: Validation, messages, layout
- VSelectionControl: Checkbox-type native input, icon rendering

## SASS Hooks
- `$switch-track-width` / `$switch-track-height`: Track dimensions (default: 36x14px)
- `$switch-track-background`: Track bg color (`surface-variant`)
- `$switch-track-radius`: Track border-radius (default: `9999px`)
- `$switch-track-opacity`: Track opacity (default: `0.6`)
- `$switch-thumb-height` / `$switch-thumb-width`: Thumb size (default: 20x20px)
- `$switch-thumb-elevation`: Thumb shadow depth (default: `2`)
- `$switch-thumb-background`: Thumb color (`surface-bright`)
- `$switch-inset-track-width` / `$switch-inset-track-height`: Inset track (52x32px)
- `$switch-inset-thumb-height` / `$switch-inset-thumb-width`: Inset thumb (24x24px)
- `$switch-error-background-color` / `$switch-error-color`: Error state colors
- `.v-switch--flat`: Removes thumb elevation
- `.v-switch--inset`: Inset variant modifier

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Basic toggle switch | `<v-switch v-model="enabled" label="Enable">` |
| Inset (Material 3 style) | `<v-switch inset>` |
| Switch with icons | `<v-switch true-icon="mdi-check" false-icon="mdi-close">` |
| Loading state | `<v-switch loading>` |
| Track with text | Use `#track-true` and `#track-false` slots |
| Flat style (no shadow) | `<v-switch flat>` |
| Colored toggle | `<v-switch color="success">` |
