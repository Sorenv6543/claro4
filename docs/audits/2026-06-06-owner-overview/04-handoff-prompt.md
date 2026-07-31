# Handoff Prompt (Phase 4)

Copy the block below and use it as the `/make-plan` input.

---

````
/make-plan Redesign the Owner Overview page. Current design failed audit at 13/30 with critical gaps in principles #3 (aesthetic, 1/3), #4 (understandable, 1/3), #6 (honest, 1/3), #8 (thorough, 0/3), and #9 (environmentally friendly, 1/3).

Verdict paragraph (from 03-verdict.md):
> The Owner Overview scored 13/30 — below the 20-point REFINE threshold — driven not by a flawed concept but by accumulated implementation failures across thoroughness (#8: 0), aesthetics (#3: 1), clarity (#4: 1), honesty (#6: 1), and environmental responsibility (#9: 1) that together indicate the design was shipped before its foundations were laid.

Why redesign and not refine: Total (13) is below the 20-point threshold; principle #8 (thorough) scored 0 — the primary interactive surface (booking detail drawer) is missing 4+ required states, and the interactive element count includes elements that are not keyboard-reachable.

Preserve from current design:
- Layout concept: welcome banner → property preview → day-stacking timeline → upcoming activity list → portfolio. This information architecture correctly models owner needs. File: src/components/smart/owner/OwnerOverview.vue:42–300.
- Booking detail drawer concept: slide-in panel with timebar visualization for turn bookings and spine view for standard bookings. File: src/components/smart/owner/OwnerOverview.vue:317–446.
- Design token system: src/styles/tokens.css (spacing, type, motion) and src/plugins/vuetify.ts (color hex values). These are the correct source of truth — the problem is that many components bypass them.
- Action model: three owner-appropriate booking actions (Reschedule, Cancel Booking, Contact Admin) — the framing is correct; execution of Contact Admin is incomplete.
- Brand tokens only for OwnerWelcomeBanner: primary color (#7367F0), font stack, and border radius.

Discard:
- All hardcoded hex colors in timeline chips (#28C76F, #FF9F43, #EA5455 — OwnerOverview.vue:1677–1679) and the hardcoded gradient in OwnerWelcomeBanner.vue:138. Caused failure on principle #3 and #9.
- Clickable `<div>` property preview cards (OwnerOverview.vue:91) — not keyboard-reachable. Caused failure on principle #8.
- "Contact Admin" as an enabled button pointing to a non-existent feature (OwnerOverview.vue:439). Caused failure on principle #6.
- Jargon strings: "cleaning window", "Turns YTD", "Occ." in templates. Caused failure on principle #4.
- Any spacing/type values not from the token scale (10px, 9px, 12px, 14px, rem-based values scattered across OwnerOverview.vue:1210–1938 and OwnerWelcomeBanner.vue:181–234). Caused failure on principle #3.

Top 5 moves from the audit (implement in this order):

1. Principle #8 — Thorough — Implement all missing states on the booking detail drawer (OwnerOverview.vue:321–446):
   (a) Loading skeleton: show while drawerItem resolves (currently instant because data is pre-fetched; add for future data-on-demand).
   (b) Error in-situ: when cancel or reschedule fails, display the error message inside the drawer panel — not just a toast.
   (c) Success in-situ: after cancel completes, show a brief confirmation inside the drawer before it closes.
   (d) Disabled during async: add `:disabled="isCancelling"` to Cancel Booking button and `:disabled="isRescheduling"` to Reschedule button. Track loading state with a ref per action.
   (e) Focus ring: ensure Vuetify focus-visible is not suppressed on drawer buttons (check for any `outline: none` without `focus-visible` alternative in bdr-* CSS block, OwnerOverview.vue:1815–1840).

2. Principle #3 / #9 — Aesthetic / Environmental — Replace hardcoded colors with CSS variable references:
   - OwnerOverview.vue:1677: `.tl-chip--checkin { background: rgb(var(--v-theme-success)); }`
   - OwnerOverview.vue:1678: `.tl-chip--turn { background: rgb(var(--v-theme-warning)); }`
   - OwnerOverview.vue:1679: `.tl-chip--urgent { background: rgb(var(--v-theme-error)); }`
   - OwnerWelcomeBanner.vue:138: Replace hardcoded gradient with `background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-primary-light)) 50%, rgb(var(--v-theme-primary-dark)) 100%);`
   - Align all spacing to 4/8/16/24/32/48px token scale; align all font-size to 11/13/15/16/18/22/26/32/40px token scale. Replace off-scale values (9px → 11px for labels, 12px → 11px or 13px, 14px → 13px or 15px, 20px → 16px or 24px, 10px → 8px or 16px) with nearest token step based on visual context.

3. Principle #6 — Honest — Fix the Contact Admin false affordance (OwnerOverview.vue:431–440):
   Option A (remove): Delete the button until direct messaging is implemented.
   Option B (honest placeholder): Replace `<v-btn>` with a non-interactive `<v-chip>` labelled "Messaging — coming soon" in muted color, clearly not clickable.
   Recommended: Option B, to preserve the reserved space and communicate roadmap without deception.

4. Principle #4 — Understandable — Replace jargon strings (template-only changes, no structural work):
   - "cleaning window" → "cleaning time" (OwnerOverview.vue:364; PropertyList.vue:249)
   - "Turns YTD" → "Turnovers this year" (PropertyList.vue:330)
   - "Occ." → "Occupancy" (OwnerWelcomeBanner.vue:51)
   - "turns" in banner subtitle → "same-day turnovers" (OwnerWelcomeBanner.vue:49)

5. Principle #8 — Thorough (accessibility) — Repair semantic HTML and tap targets:
   - Replace clickable `<div class="prop-preview-card">` (OwnerOverview.vue:90–111) with `<router-link>` wrapping the card content.
   - Increase `.tl-chip` minimum height to 44px via `min-height: 44px; padding: 10px 12px;` (OwnerOverview.vue:1660–1685).
   - Add `role="main"` or verify the layout wrapper includes `<main>` to establish page landmark.
   - Add `aria-label` to the range toggle group (RangeToggle.vue) and the timeline card heading.

Redesign principles in priority order:
1. Principle #8 (thorough) — Every interactive state must be handled; every action must be keyboard-reachable; every touch target must meet 44px minimum.
2. Principle #3 (aesthetic) — All colors, spacing, and type sizes must reference the token system; no orphan values; dark mode must not break.
3. Principle #6 (honest) — Every affordance must correspond to a real, present capability.
4. Principle #4 (understandable) — Every owner-facing string must use language a non-operator property owner understands.
5. Principle #9 (environmental) — All motion must be gated by prefers-reduced-motion; dark mode must be honored by all semantic color elements.

Deliverables for the plan:
- New/updated implementation for all 5 moves above — target files and exact changes specified per move
- States checklist per interactive surface: loading / error / success / disabled for drawer AND any other surface with async operations
- Token alignment table: old value → nearest token step → file:line for each replacement
- Contact Admin redesign: either remove or visual placeholder implementation
- Jargon replacement list: old string → new string → file:line for each
- Tap target audit results and remediation for each undersized element
- Regression checklist: verify principles #1 (innovative, 2/3) and #5 (unobtrusive, 2/3) are not degraded by the changes
- Dark mode smoke test: take screenshot at /owner/overview with Vuetify dark theme applied and confirm all semantic colors render correctly

Primary user: Property owners — non-operator clients who view their booking schedule ~weekly.
Primary task: Understand today's booking situation and take a booking action (reschedule, cancel, or contact).
Stack: Vue 3 + Vuetify 4, Pinia, Supabase. Design tokens in src/styles/tokens.css and src/plugins/vuetify.ts.

Anti-patterns to guard against (REDESIGN-specific):
- Porting old structure under new styling — the structural problems (clickable divs, missing states, hardcoded colors) must actually be fixed, not restyled
- Keeping "Contact Admin" as-is under a flag
- Redesigning to follow a different trend rather than fixing the principles above
- Treating the Preserve list as optional — layout concept and drawer concept must survive
````
