# Claude Design v1 — DIFF

**Purpose:** authoritative Phase 1 work list. Each row describes one value or token change required to bring the repo in line with Claude Design v1.

**Methodology:** compared `design/handoff/claude-design-v1/extracted/colors_and_type.css` (+ `README.md` Visual Foundations) against `src/styles/tokens.css`, `src/plugins/vuetify.ts`, `src/styles/variables.scss`, and `src/utils/constants.ts` as of branch `feature/design-system-v1` @ `main`.

**Status legend:**
- ✅ `MATCH` — already in sync, no change needed
- 🟡 `ADD` — new token; append to tokens.css
- 🟠 `CHANGE` — existing token with a different value
- 🔴 `CONFLICT` — handoff itself disagrees; human decision required
- 🔵 `REFACTOR` — structural change (rename, split, rewrite) beyond a value swap

**Layers:**
- `tokens` → `src/styles/tokens.css`
- `theme` → `src/plugins/vuetify.ts` `lightTheme.colors`
- `scss` → `src/styles/variables.scss` (Vuetify Sass root)
- `main` → `src/styles/main.scss` (type helper classes)
- `const` → `src/utils/constants.ts` (PROPERTY_COLORS)
- `pencil` → `design/materio-vuetify.token_sync.pen` (Pencil MCP — touched first in Phase 1)

---

## 1. Brand colors

| Status | Token | Current | New | Layer | Notes |
|---|---|---|---|---|---|
| ✅ | `--claro-primary` | `#7367F0` | `#7367F0` | tokens, theme | Materio violet, unchanged |
| ✅ | `--claro-primary-light` | `#9E95F5` | `#9E95F5` | tokens, theme | |
| ✅ | `--claro-primary-dark` | `#5E52EE` | `#5E52EE` | tokens, theme | |
| 🟡 | `--claro-primary-tint` | — | `#F0EEFF` | tokens | NEW — 8% tint for active-nav background |
| ✅ | `--claro-secondary` | `#A8AAAE` | `#A8AAAE` | tokens, theme | |
| 🟠 | `--claro-accent` | `#7367F020` (hex+alpha) | `rgba(115, 103, 240, 0.125)` | tokens | Format-only change; semantic value identical (≈12.5%) |

## 2. Surfaces

| Status | Token | Current | New | Layer | Notes |
|---|---|---|---|---|---|
| ✅ | `--claro-background` | `#F5F5F9` | `#F5F5F9` | tokens, theme | |
| ✅ | `--claro-surface` | `#FFFFFF` | `#FFFFFF` | tokens, theme | |
| ✅ | `--claro-surface-variant` | `#F5F5F9` | `#F5F5F9` | tokens, theme | |
| ✅ | `--claro-card-bg` | `#FFFFFF` | `#FFFFFF` | tokens, theme | |

## 3. Text (refactor from 2-step to 4-step alpha scale)

| Status | Token | Current | New | Layer | Notes |
|---|---|---|---|---|---|
| 🔵 | `--claro-fg1` | — | `#2E263D` | tokens | NEW — primary text. Aliased by `--claro-on-background`, `--claro-on-surface` |
| 🔵 | `--claro-fg2` | — | `rgba(46, 38, 61, 0.72)` | tokens | NEW — secondary text (was missing entirely) |
| 🔵 | `--claro-fg3` | `rgba(46, 38, 61, 0.5)` (as `--claro-text-secondary`) | `rgba(46, 38, 61, 0.50)` | tokens | Rename from `--claro-text-secondary` → `--claro-fg3`. Keep old name as alias for 1 release. |
| 🔵 | `--claro-fg4` | — | `rgba(46, 38, 61, 0.28)` | tokens | NEW — disabled / faint |
| 🟠 | `--claro-on-background` | `#2E263D` | `var(--claro-fg1)` | tokens | Redirect to new alias |
| 🟠 | `--claro-on-surface` | `#2E263D` | `var(--claro-fg1)` | tokens | Redirect to new alias |
| 🟡 | `--claro-on-primary` | — | `#FFFFFF` | tokens | NEW — for text on primary button/active nav |
| 🟠 | Vuetify `text-secondary` | `#2E263D80` | `#2E263D80` (unchanged, but match new fg3) | theme | |

## 4. Semantic colors

