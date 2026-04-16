# VListItemTitle
Source: packages/vuetify/src/components/VList/VListItemTitle.ts

Simple functional component created via `createSimpleFunctional('v-list-item-title')`. Renders a `<div>` with class `v-list-item-title`. Used inside VListItem to display primary text.

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| tag | string | HTML element tag (default: "div") | -- |

No design-specific props. All visual styling comes from SASS and parent VListItem context.

## Slot Anatomy
- **default**: Text content of the title

## Composable Hooks
None -- pure functional wrapper.

## SASS Hooks
- `$list-item-title-font-size`: from settings typography "body-large" size
- `$list-item-title-font-weight`: from settings typography "body-large" weight
- `$list-item-title-letter-spacing`: from settings typography "body-large" letter-spacing
- `$list-item-title-line-height`: from settings typography "body-large" line-height
- `$list-item-title-hyphens`: auto
- `$list-item-title-overflow-wrap`: normal
- `$list-item-title-word-break`: normal
- `$list-item-title-padding`: 0
- `.v-list-item--nav .v-list-item-title`: Uses nav-specific typography (0.8125rem, weight 500)
- CSS: `white-space: nowrap; text-overflow: ellipsis; overflow: hidden`

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Primary list text | `<VListItemTitle>Text</VListItemTitle>` inside VListItem |
| Bold nav label | Parent VListItem with `nav` prop auto-applies nav typography |
| Truncated long title | Built in -- single line with ellipsis by default |
| Custom title markup | Slot content: `<VListItemTitle><strong>Bold</strong> text</VListItemTitle>` |
