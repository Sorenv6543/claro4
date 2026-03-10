# Vuetify Date/Time Pickers Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix VDatePicker not rendering and replace all native date/time inputs across three booking forms with reusable Vuetify picker components.

**Architecture:** Add `date: {}` to `createVuetify()` to activate the built-in date adapter. Create `DatePickerField.vue` and `TimePickerField.vue` as reusable dumb components in `src/components/dumb/shared/`. Update all three forms to use them — form models stay as YYYY-MM-DD / HH:mm strings, display formatting is internal to the components.

**Tech Stack:** Vue 3, Vuetify 3.11.8, TypeScript. No new packages.

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `src/plugins/vuetify.ts` | Add `date: {}` to activate built-in adapter |
| Create | `src/components/dumb/shared/DatePickerField.vue` | Reusable date picker (v-menu + v-date-picker) |
| Create | `src/components/dumb/shared/TimePickerField.vue` | Reusable time picker (v-menu + v-time-picker) |
| Modify | `src/components/dumb/admin/AdminBookingForm.vue` | Replace inline pickers, add time pickers |
| Modify | `src/components/dumb/owner/OwnerBookingForm.vue` | Same as admin form |
| Modify | `src/components/dumb/shared/BookingForm.vue` | Replace native type="date"/"time" inputs |

---

## Chunk 1: Foundation

### Task 1: Fix Vuetify Date Adapter

**Files:**
- Modify: `src/plugins/vuetify.ts:288`

- [ ] **Step 1: Add `date: {}` to createVuetify()**

  Open `src/plugins/vuetify.ts`. Find the `export default createVuetify({` block (line 288). Add `date: {},` immediately after `directives,`:

  ```typescript
  export default createVuetify({
    components,
    directives,
    date: {},        // ← add this line

    // Icon configuration
    icons: {
  ```

- [ ] **Step 2: Confirm build passes**

  ```bash
  cd c:/Users/Soren/claro4
  pnpm build
  ```

  Expected: build succeeds with no new errors.

---

### Task 2: Create DatePickerField.vue

**Files:**
- Create: `src/components/dumb/shared/DatePickerField.vue`

> This component wraps `v-menu + v-date-picker`. It converts between the stored YYYY-MM-DD string and a `Date` object internally. Rules are wrapped to validate the stored `modelValue` (not the display string), so existing date rules work correctly.

- [ ] **Step 1: Create the file with this exact content**

  ```vue
  <template>
    <v-menu v-model="menu" :close-on-content-click="false">
      <template #activator="{ props: menuProps }">
        <v-text-field
          v-bind="menuProps"
          :model-value="displayValue"
          :label="label"
          :hint="hint"
          :rules="wrappedRules"
          :disabled="disabled"
          :error-messages="errorMessages"
          persistent-hint
          readonly
          prepend-inner-icon="mdi-calendar"
        />
      </template>
      <v-date-picker
        :model-value="strToDate(modelValue)"
        :min="min"
        :max="max"
        color="primary"
        elevation="4"
        hide-title
        @update:model-value="onSelect"
      />
    </v-menu>
  </template>

  <script setup lang="ts">
  import { ref, computed } from 'vue'

  const props = withDefaults(defineProps<{
    modelValue: string | null
    label: string
    min?: string
    max?: string
    hint?: string
    rules?: ((v: string) => boolean | string)[]
    disabled?: boolean
    errorMessages?: string | string[]
  }>(), {
    disabled: false,
  })

  const emit = defineEmits<{
    'update:modelValue': [value: string]
  }>()

  const menu = ref(false)

  function strToDate(str: string | null | undefined): Date | undefined {
    if (!str) return undefined
    const [y, m, d] = str.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  function dateToStr(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // Display value: "Mon, Apr 5 2026" when set, empty string when null/empty
  const displayValue = computed(() => {
    if (!props.modelValue) return ''
    const d = strToDate(props.modelValue)
    if (!d) return ''
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    })
  })

  // Rules validate the stored modelValue (YYYY-MM-DD), not the display string.
  // Without this wrapper, date format rules like /^\d{4}-\d{2}-\d{2}$/ would
  // incorrectly test "Mon, Apr 5 2026" instead of "2026-04-05".
  const wrappedRules = computed(() =>
    (props.rules ?? []).map(rule => () => rule(props.modelValue ?? ''))
  )

  function onSelect(date: unknown) {
    if (date instanceof Date) {
      emit('update:modelValue', dateToStr(date))
      menu.value = false
    }
  }
  </script>
  ```

- [ ] **Step 2: Confirm build still passes**

  ```bash
  pnpm build
  ```

  Expected: no new errors.

---

### Task 3: Create TimePickerField.vue

**Files:**
- Create: `src/components/dumb/shared/TimePickerField.vue`

