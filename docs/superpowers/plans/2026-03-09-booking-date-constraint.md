# Booking Date Constraint Fix Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce `checkin_date ≤ checkout_date` throughout the entire bookings entity — SQL, business logic, all three booking forms, and the property metrics composable.

**Architecture:** Six independent bug sites are fixed in sequence. The SQL constraint is corrected first (data layer), then business logic, then forms, then composable. Each task is self-contained and commits individually.

**Tech Stack:** Vue 3, TypeScript, Vitest, Pinia, Supabase (PostgreSQL), Vuetify 3

**Spec:** `docs/superpowers/specs/2026-03-09-booking-date-constraint-design.md`

---

## Chunk 1: Data Layer + Business Logic

### Task 1: Fix SQL Constraint

**Files:**
- Create: `supabase/migrations/20260309000000_fix_booking_dates_constraint.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Fix booking_dates_valid constraint direction.
-- Old (wrong): CHECK (checkin_date >= checkout_date) — rejects valid bookings.
-- New (correct): CHECK (checkout_date >= checkin_date) — checkin ≤ checkout.

ALTER TABLE public.bookings
  DROP CONSTRAINT booking_dates_valid;

ALTER TABLE public.bookings
  ADD CONSTRAINT booking_dates_valid CHECK (checkout_date >= checkin_date);
```

- [ ] **Step 2: Also update the source-of-truth migration for consistency**

In `supabase/migrations/20260225013203_complete_schema.sql`, find line 95 and change:
```sql
-- Before:
  CONSTRAINT booking_dates_valid CHECK (checkin_date >= checkout_date)
-- After:
  CONSTRAINT booking_dates_valid CHECK (checkout_date >= checkin_date)
```

> Note: Both files must agree. The new migration file handles runtime DB changes; the original migration documents the intended schema.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260309000000_fix_booking_dates_constraint.sql \
        supabase/migrations/20260225013203_complete_schema.sql
