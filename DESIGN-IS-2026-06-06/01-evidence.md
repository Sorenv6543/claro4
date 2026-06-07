# Evidence (Phase 1 Consolidation)

Sources: four parallel subagent reports on structural, copy/honesty, weight/friction, and visual/accessibility evidence.
All findings below cite original file:line. Findings without citations are marked [INFERRED].

---

## Structural Evidence

**Interactive element count (desktop):** 31 total — 11 v-btn, 3 v-chip (decorative/display), 6 timeline chips (tl-chip, clickable), 3 range-toggle buttons, 3 property preview cards (clickable divs), 2 router-links, 2 list-expand buttons, 1 alert retry, 1 tip dismiss, 3 property list action buttons (conditional).

**Max nesting depth:** 7 levels via Teleport drawer chain (OwnerOverview → Teleport → Transition → .bdr-overlay → .bdr-panel → .bdr-wrap → drawer actions).

**Repeated patterns:** 3 action buttons (Reschedule / Cancel Booking / Contact Admin) appear identically in both the drawer (OwnerOverview.vue:411–440) and the Upcoming Activities inlay (OwnerBookingInlay.vue:81–113). This is two separate surfaces for the same affordance — intentional dual-surface, not a duplication bug, but still surface inflation.

**Unused declarations:** 34 computed properties in OwnerOverview.vue (lines 523–1143). Two confirmed dead: `drawerPriorityColor` (removed in this session), `daysDiff` (OwnerOverview.vue:587) — TS6133 unreferenced.

**Drawer state coverage:**
- Empty (no booking): handled via null check on drawerItem (line 876)
- Loading: **ABSENT** — no skeleton or spinner in drawer template
- Error (cancel/edit fail): **ABSENT** — error fires `uiStore.addNotification` (line 1043) but drawer shows no in-situ state
- Success after action: **PARTIAL** — notification fires (line 1040) but no drawer success indicator
- Cancelled status chip: **PRESENT** — drawerStatusColor maps 'cancelled' → 'error' chip (line 959)
- Focus rings (custom): **ABSENT** — Vuetify defaults only
- Disabled state on buttons during async: **ABSENT** — no :disabled binding on Reschedule / Cancel Booking

---

## Copy & Honesty Evidence

**Inflations:** None detected. All copy is factual and transactional.

**Dark pattern — false affordance:**
- Button label: "Contact Admin" (OwnerOverview.vue:439)
- Snackbar message: "Direct messaging with your cleaning team is coming soon." (OwnerOverview.vue:317)
- The button is enabled, styled as a real action, and emits a visible click response, but performs no action. Affordance implies messaging capability; behavior is a dismissible notification. One instance.

**Jargon remaining in owner-facing UI:**
| Term | Location | Issue |
|------|----------|-------|
| "cleaning window" | OwnerOverview.vue:364; PropertyList.vue:249 | Internal ops term; owners don't know what cleaning scheduling means |
| "Turns YTD" | PropertyList.vue:330 | "YTD" acronym + "Turns" industry jargon |
| "Occ." | OwnerWelcomeBanner.vue:51 | Truncated "Occupancy" — not immediately clear |
| "Turn today" / "Turn" | OwnerWelcomeBanner.vue:112; PropertyList.vue row data | Partially replaced but still in property stats and banner |

**Label→behavior mismatches:** 1 soft mismatch (Contact Admin, above). All other labels map correctly to their handlers.

---

## Weight & Friction Evidence

**Bundle size:** Build failed (OwnerNavigationDrawer.vue syntax error in separate component). Bundle size not measurable. [INFERRED based on stack: Vue 3 + Vuetify 4 + FullCalendar → likely 300–600KB total, owner-chunk estimated 80–120KB separate.]

**Complexity:** 34 computed properties, 11 refs, 0 watchers in OwnerOverview.vue (script lines 449–1199).

**Idle animations:** 5 CSS transitions active on idle page —
1. `.tl-chip` spring transition on hover (line 1673)
2. `.prop-preview-card.clickable` spring transition (line 1754)
3. `.bk-row-shell` filter/opacity transition (line 1377)
4. `<v-expand-transition>` on upcoming list (line 274)
5. `<Transition name="bdr-slide">` on drawer open (line 322)
`prefers-reduced-motion` not respected in any of these.

**Overlays triggered from page:** 3 — ConfirmationDialog (line 304), v-snackbar (line 315), Teleport drawer (line 321).

**Touch target violations:**
- `.tl-chip` (timeline event buttons): computed height ~22–24px — below 44px minimum (OwnerOverview.vue:1660–1685)
- Drawer close button: `size="small"` icon button ~32–36px (line 335)

---

## Visual & Accessibility Evidence

**Spacing scale (tokens.css):** 6 steps — 4 / 8 / 16 / 24 / 32 / 48px.
Hardcoded values outside scale in OwnerOverview.vue: 10px (×12 occurrences), 14px, 20px, 6px — all outside the defined scale (lines 1210–1938).

**Type scale (tokens.css):** 9 steps — 11 / 13 / 15 / 16 / 18 / 22 / 26 / 32 / 40px.
Hardcoded values outside scale: 9px (lines 1636, 1706, 1902), 12px (lines 1322, 1425, 1665), 14px (line 1783), 1.1rem / 1.25rem / 2.25rem / 1.5rem / 1rem in OwnerWelcomeBanner.vue (lines 181–234) — all outside the token system.

**Color token violations (hardcoded hex/rgba bypassing CSS variables):**
| Color | Location | Issue |
|-------|----------|-------|
| `#28C76F` | OwnerOverview.vue:1677 | `.tl-chip--checkin` background — hardcoded, no dark mode |
| `#FF9F43` | OwnerOverview.vue:1678 | `.tl-chip--turn` background — hardcoded, no dark mode |
| `#EA5455` | OwnerOverview.vue:1679 | `.tl-chip--urgent` background — hardcoded, no dark mode |
| `rgba(234,84,85,0.28)` | OwnerOverview.vue:1679 | Urgent chip shadow — hardcoded |
| `linear-gradient(135deg, #7367F0 0%, #9E95F5 50%, #5E52EE 100%)` | OwnerWelcomeBanner.vue:138 | Hero gradient — should use theme vars |
| `#fff` × 6 | OwnerOverview.vue:1644–1712 | Status pill and bubble text — fragile on dark bg |

**Drawer states checklist:**
- Empty: handled (null guard)
- Loading: **MISSING**
- Error: **MISSING** (in-situ; toast only)
- Success: **MISSING** (in-situ; toast only)
- Focus rings: **MISSING** (no custom focus styles on drawer buttons)
- Disabled during async: **MISSING**

**ARIA / semantic HTML:**
- No `role="main"`, `<nav>`, or `<header>` landmarks in OwnerOverview.vue
- Property preview cards are clickable divs (line 91), not `<button>` or `<a>` — not keyboard-reachable by default
- Timeline event chips are `<button>` elements ✓ (line 204)
- Only 3 `aria-label` attributes on the entire surface
- 1 `aria-expanded` attribute (line 254)

**Trend markers:**
- Glass morphism (`backdrop-filter: blur`, glass-card class) — 2021–2023 trend
- Bento grid (tl-card + ov-bento-grid) — 2023–2024 trend
- Aurora hero gradient (OwnerWelcomeBanner.vue:138) with noise texture — 2023–2024 trend

---

## Known Gaps
- Bundle size not measurable (build failure in unrelated component)
- Contrast ratios not calculated (no live browser measurement)
- Mobile surface (OwnerDayBar.vue) not fully audited
- Keyboard tab order not live-tested
- prefers-reduced-motion runtime behavior not verified
