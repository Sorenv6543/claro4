# VProgressCircular
Source: packages/vuetify/src/components/VProgressCircular/VProgressCircular.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| modelValue | 0-100 | SVG stroke-dashoffset for arc progress | 0 |
| indeterminate | `true` `'disable-shrink'` | Continuous rotation animation; disable-shrink removes dash animation | -- |
| color | color string | Stroke color of progress arc | -- |
| bgColor | color string | Underlay circle stroke color | -- |
| size | `x-small` `small` `default` `large` `x-large` or number | Overall dimensions | default (32px) |
| width | number/string | Stroke thickness | 4 |
| rotate | number/string | Starting angle offset in degrees | 0 |
| rounded | boolean | Rounded stroke endpoints (`stroke-linecap: round`) | -- |

## Slot Anatomy
- **default**: Centered content inside the circle; receives `{ value }`

## Composable Hooks
- **useTextColor**: Arc stroke color
- **useSize**: Predefined size classes (x-small through x-large, scale: -2/-1/0/+2/+4)
- **provideTheme**: Theme context
- **useIntersectionObserver**: Pauses indeterminate animation when not visible
- **useReveal**: Optional reveal animation on mount
- **useResizeObserver**: Measures actual element size for SVG calculations

## SASS Hooks
- `$progress-circular-size`: 32px -- base size at "default"
- `$progress-circular-sizes`: x-small(-2), small(-1), default(0), large(+2), x-large(+4)
- `$progress-circular-rotate-animation`: progress-circular-rotate 1.4s linear infinite
- `$progress-circular-rotate-dash`: progress-circular-dash 1.4s ease-in-out infinite
- `$progress-circular-overlay-transition`: all 0.2s ease-in-out
- `$progress-circular-underlay-color`: rgba(border-color, border-opacity)
- `$progress-circular-reveal-duration`: 900ms

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Spinning loader | `indeterminate` |
| Percentage circle | `:model-value="75"` |
| Small inline spinner | `indeterminate size="x-small"` |
| Large hero spinner | `size="x-large" width="6"` |
| Progress with label | `<v-progress-circular :model-value="60"><span>60%</span></v-progress-circular>` |
| Rounded arc endpoints | `rounded` |
| Thick ring | `width="8"` |
| Custom start angle | `rotate="90"` (start from bottom) |