git commit -m "fix(db): correct booking_dates_valid constraint direction"
```

---

### Task 2: Fix `validateBooking` in businessLogic.ts (TDD)

**Files:**
- Create: `src/__tests__/utils/businessLogic.spec.ts`
- Modify: `src/utils/businessLogic.ts` (lines 219–224)

The `else` branch in `validateBooking` (for standard bookings) contains a `timeDiff` warning that computes `checkinDate − checkoutDate`. Under the correct model, checkin ≤ checkout, so this is always ≤ 0 for valid bookings — the warning is permanently dead. Additionally, for DATE-only fields, the minimum gap between different calendar days is 24 hours, making the `< 3 hours` threshold unreachable for standard bookings. Remove the entire `else` block.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/utils/businessLogic.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  validateBooking,
  validateTurnBooking,
  detectBookingConflicts,
  calculateBookingPriority,
} from '@/utils/businessLogic'
import type { Booking } from '@/types'
import type { Property } from '@/types/property'

const mockProperty: Property = {
  id: 'prop1',
  owner_id: 'owner1',
  name: 'Test Property',
  address: '123 Test St',
  property_type: 'apartment',
  pricing_tier: 'standard',
  cleaning_duration: 120,
  active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const baseBooking: Partial<Booking> = {
  id: 'b1',
  property_id: 'prop1',
  owner_id: 'owner1',
  booking_type: 'standard',
  status: 'pending',
  priority: 'normal',
  checkin_time: '15:00',
  checkout_time: '11:00',
}

describe('validateBooking — date ordering', () => {
  it('accepts when checkout_date is after checkin_date', () => {
    const result = validateBooking(
      { ...baseBooking, checkin_date: '2026-04-01', checkout_date: '2026-04-05' },
      mockProperty
    )
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('accepts when checkout_date equals checkin_date (same-day turn)', () => {
    const result = validateBooking(
      {
        ...baseBooking,
        booking_type: 'turn',
        checkin_date: '2026-04-01',
        checkout_date: '2026-04-01',
        checkin_time: '14:00',
        checkout_time: '22:00',
      },
      mockProperty
    )
    expect(result.valid).toBe(true)
  })

  it('rejects when checkout_date is before checkin_date', () => {
    const result = validateBooking(
      { ...baseBooking, checkin_date: '2026-04-05', checkout_date: '2026-04-01' },
      mockProperty
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Checkout date must be on or after checkin date')
  })

  it('does not warn about short time for standard bookings with different dates', () => {
    // After removing dead timeDiff block, no spurious warning fires
    const result = validateBooking(
      { ...baseBooking, checkin_date: '2026-04-01', checkout_date: '2026-04-02' },
      mockProperty
    )
    expect(result.warnings.some(w => w.includes('turn booking'))).toBe(false)
  })
})

describe('validateTurnBooking — time ordering under Model A', () => {
  it('rejects turn booking where checkout_time is before checkin_time', () => {
    const result = validateTurnBooking(
      {
        ...baseBooking,
        booking_type: 'turn',
        checkin_date: '2026-04-01',
        checkout_date: '2026-04-01',
        checkin_time: '14:00',
        checkout_time: '10:00', // guests depart before they arrived
      },
      mockProperty
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('For turn bookings, checkout time must be after checkin time')
  })

  it('accepts turn booking where checkout_time is after checkin_time', () => {
    const result = validateTurnBooking(
      {
        ...baseBooking,
        booking_type: 'turn',
        checkin_date: '2026-04-01',
        checkout_date: '2026-04-01',
        checkin_time: '14:00',
        checkout_time: '22:00',
      },
      mockProperty
    )
    expect(result.valid).toBe(true)
  })
})

describe('detectBookingConflicts', () => {
  const existing: Booking = {
    id: 'b2',
    property_id: 'prop1',
    owner_id: 'owner1',
    checkin_date: '2026-04-03',
    checkout_date: '2026-04-07',
    checkin_time: '15:00',
    checkout_time: '11:00',
    booking_type: 'standard',
    status: 'pending',
    priority: 'normal',
  }

  it('detects overlap when new booking starts inside an existing booking', () => {
    const booking: Booking = {
      ...existing,
      id: 'b3',
      checkin_date: '2026-04-05',
      checkout_date: '2026-04-09',
    }
    expect(detectBookingConflicts(booking, [existing])).toHaveLength(1)
  })

  it('does not conflict when bookings are adjacent (one checkout == other checkin)', () => {
    const booking: Booking = {
      ...existing,
      id: 'b3',
      checkin_date: '2026-04-07', // same as existing checkout
      checkout_date: '2026-04-10',
    }
    expect(detectBookingConflicts(booking, [existing])).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- src/__tests__/utils/businessLogic.spec.ts
```

Expected: The "does not warn about short time" test FAILS (the dead timeDiff code still exists). Other tests pass.

- [ ] **Step 3: Remove the dead `else` block from `validateBooking`**

In `src/utils/businessLogic.ts`, find lines 214–224 and replace:

```ts
// Before:
  if (booking.booking_type === 'turn') {
    const turnValidation = validateTurnBooking(booking, property);
    errors.push(...turnValidation.errors);
    warnings.push(...turnValidation.warnings);
  } else {
    // Standard booking validation
    const timeDiff = (checkinDate.getTime() - checkoutDate.getTime()) / (1000 * 60 * 60); // hours
    if (timeDiff < 3) {
      warnings.push('Very short time between checkout and checkin. Consider marking as a turn booking.');
    }
  }

// After:
  if (booking.booking_type === 'turn') {
    const turnValidation = validateTurnBooking(booking, property);
    errors.push(...turnValidation.errors);
    warnings.push(...turnValidation.warnings);
  }
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
pnpm test -- src/__tests__/utils/businessLogic.spec.ts
```

Expected: All tests pass (PASS).

- [ ] **Step 5: Run the full test suite to catch regressions**

```bash
pnpm test:run
```

