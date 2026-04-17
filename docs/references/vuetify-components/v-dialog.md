# VDialog
Source: packages/vuetify/src/components/VDialog/VDialog.tsx

Wraps VOverlay to provide a modal dialog with scrim, focus trapping, and scroll blocking.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| fullscreen | boolean | Removes border-radius, margin; sets width/height 100% | -- |
| scrollable | boolean | Constrains inner VCard to max-height 100%, enables overflow-y scroll on card-text | -- |
| maxWidth | string/number | Sets max-width on overlay content | 700px |
| width | string/number | Sets explicit width on overlay content | -- |
| maxHeight | string/number | Sets max-height on overlay content | -- |
| height | string/number | Sets explicit height on overlay content | -- |
| scrim | boolean/string | Shows backdrop; string sets scrim color | true (inherited) |
| persistent | boolean | Prevents closing on outside click/escape; adds bounce animation | -- |
| noClickAnimation | boolean | Disables the bounce animation on persistent dialogs | -- |
| opacity | number/string | Sets `--v-overlay-opacity` on scrim (default 0.32) | -- |
| transition | component/string | Dialog enter/leave transition | VDialogTransition |
| zIndex | number/string | z-index of overlay | 2400 |
| closeOnBack | boolean | Close dialog on browser back | true |
| contained | boolean | Position overlay absolutely within parent | -- |
| eager | boolean | Render content immediately, not lazily | -- |
| modelValue | boolean | Controls open/close state | -- |

## Slot Anatomy
- **activator**: `{ isActive, props, targetRef }` -- element that opens the dialog; bind `props` to it
- **default**: `{ isActive }` -- dialog body content; typically contains VCard or VSheet

## Composable Hooks
- **useProxiedModel**: two-way binding for modelValue (open/close state)
- **useScopeId**: scoped CSS isolation
- **VOverlay internals**: useFocusTrap (captureFocus=true), useStack (z-index ordering), useLocationStrategies (static), useScrollStrategies (block), useTeleport, useLazy

## SASS Hooks
| Variable / Class | Controls |
|-----------------|----------|
| `$dialog-elevation` | Box shadow depth (default 5) |
| `$dialog-border-radius` | Border radius on inner card/sheet (default border-radius-root) |
| `$dialog-margin` | Margin around overlay content (default 24px) |
| `$dialog-card-header-padding` | VCard item padding inside dialog (16px 24px) |
| `$dialog-card-text-padding` | VCard text padding (16px 24px 24px) |
| `$dialog-card-actions-justify` | Card actions alignment (flex-end) |
| `.v-dialog--fullscreen` | Zero margin/radius, 100% dimensions |
| `.v-dialog--scrollable` | Flex column layout with overflow-y on card-text |

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Centered modal with backdrop | `<v-dialog v-model="open">` (defaults are sufficient) |
| Full-screen takeover | `fullscreen` prop |
| Long scrollable form | `scrollable` prop + VCard with card-text |
| Non-dismissible confirmation | `persistent` prop |
| Narrow alert dialog | `max-width="400"` |
| Custom scrim color | `scrim="black"` or `scrim="primary"` |
| Dialog that stays rendered | `eager` prop |
