# SPA Route Performance Snippets

## Install Route Transition Timer

Instruments click → render timing for SPA navigations:

```javascript
(() => {
  window.__routePerf = { transitions: [], current: null };

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

  let renderTimer = null;
  const observer = new MutationObserver(() => {
    if (window.__routePerf.current) {
      clearTimeout(renderTimer);
      renderTimer = setTimeout(() => {
        const t = window.__routePerf.current;
        t.totalTime = performance.now() - t.clickTime;
        window.__routePerf.transitions.push(t);
        window.__routePerf.current = null;
      }, 150);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return 'Instrumentation installed. Navigate between routes, then collect results.';
})()
```

## Collect Transition Results

Retrieves all recorded route transition timings:

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
    summary: transitions.length > 0 ? {
      avgTime: (transitions.reduce((s, t) => s + (t.totalTime || 0), 0) / transitions.length).toFixed(0) + 'ms',
      maxTime: Math.max(...transitions.map(t => t.totalTime || 0)).toFixed(0) + 'ms',
      minTime: Math.min(...transitions.map(t => t.totalTime || 0)).toFixed(0) + 'ms',
      totalChunks: transitions.reduce((s, t) => s + (t.chunks?.length || 0), 0)
    } : null
  };
})()
```

## Audit Code Splitting

Shows all loaded scripts sorted by size:

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

  const totalSize = scripts.reduce((s, r) => s + parseFloat(r.size), 0);
  const cachedCount = scripts.filter(s => s.cached).length;

  return {
    totalScripts: scripts.length,
    totalSize: totalSize.toFixed(0) + ' kB',
    cachedScripts: cachedCount,
    uncachedSize: (totalSize - scripts.filter(s => s.cached).reduce((s, r) => s + parseFloat(r.size), 0)).toFixed(0) + ' kB',
    top10Largest: scripts.slice(0, 10)
  };
})()
```

## Vue Router Navigation Timing

Hooks into Vue Router for precise navigation lifecycle timing:

```javascript
(() => {
  // Requires access to the Vue Router instance
  const app = document.querySelector('[data-v-app]')?.__vue_app__;
  if (!app) return { error: 'Vue app not found' };

  const router = app.config.globalProperties.$router;
  if (!router) return { error: 'Router not found' };

  window.__routerTimings = [];

  router.beforeEach((to, from) => {
    window.__currentNav = {
      from: from.path,
      to: to.path,
      guardStart: performance.now()
    };
  });

  router.afterEach((to) => {
    if (window.__currentNav) {
      window.__currentNav.guardEnd = performance.now();
      window.__currentNav.guardTime = (window.__currentNav.guardEnd - window.__currentNav.guardStart).toFixed(0) + 'ms';

      // Wait for next tick to capture render time
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.__currentNav.renderEnd = performance.now();
          window.__currentNav.totalTime = (window.__currentNav.renderEnd - window.__currentNav.guardStart).toFixed(0) + 'ms';
          window.__routerTimings.push({ ...window.__currentNav });
          window.__currentNav = null;
        });
      });
    }
  });

  return 'Vue Router timing hooks installed. Navigate between routes, then run: window.__routerTimings';
})()
```
