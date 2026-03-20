---
name: spa-route-performance
description: Use when measuring navigation performance between routes in a Single Page Application, investigating slow route transitions, comparing route load times, or auditing lazy-loaded chunk sizes. Also use when SPA feels sluggish when switching between pages.
---

# SPA Route Performance

## Overview

Measures and optimizes the performance of client-side route transitions in SPAs. Unlike full page loads, SPA navigations don't trigger a new page load — they swap components, fetch data, and re-render. This skill traces what happens between click and render completion.

## When to Use

- Route transitions feel slow
- Comparing performance of different routes
- Auditing lazy-loaded chunk sizes and load times
- Investigating jank during route transitions
- After adding new routes or heavy components
- Checking if code splitting is working effectively

## SPA Navigation Anatomy

A client-side route transition involves:

1. **Route resolution** — Router matches URL, triggers guards (auth checks)
2. **Chunk loading** — Lazy-loaded components download
3. **Data fetching** — Composables/stores fetch required data
4. **Component mounting** — Vue creates and mounts component tree
5. **Layout paint** — Browser renders the new view

Each phase can be a bottleneck. This workflow measures all of them.

## Measurement Workflow

### Step 1: Navigate to Starting Route

1. `navigate_page` to the SPA's entry point or a specific route.
2. `wait_for` expected content to confirm the page is ready.

### Step 2: Install Performance Instrumentation

Use `evaluate_script` to install route transition timing:

```javascript
(() => {
  window.__routePerf = {
    transitions: [],
    current: null
  };

  // Mark navigation start on any click that might trigger navigation
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a, [role="link"], .v-list-item, [data-route]');
    if (link) {
      window.__routePerf.current = {
        clickTime: performance.now(),
        target: link.textContent?.trim().substring(0, 50) || link.href || 'unknown',
        chunks: [],
        networkRequests: 0
      };
    }
  }, true);

  // Track dynamically loaded chunks
  const origFetch = window.fetch;
  window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    if (window.__routePerf.current && (url.includes('.js') || url.includes('.css'))) {
      window.__routePerf.current.chunks.push({
        url: url.split('/').pop()?.split('?')[0],
        startTime: performance.now() - window.__routePerf.current.clickTime
      });
      window.__routePerf.current.networkRequests++;
    }
    return origFetch.apply(this, args);
  };

  // Detect render completion via MutationObserver
  let renderTimer = null;
  const observer = new MutationObserver(() => {
    if (window.__routePerf.current) {
      clearTimeout(renderTimer);
      renderTimer = setTimeout(() => {
        const transition = window.__routePerf.current;
        transition.totalTime = performance.now() - transition.clickTime;
        transition.renderCompleteTime = transition.totalTime;
        window.__routePerf.transitions.push(transition);
        window.__routePerf.current = null;
      }, 150); // 150ms of DOM stability = render complete
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return 'Route performance instrumentation installed. Navigate between routes, then collect results.';
})()
```

### Step 3: Perform Route Navigations

Navigate between routes using `click` on navigation elements. Test:

1. **Cold navigation** — First visit to each route (chunks not cached)
2. **Warm navigation** — Return visit (chunks cached)
3. **Heavy routes** — Routes with data tables, calendars, maps
4. **Auth-guarded routes** — Routes that trigger auth checks

Wait for each route to fully render before navigating to the next.

### Step 4: Collect Transition Data

Use `evaluate_script` to retrieve results:

```javascript
(() => {
  const transitions = window.__routePerf?.transitions || [];
  return {
    count: transitions.length,
    transitions: transitions.map(t => ({
      target: t.target,
      totalTime: t.totalTime?.toFixed(0) + 'ms',
      chunksLoaded: t.chunks?.length || 0,
      chunkNames: t.chunks?.map(c => c.url) || [],
      networkRequests: t.networkRequests
    })),
    summary: {
      avgTime: (transitions.reduce((s, t) => s + (t.totalTime || 0), 0) / transitions.length).toFixed(0) + 'ms',
      maxTime: Math.max(...transitions.map(t => t.totalTime || 0)).toFixed(0) + 'ms',
      totalChunks: transitions.reduce((s, t) => s + (t.chunks?.length || 0), 0)
    }
  };
})()
```

