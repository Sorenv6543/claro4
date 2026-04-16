# VExpansionPanel
Source: packages/vuetify/src/components/VExpansionPanel/VExpansionPanel.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| title | string | Text content for VExpansionPanelTitle | -- |
| text | string | Text content for VExpansionPanelText | -- |
| bgColor | color string | Background color of the panel | -- |
| color | color string | Title color (passed to VExpansionPanelTitle) | -- |
| elevation | 0-24 | Shadow on `.v-expansion-panel__shadow` | 1 (default shadow element) |
| rounded | boolean or string | Border radius | true |
| disabled | boolean | Prevents toggle, dims content | -- |
| value | any | Group item identifier for selection | -- |
| expandIcon | IconValue | Icon when collapsed | `$expand` |
| collapseIcon | IconValue | Icon when expanded | `$collapse` |
| hideActions | boolean | Hides the expand/collapse icon | -- |
| focusable | boolean | Adds active hover/focus states on title | -- |
| static | boolean | Disables min-height change on active state | -- |
| ripple | boolean/object | Ripple effect on title click | false |
| readonly | boolean | Prevents toggling | -- |
| eager | boolean | Renders content immediately, not lazily | -- |

## Slot Anatomy
- **default**: Raw content (use VExpansionPanelTitle + VExpansionPanelText manually)
- **title**: Custom title content inside VExpansionPanelTitle
- **text**: Custom text content inside VExpansionPanelText

### Sub-components
- **VExpansionPanelTitle**: Button element with expand/collapse icon; has `actions` slot
- **VExpansionPanelText**: Content wrapper with VExpandTransition animation

## Composable Hooks
- **useGroupItem**: Registers with parent VExpansionPanels group
- **useBackgroundColor**: Panel background color
- **useElevation**: Shadow classes on shadow element
- **useRounded**: Border radius classes

## SASS Hooks
- `$expansion-panel-background-color`: rgb(surface theme)
- `$expansion-panel-color`: on-surface with high emphasis
- `$expansion-panel-border-color`: border-color with border-opacity
- `$expansion-panel-border-radius`: root border radius
- `$expansion-panel-title-min-height`: 48px
- `$expansion-panel-active-title-min-height`: 64px
- `$expansion-panel-title-padding`: 16px 24px
- `$expansion-panel-title-font-size`: 0.9375rem
- `$expansion-panel-text-padding`: 8px 24px 16px
- `$expansion-panel-active-margin`: 16px -- vertical gap when active
- `$expansion-panel-disabled-opacity`: 0.26

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Simple expand/collapse item | `title="Question" text="Answer"` |
| Custom title with badge | Use `title` slot with custom markup |
| Rich expandable content | Use `text` slot or manual VExpansionPanelTitle + VExpansionPanelText |
| Disabled panel | `disabled` prop |
| No expand icon | `hide-actions` |
| Panel with background | `bg-color="surface-variant"` |
| Always-visible content area | `eager` prop |
