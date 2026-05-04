---
name: claro-design
description: Use this skill to generate well-branded interfaces and assets for Claro, a multi-tenant property-cleaning scheduler (Vue 3 / Vuetify 4 / Supabase), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Every mock should `<link rel="stylesheet" href="colors_and_type.css">` to get the canonical tokens. For production code, follow the Vuetify 4 global defaults documented in README.md § Visual Foundations — do not re-style components that already get global defaults from `src/plugins/vuetify.ts`.

Key files to orient from:
- `README.md` — product context, content fundamentals, visual foundations, iconography
- `colors_and_type.css` — all design tokens as CSS vars + semantic type classes
- `preview/` — atomic design cards (colors, type, components) you can read to understand patterns
- `ui_kits/claro-owner/` — Owner interface UI kit (mobile-first, then desktop)
- `ui_kits/claro-admin/` — Admin interface UI kit (desktop-first, dense tables)
- `assets/` — Claro wordmark SVG, property color swatches

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (which role — owner / admin / cleaner? desktop or mobile? which screen or flow?), and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

**Non-negotiables:**
- Claro purple `#7367F0` is the only brand accent. Don't invent new brand colors.
- 2px radii on surfaces; pill on chips and primary buttons. Not 8px, not 12px.
- Material Design Icons (MDI) only — never emoji, never custom SVG icons.
- Inter, weights 400/500/600 only.
- Gradients only on the Owner hero "Welcome back" card. Nowhere else.
- Cards get `--claro-shadow-sm` baseline; never raw `box-shadow` elsewhere.