### Step 5: Analyze Network During Navigation

Use `list_network_requests` after navigating to check:

1. **Chunk sizes** — Filter by `resourceTypes: ["Script"]` and look for lazy-loaded chunks
2. **API calls** — Filter by `resourceTypes: ["Fetch", "XHR"]` to see data fetching
3. **Waterfall** — Check if chunks and API calls run in parallel or sequentially

### Step 6: Performance Trace for Detailed Analysis

For the slowest route transition:

1. Navigate to the starting route
2. `performance_start_trace` with `reload: false` and `autoStop: false`
3. `click` to navigate to the slow route
4. Wait for render to complete
5. `performance_stop_trace`

Analyze the trace for:
- `ForcedReflow` — Layout thrashing during mount
- `LCPBreakdown` — What delayed the main content
- Long tasks blocking the main thread

### Step 7: Check Code Splitting Effectiveness

Use `evaluate_script` to audit loaded modules:

```javascript
(() => {
  const scripts = performance.getEntriesByType('resource')
    .filter(r => r.initiatorType === 'script' || r.name.endsWith('.js'))
    .map(r => ({
      name: r.name.split('/').pop()?.split('?')[0],
      size: (r.transferSize / 1024).toFixed(1) + ' kB',
      duration: r.duration.toFixed(0) + 'ms',
      cached: r.transferSize === 0
    }))
    .sort((a, b) => parseFloat(b.size) - parseFloat(a.size));

  return {
    totalScripts: scripts.length,
    totalSize: (scripts.reduce((s, r) => s + parseFloat(r.size), 0)).toFixed(0) + ' kB',
    cachedScripts: scripts.filter(s => s.cached).length,
    largestScripts: scripts.slice(0, 10)
  };
})()
```

## Performance Targets

| Metric | Good | Needs Work | Poor |
|--------|------|-----------|------|
| Route transition time | < 300ms | 300-800ms | > 800ms |
| Lazy chunk size | < 50 kB | 50-150 kB | > 150 kB |
| API calls per transition | 1-2 | 3-4 | > 4 |
| Layout shifts during transition | 0 | 1-2 small | > 2 or large |

## Optimization Strategies

| Bottleneck | Fix |
|-----------|-----|
| **Large lazy chunks** | Split route into smaller sub-chunks; move shared code to common chunk |
| **Sequential data fetching** | Use `Promise.all()` for parallel fetches; prefetch on hover |
| **Slow component mounting** | Use `<Suspense>` with skeleton fallback; virtualize large lists |
| **Auth guard delays** | Cache auth state; don't re-verify on every navigation |
| **Layout thrashing on mount** | Reserve dimensions with CSS; avoid DOM reads during mount |
| **Waterfalling chunks** | Preload critical chunks with `<link rel="modulepreload">`; use route-level prefetching |

## Vue Router-Specific Tips

```javascript
// Prefetch on hover for faster navigation
router.beforeEach((to) => {
  // Data is already fetching when user clicks
})

// Use route-level code splitting
const routes = [
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard.vue') // Lazy loaded
  }
]

// Navigation guards add latency — keep them fast
router.beforeEach(async (to) => {
  // BAD: await fetchUserProfile() on every navigation
  // GOOD: check cached auth state, fetch only if stale
})
```

## Common Mistakes

- Only measuring initial page load — SPA navigation performance is a different metric
- Not testing cold vs warm navigations — cached chunks mask real load times
- Ignoring data fetching time — chunk loading is fast, API calls are often the bottleneck
- Not testing on throttled connections — `emulate` with "Fast 3G" reveals chunking issues
- Over-splitting routes — too many tiny chunks creates HTTP overhead; find the balance
