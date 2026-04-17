# VOtpInput
Source: packages/vuetify/src/components/VOtpInput/VOtpInput.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| variant | `'outlined'` `'filled'` `'underlined'` `'plain'` `'solo'` `'solo-inverted'` `'solo-filled'` | Field style for each digit cell (via VField) | -- |
| density | `'default'` `'comfortable'` `'compact'` | Adjusts cell height via density system | -- |
| rounded | boolean \| string \| number | Cell border-radius | -- |
| color | string | Focused cell color | -- |
| baseColor | string | Unfocused cell color | -- |
| bgColor | string | Cell background-color | -- |
| length | number \| string | Number of OTP digits/cells (default: `6`) | -- |
| type | `'number'` \| `'text'` \| `'password'` | Input mode per cell (default: `'number'`) | -- |
| masked | boolean | Renders all cells as `type="password"` to hide input | -- |
| divider | string | Character displayed between cells (e.g., `'-'`) | -- |
| focusAll | boolean | Highlights all cells when any cell is focused | -- |
| placeholder | string | Placeholder per cell | -- |
| disabled | boolean | Disables all cells | -- |
| error | boolean | Applies error styling to all cells | -- |
| loading | boolean \| string | Shows overlay with VProgressCircular; string sets loader color | -- |
| autofocus | boolean | Auto-focuses first cell on mount/intersect | -- |
| width / height / maxWidth / maxHeight / minWidth / minHeight | string \| number | Dimension props applied to the content wrapper | -- |

## Slot Anatomy
- default: Content appended after all cells (inside content wrapper)
- loader: Custom loading overlay content (replaces VProgressCircular)

## Composable Hooks
- useDensity: Applies density CSS classes
- useDimension: Applies dimension styles to content wrapper
- useFocus: Manages focused state and emits `update:focused`
- useProxiedModel: Two-way binding; splits string into array of characters
- useLocale: Translates ARIA label
- useIntersectionObserver: Triggers autofocus on visibility
- provideDefaults: Provides VField defaults (color, variant, rounded) to all child fields

## SASS Hooks
- `$otp-input-content-height`: Base cell height (default: `64px`, adjusted by density)
- `$otp-input-content-gap`: Gap between cells (default: `0.5rem`)
- `$otp-input-content-max-width`: Max width of the cell row (default: `320px`)
- `$otp-input-content-padding`: Inner padding (default: `0.5rem`)
- `$otp-input-divided-content-max-width`: Max width when using divider (default: `360px`)
- `$otp-input-field-font-size`: Digit font size (default: `1.25rem`)
- `$otp-input-divider-margin`: Margin around divider character
- `$otp-input-padding`: Root element padding
- `.v-otp-input--divided`: Applied when `divider` prop is set
- `.v-otp-input__field`: The actual input element (centered text, no border, transparent bg)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| 6-digit OTP input | `<v-otp-input v-model="code" @finish="verify">` |
| 4-digit PIN | `<v-otp-input :length="4">` |
| OTP with dashes between | `<v-otp-input divider="-">` |
| Masked/hidden digits | `<v-otp-input masked>` |
| Loading while verifying | `<v-otp-input :loading="isVerifying">` |
| Text/alphanumeric code | `<v-otp-input type="text">` |
| Auto-focus on page load | `<v-otp-input autofocus>` |
