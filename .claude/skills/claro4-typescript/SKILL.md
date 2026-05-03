---
name: claro4-typescript
description: Claro4 TypeScript error patterns and fixes, type locations, and Supabase-to-app type mapping. Use when hitting TypeScript errors, type mismatches, or build failures in this project.
---

## Common Error Patterns

| Error | Likely Cause | Fix |
|-------|--------------|-----|
| `Property 'x' does not exist on type 'never'` | Uninitialized ref or empty array inference | Add explicit type: `ref<Booking[]>([])` |
| `Type 'X \| undefined' is not assignable to 'X'` | Optional chaining or Map.get() | Add null check or use `!` if guaranteed |
| `Argument of type 'X' is not assignable to parameter of type 'Y'` | Supabase row vs app type mismatch | Cast via `as Booking` or map fields explicitly |
| `Object is possibly 'undefined'` | Accessing computed before data loads | Guard with `v-if` in template or `?.` in script |

## Type Locations

- **Domain types**: `src/types/` — Booking, Property, User, etc.
- **Supabase rows**: Inferred from `supabase.from('table').select()` — may need casting to domain types
- **Component props**: Define with `defineProps<{ prop: Type }>()` — import types from `@types/*`
- **Store state**: Pinia stores use `Map<string, T>` — use `.get()` with undefined checks

```typescript
// Common type fixes
const bookings = ref<Booking[]>([])            // explicit type avoids 'never' inference
const booking = bookingStore.bookings.get(id)  // Map.get() returns T | undefined
if (!booking) return                           // always guard, or use ! if guaranteed

// Safe helpers from src/utils/typeHelpers.ts
import { safeDate, safeString, safeBookingField } from '@utils/typeHelpers'
const checkoutDate = safeDate(booking.checkout_date)      // always a valid Date
const field = safeString(unknownValue, 'fallback')        // always a string
```

## Supabase to App Type Mapping
Supabase returns snake_case rows; app types match this convention. When types drift:

```typescript
const { data } = await supabase.from('bookings').select('*')
const bookings = (data ?? []) as Booking[]
```

When types drift: check `supabase/migrations/` for column changes → update `src/types/` → run `pnpm build` to find all affected code.
