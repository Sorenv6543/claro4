# PR Review Fixes — `claudedesignhandoff` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address all 3 Critical and 11 Important issues identified in the `claudedesignhandoff` PR review before merging.

**Architecture:** Fixes span CI YAML, a shared utility extraction, a new composable, Vue component error-handling and style corrections, and a unit-test addition. No new routes, stores, or external dependencies are introduced.

**Tech Stack:** Vue 3 + `<script setup lang="ts">`, Vuetify 4, Pinia, Vitest, GitHub Actions

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `.github/workflows/ci.yml` | Modify | Guard Lighthouse step; add fail-loud URL assertion |
| `.github/workflows/deploy.yml` | Modify | Add `continue-on-error: true` to Sentry notification step |
| `scripts/__tests__/check-bundle-size.test.js` | Modify | Add missing ENOENT test case |
| `src/components/smart/shared/Reports.vue` | Modify | Add "coming soon" v-alert banner |
| `src/utils/propertyStatus.ts` | **Create** | Shared `propStatus()` function + `PropertyStatus` type |
| `src/components/smart/owner/OwnerOverview.vue` | Modify | Import shared propStatus; fix Promise.allSettled; fix today-freeze |
| `src/components/smart/owner/OwnerPropertyTimeline.vue` | Modify | Import shared propStatus; fix mobile loading; fix Promise.allSettled; fix today-freeze |
| `src/components/smart/owner/OwnerBookings.vue` | Modify | Switch to Promise.allSettled |
| `src/composables/shared/useToday.ts` | **Create** | Reactive date strings that refresh after midnight |
| `src/styles/main.scss` | Modify (if needed) | — |
| `src/components/smart/owner/OwnerNavigationDrawer.vue` | Modify | Replace focus-visible `box-shadow` with `outline` |
| `src/components/smart/owner/OwnerProperties.vue` | Modify | Add `loading` ref; fix ownership-check notification |
| `src/components/dumb/shared/BookingForm.vue` | Modify | Remove fake loading from `handleDelete` |
| `src/components/dumb/owner/OwnerOverview.vue` | Modify | Remove `box-shadow` from `.event-pill` |
| `src/components/dumb/shared/DashActivityTimeline.vue` | **Delete** | Unreachable dead code |
| `src/components/dumb/shared/DashProgressList.vue` | **Delete** | Unreachable dead code |
| `src/components/dumb/owner/OwnerUpcomingTable.vue` | **Delete** | Unreachable dead code |
| `src/__tests__/utils/propertyStatus.spec.ts` | **Create** | Unit tests for the extracted propStatus util |

---

## Task 1 — CI: Guard Lighthouse step + add fail-loud URL assertion

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add URL assertion step before Lighthouse**

In `.github/workflows/ci.yml`, insert a new step between "Deploy preview to Cloudflare Pages" and "Run Lighthouse CI":

```yaml
      - name: Assert preview URL
        if: steps.deploy.outputs.preview_url == ''
        run: |
          echo "::error::Deploy step produced no preview URL. Check wrangler output above."
          exit 1

      - name: Run Lighthouse CI
        if: steps.deploy.outputs.preview_url != ''
        run: |
          pnpm exec lhci autorun \
            --collect.url="${{ steps.deploy.outputs.preview_url }}" \
            --collect.numberOfRuns=1
```

The full block around lines 79-83 should become:

```yaml
      - name: Assert preview URL
        if: steps.deploy.outputs.preview_url == ''
        run: |
          echo "::error::Deploy step produced no preview URL. Check wrangler output above."
          exit 1

      - name: Run Lighthouse CI
        if: steps.deploy.outputs.preview_url != ''
        run: |
          pnpm exec lhci autorun \
            --collect.url="${{ steps.deploy.outputs.preview_url }}" \
            --collect.numberOfRuns=1
```

- [ ] **Step 2: Verify the YAML is valid**

```bash
# Install yamllint if needed: pip install yamllint
cat .github/workflows/ci.yml | python -c "import sys, yaml; yaml.safe_load(sys.stdin); print('YAML OK')"
```

