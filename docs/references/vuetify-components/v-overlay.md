# VOverlay
Source: packages/vuetify/src/components/VOverlay/VOverlay.tsx

Base layer component used by VDialog, VMenu, VTooltip, VBottomSheet, and VSnackbar. Provides scrim, teleport, positioning, scroll strategies, focus trapping, and z-index stacking.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| modelValue | boolean | Controls visibility | -- |
| scrim | boolean/string | Shows backdrop overlay; string sets scrim color | true |
| opacity | number/string | Sets `--v-overlay-opacity` on scrim | 0.32 (SASS default) |
| absolute | boolean | Uses `position: absolute` instead of fixed | -- |
| contained | boolean | Positions within parent; scrim is absolute | -- |
| persistent | boolean | Prevents close on outside click/escape; shows bounce animation | -- |
| noClickAnimation | boolean | Disables bounce animation when persistent | -- |
| closeOnBack | boolean | Close on browser back navigation | true |
| disabled | boolean | Prevents activation; closes if open | -- |
| eager | boolean | Renders content immediately (not lazy) | -- |
| zIndex | number/string | z-index via useStack | 2000 |
| attach | boolean/string/Element | Teleport target; false = body, string = selector | -- |
| contentClass | string | Extra class on `.v-overlay__content` | -- |
| contentProps | object | Extra props/attrs on content element | -- |
| locationStrategy | `static` / `connected` / function | How content is positioned | static |
| location | Anchor string | Position for connected strategy | -- |
| origin | Anchor / `auto` / `overlap` | Transform origin for transitions | -- |
| offset | number/string/number[] | Offset from activator (connected strategy) | -- |
| scrollStrategy | `none` / `close` / `block` / `reposition` / function | Behavior on scroll | block |
| transition | string/component | Enter/leave transition | -- |
| width/height/maxWidth/maxHeight/minWidth/minHeight | string/number | Dimension constraints on content | -- |
| theme | string | Theme override for overlay content | -- |

## Activator Props (from useActivator)
| Prop | Values | Effect |
|------|--------|--------|
| activator | string/Element/component | Target element that triggers the overlay |
| activatorProps | object | Props merged onto activator slot bindings |
| openOnClick | boolean | Activate on click (default true) |
| openOnHover | boolean | Activate on mouseenter |
| openOnFocus | boolean | Activate on focus |
| openDelay | number | Delay before opening (ms) |
| closeDelay | number | Delay before closing (ms) |

## Slot Anatomy
- **activator**: `{ isActive, props, targetRef }` -- trigger element; must bind `props` (includes ref, aria, event handlers)
- **default**: `{ isActive }` -- overlay body content

## Composable Hooks
- **useLocationStrategies**: static (centered) or connected (anchored to activator)
- **useScrollStrategies**: none, close, block (locks body scroll), reposition
- **useActivator**: manages activator element detection, hover/click/focus events
- **useFocusTrap**: traps focus within overlay when captureFocus is true
- **useStack**: manages z-index stacking order across multiple overlays
- **useTeleport**: moves content to body or specified attach target
- **useLazy**: defers rendering until first activation (unless eager)
- **useBackgroundColor**: applies scrim color
- **provideTheme**: theme scoping for overlay content

## SASS Hooks
| Variable / Class | Controls |
|-----------------|----------|
| `$overlay-opacity` | Default scrim opacity (0.32) |
| `$overlay-scrim-background` | Scrim background color (#000) |
| `.v-overlay` | Fixed position, full viewport, pointer-events none |
| `.v-overlay__content` | Absolute positioned, pointer-events auto, outline none |
| `.v-overlay__scrim` | Fixed full-screen backdrop with opacity |
| `.v-overlay--absolute` | Switches to position absolute |
| `.v-overlay--contained` | Scrim uses position absolute |
| `.v-overlay-scroll-blocked` | Body scroll lock styles |

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Custom popup/popover | VOverlay with `location-strategy="connected"` |
| Full-screen blocking overlay | Default VOverlay with scrim |
| Overlay inside a container | `contained` prop on a relative-positioned parent |
| No backdrop | `scrim="false"` or `:scrim="false"` |
| Colored backdrop | `scrim="primary"` or any color string |
| Tooltip-like positioning | `location-strategy="connected"` + `location` + `offset` |
