# VTabs
Source: packages/vuetify/src/components/VTabs/VTabs.tsx

## Overview
Tab navigation container built on VSlideGroup. Manages a set of VTab items with an active indicator slider. Can auto-generate VTabsWindow for tab content panels. Supports horizontal and vertical directions, inset style, and multiple alignment modes.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| color | string | Active tab color (passed to VTab) | -- |
| bgColor | string | Background color of the tab bar | -- |
| sliderColor | string | Active indicator/slider color | -- |
| density | 'default' / 'comfortable' / 'compact' | Height: default=48px, comfortable=-1, compact=-3 | -- |
| alignTabs | 'start' / 'title' / 'center' / 'end' | Tab alignment within container | -- |
| fixedTabs | boolean | Equal-width tabs with auto margins | -- |
| grow | boolean | Tabs expand to fill width (`flex: 1 0 auto`) | -- |
| stacked | boolean | Stacks icon above text (height becomes 72px) | -- |
| height | number/string | Explicit tab bar height | -- |
| hideSlider | boolean | Hides the active indicator line | -- |
| inset | boolean | Inset/pill style: tabs rendered inside a tinted container with rounded slider | -- |
| insetPadding | string/number | Padding inside inset container | -- |
| insetRadius | string/number | Border-radius of inset slider | -- |
| direction | 'horizontal' / 'vertical' | Tab layout direction | -- |
| items | TabItem[] | Array of tab items (string, number, or object with text/value) | -- |

## Slot Anatomy
- default: Manual VTab children (overrides `items` prop)
- tab: Custom tab rendering per item `({ item })`
- item: Custom window item content per tab `({ item })`
- window: Additional content in VTabsWindow
- prev: Custom previous arrow for VSlideGroup
- next: Custom next arrow for VSlideGroup
- `tab.{value}`: Named slot for specific tab
- `item.{value}`: Named slot for specific window item

## Sub-components
- **VTabsWindow**: Content panel container (uses VWindow internally)
- **VTabsWindowItem**: Individual content panel (uses VWindowItem)

## Internal Defaults
Provides defaults to child VTab: `color`, `direction`, `stacked`, `fixed`, `inset`, `sliderColor`, `sliderTransition`, `sliderTransitionDuration`, `hideSlider`

## Composable Hooks
- useBackgroundColor: Applies tab bar background
- useDensity: Applies density height
- useProxiedModel: v-model for selected tab
- provideDefaults: Passes props to child VTab components

## SASS Hooks
- `$tabs-height`: Default height (48px)
- `$tabs-stacked-height`: Stacked mode height (72px)
- `$tabs-density`: Density map (default: 0, comfortable: -1, compact: -3)
- `--v-tabs-height`: CSS var controlling height
- `--v-tabs-inset-padding`: Inset mode inner padding (4px)
- `--v-tabs-inset-radius`: Inset slider border-radius
- `--v-tabs-slider-background`: Inset slider background color
- `.v-tabs--fixed-tabs / .v-tabs--grow`: Width distribution modes
- `.v-tabs--align-tabs-{position}`: Alignment classes
- `.v-tabs--inset`: Background tint, box-shadow, rounded container

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Standard horizontal tabs | `<v-tabs v-model="tab" :items="['Tab 1', 'Tab 2']">` |
| Center-aligned tabs | `<v-tabs align-tabs="center">` |
| Equal-width tabs | `<v-tabs fixed-tabs>` or `<v-tabs grow>` |
| Colored active tab | `<v-tabs color="primary">` |
| Vertical side tabs | `<v-tabs direction="vertical">` |
| Tabs inside app bar | Place `<v-tabs>` in VAppBar's extension slot |
| Inset/pill-style tabs | `<v-tabs inset>` |
| Tabs with icons | `<v-tabs stacked>` with VTab having icon + text |
| Hide active indicator | `<v-tabs hide-slider>` |
