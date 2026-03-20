# CLS Debugging Snippets

## Capture Layout Shifts with Element Details

Use with `evaluate_script`. Observes layout shifts for 5 seconds and reports which elements shifted:

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

## Audit Common CLS Causes

Checks for images without dimensions, iframes without dimensions, dynamic positioned elements, and font-display issues:

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

  // Web fonts that may cause FOUT/FOIT
  const fontFaces = [...document.fonts].map(f => ({
    family: f.family,
    status: f.status,
    display: f.display
  }));
  const nonSwapFonts = fontFaces.filter(f => f.display !== 'swap' && f.display !== 'optional');
  if (nonSwapFonts.length) {
    issues.push({ type: 'font-display-issue', fonts: nonSwapFonts });
  }

  // Elements with no explicit height that contain async content
  document.querySelectorAll('[v-if], [v-show], .v-skeleton-loader').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.height === 0 && !el.style.minHeight) {
      issues.push({ type: 'zero-height-conditional', tag: el.tagName, class: el.className?.substring(0, 40) });
    }
  });

  return { issueCount: issues.length, issues };
})()
```

## Highlight Shifting Elements Visually

Adds a red outline to elements that cause layout shifts (useful with `take_screenshot`):

```javascript
new Promise(resolve => {
  const highlighted = [];
  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        for (const source of entry.sources || []) {
          if (source.node && source.node.style) {
            source.node.style.outline = '3px solid red';
            source.node.style.outlineOffset = '-3px';
            highlighted.push(source.node.tagName + '.' + (source.node.className?.split(' ')[0] || ''));
          }
        }
      }
    }
  });
  observer.observe({ type: 'layout-shift', buffered: true });
  setTimeout(() => {
    observer.disconnect();
    resolve({ highlightedElements: highlighted, note: 'Red-outlined elements caused layout shifts. Take a screenshot to see them.' });
  }, 5000);
});
```
