# VBanner
Source: packages/vuetify/src/components/VBanner/VBanner.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| lines | `one` `two` `three` | Clamps text via `-webkit-line-clamp`; adjusts padding | -- |
| stacked | boolean | Switches to stacked grid layout (prepend + content above actions) | -- |
| sticky | boolean | `position: sticky; top: 0; z-index: 1` | -- |
| color | color string | Applied to prepend avatar and action buttons | -- |
| bgColor | color string | Background color of the banner | -- |
| icon | IconValue | Displayed inside a VAvatar in the prepend area | -- |
| avatar | string (image URL) | Image shown in prepend VAvatar | -- |
| density | `default` `comfortable` `compact` | Adjusts vertical padding per density map | -- |
| elevation | 0-24 | Box shadow | 0 |
| rounded | boolean or string | Border radius | -- |
| border | boolean or string | Border style control | bottom thin border by default |
| text | string | Banner message text | -- |

## Slot Anatomy
- **default**: Additional content below banner text
- **prepend**: Left area; defaults to VAvatar with `icon`/`avatar` props
- **text**: Banner message; replaces `text` prop, rendered inside `VBannerText`
- **actions**: Right-aligned action buttons; rendered inside `VBannerActions`

## Composable Hooks
- **useBackgroundColor**: Applies bgColor as background
- **useBorder**: Border styling (default: bottom thin border)
- **useDensity**: Padding adjustments per density
- **useDisplay**: Responsive classes; auto-stacks on mobile
- **useElevation**: Shadow classes
- **useRounded**: Border radius
- **usePosition**: Position classes (absolute/fixed/sticky)
- **provideTheme**: Theme context
- **provideDefaults**: Passes `color` and `density` to child VBannerActions

## SASS Hooks
- `$banner-padding`: 8px -- base vertical padding unit
- `$banner-padding-inline-start`: 16px
- `$banner-padding-inline-end`: 8px
- `$banner-prepend-margin-end`: 24px -- gap after prepend
- `$banner-text-padding-end`: 90px -- right padding on text (room for actions)
- `$banner-border-width`: 0 0 thin 0 -- bottom border by default
- `$banner-sticky-top`: 0
- `$banner-font-size`: body-medium typography
- `$banner-line-height`: label-large line-height
- `$banner-action-margin`: 20px

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| System notification bar at top | `sticky` prop |
| Banner with icon | `icon="mdi-alert"` |
| Banner with avatar image | `avatar="/path/to/img.png"` |
| One-line compact banner | `lines="one" density="compact"` |
| Mobile-stacked layout | `stacked` or rely on auto-mobile detection |
| Action buttons in banner | Use `actions` slot with VBtn(s) |
