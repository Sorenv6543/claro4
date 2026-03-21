# Design System Restyling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up an isolated worktree with Pencil MCP workspace, then iteratively restyle existing components by converting user-provided example images into Vue component designs.

**Architecture:** Git worktree on a `design-system` branch isolates visual work from main. Pencil MCP generates `.pen` design files from example images, from which Vue component styling is extracted and applied to existing dumb/smart components. Each restyled component is validated via the existing `/dev/demos` viewer.

**Tech Stack:** Vue 3, Vuetify 4, Pencil MCP (`.pen` files), git worktrees, pnpm

**Spec:** `docs/superpowers/specs/2026-03-20-design-system-restyling-design.md`

---

## File Structure

### New files
- `.worktrees/design-system/` — git worktree (entire repo copy)
- `src/design/*.pen` — Pencil MCP design reference files (in worktree only)

### Files that may be modified (in worktree)
- `src/components/dumb/shared/*.vue` — shared dumb components being restyled
- `src/components/dumb/admin/*.vue` — admin dumb components (if images provided)
- `src/components/dumb/owner/*.vue` — owner dumb components (if images provided)
- `src/components/smart/admin/AdminSidebar.vue` — visual-only changes if images provided
- `src/components/smart/owner/OwnerNavigationDrawer.vue` — visual-only changes if images provided
- `src/components/smart/shared/FullCalendar.vue` — visual-only changes if images provided
- `src/plugins/vuetify.ts` — only with explicit user approval for new theme colors

### Files modified on main (setup only)
- `.gitignore` — add `.worktrees/` entry

---

### Task 1: Add `.worktrees/` to `.gitignore` on main

**Files:**
- Modify: `.gitignore`

This must happen on `main` before creating the worktree, to prevent the worktree directory from being tracked.

- [ ] **Step 1: Add `.worktrees/` to `.gitignore`**

Append the following to the end of `.gitignore`:

```
# Git worktrees
.worktrees/
```

- [ ] **Step 2: Verify it's ignored**

Run: `git check-ignore -v .worktrees`
Expected: `.gitignore` rule matches

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add .worktrees/ to .gitignore"
```

---

### Task 2: Create the worktree

- [ ] **Step 1: Create the worktree on a new `design-system` branch**

```bash
git worktree add .worktrees/design-system -b design-system
```

Expected: `Preparing worktree (new branch 'design-system')` message.

- [ ] **Step 2: Install dependencies in the worktree**

```bash
cd .worktrees/design-system && pnpm install
```

Expected: `pnpm install` completes without errors.

- [ ] **Step 3: Create the `src/design/` directory for `.pen` files**

```bash
mkdir -p .worktrees/design-system/src/design
```

- [ ] **Step 4: Verify the dev server starts and demos load**

```bash
cd .worktrees/design-system && pnpm dev
```

Expected: Dev server starts. Navigate to `http://localhost:5173/dev/demos` (port may vary) and confirm the demo index page loads with demos listed.

- [ ] **Step 5: Verify tests pass as a clean baseline**

```bash
cd .worktrees/design-system && pnpm test:run
```

Expected: All tests pass. If any fail, report failures and ask before proceeding.

---

### Task 3: Set up Pencil MCP workspace

- [ ] **Step 1: Check Pencil MCP editor state**

Use Pencil MCP tool `get_editor_state()` to confirm the editor is available and no `.pen` file is currently active.

- [ ] **Step 2: Get design system guidelines from Pencil**

Use Pencil MCP tool `get_guidelines(topic="design-system")` to retrieve design system rules for working with `.pen` files.

- [ ] **Step 3: Get style guide tags for inspiration**

Use Pencil MCP tool `get_style_guide_tags` to see available design themes/tags.

- [ ] **Step 4: Select and load a style guide**

Use Pencil MCP tool `get_style_guide(tags)` with tags relevant to the project's aesthetic (property management, clean/modern). This informs the design language for restyled components.

- [ ] **Step 5: Create a `.pen` file for the first component**

Use Pencil MCP tool `open_document(filePathOrNew=".worktrees/design-system/src/design/ComponentName.pen")` to create a new `.pen` file at a specific path. Replace `ComponentName` with the actual component name when ready. For subsequent components, open a new document with the appropriate path each time.

---

### Task 4: Restyle component (repeatable workflow)

This task is the template for every component. Repeat for each component the user provides an image for.

**Precondition:** User has provided an example image of the desired component look.

**Note on finding demos:** Demo files live in `src/dev/demos/` and may be in subdirectories (e.g., `src/dev/demos/Admin/TurnAlertsDemo.vue`). If the corresponding demo is not obvious, search with: `grep -r "ComponentName" src/dev/demos/` to find which demos import or use the component.

- [ ] **Step 1: Analyze the example image**

Read the user-provided image to understand the target design: colors, spacing, typography, structure, shadows, border radii, icons.

