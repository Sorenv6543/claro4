# VSnackbar
Source: packages/vuetify/src/components/VSnackbar/VSnackbar.tsx

Toast notification component. Wraps VOverlay with auto-timeout, variant styling, location-based positioning, and queue support.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| text | string | Snackbar message text | -- |
| title | string | Bold title above text | -- |
| color | string | Theme/custom color applied via variant system | -- |
| variant | `flat`/`text`/`elevated`/`tonal`/`outlined`/`plain` | Visual style via genOverlays + useVariant | -- |
| rounded | boolean/string | Border radius classes | -- |
| location | Anchor string | Viewport position (`bottom`, `top`, `top end`, etc.) | bottom |
| position | `static`/`relative`/`fixed`/`absolute`/`sticky` | CSS position override | -- |
| vertical | boolean | Stacks content and actions vertically | -- |
| timeout | number/string | Auto-dismiss delay in ms; -1 = no auto-dismiss | 5000 |
| timer | boolean/`top`/`bottom` | Shows countdown progress bar | false |
| timerColor | string | Color of timer progress bar | info |
| reverseTimer | boolean | Fills timer instead of emptying | -- |
| prependIcon | IconValue | Icon before content | -- |
| prependAvatar | string | Avatar image before content | -- |
| loading | boolean | Shows VProgressCircular in prepend slot | -- |
| modelValue | boolean | Controls visibility | -- |
| transition | string | Enter/leave transition | v-snackbar-transition |
| theme | string | Theme override | -- |
| zIndex | number/string | z-index | 10000 (SASS) |
| closeOnBack | boolean | Close on browser back | false |
| contentClass | string | Extra class on wrapper | -- |

## Slot Anatomy
- **activator**: `{ isActive, props }` -- optional trigger element
- **default**: snackbar body content (alongside text/title props)
- **prepend**: replaces icon/avatar/loading area
- **header**: full-width header above content
- **title**: replaces title text
- **text**: replaces text content
- **actions**: `{ isActive }` -- action buttons; VBtn defaults to `variant="text"`, `slim`, no ripple

## Composable Hooks
- **useVariant**: applies color + variant CSS (flat, tonal, outlined, etc.)
- **useRounded**: applies rounded classes
- **usePosition**: applies CSS position classes
- **provideTheme**: theme scoping
- **useProxiedModel**: two-way modelValue binding
- **useLayout**: reads layout insets for proper positioning within VLayout
- **useCountdown** (internal): manages timeout countdown for timer display
- **useSnackbarItem**: queue integration for VSnackbarQueue

## SASS Hooks
| Variable / Class | Controls |
|-----------------|----------|
| `$snackbar-border-radius` | Wrapper border radius (default border-radius-root) |
| `$snackbar-wrapper-max-width` | Max width (672px) |
| `$snackbar-wrapper-min-width` | Min width (344px) |
| `$snackbar-wrapper-min-height` | Min height (48px) |
| `$snackbar-wrapper-margin` | Margin from viewport edge (8px) |
| `$snackbar-wrapper-padding` | Wrapper padding (0) |
| `$snackbar-content-padding` | Text content padding (14px 16px) |
| `$snackbar-font-size` | body-medium typography size |
| `$snackbar-elevation` | Box shadow depth (default 2) |
| `$snackbar-z-index` | z-index (10000) |
| `$snackbar-background` | Default background (surface-variant) |
| `$snackbar-color` | Default text color (on-surface-variant) |
| `$snackbar-action-margin` | Action button margin (8px) |
| `.v-snackbar--vertical` | Stacked layout with full-width actions |
| `.v-snackbar--collapsed` | Queue collapsed state with reduced dimensions |

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Simple bottom toast | `<v-snackbar v-model="show" text="Saved">` |
| Top-right notification | `location="top end"` |
| Centered top banner | `location="top center"` |
| Toast with undo action | `actions` slot with VBtn that sets `isActive.value = false` |
| Error notification | `color="error"` |
| Persistent (no auto-close) | `timeout="-1"` |
| Toast with countdown bar | `timer` prop (or `timer="bottom"`) |
| Toast with icon | `prepend-icon="mdi-check"` |
| Vertical layout | `vertical` prop for stacked content + actions |
| Outlined style | `variant="outlined"` |
