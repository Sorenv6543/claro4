---
name: performance-audit
description: Use when auditing overall page performance, checking Core Web Vitals, analyzing network waterfalls, render-blocking resources, third-party impact, or running a comprehensive performance review of a web page.
---

# Performance Audit

## Overview

Full-spectrum performance audit combining Lighthouse scores, performance traces, network analysis, and Core Web Vitals breakdown. Goes beyond LCP to cover all dimensions of page performance.

## When to Use

- User asks to "check performance" or "audit" a page
- Investigating slow page loads without a specific metric in mind
- Pre-launch performance review
- Comparing performance before/after changes

## Audit Workflow

### Step 1: Navigate and Trace

Navigate to the target URL, then record a performance trace with reload:

1. `navigate_page` to the target URL.
2. `performance_start_trace` with `reload: true` and `autoStop: true`.

The trace returns lab metrics (LCP, INP, CLS), field data (CrUX if available), and a list of available insight sets.

### Step 2: Run Lighthouse Audit

Run `lighthouse_audit` with categories relevant to the investigation:

- `categories: ["accessibility", "seo", "best-practices"]`

Note: Lighthouse via MCP covers accessibility, SEO, and best practices. The performance trace from Step 1 provides the performance data.

### Step 3: Analyze All Available Insights

From the trace results, call `performance_analyze_insight` for EVERY available insight. Common insights include:

| Insight | What it reveals |
|---------|----------------|
| **LCPBreakdown** | LCP subpart timings (TTFB, load delay, load duration, render delay) |
| **LCPDiscovery** | Whether LCP resource is discoverable early, fetchpriority, lazy-load checks |
| **INPBreakdown** | Longest interaction breakdown |
| **CLSCulprits** | Layout shift sources and timing |
| **RenderBlocking** | Requests blocking initial render |
| **DocumentLatency** | Server response time issues |
| **NetworkDependencyTree** | Critical path chain length and latency |
| **ThirdParties** | Third-party transfer sizes and main thread time |
| **FontDisplay** | Font loading strategy issues |
| **DOMSize** | DOM complexity impact |
| **ForcedReflow** | JavaScript-triggered layout thrashing |

Analyze all insights in parallel for efficiency.

### Step 4: Network Waterfall Analysis

Use `list_network_requests` to examine the full request waterfall:

1. Check total number of requests and transfer size
2. Filter by `resourceTypes: ["Document", "Script", "Stylesheet"]` for critical resources
3. Look for:
   - Long chains of sequential requests
   - Large resources that could be compressed
   - Requests with high latency
   - Resources served without caching headers

Use `get_network_request` for detailed headers on suspicious requests.

### Step 5: Identify LCP Element

Use `evaluate_script` with this snippet to identify the LCP element:

```javascript
new Promise(resolve => {
  new PerformanceObserver(list => {
    const entries = list.getEntries();
    const last = entries[entries.length - 1];
    resolve({
      element: last.element?.tagName,
      url: last.url || '(text element)',
      startTime: last.startTime,
      renderTime: last.renderTime,
      loadTime: last.loadTime,
      size: last.size
    });
  }).observe({ type: 'largest-contentful-paint', buffered: true });
});
```

### Step 6: Emulated Testing (Optional)

For real-world simulation, re-run the trace under throttled conditions:

1. `emulate` with `networkConditions: "Fast 3G"` and `cpuThrottlingRate: 4`
2. `performance_start_trace` with `reload: true` and `autoStop: true`

Compare throttled vs unthrottled results to identify issues only visible on slower connections.

## Report Structure

Present findings as:

1. **Core Web Vitals Summary** — Table with lab values, field values (if available), and ratings
2. **LCP Breakdown** — Subpart analysis with targets
3. **CLS Analysis** — Shift sources and causes
4. **INP Analysis** — Interaction breakdown (if measured)
5. **Network Analysis** — Request count, transfer size, critical path depth, render-blocking resources
6. **Third-Party Impact** — Transfer sizes and main thread time by provider
7. **Lighthouse Scores** — Accessibility, SEO, best practices scores
8. **Prioritized Recommendations** — Ordered by impact, with severity and actionability

## Common Mistakes

- Running only Lighthouse OR only a trace — use both for complete picture
- Not checking field data (CrUX) — lab and field can differ dramatically
- Ignoring third-party impact — often the largest performance drag
- Not testing under throttled conditions — fast dev machines mask real-world issues
