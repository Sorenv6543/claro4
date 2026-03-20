# Memory Leak Detection Snippets

## Baseline Memory Measurement

Use with `evaluate_script` to get current memory state:

```javascript
(() => {
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

## Detached DOM Node Detector

Checks for common leak patterns in Vue applications:

```javascript
(() => {
  const walker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT);
  let count = 0;
  while (walker.nextNode()) count++;

  return {
    attachedNodes: count,
    vueInstances: document.querySelectorAll('[data-v-]').length,
    canvasElements: document.querySelectorAll('canvas').length,
    iframeElements: document.querySelectorAll('iframe').length
  };
})()
```

## Event Listener Audit

Counts event listeners on key elements:

```javascript
(() => {
  const targets = [window, document, document.body];
  const results = [];

  // Note: getEventListeners() is Chrome DevTools console-only API
  // In evaluate_script, we check for known patterns instead

  const interactiveElements = document.querySelectorAll('button, a, input, [onclick], [data-action]');

  return {
    interactiveElements: interactiveElements.length,
    note: 'Use Chrome DevTools Console panel for getEventListeners() — not available in evaluate_script'
  };
})()
```

## Timer Leak Detector

Instrument setInterval/setTimeout to track active timers:

```javascript
(() => {
  if (window.__timerTracker) {
    return {
      activeIntervals: window.__timerTracker.intervals.size,
      activeTimeouts: window.__timerTracker.timeouts.size,
      intervals: [...window.__timerTracker.intervals.values()],
      timeouts: [...window.__timerTracker.timeouts.values()]
    };
  }

  // Install tracker
  window.__timerTracker = { intervals: new Map(), timeouts: new Map() };
  const origSetInterval = window.setInterval;
  const origClearInterval = window.clearInterval;
  const origSetTimeout = window.setTimeout;
  const origClearTimeout = window.clearTimeout;

  window.setInterval = function(fn, ms, ...args) {
    const id = origSetInterval.call(window, fn, ms, ...args);
    const stack = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
    window.__timerTracker.intervals.set(id, { ms, source: stack, created: Date.now() });
    return id;
  };
  window.clearInterval = function(id) {
    window.__timerTracker.intervals.delete(id);
    return origClearInterval.call(window, id);
  };
  window.setTimeout = function(fn, ms, ...args) {
    const id = origSetTimeout.call(window, fn, ms, ...args);
    const stack = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
    window.__timerTracker.timeouts.set(id, { ms, source: stack, created: Date.now() });
    const origFn = fn;
    // Auto-remove when timeout fires
    origClearTimeout.call(window, id);
    const newId = origSetTimeout.call(window, () => {
      window.__timerTracker.timeouts.delete(newId);
      if (typeof origFn === 'function') origFn();
    }, ms, ...args);
    window.__timerTracker.timeouts.set(newId, { ms, source: stack, created: Date.now() });
    window.__timerTracker.timeouts.delete(id);
    return newId;
  };
  window.clearTimeout = function(id) {
    window.__timerTracker.timeouts.delete(id);
    return origClearTimeout.call(window, id);
  };

  return 'Timer tracker installed. Navigate/interact, then re-run this snippet to see active timers.';
})()
```
