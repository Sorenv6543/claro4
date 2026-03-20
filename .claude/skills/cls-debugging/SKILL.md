---
name: cls-debugging
description: Use when investigating Cumulative Layout Shift (CLS), elements jumping or moving during page load, content reflowing unexpectedly, or when CLS score exceeds 0.1. Also use when users report visual instability or "jank" during page load or interaction.
---

# CLS Debugging

## Overview

Systematic workflow for identifying and fixing Cumulative Layout Shift issues. CLS measures visual stability — how much visible content shifts unexpectedly during the page lifecycle.

**Thresholds**: Good ≤ 0.1 | Needs Improvement 0.1–0.25 | Poor > 0.25

## When to Use

- CLS score exceeds 0.1
- Users report content "jumping" during load
- Elements reposition after initial render
- Font loading causes text reflow
- Images or ads push content down
- SPA route transitions cause layout shifts

## CLS Fundamentals

Layout shifts are scored by: `impact fraction × distance fraction`

- **Impact fraction**: % of viewport affected by the shift
- **Distance fraction**: Distance elements moved as % of viewport
- Only **unexpected** shifts count — user-initiated shifts (within 500ms of input) are excluded

**Shift clusters**: CLS uses a sliding session window. Shifts within 1s of each other (max 5s window) are grouped. The worst cluster is your CLS score.

## Debugging Workflow

### Step 1: Record a Performance Trace

1. `navigate_page` to the target URL.
2. `performance_start_trace` with `reload: true` and `autoStop: true`.

Note the CLS score and available insights from the trace results.

### Step 2: Analyze CLS Culprits

Call `performance_analyze_insight` with `insightName: "CLSCulprits"` and the insight set ID.

This reveals:
- The worst layout shift cluster (timing and total score)
- Individual shifts within the cluster (timing and individual scores)
- Potential root causes for each shift (if identifiable)

### Step 3: Identify Shifting Elements

Use `evaluate_script` with this snippet to capture live layout shifts:

```javascript
new Promise(resolve => {
  const shifts = [];
  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        for (const source of entry.sources || []) {
          shifts.push({
            score: entry.value.toFixed(4),
            startTime: entry.startTime.toFixed(0) + 'ms',
            element: source.node?.tagName + (source.node?.className ? '.' + source.node.className.split(' ')[0] : ''),
            previousRect: `${source.previousRect.x},${source.previousRect.y} ${source.previousRect.width}x${source.previousRect.height}`,
            currentRect: `${source.currentRect.x},${source.currentRect.y} ${source.currentRect.width}x${source.currentRect.height}`
          });
        }
      }
    }
  });
  observer.observe({ type: 'layout-shift', buffered: true });
  setTimeout(() => { observer.disconnect(); resolve(shifts); }, 5000);
});
```

This captures the **exact elements** that shifted, their before/after positions, and the shift score.

### Step 4: Take Visual Evidence

Use `take_screenshot` at key moments to visually confirm shifts:

1. Screenshot immediately after navigation starts
2. Screenshot after LCP
3. Screenshot after full load

Compare to see what moved.

### Step 5: Check Common Causes

Use `evaluate_script` with this diagnostic snippet:

```javascript
(() => {
  const issues = [];

  // Images without dimensions
  document.querySelectorAll('img:not([width]):not([height])').forEach(img => {
    if (!img.style.width && !img.style.height && !img.closest('[style*="aspect-ratio"]')) {
      const rect = img.getBoundingClientRect();
      if (rect.width > 0) {
        issues.push({ type: 'img-no-dimensions', src: img.src?.substring(0, 80), rendered: `${rect.width}x${rect.height}` });
      }
    }
  });

  // Iframes without dimensions
  document.querySelectorAll('iframe:not([width]):not([height])').forEach(iframe => {
    issues.push({ type: 'iframe-no-dimensions', src: iframe.src?.substring(0, 80) });
  });

  // Dynamically injected content above fold
  const viewportHeight = window.innerHeight;
  document.querySelectorAll('[style*="position: absolute"], [style*="position: fixed"]').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < viewportHeight && rect.height > 50) {
      issues.push({ type: 'dynamic-positioned', tag: el.tagName, class: el.className?.substring(0, 40), rect: `${rect.width}x${rect.height}` });
    }
  });

  // Web fonts that may cause FOUT/FOIT
  const fontFaces = [...document.fonts].map(f => ({
    family: f.family,
    status: f.status,
    display: f.display
  }));
  const nonSwapFonts = fontFaces.filter(f => f.display !== 'swap' && f.display !== 'optional');
  if (nonSwapFonts.length) {
    issues.push({ type: 'font-display', fonts: nonSwapFonts });
  }

  return { issueCount: issues.length, issues };
})()
```

### Step 6: Check Render-Blocking and Font Insights

If available in the trace, also analyze:

- `performance_analyze_insight` with `FontDisplay` — fonts blocking text rendering cause reflow when they finally load
- `performance_analyze_insight` with `RenderBlocking` — late-loading CSS can trigger layout recalculation

## Fix Strategies

| Cause | Fix | CSS Example |
|-------|-----|-------------|
| **Images without dimensions** | Set explicit width/height or aspect-ratio | `img { aspect-ratio: 16/9; width: 100%; }` |
| **Web fonts** | Use `font-display: swap` + font metric overrides | `@font-face { font-display: swap; }` |
| **Dynamic content injection** | Reserve space with min-height or skeleton | `.banner-slot { min-height: 90px; }` |
| **Late-loading CSS** | Inline critical CSS, defer non-critical | `<link rel="preload" as="style">` |
| **SPA route transitions** | Fix container dimensions, use `will-change: transform` | `.page-container { min-height: 100vh; }` |
| **Vuetify component mounting** | Set explicit heights on `v-app-bar`, `v-navigation-drawer` | `<v-app-bar height="64">` |
| **Async component loading** | Use `<Suspense>` with sized fallback | `<Suspense><template #fallback><div style="height:200px"/></template>` |

## SPA-Specific CLS Issues

In Vue/React SPAs, CLS commonly occurs from:

1. **Progressive hydration** — Components mount in waves, causing layout shifts
2. **Async data loading** — Content renders empty then fills in
3. **Route transitions** — Old route unmounts before new one has dimensions
4. **Conditional rendering** — `v-if` blocks appear after async checks

**SPA fixes:**
- Use skeleton loaders matching final component dimensions
- Set `min-height` on route containers
- Pre-allocate space for async content with CSS
- Use `v-show` instead of `v-if` for content that toggles frequently

## Verification

After applying fixes:

1. Re-run `performance_start_trace` with `reload: true`
2. Check the new CLS score
3. Verify the worst cluster score dropped below 0.1
4. Test under throttled conditions with `emulate` (`networkConditions: "Fast 3G"`, `cpuThrottlingRate: 4`) — CLS issues are often worse on slow devices

## Common Mistakes

- Only checking CLS on fast connections — throttled networks reveal more shifts
- Fixing individual shifts without addressing the cluster — CLS scores the worst cluster
- Adding `will-change` everywhere — only use on elements that actually animate
- Ignoring font-related shifts — font swap is a very common CLS source
