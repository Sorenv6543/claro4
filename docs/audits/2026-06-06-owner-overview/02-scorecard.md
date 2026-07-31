# Scorecard (Phase 2)

Scoring rules applied: tie-breaker = lower score; score worst instance not mean; 0–3 integer per principle.

---

1. **Good design is innovative — Score: 2/3**
   Evidence: Vertical day-stacking timeline with per-property swimlanes is a non-standard pattern not common in competitor rental-management tools; booking detail drawer with embedded timebar visualization (OUT / cleaning window / IN) is a distinctive affordance. Neither is trend-novel for its own sake — both serve the use case.
   Justification: Refreshes the schedule-dashboard pattern with two clear improvements, but stops short of a fully original interaction model.

2. **Good design makes a product useful — Score: 2/3**
   Evidence: Primary task (view today's status, take a booking action) completes in ≤3 steps from landing. However, "Contact Admin" (OwnerOverview.vue:439) is an enabled button that silently fails — it is a decoy action (snackbar: "coming soon", line 317). Timeline chips are 22–24px tall (01-evidence.md — touch target violations), degrading interaction accuracy on touch devices.
   Justification: Primary task completes, but the active decoy action and undersized touch targets add measurable friction.

3. **Good design is aesthetic — Score: 1/3**
   Evidence: 12+ hardcoded hex/rgba values bypass the token system (OwnerOverview.vue:1677–1712; OwnerWelcomeBanner.vue:138). Type sizes 9px, 12px, 14px, and rem-based values outside the 9-step token scale (lines 1636, 1322, 1783). Spacing values 10, 14, 20, 6px outside the 6-step scale (lines 1210–1938). In light mode the visuals look consistent; the token violations are invisible there. But dark mode reveals the breakage — timeline chips retain hardcoded green/orange/red in dark contexts.
   Justification: More than 2 inconsistencies across color, type, and spacing — at least 5 distinct orphan-value families. Score worst: hardcoded chip colors break the visual system under theme switch.

4. **Good design makes a product understandable — Score: 1/3**
   Evidence: Three jargon terms remain in owner-facing UI: "cleaning window" (OwnerOverview.vue:364 — internal ops term meaningless to an owner), "Turns YTD" (PropertyList.vue:330 — two layers of jargon), "Occ." (OwnerWelcomeBanner.vue:51 — unexplained abbreviation). Primary action labels (Reschedule, Cancel Booking) are clear. Timebar labels (OUT / IN / cleaning window) require prior knowledge of the cleaning workflow to interpret.
   Justification: Three controls/labels are unclear and jargon is present — scores 1 per anchor.

5. **Good design is unobtrusive — Score: 2/3**
   Evidence: Glass-card chrome is visually receding; property color dots are small and functional. Welcome banner gradient is the heaviest decorative element but anchors spatial hierarchy. No animation runs continuously on idle (transitions are hover/interaction-triggered only; OwnerDayBar NOW-line updates are mobile-only). Content (bookings, properties) is the visual figure.
   Justification: Chrome is visible but quiet; content leads. The aurora hero is the one element that slightly tips the balance but does not dominate.

6. **Good design is honest — Score: 1/3**
   Evidence: "Contact Admin" button (OwnerOverview.vue:439) is styled as a functional action (secondary text button, mdi-message-outline icon), but clicking it only shows a passive snackbar: "Direct messaging with your cleaning team is coming soon." (line 317). This is a false affordance — label promises a capability that does not exist. One instance.
   Justification: One dark pattern (false affordance) per anchor = score 1.

7. **Good design is long-lasting — Score: 1/3**
   Evidence: Three distinct 2022–2024 trend markers: glass morphism (`backdrop-filter: blur`, glass-card in every card), bento-grid layout (`ov-bento-grid`, tl-card), aurora gradient hero (`linear-gradient(135deg, #7367F0 0%, #9E95F5 50%, #5E52EE 100%)` with noise overlay — OwnerWelcomeBanner.vue:138). Each is individually defensible; together they signal a specific design era.
   Justification: 2–3 dated markers — scores 1 per anchor.

8. **Good design is thorough down to the last detail — Score: 0/3**
   Evidence: Booking detail drawer is missing 4+ states: loading (no skeleton/spinner on drawer open), error in-situ (OwnerOverview.vue:1043 fires toast only — no drawer error display), success in-situ (toast only, no drawer confirmation), disabled state on action buttons during async operations (no :disabled binding, lines 411–440). Additionally: property preview cards are clickable `<div>` elements (line 91) not keyboard-reachable; no ARIA landmarks on page; touch targets on timeline chips ~22–24px (lines 1660–1685) — well below 44px minimum.
   Justification: 4+ states missing in the primary interactive surface (drawer), plus semantic HTML and tap-target failures — scores 0 per anchor.

9. **Good design is environmentally friendly — Score: 1/3**
   Evidence: Bundle size not measurable (build failure in OwnerNavigationDrawer.vue); stack (Vue 3 + Vuetify 4 + FullCalendar) suggests initial bundle >100KB. Dark mode is not honored for timeline chip colors (#28C76F, #FF9F43, #EA5455 hardcoded — lines 1677–1679). `prefers-reduced-motion` not respected in any of the 5 idle-page transitions (01-evidence.md — animation count). No autoplay video or >2MB JS confirmed.
   Justification: Dark mode actively broken for key semantic elements; motion not gated — scores 1 per anchor (between 2 and 0; pick lower on tie).

10. **Good design is as little design as possible — Score: 2/3**
    Evidence: "Portfolio" section (OwnerOverview.vue:293–300) shows property list after a "Your properties" preview section already showed the same properties — two property-listing surfaces within one scroll. "Upcoming Activities" list partially duplicates the timeline content but provides the expand-to-act affordance the timeline lacks, so it earns its place. Tip card (line 59–70) is low-information and removable after first visit (though it is dismissible).
    Justification: Approximately 2 removable elements (Portfolio duplication, persistent tip card) — scores 2 per anchor.

---

## Total: 13/30

| # | Principle | Score |
|---|-----------|-------|
| 1 | Innovative | 2 |
| 2 | Useful | 2 |
| 3 | Aesthetic | 1 |
| 4 | Understandable | 1 |
| 5 | Unobtrusive | 2 |
| 6 | Honest | 1 |
| 7 | Long-lasting | 1 |
| 8 | Thorough | 0 |
| 9 | Environmentally friendly | 1 |
| 10 | As little design as possible | 2 |
| **Total** | | **13 / 30** |
