# VMenu
Source: packages/vuetify/src/components/VMenu/VMenu.tsx

Wraps VOverlay with connected positioning, no scrim, keyboard navigation, and nested submenu support.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| location | Anchor string | Position relative to activator (`bottom`, `top`, `start`, `end`, etc.) | bottom (default); `end` when submenu |
| closeOnContentClick | boolean | Close menu when content is clicked | true |
| closeOnBack | boolean | Close on browser back | true (inherited) |
| openOnClick | boolean | Open on activator click | true (inherited) |
| openOnHover | boolean | Open on activator hover | false (inherited) |
| openDelay | number | Delay before opening on hover (ms) | 300 |
| closeDelay | number | Delay before closing on hover (ms) | 250 |
| persistent | boolean | Prevents closing on outside click | -- |
| submenu | boolean | Enables submenu behavior (arrow-key navigation, `end` location) | -- |
| transition | component/string | Enter/leave transition | VDialogTransition |
| zIndex | number/string | z-index of overlay | 2000 (inherited) |
| scrim | boolean/string | Backdrop | false |
| contentClass | string | Extra class on overlay content | -- |
| modelValue | boolean | Controls open/close state | -- |
| disabled | boolean | Prevents opening | -- |

## Slot Anatomy
- **activator**: `{ isActive, props, targetRef }` -- trigger element; bind `props` for aria + keyboard handlers
- **default**: `{ isActive }` -- menu body; typically VList, VCard, or VSheet

## Composable Hooks
- **useProxiedModel**: two-way binding for modelValue
- **useRtl**: adjusts submenu arrow-key direction for RTL
- **useScopeId**: scoped CSS isolation
- **VMenuSymbol (provide/inject)**: nested menu parent-child registration for cascading close
- **VOverlay internals**: useLocationStrategies (connected), useScrollStrategies (reposition), useActivator, useFocusTrap (captureFocus=true)

## SASS Hooks
| Variable / Class | Controls |
|-----------------|----------|
| `$menu-elevation` | Box shadow depth (default 3) |
| `$menu-content-border-radius` | Border radius on overlay content (default border-radius-root) |
| `.v-menu > .v-overlay__content` | Flex column, rounded, contains card/sheet/list |
| Inner `.v-card, .v-sheet, .v-list` | Gets surface background, border-radius inherit, overflow auto |

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Dropdown below button | `<v-menu>` with activator slot bound to VBtn |
| Context menu at cursor | `openOnClick` + `location="end"` or coordinate-based activator |
| Hover-triggered menu | `openOnHover` prop |
| Nested flyout submenu | `submenu` prop on child VMenu |
| Menu with list items | VList with VListItems inside default slot |
| Right-aligned dropdown | `location="bottom end"` |
| Persistent filter panel | `persistent` + `:close-on-content-click="false"` |
