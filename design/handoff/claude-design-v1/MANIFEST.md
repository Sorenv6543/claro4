# Claude Design v1 — Handoff Manifest

**Source:** https://claude.ai/design/p/6c4d07ec-2367-4b53-b4bb-b0dc09b3a4c6
**Received:** 2026-04-24
**Status:** Intake complete — Phase 0 of design-system-v1 migration

## Contents

All binary artifacts in this directory are **gitignored** (see `.gitignore`: `design/handoff/**/*.zip`, `design/handoff/**/extracted/`). Only `MANIFEST.md` is committed. To recover, re-download the handoff from the Claude Design project URL above and place the zip files alongside this manifest, then run the regeneration command below.

| File (local only, not in git) | Size | Purpose |
|---|---|---|
| `Claro Design System v1.zip` | 22 MB | Raw Claude Design export (bundled Vue scaffold + design spec) |
| `Claro Design System v1-handoff.zip` | 22 MB | Packaged handoff variant of the same export |
| `Inter.zip` | 20 MB | Google Fonts Inter static TTF bundle (18pt/24pt/28pt). **Not used** — the project imports Inter weights 400/500/600 via `@fontsource/inter` (npm). Archival only. |
| `extracted/` | ~60 MB uncompressed | Unzipped contents of the handoff. Regenerate with the command below. |

## Key files inside `extracted/`

- `colors_and_type.css` — canonical design tokens as CSS vars. Primary reference for `docs/design-system/claude-design-v1/DIFF.md`.
- `README.md` — full design-system spec (voice, typography, color, spacing, radii, shadows, layout, icons). The single best narrative description of the v1 design.
- `SKILL.md` — skill manifest. Non-negotiables: `#7367F0` primary, 2px radii, MDI-only icons, Inter 400/500/600, gradients only on Owner hero.
- `preview/` — per-primitive HTML cards (colors, type, components-appbar, components-buttons, components-chips, components-hero-card + v2/v3, components-inputs, components-property-list, components-sidebar-nav, etc.).
- `ui_kits/claro-owner/index.html` — Owner interface prototype (mobile 420px + desktop 1200px).
- `ui_kits/claro-admin/index.html` — Admin interface prototype (desktop, dense tables).
- `pages/owner/overview.vue` — reference Vue implementation of Owner Overview (**reference only** — do not import; our architecture uses Pinia stores + Supabase composables this scaffold does not).
- `fonts/Inter-VariableFont.ttf` + italic — variable Inter fonts used by the standalone HTML mocks. The production app uses `@fontsource/inter` npm packages; these variable TTFs are **not** installed into the app.

## Handoff vs production boundaries

- **Use as source of truth:** `colors_and_type.css`, `README.md`, preview HTML cards — all foundation values and visual specs.
- **Use as reference only:** Vue components under `components/`, `pages/`, `composables/`, `stores/`, `utils/` inside `extracted/`. Claude Design generated these to showcase the design but they do not match our Pinia + Supabase + role-split architecture. Extract patterns (prop shapes, slot anatomy, class names) — do not copy files wholesale.
- **Discard:** `Inter.zip` (redundant; @fontsource in npm covers our weights).

## Known inconsistencies in the handoff (resolve before Phase 1)

- `README.md` § Layout rules says persistent left nav drawer is "380px open / 72px collapsed".
- `colors_and_type.css` declares `--claro-drawer-width: 260px`, `--claro-drawer-width-collapsed: 72px`.
- Current repo `tokens.css` has `--claro-drawer-width: 260px` already synced.
- Current repo `tokens.css` has `--claro-drawer-width: 380px` — **conflict.** README matches current 380px, colors_and_type.css reduces to 260px. Resolution required before propagating to Pencil in Phase 1.

## Regenerating `extracted/`

```bash
cd design/handoff/claude-design-v1
unzip -o "Claro Design System v1-handoff.zip" -d extracted
```