Expected: `YAML OK`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "fix(ci): guard Lighthouse step against empty preview URL"
```

---

## Task 2 — CI: Sentry notification must not block production deploy

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Add continue-on-error and warning annotation**

Replace the "Notify Sentry of release" step (lines 62-78) with:

```yaml
      - name: Notify Sentry of release
        continue-on-error: true
        run: |
          PKG_VERSION=$(node -p "require('./package.json').version")
          SHORT_SHA=$(git rev-parse --short HEAD)
          VERSION="${PKG_VERSION}+${SHORT_SHA}"
          npx sentry-cli releases new "$VERSION" \
            --org "${{ secrets.SENTRY_ORG }}" \
            --project "${{ secrets.SENTRY_PROJECT }}"
          npx sentry-cli releases finalize "$VERSION" \
            --org "${{ secrets.SENTRY_ORG }}" \
            --project "${{ secrets.SENTRY_PROJECT }}"
          npx sentry-cli releases deploys "$VERSION" new \
            --env production \
            --org "${{ secrets.SENTRY_ORG }}" \
            --project "${{ secrets.SENTRY_PROJECT }}"
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}

      - name: Warn if Sentry notification failed
        if: steps.notify-sentry.outcome == 'failure'
        run: echo "::warning::Sentry release notification failed — deploy succeeded but release tracking may be incomplete."
```

Also add `id: notify-sentry` to the Sentry step so the outcome check works:

```yaml
      - name: Notify Sentry of release
        id: notify-sentry
        continue-on-error: true
        ...
```

- [ ] **Step 2: Verify YAML**

```bash
cat .github/workflows/deploy.yml | python -c "import sys, yaml; yaml.safe_load(sys.stdin); print('YAML OK')"
```

Expected: `YAML OK`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "fix(ci): Sentry notification must not block production deploy"
```

---

## Task 3 — Scripts: Add ENOENT test for missing assets directory

**Files:**
- Modify: `scripts/__tests__/check-bundle-size.test.js`

- [ ] **Step 1: Add the missing test**

Open `scripts/__tests__/check-bundle-size.test.js` and add a fourth `it` block after the existing three:

```js
  it('throws when the assets directory does not exist', () => {
    expect(() => checkOwnerBundleSize('/tmp/__nonexistent_bundle_test_dir__')).toThrow()
  })
```

The full file should now be:

```js
// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { checkOwnerBundleSize } from '../check-bundle-size.js'

describe('checkOwnerBundleSize', () => {
  let tmpDir

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('passes when owner-app chunk is under the limit', () => {
    fs.writeFileSync(path.join(tmpDir, 'owner-app-abc123.js'), Buffer.alloc(1024, 'a'))
    const result = checkOwnerBundleSize(tmpDir, 500)
    expect(result.passed).toBe(true)
    expect(result.totalKB).toBeLessThan(500)
  })

  it('fails when owner-app chunk exceeds the limit', () => {
    const content = Buffer.from(
      Array.from({ length: 600 * 1024 }, () => Math.random().toString(36)[2]).join('')
    )
    fs.writeFileSync(path.join(tmpDir, 'owner-app-abc123.js'), content)
    const result = checkOwnerBundleSize(tmpDir, 1)
    expect(result.passed).toBe(false)
  })

  it('throws when no owner-app chunks are found', () => {
    fs.writeFileSync(path.join(tmpDir, 'vendor-abc123.js'), 'other chunk')
    expect(() => checkOwnerBundleSize(tmpDir)).toThrow('No owner-app chunks found')
  })

  it('throws when the assets directory does not exist', () => {
    expect(() => checkOwnerBundleSize('/tmp/__nonexistent_bundle_test_dir__')).toThrow()
  })
})
```

- [ ] **Step 2: Run the test suite to confirm the new test passes**

```bash
pnpm test -- scripts/__tests__/check-bundle-size.test.js
```

Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add scripts/__tests__/check-bundle-size.test.js
git commit -m "test(scripts): add ENOENT case for missing assets directory"
```

---

## Task 4 — Reports.vue: Add coming-soon banner

**Files:**
- Modify: `src/components/smart/shared/Reports.vue`

- [ ] **Step 1: Add a v-alert banner at the top of the template**

Replace the current `<template>` block:

```vue
<template>
    <v-container fluid>
        <OwnerChartGallery :charts="charts" />
    </v-container>
</template>
```

With:

```vue
<template>
  <v-container fluid>
    <v-alert
      class="mb-6"
      icon="mdi-chart-line"
      title="Reports — Coming Soon"
      text="These charts show sample data. Live reporting will be connected in a future release."
      type="warning"
      variant="tonal"
    />
    <OwnerChartGallery :charts="charts" />
  </v-container>
