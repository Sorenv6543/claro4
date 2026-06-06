# 12-Hour Time Format Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize all user-facing time displays to a 12-hour format (e.g., "2:30 PM") across mobile and desktop views.

**Architecture:** Centralize 12h formatting logic in `src/utils/timelineMath.ts` and apply it at the display layer in Vue components. Internal logic remains in 24h format.

**Tech Stack:** Vue 3, TypeScript, Vitest.

---

### Task 1: Update `src/utils/timelineMath.ts`

**Files:**
- Modify: `src/utils/timelineMath.ts`
- Test: `src/__tests__/utils/timelineMath.test.ts` (create if not exists)

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/utils/timelineMath.test.ts
import { describe, it, expect } from 'vitest'
import { fmt12, fmt12Now } from '@/utils/timelineMath'

describe('timelineMath utils', () => {
  it('fmt12 formats 24h string to 12h', () => {
    expect(fmt12('14:30')).toBe('2:30 PM')
    expect(fmt12('09:15')).toBe('9:15 AM')
    expect(fmt12('00:00')).toBe('12:00 AM')
    expect(fmt12('12:00')).toBe('12:00 PM')
  })

  it('fmt12Now returns current time in 12h format', () => {
    const result = fmt12Now()
    expect(result).toMatch(/\d{1,2}:\d{2} (AM|PM)/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/utils/timelineMath.test.ts`
Expected: FAIL

- [ ] **Step 3: Update implementation**

```typescript
// src/utils/timelineMath.ts

/**
 * Format an "HH:MM" string as "h:mm AM/PM" (e.g. "14:30" → "2:30 PM").
 */
export function fmt12 (timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return timeStr
  }
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

/**
 * Get current time in 12h format.
 */
export function fmt12Now(): string {
  const now = new Date()
  return fmt12(`${now.getHours()}:${now.getMinutes()}`)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/__tests__/utils/timelineMath.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/timelineMath.ts src/__tests__/utils/timelineMath.test.ts
git commit -m "utils: update fmt12 and add fmt12Now"
```

---

### Task 2: Update Mobile View (OwnerDayBar.vue)

**Files:**
- Modify: `src/components/dumb/owner/OwnerDayBar.vue`

- [ ] **Step 1: Update `displayTime` computed property**

```typescript
// src/components/dumb/owner/OwnerDayBar.vue
// Replace displayTime logic with fmt12Now()
import { fmt12, fmt12Now, ... } from '@utils/timelineMath'

const displayTime = computed(() => fmt12Now())
```

- [ ] **Step 2: Verify visual consistency**
Check that the greeting time and event times in the list/bottom sheet use the 12h format. (Already using fmt12 in many places, verify no 24h remains).

- [ ] **Step 3: Commit**

```bash
git add src/components/dumb/owner/OwnerDayBar.vue
git commit -m "ui: use centralized fmt12Now in OwnerDayBar"
```

---

### Task 3: Update Desktop View (OwnerOverview.vue)

**Files:**
- Modify: `src/components/smart/owner/OwnerOverview.vue`

- [ ] **Step 1: Update Urgent Banner**

```vue
<!-- src/components/smart/owner/OwnerOverview.vue -->
<!-- Search for: Guests out {{ urgentTurns[0].checkoutTime }} -->
<!-- Ensure it uses fmt12() -->
<div class="triage-sub">
  {{ urgentTurns[0].property }} · Guests out {{ fmt12(urgentTurns[0].checkoutTime) }}
</div>
```

- [ ] **Step 2: Update Upcoming Activity List**

```typescript
// src/components/smart/owner/OwnerOverview.vue
// Ensure unifiedUpcomingEvents uses fmt12 for display
events.push({
  ...
  time: fmt12(b.checkout_time ?? '11:00'),
  ...
})
```

- [ ] **Step 3: Commit**

```bash
git add src/components/smart/owner/OwnerOverview.vue
git commit -m "ui: ensure 12h format in OwnerOverview urgent banner and upcoming list"
```

---

### Task 4: Update Shared PropertyList

**Files:**
- Modify: `src/components/dumb/owner/PropertyList.vue`

- [ ] **Step 1: Identify 24h usages in PropertyList**
Search for `:mm` or 24h logic.

- [ ] **Step 2: Apply `fmt12`**

- [ ] **Step 3: Commit**

```bash
git add src/components/dumb/owner/PropertyList.vue
git commit -m "ui: use 12h format in PropertyList"
```
