---
name: claro4-business-logic
description: Claro4 businessLogic.ts API reference with usage examples. Use when working with booking validation, priority calculation, conflict detection, status transitions, or cleaner assignments.
---

All booking/cleaning rules live in `src/utils/businessLogic.ts`. Never reimplement ad-hoc date math — use these helpers.

## Validation

```typescript
import { validateBooking, validateTurnBooking } from '@utils/businessLogic'

const result = validateBooking(bookingData, property, existingBookings)
// → { valid: boolean, errors: string[], warnings: string[], conflicts?: Booking[] }
if (!result.valid) { /* show result.errors */ }

// Turn bookings (same-day): checkout and checkin must be on same calendar day;
// checkout_time must be after checkin_time; warns on late checkout (>14:00) or early checkin (<14:00)
const { valid, errors, warnings } = validateTurnBooking(bookingData, property)
```

## Priority

```typescript
import { calculateBookingPriority } from '@utils/businessLogic'

const priority = calculateBookingPriority(booking)
// → 'low' | 'normal' | 'high' | 'urgent'  (turns are always at least 'high')
```

## Conflict Detection

```typescript
import { detectBookingConflicts } from '@utils/businessLogic'

const conflicts = detectBookingConflicts(booking, allPropertyBookings)
// → Booking[] of overlapping bookings for same property
// Note: adjacent bookings (one checkout == another checkin) do NOT conflict
```

## Status Transitions

```typescript
import { getAvailableStatusTransitions, canTransitionBookingStatus } from '@utils/businessLogic'

const nextStatuses = getAvailableStatusTransitions(booking)
// → BookingStatus[] of valid next states
```

## Filtering & Querying

```typescript
import {
  filterBookingsByDateRange,
  getRecentBookings,
  getUrgentTurns,
  getUpcomingBookings
} from '@utils/businessLogic'
```

## Metrics & Assignments

```typescript
import { calculateSystemMetrics } from '@utils/businessLogic'
// → Aggregate metrics across properties and bookings

import { buildAssignmentUpdate } from '@utils/businessLogic'
// → Build cleaner assignment update payloads (multiple overloads)

import { canDeactivateProperty } from '@utils/businessLogic'
// → Check if property has active bookings before deactivating
```

## Deprecated
`getCleaningWindow` and `canScheduleCleaning` are deprecated — do not use.
