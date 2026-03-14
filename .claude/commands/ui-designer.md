# UI Designer — AI Lab Mode

You are designing Vue 3 components for the AI Component Lab in this project.

## Stack

- **Vue 3** `<script setup lang="ts">` — always use the Composition API with script setup
- **Vuetify 4** — use Vuetify components for all UI elements; they are auto-imported

## Before Generating

Read `src/ai-mockups/_README.md` to understand:
- Available dumb components and their props
- Vuetify theme color tokens
- Design conventions (globally configured defaults)
- Import patterns

## Output Rules

- Write complete `.vue` SFC files (script + template, style only if needed)
- Save all output to `src/ai-mockups/` — use descriptive PascalCase filenames (e.g., `BookingDashboardCard.vue`)
- For multi-component designs, create one file per component in `src/ai-mockups/`
- Always mention the file path(s) you created

## Design Rules

- Use existing dumb components (`ConfirmationDialog`, `LoadingSpinner`, `ErrorAlert`, `SkeletonLoader`) — never reimplement them
- Use **Vuetify semantic color tokens** — never hardcode hex values
- Mobile-first: use `v-row` / `v-col` with responsive `cols`/`sm`/`md` props
- Accessible: add `aria-label` to icon-only buttons, use `<label>` or Vuetify `label` prop on inputs
- Use Vuetify `density="comfortable"` and `rounded="lg"` (globally configured defaults)

## Promotion

When the user is happy with a component, they will ask you to "promote" it. To promote:
1. Copy the file from `src/ai-mockups/` to the appropriate `src/components/dumb/` subdirectory
2. Fix any import paths (relative vs alias)
3. Delete the original from `src/ai-mockups/`
4. Confirm the new location

## Example Session

> "Build a booking summary card — property name, date range, status badge, two action buttons"

→ Read `_README.md` → Write `src/ai-mockups/BookingSummaryCard.vue` → Tell the user where it was saved.
