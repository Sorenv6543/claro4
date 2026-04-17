# VCardSubtitle
Source: packages/vuetify/src/components/VCard/VCardSubtitle.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| opacity | `number`, `string` | Sets `--v-card-subtitle-opacity` CSS var, overriding default medium-emphasis | — |
| tag | Any HTML tag string | Changes the rendered element (default: `div`) | — |

## Slot Anatomy
- **default**: Subtitle text or custom content

## Composable Hooks
- **makeComponentProps**: Provides `class` and `style` prop support
- **makeTagProps**: Provides `tag` prop for custom element rendering

## SASS Hooks
- `$card-subtitle-font-size`: Font size (from typography body-medium)
- `$card-subtitle-font-weight`: Font weight (from typography body-medium)
- `$card-subtitle-letter-spacing`: Letter spacing (from typography body-medium)
- `$card-subtitle-line-height`: Line height (from typography body-medium)
- `$card-subtitle-opacity`: Opacity (defaults to `--v-card-subtitle-opacity` or `--v-medium-emphasis-opacity`)
- `$card-subtitle-padding`: Standalone padding (0 1rem)
- `$card-subtitle-header-padding`: Padding when inside VCardItem (0 0 0.25rem)
- `$card-subtitle-white-space`: White space (nowrap)
- `$card-subtitle-overflow`: Overflow (hidden)
- `$card-subtitle-text-overflow`: Text overflow (ellipsis)
- `$card-subtitle-comfortable-line-height`: Comfortable density line-height (1.125rem)
- `$card-subtitle-compact-line-height`: Compact density line-height (1rem)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Secondary text under title | `<v-card-subtitle>Secondary text</v-card-subtitle>` |
| Subtitle inside card header | Use via VCard `subtitle` prop or `subtitle` slot (auto-wrapped in VCardItem) |
| Custom subtitle opacity | `<v-card-subtitle opacity="0.8">` |
| Subtitle that truncates | Default behavior: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` |
| Subtitle with wrapping text | Override `$card-subtitle-white-space` to `normal` via SASS |
