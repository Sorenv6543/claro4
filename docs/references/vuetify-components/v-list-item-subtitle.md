# VListItemSubtitle
Source: packages/vuetify/src/components/VList/VListItemSubtitle.tsx

Secondary text component for VListItem. Renders a `<div>` with class `v-list-item-subtitle`. Supports custom opacity.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| opacity | number \| string | Sets `--v-list-item-subtitle-opacity` CSS var | -- |
| tag | string | HTML element tag (default: "div") | -- |

## Slot Anatomy
- **default**: Subtitle text content

## Composable Hooks
- **makeComponentProps**: class/style passthrough
- **makeTagProps**: Custom tag element

## SASS Hooks
- `$list-item-subtitle-opacity`: `var(--v-list-item-subtitle-opacity, var(--v-medium-emphasis-opacity))`
- `$list-item-subtitle-font-size`: from settings typography "body-medium" size
- `$list-item-subtitle-font-weight`: from settings typography "body-medium" weight
- `$list-item-subtitle-letter-spacing`: from settings typography "body-medium" letter-spacing
- `$list-item-subtitle-line-height`: 1rem
- `$list-item-subtitle-overflow-wrap`: break-word
- `$list-item-subtitle-padding`: 0
- CSS: Uses `-webkit-line-clamp` based on parent lines prop (1/2/3 lines)
- `.v-list-item--nav .v-list-item-subtitle`: Uses nav-specific typography (0.75rem)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Secondary description text | `<VListItemSubtitle>Detail</VListItemSubtitle>` |
| Reduced opacity subtitle | `opacity="0.5"` or rely on default medium-emphasis |
| Multi-line subtitle | Parent VListItem `lines="two"` or `lines="three"` |
| Custom subtitle content | Slot: `<VListItemSubtitle><em>Italic</em> note</VListItemSubtitle>` |
| Nav-style smaller subtitle | Automatic when parent VListItem has `nav` prop |
