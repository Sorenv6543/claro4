# B.1a-iv — Stacked Cover + Horizontal Rows

**Date:** 2026-05-03
**Scope:** New design variant for the Owner Property Overview mobile screen
**Output:** HTML prototype (throwaway), not production Vue code

---

## Context

`screens-property-overview-split-cover.html` renders `ScreenBv1a_ii` — a horizontal split cover (photo left 48%, events right 52%). The split felt cramped on 393px-wide devices and the event type hierarchy was unclear. This spec adds `ScreenBv1a_iv` as a new variant rather than overwriting the existing one.

---

## Design Decisions

| Axis | B.1a-ii (existing) | B.1a-iv (this spec) |
|---|---|---|
| Cover structure | Horizontal split (48/52) | Full-width photo top, events strip below |
| Events hierarchy | Time leads (large tabular) | Event type leads, time right-aligned secondary |
| Mini-card height | 80px | 88px |
| Mini-card hierarchy | Time leads | Event type leads |

---

## Files

### Modified
- `preview/screens-property-overview-b1a-variants.jsx` — add `ScreenBv1a_iv` function at the bottom; add it to the `Object.assign(window, {...})` export

### Created
- `preview/screens-property-overview-stacked-cover.html` — new HTML entry point; loads same JSX chain as `screens-property-overview-split-cover.html` but renders `<ScreenBv1a_iv />`

---

## Component: `ScreenBv1a_iv`

Reuses: `OV`, `PROPS`, `EVENTS`, `NOW_HOUR`, `NOW_MIN`, `NEEDSACTION`, `typeLabel`, `_enrich`, `PropPhoto` from the existing JSX files.

### Layout

```
[Status bar spacer — 54px]
[Masthead]
  date string (10px/700 uppercase fg3)
  "Today" (24px/800 INK_B1ED)       [amber action badge — right]
[Scrollable body]
  [Cover card — featured property]
    [PropPhoto — full width, 160px]
      overlay: gradient scrim bottom half
      top-left badge: "Action needed" (amber, only if hasUrgent)
      bottom-left: city (9px/700 uppercase, white 0.9 opacity)
                   street (16px/800, white, text-shadow)
    [Events strip — white bg, 12px 14px padding]
      "Today" label (10px/700 uppercase fg3, mb 8px)
      [per event]
        left: event type (14px/800 INK_B1ED)
              "No cleaner · {ev.guests}g" (9px/700 amber uppercase, mt 2px — only if !cleaner)
              cleaner name (9px/500 fg3, mt 2px — only if cleaner)
        right: time (13px/700 fg3 tabular-nums)
        [hairline divider between events]
      [if hasUrgent]
        "Resolve" button (full-width, amber fill, 10px/800 uppercase, 9px padding, 2px radius)
  [Section label — "The rest of today" 10px/800 uppercase fg3, pl 2px, mb 8px]
  [Mini-cards — one per remaining property]
    height: 88px
    PropPhoto: 96px wide, flex-shrink 0
    meta area padding: 11px 12px (4px more top than current)
    top: street (13px/700 INK_B1ED, truncate ellipsis)
         city (9px/600 uppercase fg3, mt 1px)
    bottom row:
      if event: type (11px/700 INK_B1ED) · time (11px/600 fg3 tabular-nums) · "No cleaner" (9px/800 amber uppercase, ml auto)
      if no event: "Quiet today" (10px italic fg3)
    border: amber 1.5px when hasUrgent, else #E8E8E8 1px
```

### Cover card border/shadow states

| State | Border | Shadow |
|---|---|---|
| `hasUrgent` | `1.5px solid #E8A33D` | `0 6px 20px rgba(232,163,61,0.2)` |
| Quiet/active | `1px solid #E8E8E8` | `0 2px 6px rgba(0,0,0,0.05)` |

### Colors (unchanged from B.1a-ii)

- `AMBER_B1ED = '#E8A33D'` — urgency accent
- `INK_B1ED = '#2E263D'` — primary text
- Background: `#FAFAFB`
- Surface: `#FFFFFF`
- Divider: `#E8E8E8`
- `fg3`: `rgba(46,38,61,0.42)`

---

## HTML Entry Point

`screens-property-overview-stacked-cover.html` mirrors `screens-property-overview-split-cover.html` exactly except:
- `<title>`: `Stacked Cover + Horizontal Rows · Mobile · Claro`
- `DesignCanvas` title/subtitle updated
- Renders `<ScreenBv1a_iv />` instead of `<ScreenBv1a_ii />`
- Thumbnail SVG: top 40% is a colored rect (photo band), bottom 60% has 3 stacked horizontal rects (mini-cards) — reuse `#7367F0` / `#FF9F43` opacity fills on dark `#1A1626` background, same as existing thumbnails

---

## Out of Scope

- No color system changes (amber stays as-is for this prototype)
- No production Vue component
- No changes to B.1a-i, B.1a-ii, B.1a-iii