</template>
```

- [ ] **Step 2: Verify the dev server renders the banner without console errors**

```bash
pnpm dev
# Open http://localhost:5173/owner/reports in Chrome
```

Confirm the yellow tonal alert renders above the chart gallery.

- [ ] **Step 3: Commit**

```bash
git add src/components/smart/shared/Reports.vue
git commit -m "fix(reports): add sample-data disclaimer banner"
```

---

## Task 5 — Extract shared propStatus utility + unit tests

**Files:**
- Create: `src/utils/propertyStatus.ts`
- Create: `src/__tests__/utils/propertyStatus.spec.ts`
- Modify: `src/components/smart/owner/OwnerOverview.vue`
- Modify: `src/components/smart/owner/OwnerPropertyTimeline.vue`

The `propStatus` function is currently duplicated in both smart components. It must be extracted as a pure function (no reactivity deps) that takes bookings and a date string.

- [ ] **Step 1: Create `src/utils/propertyStatus.ts`**

```typescript
export type PropertyStatus =
  | 'urgent_turn'
  | 'turn_today'
  | 'checkin_today'
  | 'checkout_today'
  | 'occupied'
  | 'vacant'

interface MinimalBooking {
  property_id: string
  status: string
  booking_type: string
  checkin_date: string
  checkout_date: string
  priority?: string
}

export function propStatus(
  propId: string,
  bookings: MinimalBooking[],
  todayStr: string,
): PropertyStatus {
  const bs = bookings.filter(b => b.property_id === propId && b.status !== 'cancelled')
  const turnToday     = bs.find(b => b.checkin_date === todayStr && b.booking_type === 'turn')
  const checkoutToday = bs.find(b => b.checkout_date === todayStr && b.booking_type !== 'turn')
  const checkinToday  = bs.find(b => b.checkin_date  === todayStr && b.booking_type !== 'turn')
  const occupied      = bs.find(
    b => b.checkin_date <= todayStr && b.checkout_date > todayStr && b.booking_type !== 'turn',
  )

  if (turnToday) return turnToday.priority === 'urgent' ? 'urgent_turn' : 'turn_today'
  if (checkoutToday && checkinToday) return 'turn_today'
  if (checkoutToday) return 'checkout_today'
  if (checkinToday)  return 'checkin_today'
  if (occupied)      return 'occupied'
  return 'vacant'
}
```

- [ ] **Step 2: Write the unit tests in `src/__tests__/utils/propertyStatus.spec.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { propStatus } from '@utils/propertyStatus'

const TODAY = '2026-04-27'
const PROP  = 'prop-1'

function booking(overrides: Record<string, string>) {
  return {
    property_id: PROP,
    status: 'confirmed',
    booking_type: 'standard',
    checkin_date: '2026-04-25',
    checkout_date: '2026-04-29',
    priority: 'normal',
    ...overrides,
  }
}

