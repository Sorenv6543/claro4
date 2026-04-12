# Perplexity — Deployment, Vuetify Depth, Responsiveness & Pencil.dev Research

> Paste into a new Perplexity thread.

```
I'm building a multi-tenant property cleaning scheduler as a Progressive Web App. Stack: Vue 3 + Vite + Vuetify 4, Pinia for state management, Supabase (Postgres + auth + RLS + realtime subscriptions). The app has two user roles: Property Owners (30-40 clients) and a single Business Admin.

I use Pencil.dev as my design tool — it's a code-native design tool where .pen files are version-controlled alongside my codebase. I have a Materio-inspired Vuetify component library in Pencil (design/materio-vuetify.lib.pen). Pencil has an MCP server that lets AI agents read designs, extract design tokens, export assets, and create new designs programmatically.

I just finished a major architecture cleanup and Materio-inspired UI restyle. The backend data layer (Supabase composables, Pinia stores, realtime sync) is in place but I haven't deployed yet. The UI works but feels flat — I'm underusing Vuetify's component library and the app isn't properly responsive across screen sizes.

Research the following four topics. For each, give me specific actionable recommendations with code patterns or configuration examples where relevant. Cite your sources.

## 1. Deployment strategy for a Vue 3 + Supabase PWA

When should a solo developer deploy a multi-tenant app like this — before the UI is fully polished or after? Research current best practices (2025-2026) for:
- Incremental deployment vs waiting for feature completeness
- Supabase-specific deployment considerations: RLS policies in production, migration workflows, environment separation (staging vs production)
- PWA deployment: service worker caching strategies for a Supabase-backed app, update propagation to existing clients
- Recommended hosting for Vue 3 + Vite SPAs (Vercel, Netlify, Cloudflare Pages) — compare trade-offs for a Supabase backend specifically
- Feature flags or role-based rollout strategies for shipping Owner features before Admin features are ready

## 2. Vuetify 4 design depth — making a flat app feel polished

My app uses Vuetify 4 but mostly at a surface level (basic cards, text fields, buttons). Research:
- Vuetify 4 elevation system, surface variants, and color overlay patterns for adding visual depth
- Best practices for v-card: variants (elevated, flat, tonal, outlined, text), using v-card-title/subtitle/text slots effectively, hover states
- Transition components available in Vuetify 4 (v-expand-transition, v-fade-transition, v-slide-x-transition, etc.) and when to use each
- Empty state patterns, loading skeleton patterns (v-skeleton-loader types), and error state patterns in Vuetify 4
- v-bottom-sheet, v-banner, v-snackbar — when each is appropriate for notifications and mobile interaction
- Theme customization beyond colors: shape (border-radius), typography scale, component density configuration

## 3. Vuetify 4 useDisplay composable — responsive design patterns

My app needs to work at mobile (375px), tablet (768px), and desktop (1440px). Research:
- How Vuetify 4's useDisplay composable works: available breakpoint properties (xs, sm, md, lg, xl, xxl, mobile, name, width, height, thresholds)
- Patterns for conditionally rendering different component layouts per breakpoint (e.g., bottom sheet on mobile vs dialog on desktop, navigation drawer behavior)
- Using useDisplay with v-navigation-drawer: permanent on desktop, temporary overlay on mobile
- Responsive grid patterns: v-row + v-col with breakpoint-specific column counts
- Data table responsive patterns: column hiding, row expansion, card-based mobile view
- Real-world examples of Vue 3 + Vuetify 4 apps handling responsive layout switching — reference any open-source projects or official examples

## 4. Pencil.dev design-to-code workflow for Vue + Vuetify projects

I'm learning Pencil.dev and want to establish a solid workflow. Research:
- How Pencil.dev's .pen files work with version control (Git) — best practices for storing design files alongside code
- Pencil.dev's MCP integration: how to use it with AI coding agents (Claude Code, Cursor, etc.) for design-to-code workflows
- How to maintain a Vuetify component library in Pencil that stays in sync with actual Vue components — design token extraction, variable system
- Pencil.dev's design system features: reusable components, variables/themes, how these map to Vuetify's theme system
- Any case studies or documented workflows of teams using Pencil.dev for component-driven development with Vue or React
- How Pencil compares to Figma for a solo developer / small team doing design + code in the same workflow

Flag any data point you are not confident about with [uncertain]. Cite sources for all recommendations.
```
