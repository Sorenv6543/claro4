# B.1a-iv Stacked Cover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `ScreenBv1a_iv` — a stacked-cover property overview variant (full-width photo on top, event-type-first events strip below, taller mini-cards) — as a new HTML prototype alongside the existing split-cover variants.

**Architecture:** One new JSX function added to the existing variants file, exported via the `Object.assign(window,{...})` pattern the file already uses. One new HTML entry point that mirrors `screens-property-overview-split-cover.html` but mounts the new component. No changes to any existing variant.

**Tech Stack:** React 18 (CDN UMD), Babel standalone (JSX transform), plain HTML/CSS. No build step — open the HTML file directly in a browser.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `preview/screens-property-overview-b1a-variants.jsx` | **Modify** | Add `ScreenBv1a_iv` function + export it |
| `preview/screens-property-overview-stacked-cover.html` | **Create** | HTML entry point that renders `ScreenBv1a_iv` |

---

## Task 1: Add `ScreenBv1a_iv` to the variants file

**Files:**
- Modify: `preview/screens-property-overview-b1a-variants.jsx`

- [ ] **Step 1.1 — Open the file and locate the export line**

The last line of `preview/screens-property-overview-b1a-variants.jsx` currently reads:

```js
Object.assign(window, { ScreenBv1a_i, ScreenBv1a_ii, ScreenBv1a_iii });
```

- [ ] **Step 1.2 — Add `ScreenBv1a_iv` function before that export line**

Insert the following function immediately before the `Object.assign` call:

```jsx
// ════════════════════════════════════════════════════════════════════════
// B.1a-iv — STACKED COVER + HORIZONTAL ROWS (REVISED)
// Full-width photo on top (160px). Events strip below: event type leads
// left, time right-aligned secondary. Mini-cards 88px, type-first.
// ════════════════════════════════════════════════════════════════════════
function ScreenBv1a_iv() {
  const enriched = _enrich();
  const featured = enriched[0];
  const rest = enriched.slice(1);

  return (
    <div style={{
      height:'100%', width:'100%', display:'flex', flexDirection:'column',
      background:'#FAFAFB', fontFamily:"'Inter',system-ui,sans-serif",
    }}>
      <div style={{ height:54, flexShrink:0 }} />

      {/* Masthead */}
      <div style={{ padding:'12px 18px 12px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:OV.fg3, letterSpacing:'0.16em', textTransform:'uppercase' }}>
              Sat · Apr 26 · 9:47
            </div>
            <div style={{ fontSize:24, fontWeight:800, color:INK_B1ED, letterSpacing:'-0.025em', marginTop:2 }}>
              Today
            </div>
          </div>
          {NEEDSACTION.length > 0 && (
            <div style={{ display:'flex', gap:6, alignItems:'center', padding:'5px 9px',
                          background:`${AMBER_B1ED}1a`, border:`1px solid ${AMBER_B1ED}66` }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:AMBER_B1ED }}/>
              <span style={{ fontSize:10, fontWeight:700, color:AMBER_B1ED, letterSpacing:'0.1em', textTransform:'uppercase' }}>
                {NEEDSACTION.length} action
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'0 14px 36px' }}>

        {/* ── Cover card ── */}
        {featured && (
          <div style={{
            background:'#fff',
            border: featured.hasUrgent ? `1.5px solid ${AMBER_B1ED}` : `1px solid ${OV.divider}`,
            boxShadow: featured.hasUrgent ? `0 6px 20px rgba(232,163,61,0.2)` : '0 2px 6px rgba(0,0,0,0.05)',
            marginBottom:16,
            overflow:'hidden',
          }}>
            {/* Full-width photo */}
            <PropPhoto p={featured} style={{ height:160, width:'100%' }}>
              <div style={{ position:'absolute', inset:0,
                            background:'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.42) 100%)' }}/>
              {featured.hasUrgent && (
                <div style={{
                  position:'absolute', top:10, left:10,
                  padding:'3px 9px', background:AMBER_B1ED, color:'#fff',
                  fontSize:9, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase',
                }}>
                  Action needed
                </div>
              )}
              <div style={{ position:'absolute', left:12, bottom:10, right:12, color:'#fff' }}>
                <div style={{ fontSize:9, fontWeight:700, opacity:0.9, letterSpacing:'0.12em', textTransform:'uppercase' }}>
                  {featured.city}
                </div>
                <div style={{ fontSize:16, fontWeight:800, letterSpacing:'-0.01em', marginTop:1, lineHeight:1.1,
                              textShadow:'0 1px 4px rgba(0,0,0,0.4)' }}>
                  {featured.street}
                </div>
              </div>
            </PropPhoto>

            {/* Events strip */}
            <div style={{ padding:'12px 14px 12px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:OV.fg3, letterSpacing:'0.12em',
                            textTransform:'uppercase', marginBottom:8 }}>Today</div>
              <div style={{ display:'flex', flexDirection:'column' }}>
                {featured.today.map((ev, i) => (
                  <React.Fragment key={ev.id}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'6px 0' }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:800, color:INK_B1ED, letterSpacing:'-0.01em' }}>
                          {typeLabel(ev.type)}
                        </div>
                        {!ev.cleaner ? (
                          <div style={{ fontSize:9, fontWeight:700, color:AMBER_B1ED,
                                        letterSpacing:'0.07em', textTransform:'uppercase', marginTop:2 }}>
                            No cleaner · {ev.guests}g
                          </div>
                        ) : (
                          <div style={{ fontSize:9, fontWeight:500, color:OV.fg3, marginTop:2 }}>
                            {ev.cleaner}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, color:OV.fg3, fontVariantNumeric:'tabular-nums' }}>
                        {ev.time}
                      </span>
                    </div>
                    {i < featured.today.length - 1 && (
                      <div style={{ height:1, background:OV.divider }} />
                    )}
                  </React.Fragment>
                ))}
                {featured.today.length === 0 && (
                  <div style={{ fontSize:12, color:OV.fg3, fontStyle:'italic', padding:'4px 0' }}>
                    Nothing scheduled today
                  </div>
                )}
              </div>
              {featured.hasUrgent && (
                <button style={{
                  width:'100%', marginTop:10, padding:'9px',
                  background:AMBER_B1ED, color:'#fff',
                  border:'none', borderRadius:2,
                  fontSize:10, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase',
                  cursor:'pointer',
                }}>Resolve</button>
              )}
            </div>
          </div>
        )}

        {/* ── Section label ── */}
        <div style={{ fontSize:10, fontWeight:800, color:OV.fg3, letterSpacing:'0.18em',
                      textTransform:'uppercase', marginBottom:8, paddingLeft:2 }}>
          The rest of today
        </div>

        {/* ── Mini-cards ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {rest.map(p => {
            const ev = p.today[0];
            return (
              <div key={p.id} style={{
                display:'flex', background:'#fff', height:88,
                border: p.hasUrgent ? `1.5px solid ${AMBER_B1ED}` : `1px solid ${OV.divider}`,
                overflow:'hidden',
              }}>
                <PropPhoto p={p} style={{ width:96, flexShrink:0 }}/>
                <div style={{ flex:1, padding:'11px 12px', display:'flex', flexDirection:'column',
                              justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:INK_B1ED, letterSpacing:'-0.01em',
                                  overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                      {p.street}
                    </div>
                    <div style={{ fontSize:9, fontWeight:600, color:OV.fg3, letterSpacing:'0.1em',
                                  textTransform:'uppercase', marginTop:1 }}>
                      {p.city}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {ev ? (
                      <>
                        <span style={{ fontSize:11, fontWeight:700, color:INK_B1ED, letterSpacing:'-0.01em' }}>
                          {typeLabel(ev.type)}
                        </span>
                        <span style={{ fontSize:11, fontWeight:600, color:OV.fg3, fontVariantNumeric:'tabular-nums' }}>
                          {ev.time}
                        </span>
                        {!ev.cleaner && (
                          <span style={{ marginLeft:'auto', fontSize:9, fontWeight:800, color:AMBER_B1ED,
                                         letterSpacing:'0.1em', textTransform:'uppercase' }}>
                            No cleaner
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize:10, color:OV.fg3, fontStyle:'italic' }}>Quiet today</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
```

- [ ] **Step 1.3 — Update the export line**

Change the last line of the file from:

```js
Object.assign(window, { ScreenBv1a_i, ScreenBv1a_ii, ScreenBv1a_iii });
```

to:

```js
Object.assign(window, { ScreenBv1a_i, ScreenBv1a_ii, ScreenBv1a_iii, ScreenBv1a_iv });
```

- [ ] **Step 1.4 — Verify the existing split-cover file still loads**

Open `preview/screens-property-overview-split-cover.html` in a browser (double-click or `open`).
Expected: The B.1a-ii split-cover screen renders without errors. Check the browser console — it should be clean (no `ScreenBv1a_ii is not defined` or similar).

