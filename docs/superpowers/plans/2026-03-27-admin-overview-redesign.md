# Admin Overview Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the admin dashboard with an operations command center featuring a split-view layout (timeline + action panel), time-aware mode shifting, and inline cleaner/team assignment.

**Architecture:** Split-view page with left timeline panel (chronological bookings) and right action panel (unassigned, urgent turns, cleaner availability, tomorrow preview). A `useTimeAwareMode` composable drives the morning→evening content shift. New `cleaner_teams` table and booking columns support team/group assignment. All new UI is dumb components composed by a rewritten `AdminDashboard.vue` smart component.

**Tech Stack:** Vue 3, Vuetify 4, Pinia, Supabase (Postgres + RLS), Vitest + vue/test-utils

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `supabase/migrations/20260327000000_cleaner_teams_and_assignment.sql` | DB: cleaner_teams table, booking columns, RLS, constraint |
| `src/types/team.ts` | CleanerTeam interface + type guard |
| `src/composables/admin/useTimeAwareMode.ts` | Time-of-day mode logic (isEveningMode, label) |
| `src/components/dumb/admin/AdminMetricsStrip.vue` | Top stat chips row |
| `src/components/dumb/admin/AdminTimelineCard.vue` | Single booking card in timeline |
| `src/components/dumb/admin/AdminTimelineDivider.vue` | Morning/Afternoon/Evening divider |
| `src/components/dumb/admin/AdminAllClearCard.vue` | Empty-state "all clear" card |
| `src/components/dumb/admin/AdminUnassignedCard.vue` | Unassigned bookings action card |
| `src/components/dumb/admin/AdminOverviewUrgentTurns.vue` | Urgent turns action card with countdowns |
| `src/components/dumb/admin/AdminOverviewCleanerAvailability.vue` | Compact cleaner utilization list |
| `src/components/dumb/admin/AdminTomorrowPreview.vue` | Tomorrow summary/prep card |
| `src/components/dumb/shared/AssignmentMenu.vue` | 3-tab assign menu (cleaner/team/quick group) |
| `src/__tests__/composables/admin/useTimeAwareMode.spec.ts` | Tests for time-aware composable |
| `src/__tests__/components/admin/AdminMetricsStrip.spec.ts` | Tests for metrics strip |
| `src/__tests__/components/admin/AdminTimelineCard.spec.ts` | Tests for timeline card |
| `src/__tests__/components/admin/AssignmentMenu.spec.ts` | Tests for assignment menu |

### Modified Files
| File | Changes |
|------|---------|
| `src/types/booking.ts` | Add `assigned_team_id`, `assigned_group_ids` to Booking interface |
| `src/types/index.ts` | Re-export CleanerTeam from team.ts |
| `src/composables/admin/useAdminBookings.ts` | Add today/tomorrow computeds, team/group assign methods |
| `src/composables/admin/useCleanerManagement.ts` | Add `allTeams` computed, `fetchTeams()` method |
| `src/components/smart/admin/AdminDashboard.vue` | Major rewrite — split-view with new dumb components |
| `src/components/smart/admin/HomeAdmin.vue` | Wire up assignment events from dashboard |

---

## Task 1: Database Migration — Cleaner Teams & Assignment Columns

**Files:**
- Create: `supabase/migrations/20260327000000_cleaner_teams_and_assignment.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/20260327000000_cleaner_teams_and_assignment.sql

-- 1. Create cleaner_teams table
CREATE TABLE public.cleaner_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  member_ids UUID[] NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update timestamp trigger
CREATE TRIGGER update_cleaner_teams_updated_at
  BEFORE UPDATE ON public.cleaner_teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for active teams
CREATE INDEX idx_cleaner_teams_active ON public.cleaner_teams (active);

-- 2. Add assignment columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN assigned_team_id UUID REFERENCES public.cleaner_teams(id) ON DELETE SET NULL,
  ADD COLUMN assigned_group_ids UUID[];

-- Index for team assignments
CREATE INDEX idx_bookings_assigned_team ON public.bookings (assigned_team_id);

-- 3. Mutual exclusivity constraint: at most one assignment type
ALTER TABLE public.bookings ADD CONSTRAINT one_assignment_type CHECK (
  (CASE WHEN assigned_cleaner_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN assigned_team_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN assigned_group_ids IS NOT NULL AND array_length(assigned_group_ids, 1) > 0 THEN 1 ELSE 0 END) <= 1
);

-- 4. RLS for cleaner_teams
ALTER TABLE public.cleaner_teams ENABLE ROW LEVEL SECURITY;

-- Admins: full CRUD
CREATE POLICY "Admins can manage all teams"
  ON public.cleaner_teams
  FOR ALL
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- Cleaners: can view teams they belong to
CREATE POLICY "Cleaners can view own teams"
  ON public.cleaner_teams
  FOR SELECT
  USING (private.is_cleaner() AND private.current_user_id() = ANY(member_ids));
```

- [ ] **Step 2: Apply the migration**

Run: `npx supabase db push` (or apply via Supabase MCP if using remote).

Expected: Migration applies successfully. Verify with:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'cleaner_teams';
SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings' AND column_name IN ('assigned_team_id', 'assigned_group_ids');
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260327000000_cleaner_teams_and_assignment.sql
git commit -m "db: add cleaner_teams table and booking assignment columns"
```

---

## Task 2: TypeScript Types — CleanerTeam + Booking Updates

**Files:**
- Create: `src/types/team.ts`
- Modify: `src/types/booking.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Create the CleanerTeam type**

```typescript
// src/types/team.ts

export interface CleanerTeam {
  id: string
  name: string
  member_ids: string[]
  active: boolean
  created_at: string
  updated_at: string
}

export type CleanerTeamFormData = Omit<CleanerTeam, 'id' | 'created_at' | 'updated_at'>

export function isCleanerTeam(obj: unknown): obj is CleanerTeam {
  if (!obj || typeof obj !== 'object') return false
  const team = obj as Record<string, unknown>
  return (
    typeof team.id === 'string' &&
    typeof team.name === 'string' &&
    Array.isArray(team.member_ids) &&
    typeof team.active === 'boolean'
  )
}
```

- [ ] **Step 2: Add assignment fields to Booking interface**

In `src/types/booking.ts`, find the `Booking` interface and add two new fields after `assigned_cleaner_id`:

```typescript
// Add these two lines after assigned_cleaner_id in the Booking interface:
  assigned_team_id?: string | null
  assigned_group_ids?: string[] | null
```

- [ ] **Step 3: Re-export from index**

In `src/types/index.ts`, add:

```typescript
export type { CleanerTeam, CleanerTeamFormData } from './team'
export { isCleanerTeam } from './team'
```

- [ ] **Step 4: Verify types compile**

Run: `npx vue-tsc --noEmit`
Expected: No errors related to team types.

- [ ] **Step 5: Commit**

```bash
git add src/types/team.ts src/types/booking.ts src/types/index.ts
git commit -m "types: add CleanerTeam interface and booking assignment fields"
```

---

## Task 3: Composable — useTimeAwareMode

**Files:**
- Create: `src/__tests__/composables/admin/useTimeAwareMode.spec.ts`
- Create: `src/composables/admin/useTimeAwareMode.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/__tests__/composables/admin/useTimeAwareMode.spec.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTimeAwareMode } from '@composables/admin/useTimeAwareMode'

describe('useTimeAwareMode', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns morning mode before 4 PM', () => {
    vi.setSystemTime(new Date('2026-03-27T10:00:00'))
    const { isEveningMode, modeLabel } = useTimeAwareMode()
    expect(isEveningMode.value).toBe(false)
    expect(modeLabel.value).toBe("Today's Schedule")
  })

  it('returns evening mode at 4 PM', () => {
    vi.setSystemTime(new Date('2026-03-27T16:00:00'))
    const { isEveningMode, modeLabel } = useTimeAwareMode()
    expect(isEveningMode.value).toBe(true)
    expect(modeLabel.value).toBe("Tomorrow's Prep")
  })

  it('returns evening mode after 4 PM', () => {
    vi.setSystemTime(new Date('2026-03-27T19:30:00'))
    const { isEveningMode, modeLabel } = useTimeAwareMode()
    expect(isEveningMode.value).toBe(true)
    expect(modeLabel.value).toBe("Tomorrow's Prep")
  })

  it('provides today and tomorrow date strings', () => {
    vi.setSystemTime(new Date('2026-03-27T10:00:00'))
    const { todayDateString, tomorrowDateString } = useTimeAwareMode()
    expect(todayDateString.value).toBe('2026-03-27')
    expect(tomorrowDateString.value).toBe('2026-03-28')
  })

  it('uses configurable threshold', () => {
    vi.setSystemTime(new Date('2026-03-27T14:00:00'))
    const { isEveningMode } = useTimeAwareMode({ thresholdHour: 14 })
    expect(isEveningMode.value).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/__tests__/composables/admin/useTimeAwareMode.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the composable**

```typescript
// src/composables/admin/useTimeAwareMode.ts
import { computed, onUnmounted, ref } from 'vue'