describe('propStatus', () => {
  it('returns vacant when no bookings', () => {
    expect(propStatus(PROP, [], TODAY)).toBe('vacant')
  })

  it('ignores cancelled bookings', () => {
    const b = booking({ checkin_date: TODAY, booking_type: 'turn', status: 'cancelled' })
    expect(propStatus(PROP, [b], TODAY)).toBe('vacant')
  })

  it('returns urgent_turn for urgent turn booking today', () => {
    const b = booking({ checkin_date: TODAY, booking_type: 'turn', priority: 'urgent' })
    expect(propStatus(PROP, [b], TODAY)).toBe('urgent_turn')
  })

  it('returns turn_today for non-urgent turn booking today', () => {
    const b = booking({ checkin_date: TODAY, booking_type: 'turn', priority: 'normal' })
    expect(propStatus(PROP, [b], TODAY)).toBe('turn_today')
  })

  it('returns turn_today when standard checkout and checkin both today', () => {
    const out = booking({ checkout_date: TODAY })
    const inn = booking({ checkin_date: TODAY })
    expect(propStatus(PROP, [out, inn], TODAY)).toBe('turn_today')
  })

  it('returns checkout_today when only checkout is today', () => {
    const b = booking({ checkout_date: TODAY })
    expect(propStatus(PROP, [b], TODAY)).toBe('checkout_today')
  })

  it('returns checkin_today when only checkin is today', () => {
    const b = booking({ checkin_date: TODAY, checkout_date: '2026-04-30' })
    expect(propStatus(PROP, [b], TODAY)).toBe('checkin_today')
  })

  it('returns occupied for booking spanning today', () => {
    const b = booking({ checkin_date: '2026-04-25', checkout_date: '2026-04-30' })
    expect(propStatus(PROP, [b], TODAY)).toBe('occupied')
  })

  it('turn_today takes priority over checkout_today + checkin_today', () => {
    const turn = booking({ checkin_date: TODAY, booking_type: 'turn', priority: 'high' })
    const out  = booking({ checkout_date: TODAY })
    const inn  = booking({ checkin_date: TODAY, checkout_date: '2026-04-30' })
    expect(propStatus(PROP, [turn, out, inn], TODAY)).toBe('turn_today')
  })

  it('ignores bookings for a different property', () => {
    const b = booking({ property_id: 'other-prop', checkin_date: TODAY, booking_type: 'turn', priority: 'urgent' })
    expect(propStatus(PROP, [b], TODAY)).toBe('vacant')
  })
})
```

- [ ] **Step 3: Run the new tests to confirm they all pass**

```bash
pnpm test -- src/__tests__/utils/propertyStatus.spec.ts
```

Expected: 10 tests pass.

- [ ] **Step 4: Update `OwnerOverview.vue` to use the extracted util**

In `src/components/smart/owner/OwnerOverview.vue`:

Add to the imports section (around line 186):
```typescript
import { propStatus } from '@utils/propertyStatus'
```

Remove the local `type StatusKey` declaration (line 293) and the local `function propStatus(...)` definition (lines 304-316).

Update `healthRows` computed (line 318) — change `propStatus(p.id)` call to pass the needed arguments:
```typescript
const healthRows = computed(() =>
  myProperties.value.map(p => {
    const status   = propStatus(p.id, myBookings.value, todayStr.value)   // todayStr.value after Task 6
    // ... rest unchanged
  }),
)
```

At this stage todayStr is still a plain string constant — that's fine for now. Task 6 converts it to a computed.

- [ ] **Step 5: Update `OwnerPropertyTimeline.vue` to use the extracted util**

In `src/components/smart/owner/OwnerPropertyTimeline.vue`:

Add to the imports section (around line 53):
```typescript
import { propStatus } from '@utils/propertyStatus'
import type { PropertyStatus } from '@utils/propertyStatus'
```

Remove the local `type PropStatus` alias (line 106) and local `function propStatus(...)` (lines 108-121).

Update `bandProperties` computed — change `propStatus(p.id)` to:
```typescript
status: propStatus(p.id, myBookings.value, todayStr) as PropertyStatus,
```

Again, `todayStr` is still a plain string at this point — Task 6 converts it.

- [ ] **Step 6: Type-check**

```bash
pnpm exec vue-tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/utils/propertyStatus.ts src/__tests__/utils/propertyStatus.spec.ts \
        src/components/smart/owner/OwnerOverview.vue \
        src/components/smart/owner/OwnerPropertyTimeline.vue
git commit -m "refactor: extract propStatus to shared util, add unit tests"
```

---

## Task 6 — OwnerPropertyTimeline: Fix mobile branch missing loading state

**Files:**
- Modify: `src/components/smart/owner/OwnerPropertyTimeline.vue`

- [ ] **Step 1: Gate MobileTimelineFeed behind `v-if="!loading"` and add sibling skeleton**

In the `<template>` section, replace (lines 16-22):

```vue
    <!-- Mobile: day-grouped card feed -->
    <div v-if="mobile" class="opt-mobile">
      <MobileTimelineFeed
        :events="mobileEvents"
        :properties="propChips"
      />
    </div>
```

With:

```vue
    <!-- Mobile: day-grouped card feed -->
    <div v-if="mobile" class="opt-mobile">
      <v-skeleton-loader v-if="loading" type="card, list-item-three-line@3" />
      <MobileTimelineFeed
        v-else
        :events="mobileEvents"
        :properties="propChips"
      />
    </div>
