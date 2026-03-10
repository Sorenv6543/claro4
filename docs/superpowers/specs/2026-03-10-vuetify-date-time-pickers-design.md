# Vuetify Date/Time Pickers Design

## Problem

`VDatePicker` components added to `AdminBookingForm` and `OwnerBookingForm` are not rendering when clicked. Root cause: no date adapter is configured in `createVuetify()`, which Vuetify 3.x requires before any date-related component can mount. Additionally, time fields across all three booking forms use native `<input type="time">` instead of Vuetify's `VTimePicker`.

## Goal

Fix the date adapter configuration and replace all native date/time inputs across the three booking forms with proper Vuetify picker components, extracted into reusable shared components.

## Architecture

### 1. Vuetify Config Fix

Add `date: {}` to `createVuetify()` in `src/plugins/vuetify.ts`. This activates the built-in `VuetifyDateAdapter` (native JS `Date`) with no additional dependencies.

```typescript
export default createVuetify({
  components,
  directives,
  date: {},
  icons: { ... },
  theme: { ... },
})
```

### 2. New Shared Components

**`src/components/dumb/shared/DatePickerField.vue`**

Wraps `v-menu + v-date-picker` in a reusable component.

Props:
- `modelValue: string | null` — stored value in YYYY-MM-DD format
- `label: string`
- `min?: string` — minimum selectable date (YYYY-MM-DD); callers supply this (e.g. `todayIso`)
- `max?: string` — maximum selectable date (YYYY-MM-DD)
- `hint?: string` — passed through to the activator `v-text-field`
- `rules?: ((v: string) => boolean | string)[]`
- `disabled?: boolean`

Emits: `update:modelValue` with a YYYY-MM-DD string

Behavior:
- A readonly `v-text-field` acts as the menu activator
- When `modelValue` is non-null, displays the date in human-readable format: "Mon, Apr 5 2026"
- When `modelValue` is null/empty, the activator shows nothing — the floating `label` serves as placeholder
- `v-date-picker` inside the menu; menu closes immediately on date selection
- `strToDate` / `dateToStr` conversion helpers are internal to this component
- Does NOT default `min` to today — callers are responsible for passing `min` to preserve past-date guards

**`src/components/dumb/shared/TimePickerField.vue`**

Wraps `v-menu + v-time-picker` in a reusable component.

Props:
- `modelValue: string` — stored value in HH:mm 24-hour format (e.g. `"15:00"`)
- `label: string`
- `hint?: string` — passed through to the activator `v-text-field`
- `rules?: ((v: string) => boolean | string)[]`
- `disabled?: boolean`

Emits: `update:modelValue` with a HH:mm string

Behavior:
- A readonly `v-text-field` acts as the menu activator
- Displays the selected time in 12-hour AM/PM format: "3:00 PM"
- `v-time-picker` with `format="ampm"` inside the menu
- Menu closes after the minute step completes (i.e. on `@update:model-value` from `VTimePicker`, which fires once both hour and minute are selected in the dial)
- Converts between stored `"15:00"` ↔ displayed `"3:00 PM"` internally

### 3. Form Updates

All three forms continue to store `checkin_date` / `checkout_date` as YYYY-MM-DD strings and `checkin_time` / `checkout_time` as HH:mm strings. No form model changes required.

**`src/components/dumb/admin/AdminBookingForm.vue`**
- Replace existing inline `v-menu + v-date-picker` blocks with `<DatePickerField :min="todayIso">`
- Add `<TimePickerField>` for `checkin_time` and `checkout_time` in a new `v-row` below the date row (two `v-col cols="12" md="6"` columns)
- Retain local `todayIso` computed (`new Date().toISOString().slice(0, 10)`) to pass as `min` prop — remove only `strToDate`, `dateToStr`, `checkinDateMenu`, `checkoutDateMenu`
- Time field rules: required + HH:mm format check; no turn-time ordering rule in this form (that is handled by `validateBooking` in the submit handler)

**`src/components/dumb/owner/OwnerBookingForm.vue`**
- Same as AdminBookingForm above

**`src/components/dumb/shared/BookingForm.vue`**
- Replace native `<v-text-field type="date">` fields with `<DatePickerField>`
- Replace native `<v-text-field type="time">` fields with `<TimePickerField>`

## Data Flow

```
User selects date in VDatePicker
  → DatePickerField emits YYYY-MM-DD string
  → form.checkin_date / form.checkout_date updated
  → passed to validateBooking / submitted to Supabase unchanged

User selects time in VTimePicker (12hr display)
  → TimePickerField converts to HH:mm internally
  → emits HH:mm string
  → form.checkin_time / form.checkout_time updated
```

## Error Handling

- Date fields keep existing Vuetify `rules` validation (checkout ≥ checkin)
- Time fields in `BookingForm.vue` keep existing `timeRules` (turn booking checkout_time > checkin_time); `AdminBookingForm` and `OwnerBookingForm` use only required + format rules for time fields (turn-time ordering is enforced by `validateBooking` in the submit handler, not the field rules)
- `rules` prop on both components passes through to the activator `v-text-field`

## Testing

- Run `pnpm build` to confirm no type errors after changes
- Run `pnpm test:run` to confirm all existing tests pass
- Manual smoke test: open each of the three forms, verify date and time pickers open and close correctly, verify submitted values are in correct format
