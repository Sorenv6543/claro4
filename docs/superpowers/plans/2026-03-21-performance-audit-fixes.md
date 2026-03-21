# Performance Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 performance issues identified by Lighthouse + Chrome DevTools trace on the Owner Dashboard.

**Architecture:** Targeted edits to 3 files — CSS animation fix, HTML preconnect, lazy layout imports, and DOM read/write batching. No new files or dependencies.

**Tech Stack:** Vue 3, Vite, FullCalendar, Supabase

**Spec:** `docs/superpowers/specs/2026-03-21-performance-audit-fixes-design.md`

---

### Task 1: Fix shimmer animation CLS

**Files:**
- Modify: `src/components/smart/shared/FullCalendar.vue:742-805`

- [ ] **Step 1: Update `turn-event-badge::after` to use static left + will-change**

In `src/components/smart/shared/FullCalendar.vue`, find the `:deep(.turn-event-badge)::after` rule (around line 743). Change `left: -100%` to `left: 0` and add `will-change: transform`:

```css
:deep(.turn-event-badge)::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.08) 25%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0.08) 75%,
    transparent 100%
  );
  will-change: transform;
  animation: turn-shimmer 2.5s ease-in-out infinite;
}
```

- [ ] **Step 2: Update keyframes to use transform instead of left**

Replace the `@keyframes turn-shimmer` block (around line 761):

```css
@keyframes turn-shimmer {
  0% { transform: translateX(-100%); }
  60% { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}
```

- [ ] **Step 3: Update `checkout-event-badge::after` to use static left + will-change**

Find `:deep(.checkout-event-badge)::after` (around line 790). Change `left: -100%` to `left: 0` and add `will-change: transform`:

```css
:deep(.checkout-event-badge)::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.06) 25%,
    rgba(255, 255, 255, 0.18) 50%,
    rgba(255, 255, 255, 0.06) 75%,
    transparent 100%
  );
  will-change: transform;
  animation: turn-shimmer 3s ease-in-out infinite;
}
```

- [ ] **Step 4: Verify the app loads and shimmer looks correct**

Run: `pnpm dev`
Open `http://localhost:3000/owner/dashboard` and visually confirm the shimmer animation on TURN and OUT badges sweeps left-to-right identically to before.

- [ ] **Step 5: Commit**

```bash
git add src/components/smart/shared/FullCalendar.vue
git commit -m "perf: fix shimmer animation CLS by using transform instead of left"
```

---

### Task 2: Add Supabase preconnect

**Files:**
- Modify: `index.html:4-5`

- [ ] **Step 1: Add preconnect link to index.html**

In `index.html`, add after the `<meta charset="UTF-8">` line (line 4):

```html
    <meta charset="UTF-8">
    <!-- Must match VITE_SUPABASE_URL in .env.local -->
    <link rel="preconnect" href="https://aejkrsvemqnftivzkkxd.supabase.co" />
    <link rel="icon" href="/favicon.ico">
```

- [ ] **Step 2: Verify the app loads**

Run: `pnpm dev`
Open `http://localhost:3000` and confirm the app still loads correctly.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "perf: add Supabase preconnect to reduce connection latency"
```

---

### Task 3: Lazy-load layouts in App.vue

**Files:**
- Modify: `src/App.vue:11-30`

- [ ] **Step 1: Replace static layout imports with defineAsyncComponent**

In `src/App.vue`, replace lines 12-30:

**Before:**
```typescript
  import { computed, markRaw } from 'vue'
  import { useRoute } from 'vue-router'

  import PWANotificationsEnhanced from '@/components/dumb/shared/PWANotificationsEnhanced.vue'
  import AdminLayout from '@/layouts/admin.vue'
  import AuthLayout from '@/layouts/auth.vue'
  import BareLayout from '@/layouts/bare.vue'
  // Import layouts
  import DefaultLayout from '@/layouts/default.vue'
  import OwnerLayout from '@/layouts/owner.vue'

  // Available layouts
  const layouts = {
    default: markRaw(DefaultLayout),
    auth: markRaw(AuthLayout),
    admin: markRaw(AdminLayout),
    owner: markRaw(OwnerLayout),
    bare: markRaw(BareLayout),
  }
```

**After:**
```typescript
  import { computed, defineAsyncComponent } from 'vue'
  import { useRoute } from 'vue-router'

  import PWANotificationsEnhanced from '@/components/dumb/shared/PWANotificationsEnhanced.vue'

  const layouts = {
    default: defineAsyncComponent(() => import('@/layouts/default.vue')),
    auth: defineAsyncComponent(() => import('@/layouts/auth.vue')),
    admin: defineAsyncComponent(() => import('@/layouts/admin.vue')),
    owner: defineAsyncComponent(() => import('@/layouts/owner.vue')),
    bare: defineAsyncComponent(() => import('@/layouts/bare.vue')),
  }
