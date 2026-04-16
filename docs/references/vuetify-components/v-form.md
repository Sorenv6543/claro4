# VForm
Source: packages/vuetify/src/components/VForm/VForm.tsx

## Design Props
| Prop | Values | CSS Effect | Claro4 Default |
|------|--------|------------|----------------|
| disabled | boolean | Disables all child inputs via form provide | -- |
| readonly | boolean | Makes all child inputs readonly via form provide | -- |
| validateOn | `'input'` `'blur'` `'submit'` `'input lazy'` `'blur lazy'` `'submit lazy'` | Controls when validation triggers (no CSS effect) | -- |
| fastFail | boolean | Stops validation on first error (no CSS effect) | -- |

## Slot Anatomy
- default: Renders form children. Receives `{ errors, isDisabled, isReadonly, isValidating, isValid, items, validate, reset, resetValidation }`

## Composable Hooks
- createForm: Provides form context (`FormKey`) to all descendant inputs for coordinated validation, disable/readonly state
- useProxiedModel: Two-way binding for `modelValue` (form validity: `true | false | null`)

## SASS Hooks
- `.v-form`: Root element class (no dedicated SASS file; minimal styling)

## Design -> Code Cheatsheet
| Design shows... | Use... |
|-----------------|--------|
| Group of validated fields | `<v-form v-model="valid" @submit.prevent>` wrapping inputs |
| Disabled form section | `<v-form disabled>` |
| Read-only form section | `<v-form readonly>` |
| Submit button that validates | Bind `@submit` and call `validate()` from slot props or ref |
| Reset all fields | Call `reset()` from slot props or ref |
