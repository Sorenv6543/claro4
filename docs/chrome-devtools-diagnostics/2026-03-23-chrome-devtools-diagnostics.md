# Chrome DevTools Diagnostics — 2026-03-23

## Diagnostic Steps Run

1. `navigate_page` → localhost:3000 (cache-busting reload)
2. `list_console_messages` (errors/warnings)
3. `list_network_requests` (fetch/xhr) → Supabase call count
4. `performance_start_trace` → LCP/CLS measurement
5. `emulate offline` → error handling test
6. `emulate Slow 3G` → race condition / UX test

---

## Results

### 1. Console (normal conditions)
- **Zero errors or warnings.** Clean.

### 2. Network — Supabase Calls (4 total, all 200)

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `user_profiles?id=eq.{uid}` | 200 |
| 2 | GET | `user_profiles?id=eq.{uid}` | **200 (duplicate)** |
| 3 | GET | `bookings?order=checkout_date.asc` | 200 |
| 4 | GET | `properties?select=*` | 200 |

**Issue:** Duplicate `user_profiles` fetch — `checkAuth()` called `loadUserProfile()` directly, bypassing the dedup guard in `loadUserProfileSafe()`.

### 3. Performance Trace (Core Web Vitals)

| Metric | Value | Status |
|--------|-------|--------|
| **LCP** | 1,682 ms | Needs improvement |
| **CLS** | 0.21 | **Bad** (threshold < 0.1) |
| **TTFB** | 4 ms | Excellent |
| **Render Delay** | 1,678 ms | Client-side bottleneck |

Insights flagged: CLS culprits, forced reflows, DOM size, network dependency tree.

### 4. Offline Emulation
- **No offline handling** — Chrome's default `ERR_INTERNET_DISCONNECTED` dino page.
- No service worker cached shell.

### 5. Slow 3G Emulation

| Finding | Detail |
|---------|--------|
| Blank white screen | No loading spinner/skeleton while Supabase calls in-flight |
| Duplicate profile fetch | Same 2x `user_profiles` confirmed on slow network |
| Vue Router warnings | 4x deprecated `next()` callback in navigation guards |
| Data requests stalled | `bookings` and `properties` hadn't loaded — zero visual feedback |

---

## Fixes Applied

### Fix 1: CLS 0.21 → Scoped wildcard transition
**File:** `src/App.vue`
- The `* { transition: ... }` rule forced reflows on every element during theme changes.
- Scoped to `.v-application, .v-navigation-drawer, .v-app-bar, .v-main, .v-card, .v-footer`.
- Set lazy layout `delay: 0` (was 200ms) so placeholder shows immediately.

### Fix 2: Duplicate `user_profiles` fetch
**File:** `src/composables/supabase/useSupabaseAuth.ts` (line 324)
- `checkAuth()` called `loadUserProfile()` directly, bypassing dedup.
- Changed to `loadUserProfileSafe()` — reuses in-flight promise.

### Fix 3: Blank screen on slow networks
**Files:** `src/App.vue`, `src/components/smart/owner/HomeOwner.vue`
- App.vue: Added `v-if="Component"` guard with `LoadingSpinner` fallback when route hasn't resolved yet.
- HomeOwner.vue: Added `initialLoading` ref + `LoadingSpinner` shown until first data fetch completes.

### Fix 4: Vue Router `next()` deprecation
**File:** `src/components/smart/owner/OwnerPropertyView.vue` (line 426)
- Converted `onBeforeRouteLeave` from `next()` callback to modern return-value pattern.
- `return false` blocks navigation; `undefined` allows it.

---

## Remaining Issues (not fixed)

- **Offline support**: No service worker / cached app shell. App is completely unusable offline.
- **CLS may still need work**: The wildcard transition was the biggest culprit, but content popping in after async loads may still contribute. Re-measure after fixes.
- **LCP 1,682ms**: Entirely render delay. Could improve with SSR, preloading critical data, or optimizing the Vue component tree.