```

- [ ] **Step 2: Verify in Chrome on a mobile viewport**

```bash
pnpm dev
# Open http://localhost:5173/owner/timeline in Chrome DevTools mobile emulation
```

While the page is loading (before data arrives), confirm the skeleton renders instead of "No activity" empty-state.

- [ ] **Step 3: Commit**

```bash
git add src/components/smart/owner/OwnerPropertyTimeline.vue
git commit -m "fix(timeline): show skeleton on mobile during initial load"
```

---

## Task 7 — Style: Remove box-shadow from .event-pill + fix focus-visible

**Files:**
- Modify: `src/components/smart/owner/OwnerOverview.vue` (remove CSS box-shadow)
- Modify: `src/components/smart/owner/OwnerNavigationDrawer.vue` (focus-visible → outline)

### 7a — Remove box-shadow from .event-pill

- [ ] **Step 1: Remove the forbidden box-shadow**

In `src/components/smart/owner/OwnerOverview.vue` `<style scoped>`, find the `.event-pill` rule (around line 517):

```css
.event-pill {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  background: var(--claro-surface);
  border: 1px solid var(--claro-border);
  border-radius: var(--claro-radius-sm);
  flex-shrink: 0;
  min-width: 160px;
  box-shadow: var(--claro-shadow-sm);
}
```

Remove the `box-shadow` line. The `border: 1px solid var(--claro-border)` already provides visual separation:

```css
.event-pill {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  background: var(--claro-surface);
  border: 1px solid var(--claro-border);
  border-radius: var(--claro-radius-sm);
  flex-shrink: 0;
  min-width: 160px;
}
```

### 7b — Replace focus-visible box-shadow with outline

- [ ] **Step 2: Fix the focus-visible rule in OwnerNavigationDrawer.vue**

In `src/components/smart/owner/OwnerNavigationDrawer.vue` `<style scoped>`, find (around line 270):

```css
.claro-nav-item:focus-visible {
  box-shadow: 0 0 0 2px var(--claro-primary);
}
```

Replace with:

```css
.claro-nav-item:focus-visible {
  outline: 2px solid var(--claro-primary);
  outline-offset: -2px;
}
```

- [ ] **Step 3: Visual check**

```bash
pnpm dev
# Navigate to http://localhost:5173/owner/overview
# Tab through the nav items and confirm focus ring is visible
# Confirm today-strip pills look correct without box-shadow
```

- [ ] **Step 4: Commit**

```bash
git add src/components/smart/owner/OwnerOverview.vue \
        src/components/smart/owner/OwnerNavigationDrawer.vue
