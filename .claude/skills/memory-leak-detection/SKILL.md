---
name: memory-leak-detection
description: Use when investigating memory leaks, growing heap size, detached DOM nodes, zombie event listeners, or when a page becomes sluggish over time. Also use when checking for cleanup issues in SPAs after route navigation.
---

# Memory Leak Detection

## Overview

Systematic approach to finding memory leaks using heap snapshots, console monitoring, and DOM inspection. Captures baseline memory, performs actions that may leak, then compares snapshots to identify retained objects.

## When to Use

- Page gets slower over time
- Memory usage grows with repeated actions
- SPA navigation leaves behind detached DOM nodes
- Event listeners or subscriptions not cleaned up
- After implementing components with subscriptions, timers, or manual DOM manipulation

## Memory Leak Categories

| Category | Symptom | Common Cause |
|----------|---------|-------------|
| **Detached DOM** | Node count grows | Elements removed from DOM but still referenced in JS |
| **Event listeners** | Listener count grows | Listeners added but never removed |
| **Closures** | Heap grows steadily | Closures capturing large scopes |
| **Timers** | Intervals accumulate | setInterval/setTimeout not cleared |
| **Subscriptions** | Connections accumulate | WebSocket, realtime, or observable subscriptions not unsubscribed |
| **Store references** | State never GC'd | Pinia/Vuex stores holding stale references |

## Detection Workflow

### Step 1: Establish Baseline

Navigate to the page and take an initial memory snapshot:

1. `navigate_page` to the target URL.
2. Wait for the page to fully load and stabilize.
3. Use `evaluate_script` to force garbage collection and get baseline metrics:

```javascript
(() => {
  // Note: gc() only available if Chrome launched with --js-flags="--expose-gc"
  if (window.gc) window.gc();
  const perf = performance.memory || {};
  return {
    usedJSHeapSize: (perf.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
    totalJSHeapSize: (perf.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
    jsHeapSizeLimit: (perf.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
    domNodes: document.querySelectorAll('*').length,
    timestamp: new Date().toISOString()
  };
})()
```

4. `take_memory_snapshot` — save as baseline.

### Step 2: Perform Suspect Actions

Execute the actions you suspect cause leaks. Common patterns:

- **Route navigation**: Navigate between routes 5-10 times using `click` or `evaluate_script`
- **Dialog open/close**: Open and close modals/dialogs repeatedly
- **List scrolling**: Scroll through large lists with virtual scrolling
- **Data refresh**: Trigger data fetches multiple times
- **Component mount/unmount**: Toggle component visibility repeatedly

Use `evaluate_script` or `click` to perform actions programmatically.

### Step 3: Measure After Actions

Re-run the baseline measurement script from Step 1. Compare:

- **usedJSHeapSize**: Should return to near-baseline after GC
- **domNodes**: Should not grow if components are properly unmounting
- Growth > 10% after GC suggests a leak

### Step 4: Take Comparison Snapshot

`take_memory_snapshot` — this captures the heap state after suspected leak actions.

### Step 5: Detect Detached DOM Nodes

Use `evaluate_script` with this snippet to find detached DOM trees:

```javascript
(() => {
  const results = { detachedNodes: 0, details: [] };
  const walker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT);
  let count = 0;
  while (walker.nextNode()) count++;
  results.attachedNodes = count;

  // Check for common Vue leak patterns
  const checks = {
    orphanedEventListeners: (() => {
      try {
        return getEventListeners ? 'available' : 'not available';
      } catch { return 'not available (Chrome-only API)'; }
    })(),
    activeTimers: 'Check via Performance tab',
    vueInstances: document.querySelectorAll('[data-v-]').length,
    observerCount: (() => {
      let count = 0;
      if (window.__resizeObservers) count += window.__resizeObservers.length;
      if (window.__mutationObservers) count += window.__mutationObservers.length;
      if (window.__intersectionObservers) count += window.__intersectionObservers.length;
      return count || 'Not tracked (instrument observers to count)';
    })()
  };
  results.checks = checks;
  return results;
})()
```

### Step 6: Check for Subscription Leaks

For SPAs with realtime subscriptions (Supabase, WebSocket, etc.):

```javascript
(() => {
  // Check Supabase channels (if using Supabase)
  const supabaseChannels = window.__supabase_channels || [];

  // Check active WebSocket connections
  const wsCheck = performance.getEntriesByType('resource')
    .filter(r => r.initiatorType === 'websocket' || r.name.includes('ws://') || r.name.includes('wss://'));

  // Check for setInterval leaks
  let intervalCount = 0;
  const origSetInterval = window.setInterval;

  return {
    activeWebSockets: wsCheck.length,
    supabaseChannels: supabaseChannels.length,
    note: 'Instrument setInterval/setTimeout in dev mode to track active timers'
  };
})()
```

### Step 7: Monitor Console for Warnings

Use `list_console_messages` filtered by type `warning` and `error` to catch:

- Vue warnings about unmounted component updates
- Memory pressure warnings
- Subscription errors after unmount

## Interpreting Results

| Metric | Healthy | Leaking |
|--------|---------|---------|
| Heap after GC | Returns to ~baseline | Grows 10%+ each cycle |
| DOM nodes after navigation | Returns to ~baseline | Grows each navigation |
| Event listener count | Stable | Grows with actions |
| Active timers | 0-2 baseline | Grows with actions |
| Supabase channels | Matches active views | Accumulates |

## Vue-Specific Leak Patterns

| Pattern | Cause | Fix |
|---------|-------|-----|
| `onMounted` without `onUnmounted` | Timer/listener not cleaned | Always pair with cleanup |
| `watch` with external refs | Watcher keeps component alive | Use `watchEffect` with auto-cleanup |
| `supabase.channel()` without `removeChannel()` | Channel accumulates | Clean up in `onUnmounted` |
| Store `.subscribe()` without unsubscribe | Subscription leak | Store and call unsubscribe |
| `ResizeObserver` without `.disconnect()` | Observer accumulates | Disconnect in `onUnmounted` |

## Common Mistakes

- Not forcing GC before measuring — JS heap has lazy GC that inflates readings
- Taking snapshots too quickly — allow 2-3 seconds for async cleanup
- Only checking heap size — DOM node count and listener count are equally important
- Ignoring Vue DevTools overlay — it adds its own DOM nodes and listeners (disable in production builds)
