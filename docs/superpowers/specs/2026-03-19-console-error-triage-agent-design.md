# Console Error Triage Agent — Design Spec

## Overview

A two-phase autonomous agent that scans all app routes on `localhost:3000` for console errors, failed network requests, and runtime exceptions, then traces Critical/High issues to source code and applies fixes.

**Approach**: Two-phase (scan then fix). Phase 1 collects a structured error manifest using Chrome DevTools MCP tools. Phase 2 traces errors to source files and applies targeted fixes.

## Agent Definition

The agent file at `.claude/agents/console-error-triage.md` uses standard frontmatter:

```markdown
---
name: console-error-triage
description: Scans all app routes on localhost:3000 for console errors, failed network requests, and runtime exceptions, then traces Critical/High issues to source code and applies fixes. Use after deployments, before releases, or when something feels broken.
---

You are a console error triage agent. [Full system prompt body follows...]
```

The spec below defines what goes into the system prompt body.

**Assumptions**:
- `localhost:3000` dev server is running
- Chrome browser is connected to Chrome DevTools MCP
- User has an active browser session (already logged in for authenticated routes)
- Agent will pause between role groups and ask user to switch accounts

## Route Scan Plan

**15 routes total**, scanned in 3 groups with auth pauses between groups.

### Auth (2 routes) — user must be logged out first
| Route | Page |
|-------|------|
| `/` | Login |
| `/auth/register` | Register |

### Owner (5 routes) — pause to log in as owner
| Route | Page |
|-------|------|
| `/owner/dashboard` | Owner dashboard with calendar |
| `/owner/bookings` | Booking list |
| `/owner/properties` | Property list |
| `/owner/profile` | Owner profile |
| `/owner/settings` | Owner settings |

### Admin (8 routes) — pause to switch to admin account
| Route | Page |
|-------|------|
| `/admin` | Admin dashboard |
| `/admin/schedule` | Schedule/calendar |
| `/admin/properties` | Property management |
| `/admin/bookings` | Booking management |
| `/admin/property-owners` | Owner management |
| `/admin/reports` | Reports |
| `/admin/cleaners` | Cleaner management |
| `/admin/users` | User management |

**Skipped routes**:
- `/owner/calendar` — redirects to `/owner/dashboard`
- `/owner/properties/:id` — needs real property ID, same component family
- `/admin/properties/:id` and `/admin/properties/:id/edit` — need real IDs, same component as index
- `/dev/demos` and `/lab` — dev-only routes, excluded from triage

## Phase 1: Scan Workflow

For each route, the agent performs a passive scan followed by deep interaction.

### 1a. Passive Scan
1. `navigate_page` to the route
2. Use `wait_for` to detect a known page element (e.g., `v-main` content, a heading, or route-specific text). Fall back to a 3-second timeout if no known element is available.
3. **Verify landing**: Use `evaluate_script` to read `window.location.pathname` and confirm it matches the intended route. If redirected, record a `redirect-detected` entry in the manifest and skip to the next route.
4. `list_console_messages` — capture all errors, warnings, logs
5. `list_network_requests` — capture all failed requests (4xx, 5xx, status 0)

### Auth Group Pre-check

Before scanning Auth routes, verify the browser is not authenticated:
1. Navigate to `/`
2. Check `window.location.pathname` — if redirected away from `/`, the user has an active session
3. If authenticated, ask the user to log out before proceeding with Auth route scanning

### 1b. Deep Interaction

The agent attempts contextual interactions based on visible elements, with safety guardrails:

| Element Type | Action | Safety Rule |
|-------------|--------|-------------|
| Buttons (`v-btn`) | Click each visible button | **Skip** buttons with destructive labels/icons (`delete`, `remove`, `mdi-delete`, `mdi-trash-can`) |
| Navigation items (`v-list-item`) | Click to trigger route/state changes | Only items within the current route's nav scope |
| Dialogs/modals | Open via trigger buttons, then close | Open and close only — do not complete dialog workflows |
| Forms | Trigger validation by clicking submit without filling fields | **Do not** fill forms with test data or submit with data |
| Data tables | Click sort headers, pagination if present | Read-only interactions only |
| Menus (`v-menu`) | Open/close | Open and close only |
| Keyboard | Use `press_key` for Escape to close dialogs | Only Escape key for dismissal |

