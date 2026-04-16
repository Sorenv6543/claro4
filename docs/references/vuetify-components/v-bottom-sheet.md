# VBottomSheet
Source: packages/vuetify/src/components/VBottomSheet/VBottomSheet.tsx

Extends VDialog with a slide-up-from-bottom transition. Anchors content to the bottom of the viewport.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| inset | boolean | Constrains width to 70% on sm-and-up breakpoint, centered | -- |
| fullscreen | boolean | Inherited from VDialog; 100% width/height | -- |
| scrollable | boolean | Inherited from VDialog; enables scroll on inner card-text | -- |
| maxWidth | string/number | Inherited from VDialog | -- |
| width | string/number | Inherited from VDialog | -- |
| persistent | boolean | Prevents closing on outside click/escape | -- |
| scrim | boolean/string | Backdrop control | true (inherited) |
| modelValue | boolean | Controls open/close state | -- |
| transition | string | Slide animation | bottom-sheet-transition |
| zIndex | number/string | z-index of overlay | 2400 (from VDialog) |

## Slot Anatomy
- **activator**: `{ isActive, props, targetRef }` -- element that opens the sheet
- **default**: `{ isActive }` -- sheet body; typically VCard or VSheet

## Composable Hooks
- **useProxiedModel**: two-way binding for modelValue
- Inherits all VDialog/VOverlay composables (focus trap, scroll block, stack, teleport)

## SASS Hooks
| Variable / Class | Controls |
|-----------------|----------|
| `$bottom-sheet-elevation` | Box shadow depth (default 4) |
| `$bottom-sheet-border-radius` | Border radius on inner card/sheet (default 0) |
| `$bottom-sheet-inset-width` | Width when inset on sm+ (default 70%) |
| `$bottom-sheet-transition-duration` | Slide animation duration (default 0.2s) |
| `.v-bottom-sheet` | Anchors content to flex-end (bottom), full width |
| `.v-bottom-sheet--inset` | Applies max-width constraint on sm-and-up |

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Full-width bottom panel | `<v-bottom-sheet v-model="open">` |
| Narrower centered sheet | `inset` prop |
| Action sheet with options | Default slot with VList inside |
| Persistent sheet | `persistent` prop |
| Custom top corners | Override `$bottom-sheet-border-radius` or use rounded card inside |
