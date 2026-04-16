# VExpansionPanels
Source: packages/vuetify/src/components/VExpansionPanel/VExpansionPanels.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| variant | `default` `accordion` `inset` `popout` | Layout variant; accordion removes gaps, inset/popout adjust max-width | default |
| flat | boolean | Removes border-top dividers and shadow on panels | -- |
| modelValue | any | Selected panel(s); array for multiple | -- |
| multiple | boolean | Allow multiple panels open simultaneously (via group composable) | -- |
| mandatory | boolean or `'force'` | Require at least one panel open | -- |
| max | number | Maximum number of open panels | -- |
| rounded | boolean or string | Border radius on the container | -- |
| tile | boolean | Removes all border radius (sets 0) | -- |
| bgColor | color string | Passed down to child VExpansionPanel | -- |
| color | color string | Passed down to child panels | -- |
| elevation | 0-24 | Passed down to child panels | -- |
| expandIcon | IconValue | Override expand icon for all panels | `$expand` |
| collapseIcon | IconValue | Override collapse icon for all panels | `$collapse` |
| hideActions | boolean | Hide expand/collapse icons on all panels | -- |
| eager | boolean | Render all panel content eagerly (no lazy loading) | -- |
| readonly | boolean | Prevent all panels from toggling | -- |
| ripple | boolean/object | Ripple on panel title click | false |
| focusable | boolean | Adds active states when focused | -- |

## Slot Anatomy
- **default**: VExpansionPanel children; receives `{ prev, next }` navigation functions

## Composable Hooks
- **useGroup**: Manages selection state (single/multiple, mandatory)
- **useRounded**: Container border radius
- **provideTheme**: Theme context
- **provideDefaults**: Passes shared props to all child VExpansionPanel instances

## SASS Hooks
- `$expansion-panel-border-radius`: root border radius
- `$expansion-panel-active-margin`: 16px -- gap around active panel (default variant)
- `$expansion-panel-popout-max-width`: 100% - 32px (inactive), 100% + 16px (active)
- `$expansion-panel-inset-max-width`: 100% (inactive), 100% - 32px (active)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Standard accordion | `variant="accordion"` |
| FAQ list (one open at a time) | Default variant with single selection |
| Multiple open panels | `multiple` prop |
| Flat borderless panels | `flat` prop |
| Inset active panel effect | `variant="inset"` |
| Pop-out active panel | `variant="popout"` |
| Read-only display | `readonly` prop |
| No rounded corners | `tile` prop |