| Status | Token | Current | New | Layer | Notes |
|---|---|---|---|---|---|
| ✅ | `--claro-success` | `#28C76F` | `#28C76F` | tokens, theme | |
| ✅ | `--claro-warning` | `#FF9F43` | `#FF9F43` | tokens, theme | |
| ✅ | `--claro-error` | `#EA5455` | `#EA5455` | tokens, theme | |
| ✅ | `--claro-info` | `#00CFE8` | `#00CFE8` | tokens, theme | |
| 🟡 | `--claro-success-tonal` | — | `rgba(40, 199, 111, 0.16)` | tokens | NEW — chip background |
| 🟡 | `--claro-warning-tonal` | — | `rgba(255, 159, 67, 0.16)` | tokens | NEW |
| 🟡 | `--claro-error-tonal` | — | `rgba(234, 84, 85, 0.16)` | tokens | NEW |
| 🟡 | `--claro-info-tonal` | — | `rgba(0, 207, 232, 0.16)` | tokens | NEW |
| 🟡 | `--claro-primary-tonal` | — | `rgba(115, 103, 240, 0.16)` | tokens | NEW |

## 5. Domain colors

| Status | Token | Current | New | Layer | Notes |
|---|---|---|---|---|---|
| ✅ | `--claro-turn-urgent` | `#EA5455` | `#EA5455` | tokens, theme | |
| ✅ | `--claro-turn-standard` | `#FF9F43` | `#FF9F43` | tokens, theme | |
| ✅ | `--claro-booking-standard` | `#28C76F` | `#28C76F` | tokens, theme | |

## 6. Property accent palette

| Status | Token / Constant | Current | New | Layer | Notes |
|---|---|---|---|---|---|
| 🟠 | `PROPERTY_COLORS[0]` | `#5c6bc0` (Material indigo) | `#7367F0` (Materio violet = brand) | const | `src/utils/constants.ts:6` |
| 🟠 | `PROPERTY_COLORS[1]` | `#43a047` (Material green) | `#28C76F` | const | |
| 🟠 | `PROPERTY_COLORS[2]` | `#8e24aa` (Material purple) | `#9155FD` | const | Distinct from brand violet |
| 🟠 | `PROPERTY_COLORS[3]` | `#f57c00` (Material orange) | `#FF9F43` | const | |
| 🟠 | `PROPERTY_COLORS[4]` | `#e53935` (Material red) | `#EA5455` | const | |
| 🟡 | `--claro-prop-1..5` | — | as above | tokens | NEW — expose per-property palette as CSS vars too (currently only the constants array exists) |
| 🟡 | `--claro-prop-6` | — | `#FDD835` (yellow) | tokens | NEW — calendar "OUT" events only. Do NOT add to `PROPERTY_COLORS` user-selectable cycle; this is system-assigned. |

## 7. Borders / dividers

| Status | Token | Current | New | Layer | Notes |
|---|---|---|---|---|---|
| ✅ | `--claro-divider` | `#E8E8E8` | `#E8E8E8` | tokens, theme | |
| 🟡 | `--claro-border` | — | `#E8E8E8` | tokens | NEW — alias for clarity (same value as divider) |
| 🟡 | `--claro-border-strong` | — | `#D4D4DB` | tokens | NEW |

## 8. Typography

