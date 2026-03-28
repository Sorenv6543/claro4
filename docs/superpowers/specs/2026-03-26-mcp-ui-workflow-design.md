# MCP UI/UX Workflow Design

**Date**: 2026-03-26
**Status**: Approved
**Goal**: Define a unified workflow for combining Chrome DevTools MCP, Vuetify MCP, and Context7 during UI/UX development work.

## Problem

Three MCP servers provide complementary capabilities for UI work, but without clear conventions Claude reaches for the wrong tool or guesses API details instead of looking them up. The user wants an automatic, proactive workflow where the right tool fires at the right time.

## Decision

**Approach 2: Workflow Doc** — Conventions written into CLAUDE.md so every session follows them automatically. No hooks or infrastructure needed.

### Workflow Phases

1. **Explore Phase** (before code): Chrome DevTools screenshot of current page state
2. **Research Phase** (before code): Vuetify MCP for component API, Context7 for FullCalendar/Vue docs — only look up what's needed
3. **Code Phase**: Write changes, then proactively screenshot to verify
4. **Debug Phase** (when off): Console messages, network requests, Vuetify prop verification

### Tool Routing

| Need | Tool | Identifier |
|------|------|------------|
| Vuetify 4 component API | `vuetify-mcp` | Direct tools (not Context7) |
| FullCalendar API | Context7 | `/fullcalendar/fullcalendar-docs` |
| Vue 3 patterns | Context7 | `/vuejs/core` |
| Visual verification | Chrome DevTools MCP | `chrome-devtools` |
| Console/network debug | Chrome DevTools MCP | `chrome-devtools` |

### Screenshot Policy

- **Before changes**: Always capture current state
- **After changes**: Proactively capture to verify — don't wait for user to ask
- **Not on every edit**: Only after meaningful visual changes

## Alternatives Considered

- **Approach 1 (Convention only)**: Rules in Claude's head, reset each session. Too ephemeral.
- **Approach 3 (Hooks)**: Auto-screenshot on every .vue edit via settings.json hooks. Too noisy and slow.

## Implementation

Rules added directly to `CLAUDE.md` under "MCP Workflow for UI/UX Development" section and "Context7 Library Quick Reference" subsection.
