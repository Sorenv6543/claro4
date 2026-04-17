# VCardText
Source: packages/vuetify/src/components/VCard/VCardText.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| opacity | `number`, `string` | Sets `--v-card-text-opacity` CSS var, overriding default (1) | — |
| tag | Any HTML tag string | Changes the rendered element (default: `div`) | — |

## Slot Anatomy
- **default**: Body text or any custom content (forms, lists, rich content, etc.)

## Composable Hooks
- **makeComponentProps**: Provides `class` and `style` prop support
- **makeTagProps**: Provides `tag` prop for custom element rendering

## SASS Hooks
- `$card-text-font-size`: Font size (from typography body-medium)
- `$card-text-font-weight`: Font weight (from typography body-medium)
- `$card-text-letter-spacing`: Letter spacing (from typography body-medium)
- `$card-text-line-height`: Line height (from typography body-medium)
- `$card-text-opacity`: Opacity (defaults to `--v-card-text-opacity` or 1)
- `$card-text-padding`: Padding (1rem)
- `$card-text-flex`: Flex behavior (1 1 auto - grows to fill)
- `$card-text-comfortable-line-height`: Comfortable density line-height (1.2rem)
- `$card-text-compact-line-height`: Compact density line-height (1.15rem)

Note: When VCardText follows VCardItem, `padding-top: 0` is applied automatically to avoid double spacing.

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Card body paragraph | `<v-card-text>Body content here</v-card-text>` |
| Body text via prop | `<v-card text="Body content" />` on parent VCard |
| Rich content area | Nest any components inside `<v-card-text>` default slot |
| Reduced opacity body text | `<v-card-text opacity="0.7">` |
| Dense body text | Set `density="compact"` on parent VCard (line-height: 1.15rem) |
