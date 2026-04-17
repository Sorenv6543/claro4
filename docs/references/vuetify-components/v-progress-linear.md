# VProgressLinear
Source: packages/vuetify/src/components/VProgressLinear/VProgressLinear.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| modelValue | 0-100 (number) | Width of determinate bar as percentage | 0 |
| indeterminate | boolean | Animating bar with two looping segments | -- |
| color | color string | Bar fill color | -- |
| bgColor | color string | Track background color (defaults to `color`) | -- |
| bgOpacity | number/string | Track background opacity | -- |
| bufferValue | 0-100 | Buffer bar width percentage | 0 |
| bufferColor | color string | Buffer bar color | -- |
| height | number/string | Bar thickness in px | 4 |
| max | number | Maximum value for percentage calculation | 100 |
| striped | boolean | Diagonal stripe pattern on determinate bar | -- |
| stream | boolean | Dotted stream animation beyond buffer | -- |
| reverse | boolean | Reverses bar direction | -- |
| rounded | boolean or string | Rounds the track | -- |
| roundedBar | boolean | Rounds the progress bar itself | -- |
| absolute | boolean | `position: absolute` with z-index 1 | -- |
| active | boolean | Controls visibility; animates height to 0 when false | true |
| clickable | boolean | Allows clicking to set value | -- |
| location | `top` `bottom` | Position within parent | top |
| chunkCount | number | Divides bar into N equal segments | -- |
| chunkWidth | number | Fixed width per chunk (alternative to count) | -- |
| chunkGap | number | Gap between chunks | 4 |

## Slot Anatomy
- **default**: Overlay content centered on the bar; receives `{ value, buffer }`

## Composable Hooks
- **useBackgroundColor**: Track and buffer background colors
- **useTextColor**: Stream color
- **useRounded**: Track border radius
- **provideTheme**: Theme context
- **useIntersectionObserver**: Pauses animation when not visible
- **useChunks**: Segmented progress bar via CSS mask

## SASS Hooks
- `$progress-linear-background`: currentColor -- bar/track fill
- `$progress-linear-background-opacity`: var(--v-border-opacity) -- track opacity
- `$progress-linear-border-radius`: pill radius
- `$progress-linear-transition`: 0.2s standard-easing
- `$progress-linear-indeterminate-animation-duration`: 2.2s
- `$progress-linear-stripe-gradient`: diagonal 135deg stripe pattern
- `$progress-linear-stream-opacity`: 0.3

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Loading bar at page top | `indeterminate absolute location="top"` |
| File upload progress | `:model-value="percent"` with `color` |
| Buffered video progress | `:model-value="played" :buffer-value="buffered"` |
| Striped loading bar | `striped indeterminate` |
| Segmented/chunked bar | `:chunk-count="5"` |
| Thick progress bar | `height="10"` |
| Rounded bar ends | `rounded-bar` |
| Label overlay on bar | default slot: `<template #default="{ value }">{{ value }}%</template>` |
