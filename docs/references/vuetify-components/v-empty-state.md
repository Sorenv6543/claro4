# VEmptyState
Source: packages/vuetify/src/components/VEmptyState/VEmptyState.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| icon | IconValue | Large centered icon (default 96px) | -- |
| image | string (URL) | Centered image (default 200px height) | -- |
| color | color string | Icon color + action button color | -- |
| bgColor | color string | Background color of container | -- |
| size | number/string or size preset | Controls icon/image dimensions | 96 (icon) / 200 (image) |
| headline | string | Large display text (display-large typography) | -- |
| title | string | Title text (title-large typography) | -- |
| text | string | Body text (body-medium typography) | -- |
| textWidth | number/string | Max-width of text area | 500 |
| actionText | string | Text for default action button | -- |
| href | string | Link for action button | -- |
| to | string | Router link for action button | -- |
| justify | `start` `center` `end` | Horizontal alignment via `align-items` | center |

## Slot Anatomy
- **media**: Icon or image area; receives VImg/VIcon defaults from props
- **headline**: Large headline text; replaces `headline` prop
- **title**: Title text; replaces `title` prop
- **text**: Description text; replaces `text` prop
- **default**: Custom content area between text and actions
- **actions**: Action buttons area; receives `{ props: { onClick } }`; defaults to VBtn with `actionText`

## Composable Hooks
- **useBackgroundColor**: Container background
- **useDimension**: Width/height styles
- **useDisplay**: Responsive display classes (smaller headline on mobile)
- **provideTheme**: Theme context

## SASS Hooks
- `$empty-state-min-height`: 100% -- fills parent
- `$empty-state-padding`: 16px
- `$empty-state-headline-font-size`: display-large size
- `$empty-state-headline-mobile-font-size`: headline-large size (responsive)
- `$empty-state-headline-color`: on-surface with medium emphasis
- `$empty-state-title-font-size`: title-large size
- `$empty-state-title-margin-bottom`: 4px
- `$empty-state-text-font-size`: body-medium size
- `$empty-state-text-padding`: 0 16px
- `$empty-state-media-icon-color`: on-surface with medium emphasis
- `$empty-state-actions-gap`: 8px
- `$empty-state-content-padding`: 24px 0

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| No results found state | `icon="mdi-magnify" headline="No results" text="Try different filters"` |
| Empty list with action | `icon="mdi-plus" title="No items yet" action-text="Add Item"` + `@click:action` |
| Empty state with image | `image="/illustrations/empty.svg" title="Nothing here"` |
| Custom action buttons | Use `actions` slot with VBtn(s) |
| Left-aligned empty state | `justify="start"` |
| Custom media content | Use `media` slot with any component |