- [ ] **Step 2: Read the current component source**

Read the existing Vue component file (e.g., `src/components/dumb/shared/PropertyCard.vue`) to understand the current template structure, props, emits, and scoped styles.

- [ ] **Step 3: Read the corresponding demo**

Read the demo file to understand how the component is exercised with sample data. Demo locations:
- `PropertyCard.vue` → `src/dev/demos/PropertyCardDemo.vue`
- `TurnAlerts.vue` / `TurnPriorityBadge.vue` → `src/dev/demos/Admin/TurnAlertsDemo.vue`
- `ErrorAlert.vue` → `src/dev/demos/ErrorHandlingDemo.vue`
- `PWAStatusCard.vue` → `src/dev/demos/PWAStatusCardDemo.vue`
- `UpcomingCleanings.vue` → used in multiple demos; grep for it: `grep -r "UpcomingCleanings" src/dev/demos/`
- For any other component: `grep -r "ComponentName" src/dev/demos/`

- [ ] **Step 4: Open a `.pen` file for this component**

Use Pencil MCP tool `open_document(filePathOrNew=".worktrees/design-system/src/design/ComponentName.pen")` to create or open the `.pen` file for this specific component. This associates the design work with a file on disk.

- [ ] **Step 5: Create the design in Pencil**

Use Pencil MCP `batch_design` to create the component design in the `.pen` file based on the example image. Follow the guidelines retrieved in Task 3.

- [ ] **Step 6: Screenshot and validate the Pencil design**

Use Pencil MCP `get_screenshot` to visually verify the `.pen` design matches the user's example image. Adjust with additional `batch_design` calls if needed.

- [ ] **Step 7: Extract styling from Pencil output**

Use Pencil MCP `batch_get` to read the design node properties. Map the Pencil design tokens to:
- Vuetify component props and classes
- Scoped CSS custom properties
- Template structure changes (if layout differs)

- [ ] **Step 8: Check for theme conflicts**

Compare extracted colors/tokens against the existing Vuetify config in `src/plugins/vuetify.ts`:
- If colors match existing theme: use semantic color names (`primary`, `secondary`, etc.)
- If new colors needed for this component only: use scoped styles
- If new colors needed across multiple components: flag for user approval before modifying `vuetify.ts`
- Never modify domain-specific colors: `turn-urgent`, `turn-standard`, `booking-standard`

- [ ] **Step 9: Update the component (visual changes only)**

Edit the component file in the worktree (`.worktrees/design-system/src/components/...`). Modify only:
- `<template>` — layout structure, Vuetify classes, component props
- `<style scoped>` — CSS custom properties, spacing, colors, typography
- Do NOT modify `<script setup>` logic, props interface, or emits

- [ ] **Step 10: Validate in the demo viewer**

Start the dev server in the worktree if not running. Navigate to the component's demo page at `/dev/demos/<slug>`. Visually confirm the restyled component matches the example image.

- [ ] **Step 11: Run tests**

```bash
cd .worktrees/design-system && pnpm test:run
```

Expected: All tests still pass (visual-only changes should not break tests).

- [ ] **Step 12: Run build**

```bash
cd .worktrees/design-system && pnpm build
```

Expected: Build succeeds with no type errors.

- [ ] **Step 13: Commit**

```bash
cd .worktrees/design-system
git add src/components/ src/design/
git commit -m "style: restyle ComponentName to match design reference"
```

---

### Task 5: PR back to main

After a batch of components has been restyled and committed:

- [ ] **Step 1: Exclude `.pen` files from the PR**

Before creating the PR, ensure `.pen` files won't cause issues in production. The `src/design/` directory contains only `.pen` reference files — verify that no Vite config or glob pattern picks them up:

```bash
cd .worktrees/design-system && grep -r "src/design" vite.config.ts
```

Expected: No matches. If `src/design/` is referenced, add it to Vite's build excludes.

- [ ] **Step 2: Push the design-system branch**

```bash
cd .worktrees/design-system
git push -u origin design-system
```

- [ ] **Step 3: Create PR**

```bash
gh pr create --title "style: design system restyling — batch N" --body "$(cat <<'EOF'
## Summary
- Restyled N components to match design references using Pencil MCP
- Visual-only changes: template/CSS modifications, no logic changes
- All components validated via /dev/demos

## Components restyled
- [list of components]

## Test plan
- [ ] Verify each demo page renders correctly at /dev/demos
- [ ] Run pnpm test:run — all tests pass
- [ ] Run pnpm build — no type errors
- [ ] Visual review of each restyled component

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Review via demo pages**

Open the demo viewer and walk through each restyled component's demo page for final visual sign-off before merging.

---

## Cleanup

If the design work is complete or abandoned, remove the worktree:

```bash
# From the main repo root
git worktree remove .worktrees/design-system

# If the branch is no longer needed (after PR merge)
git branch -d design-system
```
