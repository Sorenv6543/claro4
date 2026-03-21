# Performance Audit Fixes Design

**Date:** 2026-03-21
**Scope:** 4 performance fixes identified via Lighthouse + Chrome DevTools performance trace on the Owner Dashboard (`/owner/dashboard`)

## Baseline Metrics

| Metric | Value | Rating |
|--------|-------|--------|
| LCP | 1,419 ms | Good |
| CLS | 0.05 | Good |
| Best Practices | 100 | - |
| Accessibility | 76 | - |
| SEO | 82 | - |
| Critical path latency | 1,677 ms | - |
| Total requests (dev) | 265 | - |
| Forced reflow time | 147 ms | - |

## Fix 1: Shimmer Animation (CLS)

**Problem:** `turn-shimmer` keyframes animate `left`, triggering layout on every frame. Causes 63 micro layout shifts (CLS 0.05).

**Fix:** Change `left` to `transform: translateX()`. Update `::after` pseudo-elements to use `left: 0` (static) instead of `left: -100%`.

**Before:**
```css
@keyframes turn-shimmer {
  0% { left: -100%; }
  60% { left: 100%; }
  100% { left: 100%; }
}
```

**After (keyframes):**
```css
@keyframes turn-shimmer {
  0% { transform: translateX(-100%); }
  60% { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}
```

**After (pseudo-elements):** Update both `::after` rules to use static positioning + compositor hint:
```css
:deep(.turn-event-badge)::after {
  /* ... existing styles ... */
  left: 0;                    /* was: left: -100% — now static, transform handles movement */
  will-change: transform;     /* hint compositor promotion */
  animation: turn-shimmer 2.5s ease-in-out infinite;
}

:deep(.checkout-event-badge)::after {
  /* ... existing styles ... */
  left: 0;                    /* was: left: -100% */
  will-change: transform;
  animation: turn-shimmer 3s ease-in-out infinite;
}
```

`translateX` percentages are relative to the element's own width (same as `left` on the absolutely-positioned `::after` with `width: 100%`), so `-100%`/`100%` produces the identical visual sweep as the original `left: -100%`/`left: 100%`.

**Expected impact:** CLS 0.05 -> ~0. Animation promoted to compositor thread.

## Fix 2: Supabase Preconnect

**Problem:** No `<link rel="preconnect">` for Supabase origin. The Supabase REST API calls sit at the end of an 8-level critical path chain at ~1.7s.

**Fix:** Add to `index.html` `<head>` (after charset meta):
```html
<link rel="preconnect" href="https://aejkrsvemqnftivzkkxd.supabase.co" />
```

Single-tenant deployment with one Supabase project, so hardcoding the origin is appropriate. Add an HTML comment noting this must stay in sync with `VITE_SUPABASE_URL` in `.env.local`:
```html
<!-- Must match VITE_SUPABASE_URL in .env.local -->
<link rel="preconnect" href="https://aejkrsvemqnftivzkkxd.supabase.co" />
```

**Expected impact:** ~100-200ms saved on DNS + TCP + TLS for Supabase API calls.

## Fix 3: Lazy Layout Loading

**Problem:** All 5 layouts are statically imported in `App.vue`. Admin layout pulls in `useAdminUserManagement`, `AdminSidebar`, and `fetchAllUsers()` — all bundled and parsed for owner users who never use them.

**Fix:** Replace static imports with `defineAsyncComponent`:
```typescript
import { defineAsyncComponent } from 'vue'

const layouts = {
  default: defineAsyncComponent(() => import('@/layouts/default.vue')),
  auth: defineAsyncComponent(() => import('@/layouts/auth.vue')),
  admin: defineAsyncComponent(() => import('@/layouts/admin.vue')),
  owner: defineAsyncComponent(() => import('@/layouts/owner.vue')),
  bare: defineAsyncComponent(() => import('@/layouts/bare.vue')),
}
```

Key details:
- `defineAsyncComponent` handles loading/error states; no `markRaw` needed
- Admin code excluded from owner bundle entirely
- Vite chunk strategy (`admin-app`, `owner-app`) splits naturally

**Expected impact:** ~200ms off critical path for owner routes. Admin code tree-shaken from owner bundle.

## Fix 4: placeBadge Reflow Batching

**Problem:** `placeBadge` in `FullCalendar.vue` interleaves `getBoundingClientRect()` reads with DOM style writes. Called up to 2x per event (TURN + OUT badges), causing 5ms forced reflow.

**Fix:** Split into `measureBadge` (reads only) and `applyBadge` (writes only). In `handleEventDidMount`, collect all measurements first, then apply all writes.

```typescript
interface BadgeMeasurement {
  eventEl: HTMLElement
  leftPct: number
  widthPct: number
  className: string
  label: string
  harness: HTMLElement | null
}

function measureBadge(eventEl: HTMLElement, dateStr: string, className: string, label: string): BadgeMeasurement | null {
  // All DOM reads: closest(), querySelector(), getBoundingClientRect()
}

function applyBadge(m: BadgeMeasurement) {
  // All DOM writes: createElement, style assignments, appendChild
}
```

In the `requestAnimationFrame` callback:
1. Collect all `measureBadge()` results (reads)
2. Call `applyBadge()` for each (writes)

**Expected impact:** Eliminates 5ms forced reflow from placeBadge. Reads batched before writes.

## Files Modified

| File | Changes |
|------|---------|
| `src/components/smart/shared/FullCalendar.vue` | Shimmer keyframes, `::after` left values, placeBadge refactor |
| `src/App.vue` | Replace static layout imports with `defineAsyncComponent` |
| `index.html` | Add Supabase preconnect |

## Verification

- `pnpm build` must pass (type check + bundle)
- `pnpm test:run` must pass
- `pnpm test:performance` must pass
- Re-run Lighthouse audit to verify CLS improvement
- Re-run performance trace to verify reduced reflow time
