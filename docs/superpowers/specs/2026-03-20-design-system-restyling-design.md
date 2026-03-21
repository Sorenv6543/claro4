# Design System Restyling via Pencil MCP

**Date:** 2026-03-20
**Status:** Approved

## Summary

Restyle existing components to match provided example images, using the Pencil MCP to generate Vue component designs from screenshots. Work happens in an isolated git worktree on a `design-system` branch.

## Goals

- Visually restyle existing components (PropertyCard, etc.) to match provided design references
- Use Pencil MCP as the design-to-code bridge: example image → `.pen` file → Vue component extraction
- Validate each restyled component against its existing demo page at `/dev/demos`
- Keep main branch clean for other work via worktree isolation

## Approach

### Worktree Setup

1. Add `.worktrees/` to `.gitignore` on `main` and commit (must happen before worktree creation to prevent tracking)
2. Create worktree: `git worktree add .worktrees/design-system -b design-system`
3. Run `pnpm install` in the worktree
4. Create `src/design/` directory in the worktree for `.pen` files
5. Verify app starts and `/dev/demos` loads correctly

### Per-Component Workflow

For each component to restyle:

1. User provides an example image of the desired look
2. Pencil MCP creates a `.pen` file from the image, generating the Vue component design
3. Extract relevant styling (colors, spacing, typography, structure) from Pencil's output
4. Update the component to match — visual changes only (template structure, CSS, classes), no logic changes
5. Validate by viewing the component's demo page at `/dev/demos`
6. Commit the restyled component on the `design-system` branch

### Acceptance Criteria

- The restyled component visually matches the provided example image (user confirms via demo page)
- Existing Vuetify global defaults in `vuetify.ts` are preserved unless the user explicitly approves a change
- If a design requires a color not in the current palette, prefer scoped component styles over theme modifications
- New theme colors may be added only if the color is needed across multiple components
- Domain-specific colors (`turn-urgent`, `turn-standard`, `booking-standard`) are not modified

### File Locations

- `.pen` design files: `src/design/` in the worktree — committed to the `design-system` branch as reference artifacts, not intended for production
- Updated components: `src/components/dumb/shared/` primarily, plus `admin/`/`owner/` or smart components if images are provided
- Theme updates: `src/plugins/vuetify.ts` only with explicit user approval per the acceptance criteria above

### Target Components

Components are in-scope when the user provides an example image. Primary candidates (dumb components with existing demos):

- `PropertyCard.vue` → `PropertyCardDemo.vue`
- `ErrorAlert.vue` → `ErrorHandlingDemo.vue`
- `UpcomingCleanings.vue` → various demos
- `TurnAlerts.vue` / `TurnPriorityBadge.vue` → `TurnAlertsDemo.vue`
- `PWAStatusCard.vue` → `PWAStatusCardDemo.vue`

Smart components (sidebars, calendar) may also be restyled if images are provided — in that case, only template/CSS changes are made, never store/composable/orchestration logic.

## Out of Scope

- No new components — only restyling existing ones
- No store, composable, or business logic changes — purely visual
- No Vuetify version changes or dependency additions

## Integration

After a batch of components is restyled and validated:
- PR from `design-system` branch back to `main`
- Review the visual diff via demo pages before merging

## Existing Infrastructure

- **Demo viewer:** `src/pages/demos/index.vue` auto-discovers demos via `import.meta.glob`
- **Demo route:** `/dev/demos` (no auth required, blocked in production)
- **Vuetify config:** `src/plugins/vuetify.ts` — light theme, dark teal theme, component defaults
- **32 existing demos** in `src/dev/demos/` covering Admin and General categories
