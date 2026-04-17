# VTab
Source: packages/vuetify/src/components/VTabs/VTab.tsx

## Overview
Individual tab button, extending VBtn. Renders inside VTabs with an active slider indicator. Supports animated slider transitions (shift, grow, fade) between selected tabs.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| color | string | Text/icon color when selected (inherited from VBtn) | -- |
| variant | string | Button variant (default: 'text') | -- |
| rounded | boolean/string | Border-radius (default: 0 for tabs) | -- |
| size | string | Button size | -- |
| density | string | Density | -- |
| icon | IconValue | Tab icon | -- |
| prependIcon | IconValue | Icon before text | -- |
| appendIcon | IconValue | Icon after text | -- |
| stacked | boolean | Stack icon above text | -- |
| ripple | boolean/object | Ripple effect | -- |
| sliderColor | string | Color of active indicator | -- |
| sliderTransition | 'shift' / 'grow' / 'fade' | Slider animation type (default: 'shift') | -- |
| sliderTransitionDuration | string/number | Animation duration in ms (shift=225, grow=350, fade=400) | -- |
| hideSlider | boolean | Hides the bottom indicator | -- |
| fixed | boolean | Full-width tab (`block` mode, max-width: 300px) | -- |
| inset | boolean | Inset/pill style (slider becomes background fill) | -- |
| selectedClass | string | Class when selected (default: 'v-tab--selected') | -- |
| text | string | Tab label text | -- |
| value | any | Tab value for v-model matching | -- |

## Slot Anatomy
- default: Custom tab content (replaces `text` prop)
- prepend: Content before text (from VBtn)
- append: Content after text (from VBtn)

## Composable Hooks
- useTextColor: Applies slider color as text color (CSS currentColor for the slider)
- useBackgroundColor: Applies slider color as background in inset mode
- forwardRefs: Exposes VBtn ref (including group selection state)

## SASS Hooks
- `$tab-border-radius`: Default border-radius (0)
- `$tab-min-width`: Minimum width (90px)
- `$tab-max-width`: Maximum width in horizontal mode (360px)
- `$tab-slider-size`: Slider thickness (2px)
- `.v-tab__slider`: Absolute-positioned indicator at bottom (horizontal) or left (vertical)
- `.v-tab--selected .v-tab__slider`: opacity: 1
- `.v-tab`: height from `var(--v-tabs-height)`

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Text-only tab | `<v-tab text="Label" value="val">` |
| Icon-only tab | `<v-tab icon="mdi-home" value="home">` |
| Icon + text tab | `<v-tab prepend-icon="mdi-home" text="Home">` |
| Custom slider color | `<v-tab slider-color="accent">` |
| No underline indicator | `<v-tab hide-slider>` |
| Smooth slide animation | Default behavior (shift transition) |
| Fade animation | `<v-tabs slider-transition="fade">` (set on VTabs) |