Expected: All existing tests continue to pass.

- [ ] **Step 6: Commit**

```bash
git add src/__tests__/utils/businessLogic.spec.ts src/utils/businessLogic.ts
git commit -m "fix(business-logic): remove dead timeDiff warning from validateBooking"
```

---

## Chunk 2: Form Components

### Task 3: Fix `AdminBookingForm.vue`

**Files:**
- Modify: `src/components/dumb/admin/AdminBookingForm.vue`

Three changes in this file. Make them all in one pass:

**Change A — Fix `showDateError` (line 553)**

```ts
// Before:
  return new Date(form.value.checkin_date as string) < new Date(form.value.checkout_date as string)

// After (fires when guests depart before they arrived):
  return new Date(form.value.checkout_date as string) < new Date(form.value.checkin_date as string)
```

**Change B — Remove date-swap comment + override in `handleSubmit` (lines 739–747)**

Find the `cleanFormData` block and remove the overriding date fields:

```ts
// Before:
  const cleanFormData: BookingFormData = {
    ...form.value,
    assigned_cleaner_id: form.value.assigned_cleaner_id || undefined,
    owner_id: form.value.owner_id || '',
    property_id: form.value.property_id || '',
    // Swap dates back to database order: checkout_date (guests leave) should be earlier than checkin_date (new guests arrive)
    checkout_date: form.value.checkin_date, // Earlier date (guests check out)
    checkin_date: form.value.checkout_date  // Later date (new guests check in)
  }

// After (no swap — form fields map directly to DB columns):
  const cleanFormData: BookingFormData = {
    ...form.value,
    assigned_cleaner_id: form.value.assigned_cleaner_id || undefined,
    owner_id: form.value.owner_id || '',
    property_id: form.value.property_id || '',
  }
```

**Change C — Remove date-swap in the `watch` populate block (lines 792–806)**

```ts
// Before:
    form.value = {
      owner_id: newBooking.owner_id,
      property_id: newBooking.property_id,
      // Swap dates to match logical flow: checkin first (earlier), checkout later (later)
      checkin_date: formatDateForInput(newBooking.checkout_date), // Earlier date
      checkout_date: formatDateForInput(newBooking.checkin_date), // Later date
      checkin_time: newBooking.checkin_time || '15:00',
      checkout_time: newBooking.checkout_time || '11:00',
      booking_type: newBooking.booking_type,
      guest_count: newBooking.guest_count,
      notes: newBooking.notes || '',
      status: newBooking.status,
      assigned_cleaner_id: newBooking.assigned_cleaner_id || '',
      priority: newBooking.priority || 'normal'
    }

// After (direct mapping — no swap):
    form.value = {
      owner_id: newBooking.owner_id,
      property_id: newBooking.property_id,
      checkin_date: formatDateForInput(newBooking.checkin_date),
      checkout_date: formatDateForInput(newBooking.checkout_date),
      checkin_time: newBooking.checkin_time || '15:00',
      checkout_time: newBooking.checkout_time || '11:00',
      booking_type: newBooking.booking_type,
      guest_count: newBooking.guest_count,
      notes: newBooking.notes || '',
      status: newBooking.status,
      assigned_cleaner_id: newBooking.assigned_cleaner_id || '',
      priority: newBooking.priority || 'normal'
    }
```

- [ ] **Step 1: Apply all three changes to `AdminBookingForm.vue`**

- [ ] **Step 2: Verify no type errors**

```bash
pnpm build
```

Expected: Build completes with no `vue-tsc` errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dumb/admin/AdminBookingForm.vue
git commit -m "fix(admin-form): remove date-swap workaround, fix showDateError direction"
```

---

### Task 4: Fix `OwnerBookingForm.vue`

**Files:**
- Modify: `src/components/dumb/owner/OwnerBookingForm.vue`

Three changes:

**Change A — Fix `showDateError` (line 273)**

```ts
// Before:
  return checkinDate < checkoutDate

// After:
  return checkoutDate < checkinDate
