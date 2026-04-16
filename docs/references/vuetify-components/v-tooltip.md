# VTooltip
Source: packages/vuetify/src/components/VTooltip/VTooltip.tsx

Lightweight overlay for hover/focus hints. Wraps VOverlay with connected positioning, no scrim, and pointer-events disabled by default.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| text | string | Tooltip text content (alternative to default slot) | -- |
| location | Anchor string | Position relative to activator | `end` (right in LTR) |
| origin | `auto` / Anchor | Transform origin for transition | auto |
| offset | number/string/number[] | Gap between tooltip and activator (px) | 10 |
| openOnHover | boolean | Show on mouseenter | true |
| openOnClick | boolean | Show on click | false |
| openOnFocus | boolean | Show on focus | inherited |
| openDelay | number | Delay before showing (ms) | inherited |
| closeDelay | number | Delay before hiding (ms) | inherited |
| interactive | boolean | Allows pointer events on tooltip content (for clickable links) | -- |
| transition | string/null | Enter/leave transition | scale-transition (enter) / fade-transition (leave) |
| modelValue | boolean | Manual control of visibility | -- |
| eager | boolean | Pre-render content | true |
| contentClass | string | Extra class on tooltip element | -- |
| disabled | boolean | Prevents tooltip from showing | -- |
| zIndex | number/string | z-index | 2000 (inherited) |

## Slot Anatomy
- **activator**: `{ isActive, props, targetRef }` -- element the tooltip describes; bind `props` for aria-describedby + hover handlers
- **default**: `{ isActive }` -- tooltip content; falls back to `text` prop if not provided

## Composable Hooks
- **useProxiedModel**: two-way binding for modelValue
- **useScopeId**: scoped CSS isolation
- **VOverlay internals**: useLocationStrategies (connected), useScrollStrategies (reposition), useActivator (openOnHover=true)

## SASS Hooks
| Variable / Class | Controls |
|-----------------|----------|
| `$tooltip-background-color` | Background (default surface-variant theme color) |
| `$tooltip-text-color` | Text color (default on-surface-variant) |
| `$tooltip-border-radius` | Border radius (default border-radius-root) |
| `$tooltip-font-size` | Font size (0.875rem) |
| `$tooltip-line-height` | Line height (1.6) |
| `$tooltip-padding` | Inner padding (5px 16px) |
| `$tooltip-overflow-wrap` | Text wrapping (break-word) |
| `$tooltip-transition-enter-duration` | Enter animation (150ms) |
| `$tooltip-transition-leave-duration` | Leave animation (75ms) |
| `.v-tooltip:not(.v-tooltip--interactive)` | pointer-events: none on content |

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Hover hint on icon button | `<v-tooltip text="Help">` with activator slot |
| Tooltip above element | `location="top"` |
| Tooltip to the left | `location="start"` |
| Click-triggered tooltip | `openOnClick` + `:open-on-hover="false"` |
| Tooltip with rich content | Default slot instead of `text` prop + `interactive` |
| Programmatic tooltip | `v-model` to control manually |
| Wider tooltip spacing | Increase `offset` prop |
