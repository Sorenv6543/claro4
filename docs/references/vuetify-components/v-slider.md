# VSlider
Source: packages/vuetify/src/components/VSlider/VSlider.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| color | string | Sets track fill and thumb color | -- |
| trackColor | string | Unfilled track color (overrides `color`) | -- |
| trackFillColor | string | Filled track color (overrides `color`) | -- |
| thumbColor | string | Thumb color (overrides `color`) | -- |
| trackSize | number \| string | Track thickness in px (default: `4`) | -- |
| thumbSize | number \| string | Thumb diameter in px (default: `20`) | -- |
| thumbLabel | boolean \| `'always'` \| `'hover'` | Shows value label above thumb | -- |
| elevation | number \| string | Thumb shadow depth (default: `1`) | -- |
| rounded | boolean \| string \| number | Thumb border-radius (default: circular) | -- |
| direction | `'horizontal'` \| `'vertical'` | Layout direction (default: `'horizontal'`) | -- |
| reverse | boolean | Reverses slider direction | -- |
| disabled | boolean | Disables slider, applies `--v-disabled-opacity` | -- |
| readonly | boolean | Prevents changes without disabling | -- |
| error | boolean | Applies theme error color | -- |
| min | number \| string | Minimum value (default: `0`) | -- |
| max | number \| string | Maximum value (default: `100`) | -- |
| step | number \| string | Step increment (default: `0` = continuous) | -- |
| showTicks | boolean \| `'always'` | Shows tick marks along the track | -- |
| ticks | number[] \| Record\<number, string\> | Custom tick positions with optional labels | -- |
| tickSize | number \| string | Tick mark size in px (default: `2`) | -- |
| label | string | Label text shown before slider | -- |
| hideDetails | boolean \| `'auto'` | Controls messages area visibility | -- |
| ripple | boolean | Thumb ripple on interaction (default: `true`) | -- |

## Slot Anatomy
- prepend: Content before the slider (where label goes)
- append: Content after the slider
- label: Custom label; receives `{ id }`
- thumb-label: Custom thumb label content; receives `{ modelValue }`
- tick-label: Custom tick label; receives `{ tick, index }`
- details: Messages area

## Composable Hooks
- useSlider: Core slider logic (mouse/touch handling, position calculation, provide/inject for sub-components)
- useSteps: Computes min/max/step/decimals and roundValue function
- useFocus: Manages thumb focus state
- useRtl: RTL-aware direction handling
- useForm: Inherits disabled/readonly from VForm
- VInput: Validation, messages, layout

## SASS Hooks
- `$slider-horizontal-min-height`: Minimum track area height (default: `32px`)
- `$slider-thumb-border-radius`: Thumb shape (default: `50%`)
- `$slider-thumb-label-font-size`: Thumb label text size
- `$slider-thumb-label-border-radius`: Thumb label corners (default: `4px`)
- `$slider-track-border-radius`: Track end caps (default: `6px`)
- `$slider-track-active-size-offset`: Extra thickness for active track (default: `2px`)
- `$slider-tick-background`: Tick mark color
- `$slider-vertical-min-height`: Vertical mode height (default: `300px`)
- `.v-slider--has-labels`: Adds bottom margin for tick labels
- `.v-slider--focused` / `.v-slider--pressed`: Focus/pressed state classes

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Basic range slider | `<v-slider v-model="val" min="0" max="100">` |
| Slider with thumb label | `<v-slider thumb-label>` |
| Always-visible label | `<v-slider thumb-label="always">` |
| Discrete steps | `<v-slider step="10" show-ticks>` |
| Labeled tick marks | `<v-slider :ticks="{ 0: 'Low', 50: 'Mid', 100: 'High' }" show-ticks="always">` |
| Vertical slider | `<v-slider direction="vertical">` |
| Colored track | `<v-slider color="primary" track-color="grey-lighten-2">` |
| Range slider (two thumbs) | Use `<v-range-slider>` instead |