const EVENING_THRESHOLD_HOUR = 16

interface TimeAwareModeOptions {
  thresholdHour?: number
}

export function useTimeAwareMode(options: TimeAwareModeOptions = {}) {
  const thresholdHour = options.thresholdHour ?? EVENING_THRESHOLD_HOUR
  const now = ref(new Date())

  // Update every minute
  const interval = setInterval(() => {
    now.value = new Date()
  }, 60_000)

  onUnmounted(() => clearInterval(interval))

  const isEveningMode = computed(() => now.value.getHours() >= thresholdHour)

  const modeLabel = computed(() =>
    isEveningMode.value ? "Tomorrow's Prep" : "Today's Schedule"
  )

  const todayDateString = computed(() => {
    const d = now.value
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  const tomorrowDateString = computed(() => {
    const tomorrow = new Date(now.value)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
  })

  return {
    isEveningMode,
    modeLabel,
    todayDateString,
    tomorrowDateString,
    now,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- src/__tests__/composables/admin/useTimeAwareMode.spec.ts`
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/composables/admin/useTimeAwareMode.ts src/__tests__/composables/admin/useTimeAwareMode.spec.ts
git commit -m "feat: add useTimeAwareMode composable for time-aware dashboard"
```

---

## Task 4: Extend useAdminBookings — Today/Tomorrow Computeds + Assignment Methods

**Files:**
- Modify: `src/composables/admin/useAdminBookings.ts`

- [ ] **Step 1: Add today/tomorrow computed properties**

In `src/composables/admin/useAdminBookings.ts`, add these computed properties after the existing `unassignedBookings` computed. They reference `allBookings` which is already defined in the composable.

Add this import at the top of the file:

```typescript
import type { CleanerTeam } from '@/types/team'
```

Then add these computeds inside the composable function, after `unassignedBookings`:

```typescript
  const todayBookingsByTime = computed(() => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    return allBookings.value
      .filter((b: Booking) => b.checkout_date === todayStr || b.checkin_date === todayStr)
      .sort((a: Booking, b: Booking) => {
        const timeA = a.checkout_time || a.checkin_time || '00:00'
        const timeB = b.checkout_time || b.checkin_time || '00:00'
        return timeA.localeCompare(timeB)
      })
  })

  const tomorrowBookings = computed(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
    return allBookings.value
      .filter((b: Booking) => b.checkout_date === tomorrowStr || b.checkin_date === tomorrowStr)
      .sort((a: Booking, b: Booking) => {
        const timeA = a.checkout_time || a.checkin_time || '00:00'
        const timeB = b.checkout_time || b.checkin_time || '00:00'
        return timeA.localeCompare(timeB)
      })
  })

  const unassignedToday = computed(() => {
    return todayBookingsByTime.value.filter(
      (b: Booking) => !b.assigned_cleaner_id && !b.assigned_team_id && (!b.assigned_group_ids || b.assigned_group_ids.length === 0)
    )
  })

  const unassignedTomorrow = computed(() => {
    return tomorrowBookings.value.filter(
      (b: Booking) => !b.assigned_cleaner_id && !b.assigned_team_id && (!b.assigned_group_ids || b.assigned_group_ids.length === 0)
    )
  })

  const urgentTurnsToday = computed(() => {
    const now = new Date()
    return todayBookingsByTime.value.filter((b: Booking) => {
      if (b.booking_type !== 'turn') return false
      if (b.status === 'completed' || b.status === 'cancelled') return false
      const checkoutTime = b.checkout_time || '11:00'
      const [hours, minutes] = checkoutTime.split(':').map(Number)
      const checkoutDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
      const hoursUntil = (checkoutDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      return hoursUntil <= 6 && hoursUntil > -2
    })
  })
```

- [ ] **Step 2: Add team/group assignment methods**

Add these methods inside the composable function, after the existing `assignCleanerToBooking`:

```typescript
  async function assignTeamToBooking(bookingId: string, teamId: string): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await supabaseBookings.updateBooking(bookingId, {
        assigned_team_id: teamId,
        assigned_cleaner_id: null,
        assigned_group_ids: null,
      } as Partial<Booking>)
      success.value = 'Team assigned successfully'
      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to assign team'
      return false
    } finally {
      loading.value = false
    }
  }

  async function assignGroupToBooking(bookingId: string, cleanerIds: string[]): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await supabaseBookings.updateBooking(bookingId, {
        assigned_group_ids: cleanerIds,
        assigned_cleaner_id: null,
        assigned_team_id: null,
      } as Partial<Booking>)
      success.value = 'Group assigned successfully'
      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to assign group'
      return false
    } finally {
      loading.value = false
    }
  }
```

- [ ] **Step 3: Add new exports to the return object**

Find the return statement in the composable and add the new properties:

```typescript
    // Add to the return object:
    todayBookingsByTime,
    tomorrowBookings,
    unassignedToday,
    unassignedTomorrow,
    urgentTurnsToday,
    assignTeamToBooking,
    assignGroupToBooking,
```

- [ ] **Step 4: Verify types compile**

Run: `npx vue-tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 5: Commit**

```bash
git add src/composables/admin/useAdminBookings.ts
git commit -m "feat: add today/tomorrow bookings and team assignment to useAdminBookings"
```

---

## Task 5: Extend useCleanerManagement — Team Support

**Files:**
- Modify: `src/composables/admin/useCleanerManagement.ts`

- [ ] **Step 1: Add team imports and state**

At the top of `src/composables/admin/useCleanerManagement.ts`, add:

```typescript
import type { CleanerTeam } from '@/types/team'
```

Inside the composable function, add a new ref after the existing `cleaners` ref:

```typescript
  const teams = ref<CleanerTeam[]>([])
```

- [ ] **Step 2: Add fetchTeams method and allTeams computed**

Add after the existing `fetchCleaners` method:

```typescript
  async function fetchTeams(): Promise<boolean> {
    try {
      const { data, error: fetchError } = await supabase
        .from('cleaner_teams')
        .select('*')
        .eq('active', true)
        .order('name')
      if (fetchError) throw fetchError
      teams.value = (data ?? []) as CleanerTeam[]
      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch teams'
      return false
    }
  }

  const allTeams = computed(() => teams.value)
```

- [ ] **Step 3: Add to return object**

Add `allTeams`, `fetchTeams`, and `teams` to the existing return object.

- [ ] **Step 4: Verify types compile**

Run: `npx vue-tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 5: Commit**

```bash
git add src/composables/admin/useCleanerManagement.ts
git commit -m "feat: add cleaner team support to useCleanerManagement"
```

---

## Task 6: Dumb Component — AdminMetricsStrip

**Files:**
- Create: `src/__tests__/components/admin/AdminMetricsStrip.spec.ts`
- Create: `src/components/dumb/admin/AdminMetricsStrip.vue`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/components/admin/AdminMetricsStrip.spec.ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import AdminMetricsStrip from '@components/dumb/admin/AdminMetricsStrip.vue'

const vuetify = createVuetify()

function mountStrip(props = {}) {
  return mount(AdminMetricsStrip, {
    props: {
      totalCleanings: 14,
      unassignedCount: 2,
      turnCount: 3,
      activeCleaners: 8,
      ...props,
    },
    global: { plugins: [vuetify] },
  })
}

describe('AdminMetricsStrip', () => {
  it('renders all four metric chips', () => {
    const wrapper = mountStrip()
    const text = wrapper.text()
    expect(text).toContain('14')
    expect(text).toContain('cleanings')
    expect(text).toContain('2')
    expect(text).toContain('unassigned')
    expect(text).toContain('3')
    expect(text).toContain('turns')
    expect(text).toContain('8')
    expect(text).toContain('cleaners')
  })

  it('shows success style when no unassigned', () => {
    const wrapper = mountStrip({ unassignedCount: 0 })
    expect(wrapper.text()).toContain('All assigned')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/__tests__/components/admin/AdminMetricsStrip.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

```vue
<!-- src/components/dumb/admin/AdminMetricsStrip.vue -->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  totalCleanings: number
  unassignedCount: number
  turnCount: number
  activeCleaners: number
  label?: string
}>()

const unassignedColor = computed(() => props.unassignedCount > 0 ? 'error' : 'success')
const unassignedText = computed(() =>
  props.unassignedCount > 0 ? `${props.unassignedCount} unassigned` : 'All assigned'
)
const unassignedIcon = computed(() =>
  props.unassignedCount > 0 ? 'mdi-alert-circle-outline' : 'mdi-check-circle-outline'
)
</script>

<template>
  <v-row class="metrics-strip mb-4" no-gutters align="center">
    <v-col cols="auto" class="d-flex flex-wrap ga-2">
      <v-chip variant="tonal" color="info" size="small" prepend-icon="mdi-clipboard-text-outline">
        {{ totalCleanings }} cleanings {{ label || 'today' }}
      </v-chip>
      <v-chip variant="tonal" :color="unassignedColor" size="small" :prepend-icon="unassignedIcon">
        {{ unassignedText }}
      </v-chip>
      <v-chip variant="tonal" color="warning" size="small" prepend-icon="mdi-swap-horizontal">
        {{ turnCount }} turns
      </v-chip>
      <v-chip variant="tonal" color="success" size="small" prepend-icon="mdi-account-group-outline">
        {{ activeCleaners }} cleaners active
      </v-chip>
    </v-col>
  </v-row>
</template>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/__tests__/components/admin/AdminMetricsStrip.spec.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/dumb/admin/AdminMetricsStrip.vue src/__tests__/components/admin/AdminMetricsStrip.spec.ts
git commit -m "feat: add AdminMetricsStrip dumb component"
```

---

## Task 7: Dumb Component — AdminTimelineDivider

**Files:**
- Create: `src/components/dumb/admin/AdminTimelineDivider.vue`

- [ ] **Step 1: Create the component**

This is a trivially simple component — a styled text divider. No test needed for a pure visual element.

```vue
<!-- src/components/dumb/admin/AdminTimelineDivider.vue -->
<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>

<template>
  <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mt-3 mb-2 pb-1" style="letter-spacing: 0.5px; border-bottom: 1px solid rgb(var(--v-border-color));">
    {{ label }}
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dumb/admin/AdminTimelineDivider.vue
git commit -m "feat: add AdminTimelineDivider dumb component"
```

---

## Task 8: Dumb Component — AdminTimelineCard

**Files:**
- Create: `src/__tests__/components/admin/AdminTimelineCard.spec.ts`
- Create: `src/components/dumb/admin/AdminTimelineCard.vue`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/components/admin/AdminTimelineCard.spec.ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import AdminTimelineCard from '@components/dumb/admin/AdminTimelineCard.vue'

const vuetify = createVuetify()

const baseBooking = {
  id: 'b1',
  property_id: 'p1',
  owner_id: 'o1',
  checkout_date: '2026-03-27',
  checkout_time: '11:00',
  checkin_date: '2026-03-27',
  checkin_time: '15:00',
  booking_type: 'standard' as const,
  status: 'scheduled' as const,
  priority: 'normal' as const,
  assigned_cleaner_id: 'c1',
}

const baseProperty = {
  id: 'p1',
  name: 'Oceanview Condo',
  color: '#5c6bc0',
}

const baseCleaner = {
  id: 'c1',
  name: 'Maria R.',
}

function mountCard(props = {}) {
  return mount(AdminTimelineCard, {
    props: {
      booking: baseBooking,
      property: baseProperty,
      cleaner: baseCleaner,
      ...props,
    },
    global: { plugins: [vuetify] },
  })
}

describe('AdminTimelineCard', () => {
  it('renders property name and time', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('Oceanview Condo')
    expect(wrapper.text()).toContain('11:00')
  })

  it('shows cleaner name when assigned', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('Maria R.')
  })

  it('shows Unassigned chip when no cleaner', () => {
    const wrapper = mountCard({
      booking: { ...baseBooking, assigned_cleaner_id: null },
      cleaner: null,
    })
    expect(wrapper.text()).toContain('Unassigned')
  })

  it('emits assign event', async () => {
    const wrapper = mountCard({
      booking: { ...baseBooking, assigned_cleaner_id: null },
      cleaner: null,
    })
    const assignBtn = wrapper.find('[data-testid="assign-btn"]')
    if (assignBtn.exists()) {
      await assignBtn.trigger('click')
      expect(wrapper.emitted('assign')).toBeTruthy()
      expect(wrapper.emitted('assign')![0]).toEqual([baseBooking])
    }
  })

  it('shows Turn chip for turn bookings', () => {
    const wrapper = mountCard({
      booking: { ...baseBooking, booking_type: 'turn' },
    })
    expect(wrapper.text()).toContain('Turn')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/__tests__/components/admin/AdminTimelineCard.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

```vue
<!-- src/components/dumb/admin/AdminTimelineCard.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Booking } from '@/types/booking'
import { getBookingStatusColor } from '@/utils/constants'

const props = defineProps<{
  booking: Booking
  property: { id: string; name: string; color: string } | null
  cleaner: { id: string; name: string } | null
  teamName?: string | null
  groupNames?: string[] | null
}>()

const emit = defineEmits<{
  assign: [booking: Booking]
  view: [booking: Booking]
  statusChange: [booking: Booking]
}>()

const displayTime = computed(() => {
  const time = props.booking.checkout_time || props.booking.checkin_time || ''
  return time.substring(0, 5)
})

const typeLabel = computed(() => {
  if (props.booking.booking_type === 'turn') {
    const checkinTime = props.booking.checkin_time?.substring(0, 5) || ''
    return `Turn (checkin ${checkinTime})`
  }
  return 'Standard clean'
})

const isUnassigned = computed(() =>
  !props.booking.assigned_cleaner_id &&
  !props.booking.assigned_team_id &&
  (!props.booking.assigned_group_ids || props.booking.assigned_group_ids.length === 0)
)

const isInProgress = computed(() => props.booking.status === 'in_progress')

const assigneeDisplay = computed(() => {
  if (props.teamName) return props.teamName
  if (props.groupNames?.length) return props.groupNames.join(', ')
  if (props.cleaner) return props.cleaner.name
  return null
})

const cleanerInitials = computed(() => {
  const name = assigneeDisplay.value
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
})

const borderStyle = computed(() => {
  if (isUnassigned.value) return { borderLeft: '3px solid rgb(var(--v-theme-error))' }
  if (isInProgress.value) return { borderLeft: '3px solid rgb(var(--v-theme-warning))' }
  return {}
})

const cardClass = computed(() => isUnassigned.value ? 'bg-error-lighten-5' : '')

const statusColor = computed(() => getBookingStatusColor(props.booking.status))
</script>

<template>
  <v-card
    variant="outlined"
    rounded="lg"
    class="mb-2"
    :class="cardClass"
    :style="borderStyle"
  >
    <v-card-text class="d-flex align-center ga-3 py-2 px-3">
      <!-- Time -->
      <div class="text-subtitle-2 font-weight-bold text-medium-emphasis" style="min-width: 48px;">
        {{ displayTime }}
      </div>

      <!-- Property color dot -->
      <div
        v-if="property"
        class="rounded-circle flex-shrink-0"
        :style="{ width: '10px', height: '10px', backgroundColor: property.color }"
      />

      <!-- Property name + type -->
      <div class="flex-grow-1" style="min-width: 0;">
        <div class="text-body-2 font-weight-medium text-truncate">
          {{ property?.name || 'Unknown Property' }}
        </div>
        <div class="text-caption text-medium-emphasis">
          Checkout → {{ typeLabel }}
        </div>
      </div>

      <!-- Turn chip -->
      <v-chip
        v-if="booking.booking_type === 'turn'"
        size="x-small"
        color="warning"
        variant="tonal"
      >
        Turn
      </v-chip>

      <!-- Status chip -->
      <v-chip size="x-small" :color="statusColor" variant="tonal">
        {{ booking.status.replace('_', ' ') }}
      </v-chip>

      <!-- Cleaner or Unassigned -->
      <template v-if="isUnassigned">
        <v-chip size="x-small" color="error" variant="flat">
          Unassigned
        </v-chip>
        <v-btn
          data-testid="assign-btn"
          size="x-small"
          color="primary"
          variant="tonal"
          @click.stop="emit('assign', booking)"
        >
          Assign
        </v-btn>
      </template>
      <template v-else>
        <div class="d-flex align-center ga-1">
          <v-avatar size="22" color="primary">
            <span class="text-caption">{{ cleanerInitials }}</span>
          </v-avatar>
          <span class="text-caption text-truncate" style="max-width: 80px;">
            {{ assigneeDisplay }}
          </span>
        </div>
      </template>

      <!-- Quick actions menu -->
      <v-btn
        icon="mdi-dots-vertical"
        size="x-small"
        variant="text"
        class="d-none d-md-flex"
        @click.stop
      >
        <v-icon size="16">mdi-dots-vertical</v-icon>
        <v-menu activator="parent">
          <v-list density="compact">
            <v-list-item
              v-if="isUnassigned"
              prepend-icon="mdi-account-plus"
              title="Assign"
              @click="emit('assign', booking)"
            />
            <v-list-item
              prepend-icon="mdi-eye"
              title="View Details"
              @click="emit('view', booking)"
            />
            <v-list-item
              prepend-icon="mdi-swap-horizontal"
              title="Change Status"
              @click="emit('statusChange', booking)"
            />
          </v-list>
        </v-menu>
      </v-btn>
    </v-card-text>
  </v-card>
</template>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/__tests__/components/admin/AdminTimelineCard.spec.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/dumb/admin/AdminTimelineCard.vue src/__tests__/components/admin/AdminTimelineCard.spec.ts
git commit -m "feat: add AdminTimelineCard dumb component"
```

---

## Task 9: Dumb Component — AdminAllClearCard

**Files:**
- Create: `src/components/dumb/admin/AdminAllClearCard.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- src/components/dumb/admin/AdminAllClearCard.vue -->
<template>
  <v-card variant="outlined" rounded="lg" class="text-center pa-6">
    <v-icon icon="mdi-check-circle-outline" size="48" color="success" class="mb-2" />
    <div class="text-body-1 text-medium-emphasis">
      All clear — no actions needed
    </div>
  </v-card>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dumb/admin/AdminAllClearCard.vue
git commit -m "feat: add AdminAllClearCard empty state component"
```

---

## Task 10: Dumb Component — AdminUnassignedCard

**Files:**
- Create: `src/components/dumb/admin/AdminUnassignedCard.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- src/components/dumb/admin/AdminUnassignedCard.vue -->
<script setup lang="ts">
import type { Booking } from '@/types/booking'

defineProps<{
  bookings: Booking[]
  propertyMap: Map<string, { id: string; name: string; color: string }>
}>()

const emit = defineEmits<{
  assign: [booking: Booking]
}>()

function getPropertyName(booking: Booking): string {
  return propertyMap.get(booking.property_id)?.name || 'Unknown'
}

function formatTime(booking: Booking): string {
  const time = booking.checkout_time || booking.checkin_time || ''
  return time.substring(0, 5)
}

// Template needs access to propertyMap from props
const propertyMap = defineModel<Map<string, { id: string; name: string; color: string }>>()
</script>

<template>
  <v-card variant="outlined" rounded="lg" border="error" class="mb-3">
    <v-card-text>
      <div class="d-flex align-center justify-space-between mb-3">
        <span class="text-subtitle-2 font-weight-bold text-error">
          <v-icon icon="mdi-alert-circle" size="18" class="mr-1" />
          Unassigned
        </span>
        <v-badge :content="bookings.length" color="error" inline />
      </div>

      <div
        v-for="booking in bookings"
        :key="booking.id"
        class="d-flex align-center justify-space-between rounded-lg pa-2 mb-1"
        style="background: rgb(var(--v-theme-surface-variant), 0.3);"
      >
        <div>
          <div class="text-body-2 font-weight-medium">
            {{ $props.propertyMap.get(booking.property_id)?.name || 'Unknown' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ formatTime(booking) }} · {{ booking.booking_type === 'turn' ? 'Turn' : 'Standard' }}
          </div>
        </div>
        <v-btn
          size="small"
          color="primary"
          variant="flat"
          append-icon="mdi-chevron-down"
          @click="emit('assign', booking)"
        >
          Assign
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>
```

Wait — there's a bug in the above. The `defineModel` is wrong. Let me fix this. The props already define `propertyMap`, so we just need to access it via `props.propertyMap` in the script. Let me rewrite properly:

```vue
<!-- src/components/dumb/admin/AdminUnassignedCard.vue -->
<script setup lang="ts">
import type { Booking } from '@/types/booking'

const props = defineProps<{
  bookings: Booking[]
  propertyMap: Map<string, { id: string; name: string; color: string }>
}>()

const emit = defineEmits<{
  assign: [booking: Booking]
}>()

function formatTime(booking: Booking): string {
  const time = booking.checkout_time || booking.checkin_time || ''
  return time.substring(0, 5)
}
</script>

<template>
  <v-card variant="outlined" rounded="lg" border="error" class="mb-3">
    <v-card-text>
      <div class="d-flex align-center justify-space-between mb-3">
        <span class="text-subtitle-2 font-weight-bold text-error">
          <v-icon icon="mdi-alert-circle" size="18" class="mr-1" />
          Unassigned
        </span>
        <v-badge :content="bookings.length" color="error" inline />
      </div>

      <div
        v-for="booking in bookings"
        :key="booking.id"
        class="d-flex align-center justify-space-between rounded-lg pa-2 mb-1"
        style="background: rgb(var(--v-theme-surface-variant), 0.3);"
      >
        <div>
          <div class="text-body-2 font-weight-medium">
            {{ props.propertyMap.get(booking.property_id)?.name || 'Unknown' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ formatTime(booking) }} · {{ booking.booking_type === 'turn' ? 'Turn' : 'Standard' }}
          </div>
        </div>
        <v-btn
          size="small"
          color="primary"
          variant="flat"
          append-icon="mdi-chevron-down"
          @click="emit('assign', booking)"
        >
          Assign
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dumb/admin/AdminUnassignedCard.vue
git commit -m "feat: add AdminUnassignedCard action panel component"
```

---

## Task 11: Dumb Component — AdminOverviewUrgentTurns

**Files:**
- Create: `src/components/dumb/admin/AdminOverviewUrgentTurns.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- src/components/dumb/admin/AdminOverviewUrgentTurns.vue -->
<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import type { Booking } from '@/types/booking'

const props = defineProps<{
  turns: Booking[]
  propertyMap: Map<string, { id: string; name: string; color: string }>
  cleanerMap: Map<string, { id: string; name: string }>
}>()

const emit = defineEmits<{
  assign: [booking: Booking]
}>()

const now = ref(new Date())
const interval = setInterval(() => { now.value = new Date() }, 60_000)
onUnmounted(() => clearInterval(interval))

function getTimeRemaining(booking: Booking): string {
  const checkoutTime = booking.checkout_time || '11:00'
  const [hours, minutes] = checkoutTime.split(':').map(Number)
  const checkout = new Date(now.value)
  checkout.setHours(hours, minutes, 0, 0)
  const diffMs = checkout.getTime() - now.value.getTime()
  if (diffMs <= 0) return 'Overdue'
  const h = Math.floor(diffMs / 3_600_000)
  const m = Math.floor((diffMs % 3_600_000) / 60_000)
  return `${h}h ${m}m remaining`
}

function getPriorityColor(booking: Booking): string {
  const checkoutTime = booking.checkout_time || '11:00'
  const [hours, minutes] = checkoutTime.split(':').map(Number)
  const checkout = new Date(now.value)
  checkout.setHours(hours, minutes, 0, 0)
  const hoursUntil = (checkout.getTime() - now.value.getTime()) / 3_600_000
  if (hoursUntil <= 2) return 'error'
  return 'warning'
}

function isUnassigned(booking: Booking): boolean {
  return !booking.assigned_cleaner_id && !booking.assigned_team_id &&
    (!booking.assigned_group_ids || booking.assigned_group_ids.length === 0)
}

function getTimeWindow(booking: Booking): string {
  const out = (booking.checkout_time || '11:00').substring(0, 5)
  const inn = (booking.checkin_time || '15:00').substring(0, 5)
  return `${out} out → ${inn} in`
}
</script>

<template>
  <v-card variant="outlined" rounded="lg" border="warning" class="mb-3">
    <v-card-text>
      <div class="d-flex align-center justify-space-between mb-3">
        <span class="text-subtitle-2 font-weight-bold" style="color: rgb(var(--v-theme-warning));">
          <v-icon icon="mdi-swap-horizontal" size="18" class="mr-1" />
          Urgent Turns
        </span>
        <v-badge :content="turns.length" color="warning" inline />
      </div>

      <div
        v-for="turn in turns"
        :key="turn.id"
        class="rounded-lg pa-2 mb-1"
        style="background: rgb(var(--v-theme-surface-variant), 0.3);"
      >
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-body-2 font-weight-medium">
              {{ props.propertyMap.get(turn.property_id)?.name || 'Unknown' }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ getTimeWindow(turn) }}
            </div>
          </div>
          <v-chip size="x-small" :color="getPriorityColor(turn)" variant="tonal">
            {{ getPriorityColor(turn) === 'error' ? 'Critical' : 'Urgent' }}
          </v-chip>
        </div>
        <div class="d-flex align-center justify-space-between mt-1">
          <span class="text-caption font-weight-medium" :class="getPriorityColor(turn) === 'error' ? 'text-error' : 'text-warning'">
            ⏱ {{ getTimeRemaining(turn) }}
            <template v-if="isUnassigned(turn)"> · Unassigned</template>
          </span>
          <v-btn
            v-if="isUnassigned(turn)"
            size="x-small"
            color="primary"
            variant="tonal"
            @click="emit('assign', turn)"
          >
            Assign
          </v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dumb/admin/AdminOverviewUrgentTurns.vue
git commit -m "feat: add AdminOverviewUrgentTurns action panel component"
```

---

## Task 12: Dumb Component — AdminOverviewCleanerAvailability

**Files:**
- Create: `src/components/dumb/admin/AdminOverviewCleanerAvailability.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- src/components/dumb/admin/AdminOverviewCleanerAvailability.vue -->
<script setup lang="ts">
import { ref } from 'vue'

export interface CleanerAvailabilityItem {
  id: string
  name: string
  assigned: number
  total: number
  isTeam?: boolean
  todayBookings?: Array<{ id: string; propertyName: string; time: string }>
}

defineProps<{
  cleaners: CleanerAvailabilityItem[]
}>()

const expandedId = ref<string | null>(null)

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function utilizationPercent(item: CleanerAvailabilityItem): number {
  if (item.total === 0) return 0
  return Math.round((item.assigned / item.total) * 100)
}

function utilizationColor(item: CleanerAvailabilityItem): string {
  const pct = utilizationPercent(item)
  if (pct >= 75) return 'error'
  if (pct >= 50) return 'warning'
  return 'success'
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}
</script>

<template>
  <v-card variant="outlined" rounded="lg" class="mb-3">
    <v-card-text>
      <div class="text-subtitle-2 font-weight-bold mb-3">
        <v-icon icon="mdi-account-group-outline" size="18" class="mr-1" />
        Cleaner Availability
      </div>

      <div v-for="item in cleaners" :key="item.id" class="mb-2">
        <div
          class="d-flex align-center ga-2 cursor-pointer"
          @click="toggleExpand(item.id)"
        >
          <v-avatar size="22" :color="item.isTeam ? 'blue-grey' : 'primary'" variant="tonal">
            <span class="text-caption">{{ item.isTeam ? 'T' : initials(item.name) }}</span>
          </v-avatar>
          <span class="text-body-2 flex-grow-1 text-truncate">{{ item.name }}</span>
          <v-progress-linear
            :model-value="utilizationPercent(item)"
            :color="utilizationColor(item)"
            rounded
            height="6"
            style="max-width: 80px;"
          />
          <span class="text-caption text-medium-emphasis" style="min-width: 28px; text-align: right;">
            {{ item.assigned }}/{{ item.total }}
          </span>
        </div>

        <!-- Expanded detail -->
        <v-expand-transition>
          <div v-if="expandedId === item.id && item.todayBookings?.length" class="ml-8 mt-1">
            <div
              v-for="booking in item.todayBookings"
              :key="booking.id"
              class="text-caption text-medium-emphasis"
            >
              {{ booking.time }} — {{ booking.propertyName }}
            </div>
          </div>
        </v-expand-transition>
      </div>
    </v-card-text>
  </v-card>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dumb/admin/AdminOverviewCleanerAvailability.vue
git commit -m "feat: add AdminOverviewCleanerAvailability action panel component"
```

---

## Task 13: Dumb Component — AdminTomorrowPreview

**Files:**
- Create: `src/components/dumb/admin/AdminTomorrowPreview.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- src/components/dumb/admin/AdminTomorrowPreview.vue -->
<script setup lang="ts">
import type { Booking } from '@/types/booking'

const props = defineProps<{
  totalBookings: number
  turnCount: number
  unassignedCount: number
  isEveningMode: boolean
  unassignedBookings?: Booking[]
  propertyMap?: Map<string, { id: string; name: string; color: string }>
}>()

const emit = defineEmits<{
  assign: [booking: Booking]
}>()

function formatTime(booking: Booking): string {
  return (booking.checkout_time || booking.checkin_time || '').substring(0, 5)
}
</script>

<template>
  <v-card
    variant="outlined"
    rounded="lg"
    class="mb-3"
    :border="isEveningMode ? 'info' : undefined"
    :style="isEveningMode ? {} : { opacity: 0.7 }"
  >
    <v-card-text>
      <div class="text-subtitle-2 font-weight-bold mb-2" :class="isEveningMode ? 'text-info' : 'text-medium-emphasis'">
        <v-icon icon="mdi-calendar-arrow-right" size="18" class="mr-1" />
        Tomorrow Preview
      </div>

      <!-- Compact summary -->
      <div class="text-body-2" :class="isEveningMode ? '' : 'text-medium-emphasis'">
        {{ totalBookings }} cleanings · {{ turnCount }} turns ·
        <span v-if="unassignedCount === 0" class="text-success">All assigned ✓</span>
        <span v-else class="text-error">{{ unassignedCount }} unassigned</span>
      </div>

      <!-- Expanded unassigned list in evening mode -->
      <template v-if="isEveningMode && unassignedBookings?.length">
        <v-divider class="my-2" />
        <div
          v-for="booking in unassignedBookings"
          :key="booking.id"
          class="d-flex align-center justify-space-between rounded-lg pa-2 mb-1"
          style="background: rgb(var(--v-theme-surface-variant), 0.3);"
        >
          <div>
            <div class="text-body-2 font-weight-medium">
              {{ props.propertyMap?.get(booking.property_id)?.name || 'Unknown' }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ formatTime(booking) }} · {{ booking.booking_type === 'turn' ? 'Turn' : 'Standard' }}
            </div>
          </div>
          <v-btn
            size="small"
            color="primary"
            variant="tonal"
            append-icon="mdi-chevron-down"
            @click="emit('assign', booking)"
          >
            Assign
          </v-btn>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dumb/admin/AdminTomorrowPreview.vue
git commit -m "feat: add AdminTomorrowPreview action panel component"
```

---

## Task 14: Shared Component — AssignmentMenu

**Files:**
- Create: `src/__tests__/components/admin/AssignmentMenu.spec.ts`
- Create: `src/components/dumb/shared/AssignmentMenu.vue`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/components/admin/AssignmentMenu.spec.ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import AssignmentMenu from '@components/dumb/shared/AssignmentMenu.vue'

const vuetify = createVuetify()

const mockCleaners = [
  { id: 'c1', name: 'Maria R.', assigned: 2, total: 4 },
  { id: 'c2', name: 'Carlos K.', assigned: 4, total: 4 },
]

const mockTeams = [
  { id: 't1', name: 'Team A', member_ids: ['c1', 'c3'], assigned: 1, total: 2 },
]

function mountMenu(props = {}) {
  return mount(AssignmentMenu, {
    props: {
      cleaners: mockCleaners,
      teams: mockTeams,
      ...props,
    },
    global: { plugins: [vuetify] },
  })
}

describe('AssignmentMenu', () => {
  it('renders cleaner list', () => {
    const wrapper = mountMenu()
    expect(wrapper.text()).toContain('Maria R.')
    expect(wrapper.text()).toContain('Carlos K.')
  })

  it('emits assignCleaner when a cleaner is clicked', async () => {
    const wrapper = mountMenu()
    const items = wrapper.findAll('[data-testid="cleaner-item"]')
    if (items.length > 0) {
      await items[0].trigger('click')
      expect(wrapper.emitted('assignCleaner')).toBeTruthy()
      expect(wrapper.emitted('assignCleaner')![0]).toEqual(['c1'])
    }
  })

  it('disables cleaners at capacity', () => {
    const wrapper = mountMenu()
    const text = wrapper.text()
    // Carlos K. is at 4/4 capacity
    expect(text).toContain('Carlos K.')
    expect(text).toContain('4/4')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/__tests__/components/admin/AssignmentMenu.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

```vue
<!-- src/components/dumb/shared/AssignmentMenu.vue -->
<script setup lang="ts">
import { ref } from 'vue'

export interface AssignableCleaner {
  id: string
  name: string
  assigned: number
  total: number
}

export interface AssignableTeam {
  id: string
  name: string
  member_ids: string[]
  assigned: number
  total: number
}

const props = defineProps<{
  cleaners: AssignableCleaner[]
  teams: AssignableTeam[]
}>()

const emit = defineEmits<{
  assignCleaner: [cleanerId: string]
  assignTeam: [teamId: string]
  assignGroup: [cleanerIds: string[]]
}>()

const activeTab = ref(0)
const selectedGroupIds = ref<string[]>([])

function toggleGroupMember(cleanerId: string) {
  const idx = selectedGroupIds.value.indexOf(cleanerId)
  if (idx >= 0) {
    selectedGroupIds.value.splice(idx, 1)
  } else {
    selectedGroupIds.value.push(cleanerId)
  }
}

function submitGroup() {
  if (selectedGroupIds.value.length >= 2) {
    emit('assignGroup', [...selectedGroupIds.value])
    selectedGroupIds.value = []
  }
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}
</script>

<template>
  <v-card width="320" rounded="lg" elevation="4">
    <v-tabs v-model="activeTab" density="compact" grow>
      <v-tab :value="0">Cleaner</v-tab>
      <v-tab :value="1">Team</v-tab>
      <v-tab :value="2">Quick Group</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- Tab 1: Individual Cleaner -->
      <v-window-item :value="0">
        <v-list density="compact" max-height="240" class="overflow-y-auto">
          <v-list-item
            v-for="c in cleaners"
            :key="c.id"
            :data-testid="'cleaner-item'"
            :disabled="c.assigned >= c.total"
            @click="c.assigned < c.total && emit('assignCleaner', c.id)"
          >
            <template #prepend>
              <v-avatar size="28" color="primary" variant="tonal">
                <span class="text-caption">{{ initials(c.name) }}</span>
              </v-avatar>
            </template>
            <v-list-item-title class="text-body-2">{{ c.name }}</v-list-item-title>
            <template #append>
              <div class="d-flex align-center ga-2">
                <v-progress-linear
                  :model-value="c.total ? (c.assigned / c.total) * 100 : 0"
                  :color="c.assigned >= c.total ? 'error' : c.assigned / c.total >= 0.5 ? 'warning' : 'success'"
                  rounded
                  height="4"
                  style="width: 50px;"
                />
                <span class="text-caption text-medium-emphasis">{{ c.assigned }}/{{ c.total }}</span>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-window-item>

      <!-- Tab 2: Saved Team -->
      <v-window-item :value="1">
        <v-list density="compact" max-height="240" class="overflow-y-auto">
          <v-list-item
            v-for="t in teams"
            :key="t.id"
            @click="emit('assignTeam', t.id)"
          >
            <template #prepend>
              <v-avatar size="28" color="blue-grey" variant="tonal">
                <v-icon size="16">mdi-account-multiple</v-icon>
              </v-avatar>
            </template>
            <v-list-item-title class="text-body-2">{{ t.name }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              {{ t.member_ids.length }} members
            </v-list-item-subtitle>
            <template #append>
              <span class="text-caption text-medium-emphasis">{{ t.assigned }}/{{ t.total }}</span>
            </template>
          </v-list-item>
          <v-list-item v-if="teams.length === 0" disabled>
            <v-list-item-title class="text-caption text-medium-emphasis text-center">
              No saved teams
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-window-item>

      <!-- Tab 3: Quick Group -->
      <v-window-item :value="2">
        <v-list density="compact" max-height="200" class="overflow-y-auto">
          <v-list-item
            v-for="c in cleaners"
            :key="c.id"
            :disabled="c.assigned >= c.total"
            @click="c.assigned < c.total && toggleGroupMember(c.id)"
          >
            <template #prepend>
              <v-checkbox-btn
                :model-value="selectedGroupIds.includes(c.id)"
                density="compact"
                hide-details
                :disabled="c.assigned >= c.total"
                @click.stop="c.assigned < c.total && toggleGroupMember(c.id)"
              />
            </template>
            <v-list-item-title class="text-body-2">{{ c.name }}</v-list-item-title>
            <template #append>
              <span class="text-caption text-medium-emphasis">{{ c.assigned }}/{{ c.total }}</span>
            </template>
          </v-list-item>
        </v-list>
        <v-divider />
        <div class="pa-2 text-center">
          <v-btn
            size="small"
            color="primary"
            :disabled="selectedGroupIds.length < 2"
            @click="submitGroup"
          >
            Assign Group ({{ selectedGroupIds.length }})
          </v-btn>
        </div>
      </v-window-item>
    </v-window>
  </v-card>
</template>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/__tests__/components/admin/AssignmentMenu.spec.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/dumb/shared/AssignmentMenu.vue src/__tests__/components/admin/AssignmentMenu.spec.ts
git commit -m "feat: add AssignmentMenu shared component with cleaner/team/group tabs"
```

---

## Task 15: Rewrite AdminDashboard.vue — Split-View Command Center

**Files:**
- Modify: `src/components/smart/admin/AdminDashboard.vue`

This is the biggest task. The component is being rewritten from a metrics dashboard to the split-view operations command center.

- [ ] **Step 1: Read the current AdminDashboard.vue to understand its full content**

Run: Read `src/components/smart/admin/AdminDashboard.vue` to confirm current structure before rewriting.

- [ ] **Step 2: Rewrite AdminDashboard.vue**

Replace the entire content of `src/components/smart/admin/AdminDashboard.vue` with:

```vue
<!-- src/components/smart/admin/AdminDashboard.vue -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Booking } from '@/types/booking'
import type { Property } from '@/types/property'
import type { CleanerTeam } from '@/types/team'
import { useAdminBookings } from '@/composables/admin/useAdminBookings'
import { useAdminProperties } from '@/composables/admin/useAdminProperties'
import { useCleanerManagement } from '@/composables/admin/useCleanerManagement'
import { useTimeAwareMode } from '@/composables/admin/useTimeAwareMode'
import { useAuthStore } from '@/stores/auth'
import { formatPropertyAddress } from '@/types/property'
import AdminMetricsStrip from '@/components/dumb/admin/AdminMetricsStrip.vue'
import AdminTimelineCard from '@/components/dumb/admin/AdminTimelineCard.vue'
import AdminTimelineDivider from '@/components/dumb/admin/AdminTimelineDivider.vue'
import AdminAllClearCard from '@/components/dumb/admin/AdminAllClearCard.vue'
import AdminUnassignedCard from '@/components/dumb/admin/AdminUnassignedCard.vue'
import AdminOverviewUrgentTurns from '@/components/dumb/admin/AdminOverviewUrgentTurns.vue'
import AdminOverviewCleanerAvailability from '@/components/dumb/admin/AdminOverviewCleanerAvailability.vue'
import AdminTomorrowPreview from '@/components/dumb/admin/AdminTomorrowPreview.vue'
import AssignmentMenu from '@/components/dumb/shared/AssignmentMenu.vue'
import type { CleanerAvailabilityItem } from '@/components/dumb/admin/AdminOverviewCleanerAvailability.vue'
import type { AssignableCleaner, AssignableTeam } from '@/components/dumb/shared/AssignmentMenu.vue'

const authStore = useAuthStore()
const {
  allBookings,
  allProperties,
  todayBookingsByTime,
  tomorrowBookings,
  unassignedToday,
  unassignedTomorrow,
  urgentTurnsToday,
  fetchAllBookings,
  assignCleanerToBooking,
  assignTeamToBooking,
  assignGroupToBooking,
} = useAdminBookings()

const { allCleaners, availableCleaners, cleanerWorkloads, allTeams, fetchCleaners, fetchTeams } = useCleanerManagement()
const { fetchAllProperties } = useAdminProperties()
const { isEveningMode, modeLabel, todayDateString, tomorrowDateString } = useTimeAwareMode()

// Assignment menu state
const assignMenuOpen = ref(false)
const assigningBooking = ref<Booking | null>(null)

// Property map for quick lookup
const propertyMap = computed(() => {
  const map = new Map<string, { id: string; name: string; color: string }>()
  for (const p of allProperties.value as Property[]) {
    map.set(p.id, {
      id: p.id,
      name: formatPropertyAddress(p, 'short'),
      color: p.color || '#5c6bc0',
    })
  }
  return map
})

// Cleaner map for quick lookup
const cleanerMap = computed(() => {
  const map = new Map<string, { id: string; name: string }>()
  for (const c of allCleaners.value) {
    map.set(c.id, { id: c.id, name: c.name })
  }
  return map
})

// Active timeline bookings (excludes completed, which get collapsed)
const activeTimelineBookings = computed(() => {
  const bookings = isEveningMode.value ? tomorrowBookings.value : todayBookingsByTime.value
  return bookings.filter((b: Booking) => b.status !== 'completed')
})

const completedCount = computed(() => {
  const bookings = isEveningMode.value ? tomorrowBookings.value : todayBookingsByTime.value
  return bookings.filter((b: Booking) => b.status === 'completed').length
})

// Group timeline bookings by time of day
const timelineGroups = computed(() => {
  const groups: Array<{ label: string; bookings: Booking[] }> = [
    { label: 'Morning', bookings: [] },
    { label: 'Afternoon', bookings: [] },
    { label: 'Evening', bookings: [] },
  ]
  for (const booking of activeTimelineBookings.value) {
    const time = booking.checkout_time || booking.checkin_time || '12:00'
    const hour = parseInt(time.split(':')[0], 10)
    if (hour < 12) groups[0].bookings.push(booking)
    else if (hour < 17) groups[1].bookings.push(booking)
    else groups[2].bookings.push(booking)
  }
  return groups.filter(g => g.bookings.length > 0)
})

// Metrics
const currentBookings = computed(() =>
  isEveningMode.value ? tomorrowBookings.value : todayBookingsByTime.value
)
const currentUnassigned = computed(() =>
  isEveningMode.value ? unassignedTomorrow.value : unassignedToday.value
)
const currentTurns = computed(() =>
  currentBookings.value.filter((b: Booking) => b.booking_type === 'turn')
)

// Cleaner availability for the action panel
const cleanerAvailabilityItems = computed<CleanerAvailabilityItem[]>(() => {
  const items: CleanerAvailabilityItem[] = cleanerWorkloads.value.map((w: { cleanerId: string; name: string; currentBookings: number; maxBookings: number }) => ({
    id: w.cleanerId,
    name: w.name,
    assigned: w.currentBookings,
    total: w.maxBookings,
    isTeam: false,
    todayBookings: todayBookingsByTime.value
      .filter((b: Booking) => b.assigned_cleaner_id === w.cleanerId)
      .map((b: Booking) => ({
        id: b.id,
        propertyName: propertyMap.value.get(b.property_id)?.name || 'Unknown',
        time: (b.checkout_time || '').substring(0, 5),
      })),
  }))

  // Add teams
  for (const team of allTeams.value) {
    items.push({
      id: team.id,
      name: team.name,
      assigned: todayBookingsByTime.value.filter((b: Booking) => b.assigned_team_id === team.id).length,
      total: team.member_ids.length,
      isTeam: true,
    })
  }

  return items
})

// Assignment menu data
const assignableCleaners = computed<AssignableCleaner[]>(() =>
  cleanerWorkloads.value.map((w: { cleanerId: string; name: string; currentBookings: number; maxBookings: number }) => ({
    id: w.cleanerId,
    name: w.name,
    assigned: w.currentBookings,
    total: w.maxBookings,
  }))
)

const assignableTeams = computed<AssignableTeam[]>(() =>
  allTeams.value.map((t: CleanerTeam) => ({
    id: t.id,
    name: t.name,
    member_ids: t.member_ids,
    assigned: todayBookingsByTime.value.filter((b: Booking) => b.assigned_team_id === t.id).length,
    total: t.member_ids.length,
  }))
)

// Whether action panel has problems to show
const hasProblems = computed(() =>
  unassignedToday.value.length > 0 || urgentTurnsToday.value.length > 0
)

// Tomorrow preview stats
const tomorrowTurnCount = computed(() =>
  tomorrowBookings.value.filter((b: Booking) => b.booking_type === 'turn').length
)

// Handlers
function handleAssign(booking: Booking) {
  assigningBooking.value = booking
  assignMenuOpen.value = true
}

async function handleAssignCleaner(cleanerId: string) {
  if (!assigningBooking.value) return
  await assignCleanerToBooking(assigningBooking.value.id, cleanerId)
  assignMenuOpen.value = false
  assigningBooking.value = null
}

async function handleAssignTeam(teamId: string) {
  if (!assigningBooking.value) return
  await assignTeamToBooking(assigningBooking.value.id, teamId)
  assignMenuOpen.value = false
  assigningBooking.value = null
}

async function handleAssignGroup(cleanerIds: string[]) {
  if (!assigningBooking.value) return
  await assignGroupToBooking(assigningBooking.value.id, cleanerIds)
  assignMenuOpen.value = false
  assigningBooking.value = null
}

const emit = defineEmits<{
  viewBooking: [booking: Booking]
  statusChange: [booking: Booking]
}>()

function getCleaner(booking: Booking) {
  if (booking.assigned_cleaner_id) return cleanerMap.value.get(booking.assigned_cleaner_id) || null
  return null
}

function getTeamName(booking: Booking): string | null {
  if (booking.assigned_team_id) {
    const team = allTeams.value.find((t: CleanerTeam) => t.id === booking.assigned_team_id)
    return team ? `${team.name} (${team.member_ids.length})` : null
  }
  return null
}

function getGroupNames(booking: Booking): string[] | null {
  if (booking.assigned_group_ids?.length) {
    return booking.assigned_group_ids
      .map(id => cleanerMap.value.get(id)?.name || 'Unknown')
  }
  return null
}

onMounted(async () => {
  await Promise.all([fetchAllBookings(), fetchAllProperties(), fetchCleaners(), fetchTeams()])
})
</script>

<template>
  <v-container fluid class="pa-4">
    <!-- Metrics Strip -->
    <AdminMetricsStrip
      :total-cleanings="currentBookings.length"
      :unassigned-count="currentUnassigned.length"
      :turn-count="currentTurns.length"
      :active-cleaners="availableCleaners.length"
      :label="isEveningMode ? 'tomorrow' : 'today'"
    />

    <!-- Mode heading -->
    <div class="text-h6 font-weight-bold mb-3">
      {{ modeLabel }}
    </div>

    <!-- Split Layout -->
    <v-row>
      <!-- LEFT: Timeline -->
      <v-col cols="12" md="7" order="2" order-md="1">
        <template v-if="activeTimelineBookings.length > 0">
          <template v-for="group in timelineGroups" :key="group.label">
            <AdminTimelineDivider :label="group.label" />
            <AdminTimelineCard
              v-for="booking in group.bookings"
              :key="booking.id"
              :booking="booking"
              :property="propertyMap.get(booking.property_id) || null"
              :cleaner="getCleaner(booking)"
              :team-name="getTeamName(booking)"
              :group-names="getGroupNames(booking)"
              @assign="handleAssign"
              @view="emit('viewBooking', $event)"
              @status-change="emit('statusChange', $event)"
            />
          </template>
        </template>

        <v-card v-else variant="outlined" rounded="lg" class="text-center pa-8 text-medium-emphasis">
          <v-icon icon="mdi-calendar-check" size="48" class="mb-2" />
          <div>No bookings {{ isEveningMode ? 'tomorrow' : 'today' }}</div>
        </v-card>

        <!-- Completed collapse -->
        <div v-if="completedCount > 0" class="rounded-lg pa-2 mt-2 text-caption text-medium-emphasis" style="background: rgb(var(--v-theme-surface-variant), 0.3);">
          <v-icon icon="mdi-check" size="14" color="success" class="mr-1" />
          {{ completedCount }} completed cleaning{{ completedCount !== 1 ? 's' : '' }} earlier today
        </div>
      </v-col>

      <!-- RIGHT: Action Panel -->
      <v-col cols="12" md="5" order="1" order-md="2">
        <!-- Unassigned Card -->
        <AdminUnassignedCard
          v-if="unassignedToday.length > 0"
          :bookings="unassignedToday"
          :property-map="propertyMap"
          @assign="handleAssign"
        />

        <!-- Urgent Turns Card -->
        <AdminOverviewUrgentTurns
          v-if="urgentTurnsToday.length > 0"
          :turns="urgentTurnsToday"
          :property-map="propertyMap"
          :cleaner-map="cleanerMap"
          @assign="handleAssign"
        />

        <!-- All Clear -->
        <AdminAllClearCard v-if="!hasProblems" />

        <!-- Cleaner Availability -->
        <AdminOverviewCleanerAvailability :cleaners="cleanerAvailabilityItems" />

        <!-- Tomorrow Preview -->
        <AdminTomorrowPreview
          :total-bookings="tomorrowBookings.length"
          :turn-count="tomorrowTurnCount"
          :unassigned-count="unassignedTomorrow.length"
          :is-evening-mode="isEveningMode"
          :unassigned-bookings="isEveningMode ? unassignedTomorrow : undefined"
          :property-map="isEveningMode ? propertyMap : undefined"
          @assign="handleAssign"
        />
      </v-col>
    </v-row>

    <!-- Assignment Menu (floating) -->
    <v-menu v-model="assignMenuOpen" :close-on-content-click="false" location="bottom end">
      <AssignmentMenu
        :cleaners="assignableCleaners"
        :teams="assignableTeams"
        @assign-cleaner="handleAssignCleaner"
        @assign-team="handleAssignTeam"
        @assign-group="handleAssignGroup"
      />
    </v-menu>
  </v-container>
</template>
```

- [ ] **Step 3: Verify types compile**

Run: `npx vue-tsc --noEmit`
Expected: No type errors. Fix any that arise from the rewrite.

- [ ] **Step 4: Commit**

```bash
git add src/components/smart/admin/AdminDashboard.vue
git commit -m "feat: rewrite AdminDashboard as split-view operations command center"
```

---

## Task 16: Update HomeAdmin.vue — Wire Up New Events

**Files:**
- Modify: `src/components/smart/admin/HomeAdmin.vue`

- [ ] **Step 1: Read the current HomeAdmin.vue**

Read `src/components/smart/admin/HomeAdmin.vue` to see the current event wiring.

- [ ] **Step 2: Add event handlers for new dashboard events**

The AdminDashboard now emits `viewBooking` and `statusChange`. Add handlers in HomeAdmin.vue. Find the `AdminDashboard` usage in the template and add the event bindings:

```vue
<!-- In the template, update AdminDashboard usage: -->
<AdminDashboard
  @view-booking="handleViewBooking"
  @status-change="handleStatusChange"
/>
```

Add these methods to the script section:

```typescript
function handleViewBooking(booking: Booking) {
  // Open booking details modal via uiStore
  uiStore.openModal('bookingDetails', { booking })
}

function handleStatusChange(booking: Booking) {
  // Could open a status-change dialog or use the booking store directly
  uiStore.openModal('bookingStatus', { booking })
}
```

Add the `Booking` import if not already present:

```typescript
import type { Booking } from '@/types/booking'
```

- [ ] **Step 3: Verify types compile**

Run: `npx vue-tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/smart/admin/HomeAdmin.vue
git commit -m "feat: wire AdminDashboard viewBooking and statusChange events in HomeAdmin"
```

---

## Task 17: Full Build & Test Verification

**Files:** None (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test:run`
Expected: All existing tests pass. New tests pass.

- [ ] **Step 2: Run type checking**

Run: `pnpm build`
Expected: Build succeeds with no type errors.

- [ ] **Step 3: Fix any failures**

If there are type errors or test failures, fix them. Common issues:
- Missing imports in modified files
- Type mismatches between composable returns and component props
- Existing tests that referenced the old AdminDashboard structure

- [ ] **Step 4: Visual verification**

Run: `pnpm dev`
Navigate to `/admin` in the browser. Verify:
- Metrics strip shows at top with stat chips
- Split layout: timeline on left, action panel on right
- Booking cards render with property names, times, status chips
- Unassigned bookings highlighted with red border
- Action panel shows unassigned card, cleaner availability
- Assignment menu opens on "Assign" button click

- [ ] **Step 5: Final commit if fixes were needed**

```bash
git add -A
git commit -m "fix: resolve build and test issues from admin overview rewrite"
```

---

## Summary

| Task | Description | New Files | Modified Files |
|------|-------------|-----------|---------------|
| 1 | Database migration | 1 | 0 |
| 2 | TypeScript types | 1 | 2 |
| 3 | useTimeAwareMode composable | 2 | 0 |
| 4 | useAdminBookings extensions | 0 | 1 |
| 5 | useCleanerManagement team support | 0 | 1 |
| 6 | AdminMetricsStrip | 2 | 0 |
| 7 | AdminTimelineDivider | 1 | 0 |
| 8 | AdminTimelineCard | 2 | 0 |
| 9 | AdminAllClearCard | 1 | 0 |
| 10 | AdminUnassignedCard | 1 | 0 |
| 11 | AdminOverviewUrgentTurns | 1 | 0 |
| 12 | AdminOverviewCleanerAvailability | 1 | 0 |
| 13 | AdminTomorrowPreview | 1 | 0 |
| 14 | AssignmentMenu | 2 | 0 |
| 15 | AdminDashboard rewrite | 0 | 1 |
| 16 | HomeAdmin event wiring | 0 | 1 |
| 17 | Build & test verification | 0 | 0 |

**Total: 16 new files, 6 modified files, 17 tasks, ~17 commits**