---

## Task 2: Create the HTML entry point

**Files:**
- Create: `preview/screens-property-overview-stacked-cover.html`

- [ ] **Step 2.1 — Create the file**

Write the following to `preview/screens-property-overview-stacked-cover.html`:

```html
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Stacked Cover + Horizontal Rows · Mobile · Claro</title>
<link rel="stylesheet" href="../colors_and_type.css">
<style>
  html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
  body { font-family: var(--claro-font-family); }
  #root { width: 100vw; height: 100vh; }
  button { font-family: inherit; }
</style>
</head>
<body>
<div id="root"></div>

<template id="__bundler_thumbnail" data-bg-color="#1A1626">
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#1A1626"/>
    <rect x="28" y="8" width="44" height="84" rx="5" fill="none" stroke="#7367F0" stroke-width="2"/>
    <!-- Photo band — top 40% of phone interior -->
    <rect x="30" y="10" width="40" height="32" fill="#7367F0" opacity="0.5"/>
    <!-- Address text lines overlay -->
    <rect x="33" y="29" width="12" height="2" fill="#fff" opacity="0.5"/>
    <rect x="33" y="33" width="20" height="3" fill="#fff" opacity="0.7"/>
    <!-- Events strip -->
    <rect x="30" y="44" width="40" height="14" fill="#fff" opacity="0.1"/>
    <rect x="33" y="47" width="18" height="3" fill="#7367F0" opacity="0.6"/>
    <rect x="33" y="52" width="14" height="2" fill="#7367F0" opacity="0.4"/>
    <!-- Mini-cards -->
    <rect x="30" y="60" width="40" height="9" fill="#7367F0" opacity="0.2"/>
    <rect x="30" y="71" width="40" height="9" fill="#FF9F43" opacity="0.2"/>
    <rect x="30" y="82" width="40" height="9" fill="#7367F0" opacity="0.15"/>
  </svg>
</template>

<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>

<script type="text/babel" src="design-canvas.jsx"></script>
<script type="text/babel" src="ios-frame.jsx"></script>
<script type="text/babel" src="screens-property-overview.jsx"></script>
<script type="text/babel" src="screens-property-overview-b1variants.jsx"></script>
<script type="text/babel" src="screens-property-overview-b1a-variants.jsx"></script>

<script type="text/babel">
function App() {
  return (
    <DesignCanvas
      title="Stacked Cover + Horizontal Rows"
      subtitle="B.1a-iv — Full-width photo top, event-type-first events strip below, 88px mini-cards.">

      <DCSection
        title="Stacked Cover + Horizontal Rows"
        subtitle="Cover photo runs full width (160px). Events strip below leads with event type, time right-aligned. Mini-cards 88px with type-first bottom row.">
        <DCArtboard label="Stacked cover + horizontal rows" width={393} height={852}>
          <IOSDevice width={393} height={852} statusBarStyle="dark">
            <ScreenBv1a_iv />
          </IOSDevice>
        </DCArtboard>
      </DCSection>

    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
</script>
</body>
</html>
```

- [ ] **Step 2.2 — Open the file in a browser and verify**

Open `preview/screens-property-overview-stacked-cover.html` in a browser.

Check each of the following — all must pass before committing:

| Check | Expected |
|---|---|
| No console errors | Browser devtools console is clean |
| Cover photo | `PropPhoto` fills full width at ~160px tall |
| "Action needed" badge | Amber badge visible top-left on cover photo (p1 = 412 Ocean Blvd has `cleaner:null`) |
| Address overlay | City + street name in white at bottom-left of photo |
| Events strip | "Today" label, then "Check-out" 14px bold on left, "10:00" on right |
| No cleaner line | "No cleaner · 4g" in amber under "Check-out" |
| Resolve button | Full-width amber button below events |
| Section label | "The rest of today" in small uppercase |
| Mini-cards | 4 cards below, each 88px, event type leads bottom-left, time secondary |
| Quiet card | Property with no events shows "Quiet today" in italic |

---

## Task 3: Commit

- [ ] **Step 3.1 — Stage and commit both files**

```bash
git add preview/screens-property-overview-b1a-variants.jsx
git add preview/screens-property-overview-stacked-cover.html
git commit -m "feat: add B.1a-iv stacked cover property overview variant

Full-width photo top, event-type-first events strip, 88px mini-cards.
Preserves existing B.1a-ii split-cover variant unchanged."
```

Expected output: commit hash printed, 2 files changed.
