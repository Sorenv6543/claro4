# VCheckbox
Source: packages/vuetify/src/components/VCheckbox/VCheckbox.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| color | string | Sets the checked-state color of the checkbox icon and ripple | -- |
| baseColor | string | Sets the unchecked-state color | -- |
| density | `'default'` `'comfortable'` `'compact'` | Adjusts min-height via `--v-input-control-height` | -- |
| disabled | boolean | Applies `--v-disabled-opacity`, prevents interaction | -- |
| error | boolean | Colors the checkbox with `$checkbox-error-color` (theme error) | -- |
| indeterminate | boolean | Shows indeterminate icon (`$checkboxIndeterminate`) instead of on/off | -- |
| label | string | Text label displayed next to the checkbox | -- |
| hideDetails | boolean \| `'auto'` | Controls validation messages area visibility | -- |
| ripple | boolean \| object | Enables/disables the ripple effect (default: `true`) | -- |
| trueValue | any | Value emitted when checked (default: `true`) | -- |
| falseValue | any | Value emitted when unchecked (default: `false`) | -- |
| trueIcon | IconValue | Icon when checked (default: `$checkboxOn`) | -- |
| falseIcon | IconValue | Icon when unchecked (default: `$checkboxOff`) | -- |
| readonly | boolean | Prevents changes but does not gray out | -- |

## Slot Anatomy
- default: Custom content replacing the selection control area
- label: Custom label content; receives `{ label, props }`
- input: Custom input element; receives `{ model, icon, inputNode, backgroundColorClasses, backgroundColorStyles }`
- prepend / append: Before/after the entire input (from VInput)

## Composable Hooks
- useFocus: Manages focused state
- useProxiedModel: Two-way `modelValue` binding
- VInput: Provides validation messages, prepend/append, layout
- VCheckboxBtn -> VSelectionControl: Renders the actual checkbox icon, ripple, and native input

## SASS Hooks
- `$checkbox-flex`: Flex shorthand for the root (default: `0 1 auto`)
- `$checkbox-disabled-color`: Color when disabled
- `$checkbox-error-color`: Color when in error state (`rgb(var(--v-theme-error))`)
- `.v-checkbox`: Root class
- `.v-checkbox-btn`: Inner selection control class
- `.v-selection-control`: Inherited control styles (min-height matches density)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Single checkbox with label | `<v-checkbox label="Accept terms" v-model="accepted">` |
| Colored checkbox | `<v-checkbox color="primary">` |
| Indeterminate (select-all) | `<v-checkbox indeterminate v-model="selectAll">` |
| Checkbox group | Multiple `<v-checkbox>` with same `v-model` array and different `value` |
| Compact checkbox list | `<v-checkbox density="compact">` |
| Custom icons | `<v-checkbox true-icon="mdi-check-circle" false-icon="mdi-circle-outline">` |
