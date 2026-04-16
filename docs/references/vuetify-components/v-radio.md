# VRadio
Source: packages/vuetify/src/components/VRadio/VRadio.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| color | string | Selected-state color of the radio icon and ripple | -- |
| baseColor | string | Unselected-state color | -- |
| density | `'default'` `'comfortable'` `'compact'` | Adjusts min-height via density system | -- |
| disabled | boolean | Grays out, prevents interaction | -- |
| error | boolean | Applies error color | -- |
| label | string | Text label next to the radio button | -- |
| ripple | boolean \| object | Enables/disables ripple (default: `true`) | -- |
| trueIcon | IconValue | Icon when selected (default: `$radioOn`) | -- |
| falseIcon | IconValue | Icon when unselected (default: `$radioOff`) | -- |
| value | any | The value this radio represents in the group model | -- |
| inline | boolean | Displays radio buttons horizontally | -- |
| readonly | boolean | Prevents changes without disabling | -- |
| multiple | boolean | Typically `false` for radios (managed by group) | -- |

Note: VRadio is a thin wrapper around VSelectionControl with `type="radio"`. It is typically used inside a `<v-radio-group>` which provides the shared `v-model`, `color`, and `density`.

## Slot Anatomy
- default: Custom content in the selection control area
- label: Custom label; receives `{ label, props }`
- input: Custom input element; receives `{ model, icon, inputNode, backgroundColorClasses, backgroundColorStyles }`

## Composable Hooks
- VSelectionControl: Renders radio icon, native radio input, ripple, and label
- VSelectionControlGroup (via v-radio-group): Coordinates model value across radios

## SASS Hooks
- `.v-radio`: Root class (adds to VSelectionControl styles)
- `.v-selection-control`: Inherited styles for the control (icon, ripple, density)
- No dedicated SASS variables file for VRadio; inherits from VSelectionControl

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Radio button group | `<v-radio-group v-model="choice"><v-radio label="A" value="a" /><v-radio label="B" value="b" /></v-radio-group>` |
| Horizontal radios | `<v-radio-group inline>` |
| Colored radios | `<v-radio-group color="primary">` |
| Compact radio list | `<v-radio-group density="compact">` |
| Custom radio icons | `<v-radio true-icon="mdi-star" false-icon="mdi-star-outline">` |
| Disabled option | `<v-radio label="Unavailable" disabled>` |