```

- [ ] **Step 2: Run type check**

Run: `pnpm build`
Expected: Build passes. The `layout` computed returns the async component wrapper, which is a valid component for `<component :is="...">`.

- [ ] **Step 3: Verify owner dashboard loads**

Run: `pnpm dev`
Navigate to `http://localhost:3000/owner/dashboard`. Confirm the owner layout renders correctly with sidebar and calendar.

- [ ] **Step 4: Verify admin layout loads**

If you have an admin account, navigate to an admin route. Otherwise, confirm no TypeScript errors and the build passes.

- [ ] **Step 5: Commit**

```bash
git add src/App.vue
git commit -m "perf: lazy-load layouts to exclude admin code from owner bundle"
```

---

### Task 4: Batch placeBadge DOM reads and writes

**Files:**
- Modify: `src/components/smart/shared/FullCalendar.vue:194-244`

- [ ] **Step 1: Add BadgeMeasurement interface and measureBadge function**

In `src/components/smart/shared/FullCalendar.vue`, replace the `placeBadge` function (lines 194-224) with:

```typescript
  interface BadgeMeasurement {
    eventEl: HTMLElement
    leftPct: number
    widthPct: number
    className: string
    label: string
    harness: HTMLElement | null
  }

  // Phase 1: DOM reads only — no style mutations
  function measureBadge (eventEl: HTMLElement, dateStr: string, className: string, label: string): BadgeMeasurement | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null

    const eventRow = eventEl.closest('tr')
    if (!eventRow) return null
    const cell = eventRow.querySelector(`td.fc-day[data-date="${dateStr}"]`)
    if (!cell) return null

    const eventRect = eventEl.getBoundingClientRect()
    const cellRect = cell.getBoundingClientRect()
    if (eventRect.width === 0) return null

    const leftPct = ((cellRect.left - eventRect.left) / eventRect.width) * 100
    const widthPct = (cellRect.width / eventRect.width) * 100
    const harness = eventEl.closest('.fc-daygrid-event-harness') as HTMLElement | null

    return { eventEl, leftPct, widthPct, className, label, harness }
  }

  // Phase 2: DOM writes only — no layout queries
  function applyBadge (m: BadgeMeasurement) {
    const badge = document.createElement('div')
    badge.className = m.className
    badge.textContent = m.label
    badge.style.left = `${m.leftPct}%`
    badge.style.width = `${m.widthPct}%`

    if (m.harness) {
      m.harness.style.overflow = 'visible'
    }
    m.eventEl.style.position = 'relative'
    m.eventEl.style.overflow = 'visible'
    m.eventEl.appendChild(badge)
  }
```

- [ ] **Step 2: Update handleEventDidMount to batch reads then writes**

Replace the `handleEventDidMount` function (lines 227-245) with:

```typescript
  function handleEventDidMount (info: { event: { extendedProps: Record<string, unknown> }, el: HTMLElement }) {
    const booking = info.event.extendedProps?.booking as Booking | undefined
    if (!booking) return

    requestAnimationFrame(() => {
      const eventEl = info.el
      if (!eventEl.isConnected) return

      // Phase 1: all reads
      const measurements: BadgeMeasurement[] = []
      if (booking.turn_date) {
        const m = measureBadge(eventEl, booking.turn_date, 'turn-event-badge', 'TURN')
        if (m) measurements.push(m)
      }
      if (booking.checkout_date && booking.checkout_date !== booking.turn_date) {
        const m = measureBadge(eventEl, booking.checkout_date, 'checkout-event-badge', 'OUT')
        if (m) measurements.push(m)
      }

      // Phase 2: all writes
      measurements.forEach(applyBadge)
    })
  }
```

- [ ] **Step 3: Verify badges render correctly**

Run: `pnpm dev`
Open `http://localhost:3000/owner/dashboard`. Confirm TURN and OUT badges appear in the correct calendar day columns on multi-day booking events.

- [ ] **Step 4: Run tests**

Run: `pnpm test:run`
Expected: All tests pass.

Run: `pnpm build`
Expected: Build passes (type check).

- [ ] **Step 5: Commit**

```bash
git add src/components/smart/shared/FullCalendar.vue
git commit -m "perf: batch placeBadge DOM reads before writes to eliminate forced reflows"
```

---

### Task 5: Final verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test:run`
Expected: All tests pass.

- [ ] **Step 2: Run performance tests**

Run: `pnpm test:performance`
Expected: All performance tests pass.

- [ ] **Step 3: Run production build**

Run: `pnpm build`
Expected: Build completes with no errors.

- [ ] **Step 4: Verify in browser**

Open `http://localhost:3000/owner/dashboard` and confirm:
1. Shimmer animations sweep correctly on TURN/OUT badges
2. Calendar renders with correct layout
3. Sidebar navigation works
4. No console errors
