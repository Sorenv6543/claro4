# VCardActions
Source: packages/vuetify/src/components/VCard/VCardActions.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| tag | Any HTML tag string | Changes the rendered element (default: `div`) | — |

VCardActions is a container that provides defaults to child VBtn components.

## Child VBtn Defaults
VCardActions uses `provideDefaults` to set these on child VBtn instances:
- `slim: true` (reduced padding: 0 8px)
- `variant: 'text'` (text-only buttons, no background)

## Slot Anatomy
- **default**: Action buttons (typically VBtn instances); rendered inside a flex row with gap

## Composable Hooks
- **makeComponentProps**: Provides `class` and `style` prop support
- **makeTagProps**: Provides `tag` prop for custom element rendering
- **provideDefaults**: Injects VBtn defaults (slim + text variant) to all child buttons

## SASS Hooks
- `$card-actions-min-height`: Minimum height (52px)
- `$card-actions-padding`: Padding (0.5rem)
- `$card-actions-flex`: Flex shorthand (none)
- `$card-actions-gap`: Gap between buttons (0.5rem)

Note: When VCardActions follows VCardTitle, `padding-top: 0` is applied automatically.

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Card with bottom action buttons | `<v-card-actions><v-btn>OK</v-btn><v-btn>Cancel</v-btn></v-card-actions>` |
| Actions via VCard slot | `<v-card><template #actions>...</template></v-card>` |
| Right-aligned actions | Add `<v-spacer />` before buttons inside actions |
| Filled action button | Override default with `variant="flat"` on individual VBtn |
| Actions with icon buttons | `<v-btn icon="mdi-heart" />` inside actions |
