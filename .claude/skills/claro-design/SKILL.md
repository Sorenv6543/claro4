---
name: claro-design
description: Use this skill to generate well-branded interfaces and assets for Claro, a multi-tenant property-cleaning scheduler (Vue 3 / Vuetify 4 / Supabase), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

All design system files live in `design/handoff/claude-design-v1/extracted/` (relative to the project root).

Read `design/handoff/claude-design-v1/extracted/README.md` first, then explore other files as needed.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Every mock should `<link rel="stylesheet" href="...colors_and_type.css">` to get the canonical tokens. For production code, follow the Vuetify 4 global defaults documented in README.md § Visual Foundations — do not re-style components that already get global defaults from `src/plugins/vuetify.ts`.

Key files to orient from:
- `design/handoff/claude-design-v1/extracted/README.md` — product context, content fundamentals, visual foundations, iconography
- `design/handoff/claude-design-v1/extracted/colors_and_type.css` — all design tokens as CSS vars + semantic type classes
- `design/handoff/claude-design-v1/extracted/preview/` — atomic design cards (colors, type, components) you can read to understand patterns
- `design/handoff/claude-design-v1/extracted/ui_kits/claro-owner/` — Owner interface UI kit (mobile-first, then desktop)
- `design/handoff/claude-design-v1/extracted/ui_kits/claro-admin/` — Admin interface UI kit (desktop-first, dense tables)
- `design/handoff/claude-design-v1/extracted/assets/` — Claro wordmark SVG, property color swatches

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (which role — owner / admin / cleaner? desktop or mobile? which screen or flow?), and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