After each interaction, re-collect console messages and network requests.

### 1c. Error Manifest Structure

All findings are accumulated into a single deduplicated manifest:

```json
{
  "scanDate": "2026-03-19",
  "routesScanned": 15,
  "errors": [
    {
      "severity": "critical | high | medium | low",
      "message": "TypeError: Cannot read properties of undefined...",
      "source": "OwnerDashboard.vue",
      "line": 42,
      "frequency": 1,
      "type": "console | network",
      "phase": "passive | interaction",
      "affectedRoutes": ["/owner/dashboard", "/owner/bookings"]
    }
  ]
}
```

Deduplicated by message + source. When deduplicating, normalize source file names by stripping hash suffixes and mapping Vite chunk names back to source components where possible (e.g., `OwnerDashboard-CxK3f2.js` → `OwnerDashboard.vue`).

### 1d. Error Handling

If any Chrome DevTools MCP call fails with a connection error (browser crash, tab closure), the agent:
1. Records the failure for the current route
2. Notes which routes remain unscanned
3. Presents partial results rather than aborting entirely

## Phase 2: Trace & Fix

### 2a. Severity Classification

| Severity | Criteria | Action |
|----------|----------|--------|
| **Critical** | Uncaught exceptions, CORS blocking core APIs, auth failures, Supabase RLS violations (403 with `code: "42501"` or PGRST errors indicating policy denial) | Fix immediately |
| **High** | Failed API calls (4xx/5xx), unhandled promise rejections, missing required resources (404), Supabase JWT errors (`JWTExpired`, `JWTInvalid`) | Fix immediately |
| **Medium** | Vue warnings (`[Vue warn]`), deprecations, non-critical 404s, Supabase PostgREST warnings | Report only |
| **Low** | Console.log noise, third-party errors, analytics failures, dev-only messages | Report only |

Only Critical and High issues proceed to the fix phase.

### 2b. Trace to Source

For each Critical/High error:
1. Parse the stack trace or network URL to identify the source file
2. `Grep` for the error origin in `src/` — match function names, API endpoints, component names
3. `Read` the relevant file to understand context
4. Identify root cause (missing null check, wrong URL, broken import, etc.)

### 2c. Apply Fix

- Use `Edit` to apply targeted fixes to source files
- Only fix issues the agent can confidently trace — if uncertain, report with analysis but don't modify code
- After all fixes, run `pnpm build` to verify no type errors were introduced
- If the dev server supports HMR, optionally re-scan affected routes to confirm fixed errors no longer appear. Note in the report whether re-verification was performed and the result.

### 2d. Final Report

Terminal summary grouped by severity:

```
## Console Error Triage — YYYY-MM-DD

Scanned: 15 routes | Errors: N | Fixed: N | Reported: N

### Critical (N) — FIXED
- [File:Line] Error message
  Fix: Description of what was changed

### High (N) — FIXED
- ...

### Medium (N)
- [File:Line] Warning message
  Impact: What this affects

### Low (N)
- ...
```

## Naming: Skill vs Agent

The existing skill at `.claude/skills/console-error-triage/` is the **single-page interactive** version — invoked manually on a specific URL.

This agent at `.claude/agents/console-error-triage.md` is the **multi-route autonomous** version — scans all routes, interacts deeply, and fixes issues. The agent does not invoke the skill; it contains its own complete workflow.

## Interaction with Existing Codebase

### Files the Agent Reads
- `src/components/smart/**/*.vue` — smart components for each route
- `src/composables/**/*.ts` — data fetching and business logic
- `src/stores/*.ts` — state management
- `src/router/index.ts` — route definitions (for context)

### Files the Agent May Edit
- Any file under `src/` that is the source of a Critical/High error
- Fixes follow existing code patterns (null guards, error handling, URL corrections)

### Validation
- `pnpm build` after all fixes to confirm type safety
- Agent does NOT run `pnpm test:run` — user should do that after reviewing fixes
