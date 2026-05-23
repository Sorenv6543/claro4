---
name: Claro
description: Multi-tenant property cleaning scheduler for short-term rental owners and admins
colors:
  studio-violet: "#7367F0"
  studio-violet-light: "#9E95F5"
  studio-violet-deep: "#5E52EE"
  studio-violet-whisper: "#F0EEFF"
  warm-concrete: "#A8AAAE"
  clearing-green: "#28C76F"
  warm-amber: "#FF9F43"
  alert-coral: "#EA5455"
  clear-sky: "#00CFE8"
  cool-linen: "#F5F5F9"
  white-surface: "#FFFFFF"
  deep-ink: "#2E263D"
  hairline: "#E8E8E8"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.2
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
rounded:
  sharp: "2px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.studio-violet}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "8px 24px"
  button-primary-hover:
    backgroundColor: "{colors.studio-violet-deep}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "8px 24px"
  button-tonal:
    backgroundColor: "rgba(115, 103, 240, 0.16)"
    textColor: "{colors.studio-violet}"
    rounded: "{rounded.pill}"
    padding: "8px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.studio-violet}"
    rounded: "{rounded.pill}"
    padding: "8px 24px"
  chip-flat:
    backgroundColor: "{colors.studio-violet}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "28px"
  chip-tonal:
    backgroundColor: "rgba(115, 103, 240, 0.16)"
    textColor: "{colors.studio-violet}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "28px"
  card:
    backgroundColor: "{colors.white-surface}"
    rounded: "{rounded.sharp}"
    padding: "24px"
  input:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.sharp}"
    padding: "8px 16px"
---

# Design System: Claro

## 1. Overview

**Creative North Star: "The Control Room"**

Claro gives property owners and operations admins complete situational awareness without demanding their full attention. An owner checking in at 9am should know within seconds: what properties have guests checking out, which cleanings are scheduled, what needs attention right now. An admin dispatching the day should see the whole board, not hunt through tabs to assemble the picture.

That goal drives every structural choice. The interface is dense enough to hold the full operational picture, disciplined enough that nothing competes with operational signal. The reference feel is Stripe Dashboard translated to property operations: typographic hierarchy does the heavy lifting, color signals status rather than personality, and whitespace is earned by separating meaningful groups, not applied uniformly for aesthetic padding.