```

**Change B — Fix error message text (line 153)**

```html
<!-- Before: -->
text="Checkin date cannot be before checkout date. Please check your dates."

<!-- After: -->
text="Checkout date cannot be before checkin date. Please check your dates."
```

**Change C — Reorder fields: checkin first, checkout second**

In the `<!-- Dates -->` `<v-row>` (lines 50–90), the two `<v-col>` blocks are currently ordered checkout → checkin. Swap them so checkin appears on the left and checkout on the right:

```html
<!-- Before: checkout col first, checkin col second -->
<v-row>
  <v-col cols="12" sm="6">
    <v-text-field
      v-model="form.checkout_date"
      label="Checkout Date"
      type="date"
      :rules="dateRules"
      required
      variant="outlined"
      :disabled="loading"
      :error-messages="errors.get('checkout_date')"
      hint="When guests leave"
      persistent-hint
      prepend-inner-icon="mdi-calendar-export"
      @update:model-value="updateBookingType"
    />
  </v-col>

  <v-col cols="12" sm="6">
    <v-text-field
      v-model="form.checkin_date"
      label="Checkin Date"
      type="date"
      :rules="dateRules"
      required
      variant="outlined"
      :disabled="loading"
      :error-messages="errors.get('checkin_date')"
      hint="When new guests arrive"
      persistent-hint
      prepend-inner-icon="mdi-calendar-import"
      @update:model-value="updateBookingType"
    />
  </v-col>
</v-row>

<!-- After: checkin col first, checkout col second -->
<v-row>
  <v-col cols="12" sm="6">
    <v-text-field
      v-model="form.checkin_date"
      label="Checkin Date"
      type="date"
      :rules="dateRules"
      required
      variant="outlined"
      :disabled="loading"
      :error-messages="errors.get('checkin_date')"
      hint="When new guests arrive"
      persistent-hint
      prepend-inner-icon="mdi-calendar-import"
      @update:model-value="updateBookingType"
    />
  </v-col>

  <v-col cols="12" sm="6">
    <v-text-field
      v-model="form.checkout_date"
      label="Checkout Date"
      type="date"
      :rules="dateRules"
      required
      variant="outlined"
      :disabled="loading"
      :error-messages="errors.get('checkout_date')"
      hint="When guests leave"
      persistent-hint
      prepend-inner-icon="mdi-calendar-export"
      @update:model-value="updateBookingType"
    />
  </v-col>
</v-row>
```

- [ ] **Step 1: Apply all three changes to `OwnerBookingForm.vue`**

- [ ] **Step 2: Verify no type errors**

```bash
pnpm build
```

Expected: Build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dumb/owner/OwnerBookingForm.vue
git commit -m "fix(owner-form): correct showDateError direction, fix error text, reorder date fields"
```

---

### Task 5: Fix `BookingForm.vue` (shared)

**Files:**
- Modify: `src/components/dumb/shared/BookingForm.vue` (lines 477–479)

The `resetForm()` function maps FullCalendar `initialData.start` and `initialData.end` to the wrong date fields. In FullCalendar, `start` = event begin = guest arrival = `checkin_date`. `end` = event finish = guest departure = `checkout_date`.

```ts
// Before (backwards):
      checkout_date: initialData.start || initialData.checkout_date || '',
      checkin_date: initialData.end || initialData.checkin_date || ''

// After (correct):
      checkin_date: initialData.start || initialData.checkin_date || '',
      checkout_date: initialData.end || initialData.checkout_date || ''
```

- [ ] **Step 1: Apply the change to `BookingForm.vue`**

- [ ] **Step 2: Verify no type errors**

```bash
pnpm build
```