| Status | Token | Current | New | Layer | Notes |
|---|---|---|---|---|---|
| ✅ | `--claro-font-family` | `'Inter', sans-serif` | `'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | tokens | Expand fallback stack (cosmetic; renders the same if Inter loads) |
| ✅ | `--claro-font-weight-normal/medium/semibold` | 400/500/600 | 400/500/600 | tokens | |
| 🟡 | `--claro-text-xs` | — | `11px` | tokens | NEW type scale |
| 🟡 | `--claro-text-sm` | — | `13px` | tokens | |
| 🟡 | `--claro-text-base` | — | `15px` | tokens | |
| 🟡 | `--claro-text-md` | — | `16px` | tokens | |
| 🟡 | `--claro-text-lg` | — | `18px` | tokens | |
| 🟡 | `--claro-text-xl` | — | `22px` | tokens | |
| 🟡 | `--claro-text-2xl` | — | `26px` | tokens | |
| 🟡 | `--claro-text-3xl` | — | `32px` | tokens | |
| 🟡 | `--claro-text-4xl` | — | `40px` | tokens | |
| 🟡 | `--claro-lh-tight/snug/normal` | — | `1.2 / 1.35 / 1.5` | tokens | NEW line-heights |

## 9. Semantic type classes (main.scss)

The handoff's `colors_and_type.css` defines semantic CSS classes that don't exist in the repo. Add these to `src/styles/main.scss` (not tokens.css, since they're style rules not tokens):

| Status | Class | Shape | Notes |
|---|---|---|---|
| 🟡 | `.claro-h1` | 600 / `--claro-text-3xl` / `--claro-lh-tight` / letter-spacing -0.01em / `--claro-fg1` | |
| 🟡 | `.claro-h2` | 600 / `--claro-text-xl` / `--claro-lh-tight` | |
| 🟡 | `.claro-h3` | 600 / `--claro-text-lg` / `--claro-lh-snug` | |
| 🟡 | `.claro-subheading` | 400 / `--claro-text-sm` / `--claro-lh-normal` / `--claro-fg3` | |
| 🟡 | `.claro-body` | inherit / `--claro-text-base` / `--claro-lh-normal` | |
| 🟡 | `.claro-caption` | `--claro-text-xs` / `--claro-lh-snug` / `--claro-fg3` / letter-spacing 0.01em | |
| 🟡 | `.claro-eyebrow` | 500 / `11px` / uppercase / letter-spacing 0.08em / `--claro-fg3` | |
| 🟡 | `.claro-wordmark` | 600 / `22px` / letter-spacing -0.01em / `--claro-primary` | For brand lockup |
| 🟡 | `.claro-numeric` | 600 / `font-variant-numeric: tabular-nums` | For stat-card numbers |

**DECISION: adopt all 9 in Phase 1.** Per-phase decisions about which classes to add fragment the work; one-time addition of 9 utility classes in Phase 1 is cheaper than spreading them across 5 component phases.

## 10. Spacing

| Status | Token | Current | New | Layer | Notes |
|---|---|---|---|---|---|
| ✅ | `--claro-space-xs..xl` | `4/8/16/24/32` | `4/8/16/24/32` | tokens | |
| 🟡 | `--claro-space-2xl` | — | `48px` | tokens | NEW |

## 11. Radii

| Status | Token | Current | New | Layer | Notes |
|---|---|---|---|---|---|
| ✅ | `--claro-radius-sm/md/lg` | `2/2/2px` | `2/2/2px` | tokens | 2px rule enforced |
| 🟡 | `--claro-radius-card` | — | `2px` | tokens | NEW — semantic alias for card corners |
| ✅ | `--claro-radius-pill` | `9999px` | `9999px` | tokens | |

## 12. Elevation / shadows

| Status | Token | Current | New | Layer | Notes |
|---|---|---|---|---|---|
| ✅ | `--claro-shadow-sm` | `0 2px 10px rgba(0,0,0,0.05)` | same | tokens | |
| ✅ | `--claro-shadow-md` | `0 4px 18px rgba(115,103,240,0.12), 0 2px 6px rgba(0,0,0,0.06)` | same | tokens | |
| ✅ | `--claro-shadow-lg` | `0 8px 28px rgba(115,103,240,0.18), 0 4px 10px rgba(0,0,0,0.08)` | same | tokens | |

## 13. Gradients

| Status | Token | Current | New | Layer | Notes |
|---|---|---|---|---|---|
| ✅ | `--claro-gradient-primary` | `linear-gradient(135deg, light 0%, primary 60%, dark 100%)` | same | tokens | |
| 🔵 | `--claro-gradient-surface` | `linear-gradient(180deg, surface, surface-variant)` | — | tokens | Handoff omits this. Current repo has it but unused per README ("Gradients only on Owner hero"). **DECISION: delete in Phase 1.** Verified zero consumers via repo grep before removal. |

## 14. Layout dimensions

| Status | Token | Current | New (`colors_and_type.css`) | New (README) | Layer | Notes |
|---|---|---|---|---|---|---|
| ✅ | `--claro-app-bar-height` | `64px` | `64px` | `64px` | tokens | |
| ✅ | `--claro-app-bar-height-mobile` | `56px` | `56px` | `56px` | tokens | |
| 🟠 | `--claro-drawer-width` | `380px` | `260px` | `380px` | tokens | **DECISION: 260px** (matches `colors_and_type.css`, the more rigorous source). Conflict resolved 2026-04-24. README to be corrected in Phase 7. |
| ✅ | `--claro-drawer-width-collapsed` | `72px` | `72px` | `72px` | tokens | |
| ✅ | `--claro-content-padding` | `24px` | `24px` | `24px` | tokens | |
| ✅ | `--claro-content-padding-mobile` | `12px` | `12px` | `12px` | tokens | |
| ✅ | `--claro-touch-target-min` | `44px` | `44px` | `44px` | tokens | |

## 15. Motion

| Status | Token | Current | New | Layer | Notes |
|---|---|---|---|---|---|
| 🟡 | `--claro-dur-fast` | — | `150ms` | tokens | NEW — for button `:active` scale |
| 🟡 | `--claro-dur-base` | — | `200ms` | tokens | NEW — for list-item hover fades |
| 🟡 | `--claro-dur-slow` | — | `250ms` | tokens | NEW — for card hover lift |
| 🟡 | `--claro-ease` | — | `ease` | tokens | NEW |

## 16. Responsive overrides (keep existing)

The handoff does NOT specify responsive token overrides. Keep the existing `@media (max-width: 599px)` and tablet blocks in `tokens.css`. If drawer width changes (§14), update the mobile override accordingly.

## 17. Vuetify Sass root (`variables.scss`)

| Status | Variable | Current | New | Notes |
|---|---|---|---|---|
| ✅ | `$body-font-family` | `'Inter', sans-serif` | same | |
| ✅ | `$border-radius-root` | `2px` | `2px` | |

No changes required in `variables.scss`.

## 18. Vuetify `defaults:` block — reviewed, deferred to Phase 3

Phase 3 addresses VBtn / VChip / VBadge / VTextField / VSelect / VDialog / VAlert / etc. defaults against the handoff's `preview/components-*.html` specs. Not in scope for Phase 1.

Known hints from preview scan (for Phase 3):
- Buttons get `rounded: 'pill'` per SKILL.md non-negotiables. Current `rounded: true` (not pill). **Likely change.**
- Primary button hover adds purple-tinted shadow + `-1px` translate (250ms) — inline style, not Vuetify prop.
- Nav drawer item active state uses `--claro-primary-tint` background + `--claro-primary` text color.

## 19. Hero Card variant decision — deferred to Phase 4

The three variants live at:
- `docs/design-system/claude-design-v1/screens/hero-card-v1.html`
- `docs/design-system/claude-design-v1/screens/hero-card-v2.html`
- `docs/design-system/claude-design-v1/screens/hero-card-v3.html`

Decision required at Phase 4 entry. Archive unselected two in `screens/` with a README noting the choice.

---

## Phase 1 summary — shape of the work

- **Additive-only in tokens.css** (safe): sections 1 (tint), 4 (tonals), 7 (borders), 8 (type scale), 10 (2xl), 11 (card radius), 15 (motion). All are new tokens that don't break existing code.
- **Refactor in tokens.css** (medium risk): section 3 text tokens — introduce `fg1..fg4`; keep `on-background`, `on-surface`, `text-secondary` as aliases for one release cycle. Every existing consumer keeps working; Phase 6 sweep migrates consumers to the new names.
- **Conflict resolution before Phase 1 propagation:** section 14 drawer width. Resolve first.
- **Property colors change** (section 6): 5 existing values + 1 new yellow. Touches `src/utils/constants.ts` and every consumer. **DECISION: map-on-read.** A new helper `mapLegacyPropertyColor(hex: string): string` translates `#5c6bc0 → #7367F0`, `#43a047 → #28C76F`, `#8e24aa → #9155FD`, `#f57c00 → #FF9F43`, `#e53935 → #EA5455` at render time. Lives in `src/utils/constants.ts` next to `PROPERTY_COLORS`. Every read of `property.color` for display routes through it. DB is not migrated; existing rows keep their old hex; the picker writes the new hex going forward. Phase 1 adds the helper and updates `PROPERTY_COLORS`; Phase 6 sweeps consumers to use the helper.
- **Theme colors in `vuetify.ts`:** only the `text-secondary` mapping touches this file. All primary/semantic/domain colors already match. This is the easiest Vuetify theme update we'll ever do.

## Decisions locked (2026-04-24)

1. **Drawer width** → `260px`. (§14)
2. **`PROPERTY_COLORS` migration** → map-on-read via new helper `mapLegacyPropertyColor()` in `src/utils/constants.ts`. DB untouched. (§6)
3. **`--claro-gradient-surface`** → delete in Phase 1. (§13)
4. **Type classes** → adopt all 9 in Phase 1. (§9)

Phase 1 unblocked.