The palette practices restraint. Studio Violet (#7367F0) is the one voice in the system. It marks actions, selections, and the primary accent dimension. Everything else serves a function: four semantic colors for operational status, two neutral surface values, one text color at four opacity steps. This discipline means that when the violet appears, it is unambiguous — it says *this is what acts, this is what's selected, this is what matters.*

This system explicitly rejects: generic SaaS cream aesthetics (cream backgrounds, Geist/Satoshi font, border-only cards — the default AI startup look); cluttered admin panel density (Bootstrap-era grids with no breathing room); and over-animated dashboards (pulsing gradients, animated counters — enterprise excess that performs excitement instead of delivering clarity).

**Key Characteristics:**
- Single-accent color discipline: Studio Violet on no more than 15% of any given screen
- Near-zero border radius (2px) on all containers; pill shape reserved exclusively for interactive indicators
- Typographic hierarchy through weight contrast, not size inflation
- Semantic colors (green/amber/coral/cyan) reserved for operational status, never decoration
- Shadows are flat at rest and ambient on interaction — elevation confirms state, not importance
- Role-aware language: owner-facing copy is calm and contextual; admin-facing copy is terse and operational

## 2. Colors: The Studio Palette

One accent, four semantic states, two surface values, one text color.

### Primary

- **Studio Violet** (#7367F0): The system's single action color. Primary buttons, active navigation state, selected chips and filters, key callouts, the Owner Aurora hero gradient. Its rarity is the point.
- **Studio Violet Light** (#9E95F5): Lighter step for hover washes, gradient start, and tonal chip backgrounds at lower opacity.
- **Studio Violet Deep** (#5E52EE): Pressed and active states on buttons and interactive surfaces.
- **Studio Violet Whisper** (#F0EEFF): Ultra-light background wash. Applied at 16% opacity for tonal chip fills and selected surface overlays.

### Secondary

- **Warm Concrete** (#A8AAAE): Secondary actions, inactive icon states, placeholder text, ghost-button labels, supporting metadata.

### Semantic (Status Only)

These four colors are locked to operational meaning. Using them decoratively breaks the signal system.

- **Clearing Green** (#28C76F): Completed, confirmed, active. Booking confirmed, property active, cleaning done.
- **Warm Amber** (#FF9F43): Caution, standard-priority turns, warnings, time pressure without urgency.
- **Alert Coral** (#EA5455): Errors, urgent turns, critical status. Admin-facing; owners see Warm Amber for the equivalent state.
- **Clear Sky** (#00CFE8): Informational, low-priority turns, neutral info states.

### Neutral

- **Cool Linen** (#F5F5F9): Page background and surface-variant fills. Not cream, not white — a slightly cool off-white that reads as "canvas."
- **White Surface** (#FFFFFF): Card faces, panel backgrounds, dialog surfaces.
- **Deep Ink** (#2E263D): Primary text at 100% opacity. At 72% for secondary text (card subtitles, supporting copy). At 50% for captions and metadata. At 28% for disabled states. These four steps are the only text opacity values in the system.
- **Hairline** (#E8E8E8): Dividers, field borders, subtle surface separators.

### Named Rules

**The One Voice Rule.** Studio Violet is the only accent in the system. On any given screen, it covers no more than 15% of the surface area. When it appears everywhere, it signals nothing. Use tonal backgrounds (16% opacity violet) for secondary emphasis rather than the full color.

**The Semantic Lock Rule.** Clearing Green, Warm Amber, Alert Coral, and Clear Sky are reserved exclusively for operational status. They are never used to color a section heading, highlight a feature, or decorate a non-status element. If a new use case feels like it "needs green," the answer is probably Studio Violet or a neutral — not green.

## 3. Typography

**Font:** Inter (with fallback: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif)

**Character:** A single-family system, Inter throughout. No display/body split. The weight range — Regular (400), Medium (500), Semibold (600), Bold (700) — carries all hierarchy. This is a deliberate constraint: adding a second typeface in a product register adds visual noise without adding meaning.

### Hierarchy

- **Display** (700, 32px, lh 1.2): Hero stat values in the Owner Aurora banner. Rarely appears; used for a single large number that anchors a page section.
- **Headline** (600, 26px, lh 1.2): Page section headings, modal titles, the greeting heading in the owner welcome banner.
- **Title** (600, 18px, lh 1.35): Card headers, section titles, navigation item labels. The workhorse level for organizing content within a page.
- **Body** (400, 15px, lh 1.5): All content text. Max line length 65–75ch to maintain readability in card contexts.
- **Label** (600, 11px, lh 1.2, ls 0.05em): Eyebrow text above headings, status badge labels, data metadata, table column headers. Optional uppercase in admin contexts for operational terse style.

### Named Rules

**The Weight-First Rule.** Express hierarchy through weight contrast (≥1.25 ratio between adjacent steps) before reaching for size. A card title at 18px/600 reads as clearly dominant over 15px/400 body without size inflation. Avoid escalating heading sizes to compensate for weak weight contrast.

**The Role-Register Rule.** Admin-facing labels may use uppercase + tighter letter-spacing (0.05em+) for operational terseness. Owner-facing labels use sentence case and warmer language. Same semantic content, different language register — built into the label level.

## 4. Elevation

Flat-by-default. Cards and surfaces rest at a hairline ambient shadow that distinguishes them from the page background without asserting depth or importance. Elevation is earned through interaction, not assigned by content hierarchy.

Vuetify's elevation 2 (the global card default) renders the Ambient Rest shadow at rest. Hover upgrades to Primary Glow. Modals and drawers use the Structural Shadow.

### Shadow Vocabulary

- **Ambient Rest** (`--claro-shadow-sm`, `0 2px 10px rgba(0,0,0,0.05)`): Default card and surface state. Barely perceptible — confirms a surface exists without implying it's elevated. All cards rest here.
- **Primary Glow** (`--claro-shadow-md`, `0 4px 18px rgba(115,103,240,0.12), 0 2px 6px rgba(0,0,0,0.06)`): Card hover state. The violet tint is intentional — it echoes the brand without dominating. This is what interaction looks like.
- **Structural Shadow** (`--claro-shadow-lg`, `0 8px 28px rgba(115,103,240,0.18), 0 4px 10px rgba(0,0,0,0.08)`): Navigation drawers, dialogs, modals, elevated panels. Reserved for surfaces that genuinely float above the page.

### Named Rules

**The State-Trigger Rule.** Shadows confirm state changes. A card does not receive a stronger shadow because its content is more important — it receives a stronger shadow because the user is hovering, the panel is open, or a surface has been elevated by interaction. Never assign shadow level by content priority.

## 5. Components

### Buttons

The one place the pill appears — all production buttons are pill-shaped (9999px). This creates immediate visual distinction between interactive controls and data containers (which are uniformly 2px).

- **Shape:** Pill (9999px). No exceptions on interactive buttons.
- **Primary:** flat variant, Studio Violet (#7367F0) background, white text, elevation 2. Padding: 8–12px vertical / 24px horizontal.
- **Primary Hover:** Studio Violet Deep (#5E52EE) background; shadow upgrades to Primary Glow.
- **Tonal:** 16% Studio Violet opacity background, full Studio Violet text. For secondary actions within card contexts where a full-color button would overpower.
- **Ghost / Text:** Transparent background, Studio Violet text. For inline low-emphasis actions, especially in card action bars.
- **Icon-only:** Pill-shaped. 36–40px touch target minimum.

### Chips / Status Indicators

- **Default state:** Tonal variant (16% opacity background) for filter labels and tag states. Flat for confirmed status.
- **Shape:** Pill (9999px). Never label/square chips in production.
- **Priority semantic mapping:** urgent = Alert Coral (admin) / Warm Amber (owner), high = Warm Amber, normal = Studio Violet, low = Clear Sky.
- **Size:** `small` is the default for inline status; `x-small` for nested time-remaining sub-chips.

### Cards / Containers

Sharp corners (2px) throughout. The contrast — sharp containers, pill interactions — is the system's clearest signature. Any reviewer can tell Claro's design system from a generic one by the radius split.

- **Corner Style:** 2px radius on all four corners. No card, dialog, drawer, or container should exceed this.
- **Background:** White Surface (#FFFFFF) on Cool Linen (#F5F5F9) page background.
- **Shadow:** Ambient Rest at default state; Primary Glow on hover.
- **Border:** None by default. Avoid `border-left` accent stripes; prefer tonal fills or icon color for visual differentiation.
- **Internal Padding:** 24px (`--claro-space-lg`) on desktop; 16px (`--claro-space-md`) on mobile breakpoints.
- **Header:** 600 weight title, left-aligned. Divider separates header from content.

### Inputs / Fields

- **Style:** Outlined, comfortable density, 2px radius. Outlined creates clear field boundaries without the heaviness of filled or underline variants.
- **Focus:** Studio Violet primary color border highlight (Vuetify's default focus treatment for the outlined variant).
- **Error:** Alert Coral (#EA5455) border and label text.
- **Disabled:** Deep Ink at 28% opacity for label and value. No background change.
- **Density:** `comfortable` across all form contexts. Never `compact` in owner-facing flows.

### Navigation

Owner: mobile bottom navigation bar + desktop side drawer. Admin: persistent side navigation.

- **Active state:** Studio Violet icon and label text; light tonal background fill (16% violet).
- **Inactive state:** Deep Ink at 50% opacity. Not gray, not light — the same ink at half intensity.
- **Navigation Drawer:** Elevation 3 (Structural Shadow), 2px radius.
- **Mobile bottom bar:** 48px minimum touch targets. Studio Violet active icon.

### Owner Aurora Hero (Signature)

The gradient banner card that anchors the Owner Overview and all owner section headers. No analog exists in the admin UI; admins use a flat header pattern.

- **Background:** `linear-gradient(125deg, #9E95F5 0%, #7367F0 40%, #5A4FE3 75%, #4840C8 100%)`
- **Decoration:** SVG abstract wave layer at 70% opacity; white-to-transparent highlight gradient on the top 50% of the card for inner-glow depth.
- **Content:** Left section: heading (18px/700) + subtitle (12.5px/75% opacity) + mobile stat pills. Right section: icon boxes (frosted glass treatment, white background at 15% opacity) with eyebrow label and 18px/800 value.
- **Shape:** 2px radius (consistent with card system — no special rounding for the hero).
- **Scope:** Owner-facing hero sections only. Do not adapt for admin use.

## 6. Do's and Don'ts

### Do:
- **Do** use 2px radius (`--claro-radius-card`, `rounded="sm"`) on all container surfaces: cards, dialogs, drawers, expansion panels, form fields.
- **Do** use pill shape (9999px, `rounded="pill"`) on all interactive indicators: buttons, chips, badges, navigation pills, range toggles.
- **Do** keep Studio Violet to no more than 15% of any given screen surface. Its rarity is its signal strength.
- **Do** express hierarchy through weight contrast (600 vs. 400) before escalating font sizes.
- **Do** use `--claro-shadow-sm` at rest and `--claro-shadow-md` on hover, applied via Vuetify's `elevation` prop or the global shadow token — never via per-component `box-shadow` CSS.
- **Do** assign semantic colors by operational meaning: Clearing Green for confirmed/done, Warm Amber for caution/standard, Alert Coral for urgent/error, Clear Sky for informational/low.
- **Do** write role-aware labels: owner-facing text is calm ("Needs Attention"), admin-facing text is terse ("URGENT"). Same data, different register.

### Don't:
- **Don't** use generic SaaS cream aesthetics: no cream or sand backgrounds (#faf7f2, #f8f6f1 and variants), no Geist or Satoshi font, no border-only cards without a white surface fill.
- **Don't** create cluttered admin panels: no cramming unrelated controls onto a single row, no data tables without adequate row breathing room (minimum 40px row height).
- **Don't** animate for personality: no pulsing gradients, no animated counter numbers, no scroll-driven entrance choreography. Animation is for state feedback (hover lift, loading skeletons) and urgency signaling (the urgent-turn pulse chip, which exists because the operational domain is urgent — not for aesthetic reasons).
- **Don't** add raw `box-shadow` on individual components. Use `--claro-shadow-sm/md/lg` or Vuetify's `elevation` prop.
- **Don't** round any container above 2px. Cards, modals, drawers, panels: 2px, always. Pill (9999px) is for interactive indicators only.
- **Don't** use `border-left` greater than 1px as a colored accent stripe on cards or list items. Use tonal background fills or header icon color for visual differentiation.
- **Don't** use gradient text (`background-clip: text` with a gradient). Use weight and color for text emphasis.
- **Don't** repurpose semantic colors decoratively: Clearing Green is not an "active tab" accent, Warm Amber is not a "featured section" highlight, Alert Coral is not a "brand red."
- **Don't** use glassmorphism (backdrop-filter blur) except in the Owner Aurora Hero stat boxes, where it's structurally purposeful. It is not a general card treatment.