> Stores HH:mm (24-hour). Displays AM/PM (12-hour). Uses `@click:minute` to close the menu — this fires specifically after the minute dial step completes, preventing premature close after hour selection. Rules are wrapped to validate the stored `modelValue`, not the display string.

- [ ] **Step 1: Create the file with this exact content**

  ```vue
  <template>
    <v-menu v-model="menu" :close-on-content-click="false">
      <template #activator="{ props: menuProps }">
        <v-text-field
          v-bind="menuProps"
          :model-value="displayValue"
          :label="label"
          :hint="hint"
          :rules="wrappedRules"
          :disabled="disabled"
          :error-messages="errorMessages"
          persistent-hint
          readonly
          prepend-inner-icon="mdi-clock-outline"
        />
      </template>
      <v-time-picker
        :model-value="modelValue"
        format="ampm"
        color="primary"
        elevation="4"
        @update:model-value="onUpdate"
        @click:minute="menu = false"
      />
    </v-menu>
  </template>

  <script setup lang="ts">
  import { ref, computed } from 'vue'

  const props = withDefaults(defineProps<{
    modelValue: string
    label: string
    hint?: string
    rules?: ((v: string) => boolean | string)[]
    disabled?: boolean
    errorMessages?: string | string[]
  }>(), {
    disabled: false,
  })

  const emit = defineEmits<{
    'update:modelValue': [value: string]
  }>()

  const menu = ref(false)

  // Convert "15:00" → "3:00 PM"
  const displayValue = computed(() => {
    if (!props.modelValue) return ''
    const [hourStr, minStr] = props.modelValue.split(':')
    const hour = parseInt(hourStr, 10)
    if (isNaN(hour)) return props.modelValue
    const min = minStr ?? '00'
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${min} ${period}`
  })

  // Rules validate the stored modelValue (HH:mm), not the display string.
  const wrappedRules = computed(() =>
    (props.rules ?? []).map(rule => () => rule(props.modelValue))
  )

  function onUpdate(value: string) {
    emit('update:modelValue', value)
  }
  </script>
  ```

- [ ] **Step 2: Confirm build still passes**

  ```bash
  pnpm build
  ```

  Expected: no new errors.

- [ ] **Step 3: Commit Tasks 1–3**

  ```bash
  git add src/plugins/vuetify.ts \
          src/components/dumb/shared/DatePickerField.vue \
          src/components/dumb/shared/TimePickerField.vue
  git commit -m "feat: add Vuetify date adapter and DatePickerField/TimePickerField components"
  ```

---

## Chunk 2: Form Updates

### Task 4: Update AdminBookingForm.vue

**Files:**
- Modify: `src/components/dumb/admin/AdminBookingForm.vue`

The form already has inline `v-menu + v-date-picker` blocks and has `strToDate`/`dateToStr` helpers. We replace those blocks with `<DatePickerField>`, add a new `<TimePickerField>` row for times, and clean up the now-redundant helpers.

#### 4a — Template: replace date pickers

- [ ] **Step 1: Replace the `<!-- Dates and Times -->` v-row (lines 117–187)**

  Find this block:
  ```vue
              <!-- Dates and Times -->
              <v-row>
                <v-col
                  cols="12"
                  sm="6"
                >
                  <v-menu
                    v-model="checkinDateMenu"
                    :close-on-content-click="false"
                  >
  ```
  ...through the closing `</v-row>` at line 187.

  Replace the entire block with:

  ```vue
              <!-- Dates -->
              <v-row>
                <v-col
                  cols="12"
                  sm="6"
                >
                  <DatePickerField
                    v-model="form.checkin_date"
                    label="Checkin Date"
                    :min="todayIso"
                    hint="When new guests arrive"
                    :rules="dateRules"
                    :disabled="loading"
                    :error-messages="errors.get('checkin_date')"
                    @update:model-value="updateBookingType"
                  />
                </v-col>

                <v-col
                  cols="12"
                  sm="6"
                >
                  <DatePickerField
                    v-model="form.checkout_date"
                    label="Checkout Date"
                    :min="todayIso"
                    hint="When guests depart"
                    :rules="dateRules"
                    :disabled="loading"
                    :error-messages="errors.get('checkout_date')"
                    @update:model-value="updateBookingType"
                  />
                </v-col>
              </v-row>

              <!-- Times -->
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <TimePickerField
                    v-model="form.checkin_time"
                    label="Checkin Time"
                    hint="When new guests arrive"
                    :rules="timeRules"
                    :disabled="loading"
                    :error-messages="errors.get('checkin_time')"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <TimePickerField
                    v-model="form.checkout_time"
                    label="Checkout Time"
                    hint="When guests depart"
                    :rules="timeRules"
                    :disabled="loading"
                    :error-messages="errors.get('checkout_time')"
                  />
                </v-col>
              </v-row>
  ```

  > Note: `form.checkin_time` is initialized as `'15:00'` and `form.checkout_time` as `'11:00'` in the default form — time pickers will start pre-populated.

#### 4b — Script: remove helpers, add timeRules

- [ ] **Step 2: Remove the two menu refs (lines 499–500)**

  Remove these two lines from the script:
  ```typescript
  const checkinDateMenu = ref(false)
  const checkoutDateMenu = ref(false)
  ```
  Leave `todayIso` on line 501 untouched — it is still needed as the `min` prop.

- [ ] **Step 3: Remove the `strToDate` function (lines 503–508)**

  Remove:
  ```typescript
  function strToDate(str: unknown): Date | undefined {
    const s = typeof str === 'string' ? str : ''
    if (!s) return undefined
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  ```

- [ ] **Step 4: Remove the `dateToStr` function (lines 510–517)**

  Remove:
  ```typescript
  function dateToStr(date: unknown): string {
    const d = date as Date
    if (!(d instanceof Date) || isNaN(d.getTime())) return ''
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const dy = String(d.getDate()).padStart(2, '0')
    return `${y}-${mo}-${dy}`
  }
  ```

- [ ] **Step 5: Add `timeRules` after `dateRules`**

  Find the existing `dateRules` array (around line 639). Add `timeRules` immediately after it:

  ```typescript
  const timeRules = [
    (v: string) => !!v || 'Time is required',
    (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v) || 'Invalid time format'
  ]
  ```

- [ ] **Step 6: Confirm build passes**

  ```bash
  pnpm build
  ```

  Expected: no errors. If TypeScript complains about `form.checkin_time` or `form.checkout_time` types, check that `BookingFormData` has those as `string` fields.

---

### Task 5: Update OwnerBookingForm.vue

**Files:**
- Modify: `src/components/dumb/owner/OwnerBookingForm.vue`

Same pattern as Task 4. Line numbers differ slightly.

#### 5a — Template

- [ ] **Step 1: Replace the `<!-- Dates -->` v-row (lines 50–120)**

  Find the block starting at `<!-- Dates -->` (line 49) through the closing `</v-row>` (line 120). Replace entirely with:

  ```vue
              <!-- Dates -->
              <v-row>
                <v-col
                  cols="12"
                  sm="6"
                >
                  <DatePickerField
                    v-model="form.checkin_date"
                    label="Checkin Date"
                    :min="todayIso"
                    hint="When new guests arrive"
                    :rules="dateRules"
                    :disabled="loading"
                    :error-messages="errors.get('checkin_date')"
                    @update:model-value="updateBookingType"
                  />
                </v-col>

                <v-col
                  cols="12"
                  sm="6"
                >
                  <DatePickerField
                    v-model="form.checkout_date"
                    label="Checkout Date"
                    :min="todayIso"
                    hint="When guests leave"
                    :rules="dateRules"
                    :disabled="loading"
                    :error-messages="errors.get('checkout_date')"
                    @update:model-value="updateBookingType"
                  />
                </v-col>
              </v-row>

              <!-- Times -->
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <TimePickerField
                    v-model="form.checkin_time"
                    label="Checkin Time"
                    hint="When new guests arrive"
                    :rules="timeRules"
                    :disabled="loading"
                    :error-messages="errors.get('checkin_time')"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <TimePickerField
                    v-model="form.checkout_time"
                    label="Checkout Time"
                    hint="When guests leave"
                    :rules="timeRules"
                    :disabled="loading"
                    :error-messages="errors.get('checkout_time')"
                  />
                </v-col>
              </v-row>
  ```

#### 5b — Script

- [ ] **Step 2: Remove `checkinDateMenu` and `checkoutDateMenu` refs (lines 256–257)**

  Remove:
  ```typescript
  const checkinDateMenu = ref(false)
  const checkoutDateMenu = ref(false)
  ```
  Leave `todayIso` (line 258) untouched.

- [ ] **Step 3: Remove `strToDate` function (lines 260–264)**

  Remove:
  ```typescript
  function strToDate(str: unknown): Date | undefined {
    const s = typeof str === 'string' ? str : ''
    if (!s) return undefined
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  ```

- [ ] **Step 4: Remove `dateToStr` function (lines 266–273)**

  Remove:
  ```typescript
  function dateToStr(date: unknown): string {
    const d = date as Date
    if (!(d instanceof Date) || isNaN(d.getTime())) return ''
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const dy = String(d.getDate()).padStart(2, '0')
    return `${y}-${mo}-${dy}`
  }
  ```

- [ ] **Step 5: Add `timeRules` after `dateRules`**

  Find `const dateRules = [` (around line 332). Add immediately after the closing `]`:

  ```typescript
  const timeRules = [
    (v: string) => !!v || 'Time is required',
    (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v) || 'Invalid time format'
  ]
  ```

- [ ] **Step 6: Confirm build passes**

  ```bash
  pnpm build
  ```

  Expected: no errors.

---

### Task 6: Update BookingForm.vue

**Files:**
- Modify: `src/components/dumb/shared/BookingForm.vue`

This form uses native `<v-text-field type="date">` and `<v-text-field type="time">`. Replace with the new components. No helpers needed in this file (DatePickerField handles strToDate/dateToStr internally).

> Note: `BookingForm` uses `reactive<Partial<BookingFormData>>` for its form state. Vue 3 supports `v-model` directly on reactive object properties in templates (e.g. `v-model="form.checkin_date"` reads and writes `form.checkin_date` directly).

#### 6a — Replace date fields

- [ ] **Step 1: Replace the dates `v-row` (lines 52–92)**

  Find the block:
  ```vue
              <!-- Dates -->
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="form.checkin_date"
                    label="Checkin Date"
                    type="date"
  ```
  ...through the closing `</v-row>` at line 92.

  Replace entirely with:

  ```vue
              <!-- Dates -->
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <DatePickerField
                    v-model="form.checkin_date"
                    label="Checkin Date"
                    :rules="dateRules"
                    :disabled="loading"
                    hint="When guests arrive"
                    :error-messages="errors.get('checkin_date')"
                    @update:model-value="updateBookingType"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <DatePickerField
                    v-model="form.checkout_date"
                    label="Checkout Date"
                    :rules="dateRules"
                    :disabled="loading"
                    hint="When guests depart"
                    :error-messages="errors.get('checkout_date')"
                    @update:model-value="updateBookingType"
                  />
                </v-col>
              </v-row>
  ```

  > Note: No `min` prop here — the calendar form does not restrict to future dates only (admin/owner may backfill historical bookings).

#### 6b — Replace time fields

- [ ] **Step 2: Replace the times `v-row` (lines 93–133)**

  Find the block:
  ```vue
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="form.checkin_time"
                    label="Checkin Time"
                    type="time"
  ```
  ...through the closing `</v-row>` at line 133.

  Replace entirely with:

  ```vue
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <TimePickerField
                    v-model="form.checkin_time"
                    label="Checkin Time"
                    :rules="timeRules"
                    :disabled="loading"
                    hint="When guests arrive"
                    :error-messages="errors.get('checkin_time')"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <TimePickerField
                    v-model="form.checkout_time"
                    label="Checkout Time"
                    :rules="timeRules"
                    :disabled="loading"
                    hint="When guests depart"
                    :error-messages="errors.get('checkout_time')"
                  />
                </v-col>
              </v-row>
  ```

  > Note: `errors` in BookingForm is `ref<Map<string, string>>`, so `errors.get('...')` returns `string | undefined`. Passing that to `:error-messages` is valid — Vuetify treats undefined as "no error".

  > Note: The original native time fields had `@update:model-value="updateBookingType"`. This is intentionally omitted here — `updateBookingType()` in BookingForm only reads `form.checkout_date` and `form.checkin_date` (not time fields), so calling it on time changes was a no-op. Do not add it back.

- [ ] **Step 3: Confirm build passes**

  ```bash
  pnpm build
  ```

  Expected: no type errors.

---

### Task 7: Verify

- [ ] **Step 1: Run the full test suite**

  ```bash
  pnpm test:run
  ```

  Expected: all tests pass. These components are pure UI wrappers with no business logic, so no new unit tests are needed. The existing `businessLogic.spec.ts` tests cover all date/time validation rules.

- [ ] **Step 2: Commit Tasks 4–7**

  ```bash
  git add src/components/dumb/admin/AdminBookingForm.vue \
          src/components/dumb/owner/OwnerBookingForm.vue \
          src/components/dumb/shared/BookingForm.vue
  git commit -m "feat: replace native date/time inputs with DatePickerField and TimePickerField"
  ```

---

## Manual Smoke Test Checklist

After all tasks are complete:

- [ ] Open Admin form → click Checkin Date → date picker opens, displays calendar → select a date → field shows "Mon, Apr 5 2026" format → close
- [ ] Open Admin form → click Checkout Date → same behavior
- [ ] Open Admin form → click Checkin Time → time picker opens in 12-hour dial → select hour → dial moves to minute → select minute → field shows "3:00 PM" → menu closes
- [ ] Open Owner form → same checks
- [ ] Open calendar BookingForm → same checks
- [ ] Create a booking via Admin form → verify submitted `checkin_date` is YYYY-MM-DD, `checkin_time` is HH:mm in the network request
- [ ] Try selecting a checkout date before checkin date → verify date error alert appears
