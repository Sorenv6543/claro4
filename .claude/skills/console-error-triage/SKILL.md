---
name: console-error-triage
description: Use when scanning a page for console errors, debugging runtime exceptions, triaging JavaScript warnings, investigating failed network requests, or when a page misbehaves without visible symptoms. Also use when checking application health or doing a pre-release error audit.
---

# Console Error Triage

## Overview

Systematic scan of browser console messages and failed network requests to identify, categorize, and prioritize runtime issues. Catches errors that don't surface visually but affect stability, security, or user experience.

## When to Use

- Page loads but something "feels wrong"
- Pre-release quality check
- After deploying changes to verify no new errors
- Investigating intermittent bugs
- User reports something broken but no obvious visual issue
- Checking third-party integration health

## Error Severity Classification

| Severity | Category | Examples |
|----------|----------|---------|
| **Critical** | Runtime exceptions | Uncaught TypeError, unhandled promise rejection, CORS failure blocking core functionality |
| **High** | Functional errors | Failed API calls (4xx/5xx), auth errors, missing required data |
| **Medium** | Warnings | Deprecation warnings, Vue warnings, missing optional resources |
| **Low** | Informational | Console.log noise, development-only messages, third-party analytics |

## Triage Workflow

### Step 1: Navigate and Wait for Stability

1. `navigate_page` to the target URL.
2. `wait_for` with expected text that indicates the page has loaded (e.g., a heading or button label).
3. Wait 2-3 seconds for async operations to complete.

### Step 2: Collect Console Messages

Use `list_console_messages` to get all messages since navigation.

Categorize by type:
- **error** — Runtime exceptions, failed assertions
- **warning** — Deprecations, potential issues
- **log/info/debug** — Application logging

For each error/warning, use `get_console_message` with the message ID to get full stack traces and details.

### Step 3: Collect Failed Network Requests

Use `list_network_requests` to get all requests, then filter for failures:

1. Filter by status codes: Look for 4xx and 5xx responses
2. Check for CORS errors (status 0 with error)
3. Check for timeouts (very long duration with no response)

Use `get_network_request` on failed requests for full headers, response body, and timing.

### Step 4: Perform User Actions

Many errors only appear during interaction. Automate common flows:

```javascript
// Example: trigger form validation, navigation, data loading
// Adapt to your specific app's interactions
```

Use `click`, `fill`, and `press_key` to simulate user actions, then re-check console messages.

### Step 5: Categorize and Deduplicate

Use `evaluate_script` to aggregate errors programmatically:

```javascript
(() => {
  const errors = [];
  const originalError = console.error;
  const originalWarn = console.warn;
  const seen = new Map();

  // Collect unhandled errors
  const unhandled = [];
  window.addEventListener('error', e => {
    const key = e.message + e.filename;
    if (!seen.has(key)) {
      seen.set(key, 1);
      unhandled.push({
        message: e.message,
        source: e.filename?.split('/').pop(),
        line: e.lineno,
        col: e.colno
      });
    } else {
      seen.set(key, seen.get(key) + 1);
    }
  });

  window.addEventListener('unhandledrejection', e => {
    unhandled.push({
      type: 'unhandled-promise',
      reason: String(e.reason).substring(0, 200)
    });
  });

  return {
    note: 'Listeners installed. Interact with the page, then run the collection snippet.',
    collectCommand: 'window.__getUnhandledErrors()'
  };
})()
```

### Step 6: Check Vue-Specific Warnings

For Vue applications, check for framework-specific issues:

```javascript
(() => {
  const issues = [];

  // Check for Vue warning patterns in console
  // Vue 3 logs warnings via console.warn with [Vue warn] prefix

  // Check for missing components
  const unknownElements = document.querySelectorAll('[data-v-app] *');
  const customElements = new Set();
  unknownElements.forEach(el => {
    if (el.tagName.includes('-') && !customElements.has(el.tagName)) {
      customElements.add(el.tagName);
    }
  });

  // Check for hydration mismatches (SSR)
  const hydrationErrors = performance.getEntriesByType('measure')
    .filter(e => e.name.includes('hydrat'));

  return {
    customElements: [...customElements],
    hydrationMeasures: hydrationErrors.length,
    note: 'Check list_console_messages for [Vue warn] entries'
  };
})()
```

## Report Structure

Present findings grouped by severity:

### Critical (fix immediately)
- Runtime exceptions that break functionality
- CORS failures blocking API calls
- Auth errors preventing access

### High (fix before release)
- Failed API calls returning 4xx/5xx
- Missing required resources (404)
- Unhandled promise rejections

### Medium (fix soon)
- Deprecation warnings (will break in future)
- Vue component warnings
- Non-critical resource failures

### Low (monitor)
- Third-party script errors (not your code)
- Development-only console logs
- Analytics/tracking failures

For each issue, provide:
- **Error message** (exact text)
- **Source** (file and line if available)
- **Frequency** (one-time vs recurring)
- **Impact** (what breaks or degrades)
- **Suggested fix** (if determinable from the error)

## Network Error Patterns

| Status | Meaning | Typical Fix |
|--------|---------|------------|
| **0** | CORS or network failure | Check CORS headers, proxy config |
| **401** | Unauthorized | Token expired, auth flow broken |
| **403** | Forbidden | RLS policy, permissions issue |
| **404** | Not found | Wrong URL, missing resource, deleted endpoint |
| **422** | Validation error | Request body doesn't match schema |
| **429** | Rate limited | Add backoff, reduce request frequency |
| **500** | Server error | Check server logs, Supabase edge function logs |
| **502/503** | Gateway/service down | Upstream service issue |

## Common Mistakes

- Only checking errors on page load — interact with the page to surface action-triggered errors
- Ignoring warnings — deprecation warnings become errors in next version
- Not deduplicating — same error firing 100 times is 1 issue, not 100
- Treating third-party errors as your problem — categorize but don't prioritize external script errors
- Not checking network tab — many "broken" features are actually failed API calls with no console error