git commit -m "fix(style): remove forbidden box-shadow; use outline for focus ring"
```

---

## Task 8 — Delete unreachable dead components

**Files:**
- Delete: `src/components/dumb/shared/DashActivityTimeline.vue`
- Delete: `src/components/dumb/shared/DashProgressList.vue`
- Delete: `src/components/dumb/owner/OwnerUpcomingTable.vue`

- [ ] **Step 1: Confirm none of these are imported anywhere**

```bash
grep -r "DashActivityTimeline\|DashProgressList\|OwnerUpcomingTable" src/ --include="*.vue" --include="*.ts"
```

Expected: no output (zero matches).

- [ ] **Step 2: Delete the files**

```bash
rm src/components/dumb/shared/DashActivityTimeline.vue
rm src/components/dumb/shared/DashProgressList.vue
rm src/components/dumb/owner/OwnerUpcomingTable.vue
```

- [ ] **Step 3: Type-check to confirm nothing broke**

```bash
pnpm exec vue-tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete unreachable dead dumb components"
```

---

## Task 9 — Extract useToday() composable; fix "today" freeze in both smart components

**Files:**
- Create: `src/composables/shared/useToday.ts`
- Modify: `src/components/smart/owner/OwnerOverview.vue`
- Modify: `src/components/smart/owner/OwnerPropertyTimeline.vue`

Without this fix, a session left open past midnight computes stale "today" strings. The composable uses a 1-minute interval to keep date strings reactive.

- [ ] **Step 1: Create `src/composables/shared/useToday.ts`**

```typescript
import { computed, onUnmounted, ref } from 'vue'

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function useToday() {
  const now = ref(new Date())

  const timer = setInterval(() => {
    const next = new Date()
    if (next.toDateString() !== now.value.toDateString()) {
      now.value = next
    }
  }, 60_000)

  onUnmounted(() => clearInterval(timer))

  const todayStr    = computed(() => toDateStr(now.value))
  const weekAhead   = computed(() => toDateStr(addDays(now.value, 7)))
  const fortAhead   = computed(() => toDateStr(addDays(now.value, 14)))
  const todayLabel  = computed(() =>
    now.value.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
  )

  return { todayStr, weekAhead, fortAhead, todayLabel }
}
```

- [ ] **Step 2: Update `OwnerOverview.vue` to use useToday()**

Add the import (alongside other composable imports, around line 184):
```typescript
import { useToday } from '@composables/shared/useToday'
```

Replace the four static date lines (around lines 222-226):
```typescript
// REMOVE these lines:
const todayStr = new Date().toISOString().split('T')[0]
const weekAhead = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0] })()
const fortAhead = (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0] })()
const todayFullLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
```

Replace with:
```typescript
const { todayStr, weekAhead, fortAhead, todayLabel: todayFullLabel } = useToday()
```

Now `todayStr`, `weekAhead`, `fortAhead`, and `todayFullLabel` are computed refs. Any template or computed referencing them must use `.value` in `<script>` (template auto-unwraps).

Update every script-side usage of these — they're all inside `computed()` callbacks so `.value` is accessed through the reactive system automatically. Verify no bare `todayStr` (string) is passed where a ref's value is expected — the `propStatus` call in `healthRows` already reads `myBookings.value` which re-evaluates when `todayStr.value` changes because `healthRows` is a computed that reads `todayStr.value`.

In the `healthRows` computed call, change:
```typescript
const status = propStatus(p.id, myBookings.value, todayStr)
```
to:
```typescript
const status = propStatus(p.id, myBookings.value, todayStr.value)
```

Do the same for every other place in OwnerOverview that reads `todayStr` directly (there are several in inline computed callbacks — search for `todayStr` and add `.value`):

- `turnsTodayCount`, `checkoutsTodayCount`, `weekCheckinCount`, `unassignedCount` computeds — add `.value` after `todayStr`
- `occupancyMap` — no direct use of todayStr (uses `new Date()` inline)
- `healthRows` — update as shown above
- `todayEvents` — `todayStr` appears in the `if` conditions: add `.value`
- `overviewListItems` — `todayStr` appears in several places: add `.value`

Similarly update `weekAhead.value` and `fortAhead.value` where used.

Update any template refs: `todayFullLabel` in the template auto-unwraps from the ref.

- [ ] **Step 3: Update `OwnerPropertyTimeline.vue` to use useToday()**

Add the import:
```typescript
import { useToday } from '@composables/shared/useToday'
```

Replace lines 78-79:
```typescript
// REMOVE:
const todayStr = new Date().toISOString().split('T')[0]
const msDay    = 86400000
```

Replace with:
```typescript
const { todayStr } = useToday()
const msDay = 86400000
```

`daysFromToday` now constructs its own `today` via `new Date()` each call (already done correctly), so `todayStr.value` is what needs updating everywhere `todayStr` appears in computed callbacks:

- `bandProperties` computed: `propStatus(p.id, myBookings.value, todayStr.value)`
- `todayEvents` computed: all `todayStr` comparisons → `todayStr.value`
- `recentActivity` computed: `todayStr` comparisons → `todayStr.value`
- `mobileEvents` computed: `todayStr` comparisons → `todayStr.value`

- [ ] **Step 4: Type-check**

```bash
pnpm exec vue-tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Run tests**

```bash
pnpm test:run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/composables/shared/useToday.ts \
        src/components/smart/owner/OwnerOverview.vue \
        src/components/smart/owner/OwnerPropertyTimeline.vue
git commit -m "fix(today): extract useToday() so date strings update after midnight"
```

---

## Task 10 — OwnerProperties: Add loading state + fix silent ownership-check failure

**Files:**
- Modify: `src/components/smart/owner/OwnerProperties.vue`

### 10a — Add loading ref + skeleton

- [ ] **Step 1: Add `loading` ref and wire it in `onMounted`**

In `src/components/smart/owner/OwnerProperties.vue`, find the `onMounted` block (around line 506):

```typescript
onMounted(async () => {
  if (authStore.isAuthenticated && authStore.user?.role === 'owner') {
    try {
      await Promise.all([
        fetchMyProperties(),
        fetchMyBookings(),
      ])
    } catch (error: unknown) {
      console.error('Failed to load properties data:', error)
      uiStore.addNotification('error', 'Error', 'Failed to load properties. Please refresh.')
    }
  }
})
```

