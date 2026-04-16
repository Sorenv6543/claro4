# VCardTitle
Source: packages/vuetify/src/components/VCard/VCardTitle.ts

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| tag | Any HTML tag string | Changes the rendered element (default: `div`) | — |

VCardTitle is a simple functional component created via `createSimpleFunctional('v-card-title')`. It renders a `<div class="v-card-title">` with its slot content. All styling comes from the parent VCard's SASS.

## Slot Anatomy
- **default**: Title text or custom content

## Composable Hooks
None. This is a simple functional wrapper.

## SASS Hooks
- `$card-title-font-size`: Font size (from typography title-large)
- `$card-title-font-weight`: Font weight (from typography title-large)
- `$card-title-letter-spacing`: Letter spacing (from typography title-large)
- `$card-title-line-height`: Line height (from typography title-large)
- `$card-title-padding`: Standalone padding (0.5rem 1rem)
- `$card-title-header-padding`: Padding when inside VCardItem (0)
- `$card-title-white-space`: White space handling (nowrap)
- `$card-title-overflow`: Overflow behavior (hidden)
- `$card-title-text-overflow`: Text overflow (ellipsis)
- `$card-title-hyphens`: Hyphenation (auto)
- `$card-title-comfortable-line-height`: Comfortable density line-height (1.75rem)
- `$card-title-compact-line-height`: Compact density line-height (1.55rem)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Card heading text | `<v-card-title>Heading</v-card-title>` |
| Title inside card header row | Use via VCard `title` prop or `title` slot (auto-wrapped in VCardItem) |
| Standalone title (no header) | Place `<v-card-title>` directly inside `<v-card>` default slot |
| Multi-line title | Override `$card-title-white-space` to `normal` via SASS, or use CSS class |
| Title that truncates | Default behavior: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` |
