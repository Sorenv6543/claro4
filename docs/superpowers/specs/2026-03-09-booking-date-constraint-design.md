# Booking Date Constraint Fix — Design Spec

**Date:** 2026-03-09
**Status:** Approved

## Problem

The codebase contains two competing semantic models for `checkin_date` and `checkout_date` on the `bookings` entity. The SQL constraint was written under "cleaning-window model" semantics (checkout = guests leave = earlier, checkin = new guests arrive = later), while CLAUDE.md, type definitions, and business logic functions use "guest-stay model" semantics (checkin = arrival = earlier, checkout = departure = later).

This caused:
- A backwards SQL constraint that would reject all valid bookings
- A deliberate date-swap workaround in `AdminBookingForm` on submit and populate
- `showDateError` computeds that fire for valid bookings in both admin and owner forms
- A backwards FullCalendar `start/end` → form field mapping in `BookingForm.vue`
- A dead `timeDiff` warning in `validateBooking` (always negative under correct model)
- Inverted date iteration and gap calculation in `useProperties.calculatePropertyMetrics`

## Invariant

`checkin_date ≤ checkout_date`

- `checkin_date` = guest arrival = start of stay (earlier)
- `checkout_date` = guest departure = end of stay (later)
- Same-day is valid (turn bookings)

## Approach

Full correction across all bug sites. Dev environment allows DB reset without data migration.

---

## Section 1: Data Layer

**File:** `supabase/migrations/20260309_fix_booking_dates_constraint.sql` (new)

- Drop constraint `booking_dates_valid`
- Add constraint `CHECK (checkout_date >= checkin_date)`

**File:** `src/types/booking.ts` — no changes needed; existing comments already describe Model A correctly.

---

## Section 2: Business Logic

**File:** `src/utils/businessLogic.ts`

- `validateBooking` standard section (lines 219–224): remove the `timeDiff` block entirely. Under Model A with DATE-only fields, `checkoutDate - checkinDate` for different calendar days is always ≥ 24 hours, making the `< 3 hours` warning permanently dead code. Same-day detection is handled by `isTurnBooking` in forms.
- All other exported functions (`validateBooking` line 209 check, `validateTurnBooking`, `detectBookingConflicts`, `calculateBookingPriority`, `getUrgentTurns`, `getUpcomingBookings`, `filterBookingsByDateRange`, `getRecentBookings`, `canDeactivateProperty`): already correct under Model A — no changes.
- `getCleaningWindow` / `canScheduleCleaning`: deprecated per CLAUDE.md — leave untouched.

---

## Section 3: Form Components

### `src/components/dumb/admin/AdminBookingForm.vue`

1. **Remove date-swap on submit** (lines 744–746): replace inverted field assignment with direct mapping (`checkout_date: form.value.checkout_date`, `checkin_date: form.value.checkin_date`).
2. **Remove date-swap on populate** (watch block, lines 795–797): populate form fields directly from booking without swapping.
3. **Fix `showDateError`** (line 553): invert condition from `checkinDate < checkoutDate` to `checkoutDate < checkinDate`.

### `src/components/dumb/owner/OwnerBookingForm.vue`

1. **Fix `showDateError`** (line 273): invert condition from `checkinDate < checkoutDate` to `checkoutDate < checkinDate`.
2. **Fix error message text** (line 153): change "Checkin date cannot be before checkout date" to "Checkout date cannot be before checkin date".
3. **Reorder fields**: swap checkout/checkin field order so checkin (arrival) appears first, checkout (departure) second — consistent with `AdminBookingForm` and `BookingForm`.

### `src/components/dumb/shared/BookingForm.vue`

1. **Fix `initialData` mapping** in `resetForm()` (lines 477–479): swap the `start`/`end` mapping so `start → checkin_date` and `end → checkout_date` (FullCalendar `start` = event begin = guest arrival).

---

## Section 4: Composable

### `src/composables/shared/useProperties.ts` — `calculatePropertyMetrics`

1. **Utilization rate loop** (lines 210–216): change loop start from `checkoutDate` to `checkinDate`, and iterate `while (currentDate <= checkoutDate)`.
2. **Gap calculation** (lines 230–244):
   - Sort by `checkin_date` instead of `checkout_date`
   - Use `sortedBookings[i].checkout_date` as end of current booking
   - Use `sortedBookings[i+1].checkin_date` as start of next booking

---

## Verification

1. `pnpm build` — confirms no type errors
2. `pnpm test:run` — validates business logic and store behaviour
3. Manual smoke test after DB reset/reseed:
   - Standard booking (Mon checkin → Fri checkout) via Owner form: saves correctly
   - Turn booking (same-day checkin/checkout) via Admin form: saves correctly, auto-detects as turn
   - Edit existing booking: dates populate correctly without inversion