Replace with:

```typescript
const loading = ref(false)

onMounted(async () => {
  if (authStore.isAuthenticated && authStore.user?.role === 'owner') {
    loading.value = true
    try {
      await Promise.all([fetchMyProperties(), fetchMyBookings()])
    } catch (error: unknown) {
      console.error('Failed to load properties data:', error)
      uiStore.addNotification('error', 'Error', 'Failed to load properties. Please refresh.')
    } finally {
      loading.value = false
    }
  }
})
```

Also add `ref` to the import from `'vue'` if it isn't already imported (check the `<script setup>` imports).

- [ ] **Step 2: Pass `:loading` to PropertyList in the template**

Find the `<PropertyList ...>` tag in the template (around line 64):

```vue
      <PropertyList
        :items="listItems"
        @assign-cleaner="handleAssignCleaner"
        @edit="handleListEdit"
        @more="handleListMore"
        @view-calendar="handleViewCalendar"
      />
```

Replace with:

```vue
      <PropertyList
        :items="listItems"
        :loading="loading"
        @assign-cleaner="handleAssignCleaner"
        @edit="handleListEdit"
        @more="handleListMore"
        @view-calendar="handleViewCalendar"
      />
```

### 10b — Fix silent ownership-check failure

- [ ] **Step 3: Add user notification on ownership check failure**

Find `handlePropertyModalDelete` (around line 451):

```typescript
async function handlePropertyModalDelete (propertyId: string): Promise<void> {
  const property = myProperties.value.find(p => p.id === propertyId)
  if (!property || property.owner_id !== authStore.user?.id) {
    console.warn('Cannot delete property not owned by current user')
    return
  }

  await handleDeleteProperty(propertyId)
}
```

Replace with:

```typescript
async function handlePropertyModalDelete (propertyId: string): Promise<void> {
  const property = myProperties.value.find(p => p.id === propertyId)
  if (!property || property.owner_id !== authStore.user?.id) {
    console.warn('[OwnerProperties] Delete attempted on non-owned property:', propertyId)
    uiStore.addNotification('error', 'Permission Denied', 'You can only delete properties you own.')
    return
  }

  await handleDeleteProperty(propertyId)
}
```

- [ ] **Step 4: Type-check**

```bash
pnpm exec vue-tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/smart/owner/OwnerProperties.vue
git commit -m "fix(properties): add loading state and surface ownership check error to user"
```

---

## Task 11 — BookingForm: Remove fake loading from handleDelete

**Files:**
- Modify: `src/components/dumb/shared/BookingForm.vue`

- [ ] **Step 1: Remove the fake loading management**

In `src/components/dumb/shared/BookingForm.vue`, find `handleDelete` (around line 731):

```typescript
  // Handle booking deletion
  function handleDelete (): void {
    if (props.mode !== 'edit' || !props.booking) return

    loading.value = true
    emit('delete', props.booking.id)

    loading.value = false
    isOpen.value = false
  }
```

Replace with:

```typescript
  function handleDelete (): void {
    if (props.mode !== 'edit' || !props.booking) return
    emit('delete', props.booking.id)
  }
```

The parent (`GlobalBookingModal.vue` or equivalent) is responsible for closing the modal and handling errors asynchronously.

- [ ] **Step 2: Type-check**

```bash
pnpm exec vue-tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dumb/shared/BookingForm.vue
git commit -m "fix(booking-form): remove fake synchronous loading from handleDelete"
```

---

## Task 12 — Switch Promise.all → Promise.allSettled in 3 smart components

**Files:**
- Modify: `src/components/smart/owner/OwnerPropertyTimeline.vue`
- Modify: `src/components/smart/owner/OwnerOverview.vue`
- Modify: `src/components/smart/owner/OwnerBookings.vue`

### 12a — OwnerPropertyTimeline

- [ ] **Step 1: Replace onMounted fetch in OwnerPropertyTimeline.vue**

Find (around lines 65-76):

```typescript
  onMounted(async () => {
    if (!authStore.isAuthenticated) return
    loading.value = true
    try {
      await Promise.all([fetchMyProperties(), fetchMyBookings()])
    } catch (err: unknown) {
      console.error('Timeline load failed:', err)
      uiStore.addNotification('error', 'Error', 'Failed to load timeline data.')
    } finally {
      loading.value = false
    }
  })
```

