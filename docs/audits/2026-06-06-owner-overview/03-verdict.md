# Verdict (Phase 3)

## REDESIGN

The Owner Overview scored 13/30 — below the 20-point REFINE threshold — driven not by a flawed concept but by accumulated implementation failures across thoroughness (#8: 0), aesthetics (#3: 1), clarity (#4: 1), honesty (#6: 1), and environmental responsibility (#9: 1) that together indicate the design was shipped before its foundations were laid.

**Important framing:** This REDESIGN verdict does not mean the information architecture is wrong. The primary layout concept — welcome banner, property preview, day-stacking timeline, upcoming-activity list, portfolio — correctly models what an owner needs. The redesign target is: fix what's broken systematically (missing states, broken dark mode, jargon, false affordance, tap targets, semantic HTML) while preserving the layout concept.

---

## Top 5 Highest-Leverage Moves

1. **#8 Thorough — Audit and implement all missing interactive states on the booking detail drawer.**
   The drawer (OwnerOverview.vue:321–446) is missing loading skeleton, in-situ error, in-situ success, and disabled-during-async states. Buttons (Reschedule, Cancel Booking) must be `:disabled` while their async operations run. A failed cancel should show an error message inside the drawer, not just a toast that the user may miss.

2. **#3 Aesthetic / #9 Environmental — Replace all hardcoded hex colors with CSS variable references.**
   Timeline chip colors `#28C76F`, `#FF9F43`, `#EA5455` (OwnerOverview.vue:1677–1679) and the welcome banner gradient `linear-gradient(135deg, #7367F0 ...)` (OwnerWelcomeBanner.vue:138) bypass the Vuetify theme system and break dark mode. Each must reference `rgb(var(--v-theme-success))`, `rgb(var(--v-theme-warning))`, `rgb(var(--v-theme-error))`, and `rgb(var(--v-theme-primary))` respectively. Spacing and type sizes outside the token scale (9px, 10px, 12px, 14px, 20px, rem values) should be aligned to the nearest token step.

3. **#6 Honest — Remove or replace the "Contact Admin" false affordance.**
   The button (OwnerOverview.vue:439) must either: (a) be removed until the feature exists, (b) be replaced with a visually distinct "coming soon" label-chip (not a button), or (c) open a real communication surface. An enabled button that does nothing violates the honest principle and erodes trust in other buttons.

4. **#4 Understandable — Replace three owner-facing jargon terms.**
   "cleaning window" (OwnerOverview.vue:364; PropertyList.vue:249) → "cleaning time"; "Turns YTD" (PropertyList.vue:330) → "Turnovers this year"; "Occ." (OwnerWelcomeBanner.vue:51) → "Occupancy". These changes require no structural work — only string replacements in templates.

5. **#8 Thorough (accessibility) — Repair semantic HTML and tap targets.**
   Property preview cards are clickable `<div>` elements (OwnerOverview.vue:91) — replace with `<button>` or `<router-link>` for keyboard reachability. Timeline chip height is ~22–24px (OwnerOverview.vue:1660–1685) — increase padding to reach 44px minimum. Add `role="main"` to the page container or rely on `<main>` in the layout wrapper.