Expected: Build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dumb/shared/BookingForm.vue
git commit -m "fix(shared-form): correct FullCalendar start/end to checkin/checkout mapping"
```

---

## Chunk 3: Composable + Final Verification

### Task 6: Fix `useProperties.ts` — `calculatePropertyMetrics`

**Files:**
- Modify: `src/composables/shared/useProperties.ts`

Two logical fixes in `calculatePropertyMetrics`:

**Change A — Utilization rate loop (lines 207–217)**

The loop currently iterates from `checkoutDate` to `checkinDate`. Under Model A, stays run from `checkinDate` (arrival) to `checkoutDate` (departure), so iterate in that direction.

```ts
// Before:
    propertyBookings.forEach(booking => {
      const checkoutDate = new Date(booking.checkout_date);
      const checkinDate = new Date(booking.checkin_date);

      // Count days between checkout and checkin
      let currentDate = new Date(checkoutDate);
      while (currentDate <= checkinDate) {
        bookedDays.add(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

// After:
    propertyBookings.forEach(booking => {
      const checkinDate = new Date(booking.checkin_date);
      const checkoutDate = new Date(booking.checkout_date);

      // Count days of guest stay from checkin to checkout
      let currentDate = new Date(checkinDate);
      while (currentDate <= checkoutDate) {
        bookedDays.add(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
```

**Change B — Gap calculation (lines 229–244)**

Sort bookings by `checkin_date` (chronological order of arrivals). Measure gaps as the time between one booking's `checkout_date` and the next booking's `checkin_date`.

```ts
// Before:
    // Sort bookings by checkout date
    const sortedBookings = [...propertyBookings].sort((a, b) => {
      return new Date(a.checkout_date).getTime() - new Date(b.checkout_date).getTime();
    });

    // Calculate gaps between consecutive bookings
    for (let i = 0; i < sortedBookings.length - 1; i++) {
      const currentCheckout = new Date(sortedBookings[i].checkin_date);
      const nextCheckin = new Date(sortedBookings[i + 1].checkout_date);

      if (nextCheckin > currentCheckout) {
        const gapDays = Math.round((nextCheckin.getTime() - currentCheckout.getTime()) / (1000 * 60 * 60 * 24));
        totalGapDays += gapDays;
        gapCount++;
      }
    }

// After:
    // Sort bookings by checkin date (chronological order of arrivals)
    const sortedBookings = [...propertyBookings].sort((a, b) => {
      return new Date(a.checkin_date).getTime() - new Date(b.checkin_date).getTime();
    });

    // Calculate gaps between consecutive bookings
    for (let i = 0; i < sortedBookings.length - 1; i++) {
      const currentEnd = new Date(sortedBookings[i].checkout_date);
      const nextStart = new Date(sortedBookings[i + 1].checkin_date);

      if (nextStart > currentEnd) {
        const gapDays = Math.round((nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60 * 24));
        totalGapDays += gapDays;
        gapCount++;
      }
    }
```

- [ ] **Step 1: Apply both changes to `useProperties.ts`**

- [ ] **Step 2: Run the full test suite**

```bash
pnpm test:run
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/composables/shared/useProperties.ts
git commit -m "fix(useProperties): correct date iteration and gap calc direction in calculatePropertyMetrics"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Full build (type-check)**

```bash
pnpm build
```

Expected: No errors.

- [ ] **Step 2: Full test suite**

```bash
pnpm test:run
```

Expected: All tests pass, including the new `businessLogic.spec.ts`.

- [ ] **Step 3: Manual smoke test (after DB reset/reseed)**

Reset the Supabase database and reseed with the corrected constraint applied, then verify:

1. **Standard booking via Owner form** — enter checkin = next Monday, checkout = next Friday. Confirm it saves, displays correctly (checkin before checkout), and no date error alert appears.
2. **Turn booking via Admin form** — enter same date for both checkin and checkout. Confirm auto-detects as `turn` type. Save and confirm dates are stored correctly (no swap).
3. **Edit existing booking via Admin form** — open a saved booking for editing. Confirm checkin and checkout dates populate into the correct fields without inversion.
4. **Invalid date rejection** — enter checkout before checkin in any form. Confirm error alert appears with message "Checkout date cannot be before checkin date".