Replace with:

```typescript
  onMounted(async () => {
    if (!authStore.isAuthenticated) return
    loading.value = true
    const [propResult, bookResult] = await Promise.allSettled([
      fetchMyProperties(),
      fetchMyBookings(),
    ])
    loading.value = false
    if (propResult.status === 'rejected' || bookResult.status === 'rejected') {
      const failed = [
        propResult.status === 'rejected' ? 'properties' : null,
        bookResult.status === 'rejected' ? 'bookings' : null,
      ].filter(Boolean).join(' and ')
      console.error('Timeline load failed:', propResult.status === 'rejected' ? propResult.reason : bookResult.reason)
      uiStore.addNotification('error', 'Load Error', `Failed to load ${failed}. Please refresh.`)
    }
  })
```

### 12b — OwnerOverview

- [ ] **Step 2: Replace onMounted fetch in OwnerOverview.vue**

Find (around lines 204-216):

```typescript
  onMounted(async () => {
    if (authStore.isAuthenticated && authStore.user?.role === 'owner') {
      loading.value = true
      try {
        await Promise.all([fetchMyProperties(), fetchMyBookings()])
      } catch (err: unknown) {
        console.error('Failed to load overview data:', err)
        uiStore.addNotification('error', 'Error', 'Failed to load dashboard data. Please refresh.')
      } finally {
        loading.value = false
      }
    }
  })
```

Replace with:

```typescript
  onMounted(async () => {
    if (!authStore.isAuthenticated || authStore.user?.role !== 'owner') return
    loading.value = true
    const [propResult, bookResult] = await Promise.allSettled([
      fetchMyProperties(),
      fetchMyBookings(),
    ])
    loading.value = false
    if (propResult.status === 'rejected' || bookResult.status === 'rejected') {
      const failed = [
        propResult.status === 'rejected' ? 'properties' : null,
        bookResult.status === 'rejected' ? 'bookings' : null,
      ].filter(Boolean).join(' and ')
      console.error('Failed to load overview data:', propResult.status === 'rejected' ? propResult.reason : bookResult.reason)
      uiStore.addNotification('error', 'Load Error', `Failed to load ${failed}. Please refresh.`)
    }
  })
```

### 12c — OwnerBookings

- [ ] **Step 3: Replace onMounted fetch in OwnerBookings.vue**

Find (around lines 220-230):

```typescript
  onMounted(async () => {
    loading.value = true
    try {
      await Promise.all([fetchMyBookings(), fetchMyProperties()])
    } catch (error) {
      console.error('Failed to load bookings:', error)
      uiStore.addNotification('error', 'Load Failed', 'Could not load bookings. Please refresh.')
    } finally {
      loading.value = false
    }
  })
```

Replace with:

```typescript
  onMounted(async () => {
    loading.value = true
    const [bookResult, propResult] = await Promise.allSettled([
      fetchMyBookings(),
      fetchMyProperties(),
    ])
    loading.value = false
    if (bookResult.status === 'rejected' || propResult.status === 'rejected') {
      const failed = [
        bookResult.status === 'rejected' ? 'bookings' : null,
        propResult.status === 'rejected' ? 'properties' : null,
      ].filter(Boolean).join(' and ')
      console.error('Failed to load bookings data:', bookResult.status === 'rejected' ? bookResult.reason : propResult.reason)
      uiStore.addNotification('error', 'Load Error', `Failed to load ${failed}. Please refresh.`)
    }
  })
```

- [ ] **Step 4: Type-check all three**

```bash
pnpm exec vue-tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Run full test suite**

```bash
pnpm test:run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/smart/owner/OwnerPropertyTimeline.vue \
        src/components/smart/owner/OwnerOverview.vue \
        src/components/smart/owner/OwnerBookings.vue
git commit -m "fix(fetch): switch Promise.all to Promise.allSettled; report per-resource failures"
```

---

## Final Verification

- [ ] Run full build to confirm no type errors or bundle regressions:

```bash
pnpm build
```

Expected: build succeeds, no type errors.

- [ ] Run full test suite one last time:

```bash
pnpm test:run
```

Expected: all tests pass.

- [ ] Push the branch:

```bash
git push origin claudedesignhandoff
```
