# Available Slash Commands

## Git & Version Control

| Command | Description |
| --- | --- |
| `/commit-commands:commit` | Create a git commit |
| `/commit-commands:commit-push-pr` | Commit, push, and open a PR |
| `/commit-commands:clean_gone` | Clean up local branches marked as `[gone]` (deleted on remote), including associated worktrees |

## Code Review

| Command | Description |
| --- | --- |
| `/review` | Review a pull request |
| `/pr-review-toolkit:review-pr` | Comprehensive PR review using specialized agents |
| `/code-review:code-review` | Code review a pull request |
| `/security-review` | Complete a security review of pending changes on the current branch |

## Planning & Execution

| Command | Description |
| --- | --- |
| `/superpowers:brainstorming` | Explore user intent, requirements, and design before implementation. Use before any creative work |
| `/superpowers:writing-plans` | Write a multi-step implementation plan from a spec or requirements, before touching code |
| `/superpowers:executing-plans` | Execute a written implementation plan in a separate session with review checkpoints |
| `/superpowers:subagent-driven-development` | Execute implementation plans with independent tasks using parallel agents |
| `/superpowers:dispatching-parallel-agents` | Run 2+ independent tasks in parallel without shared state |

## Development Workflow

| Command | Description |
| --- | --- |
| `/superpowers:test-driven-development` | TDD workflow: write tests before implementation code |
| `/superpowers:systematic-debugging` | Structured debugging for any bug, test failure, or unexpected behavior |
| `/superpowers:verification-before-completion` | Verify work is actually complete before claiming success |
| `/superpowers:using-git-worktrees` | Create isolated git worktrees for feature work |
| `/superpowers:finishing-a-development-branch` | Guide completion of dev work: merge, PR, or cleanup options |
| `/superpowers:requesting-code-review` | Request code review after completing tasks or major features |
| `/superpowers:receiving-code-review` | Handle incoming code review feedback with technical rigor |
| `/simplify` | Review changed code for reuse, quality, and efficiency, then fix issues |

## UI & Frontend

| Command | Description |
| --- | --- |
| `/ui-designer` | Design/generate Vue 3 + Vuetify 4 UI components, screens, layouts, or mockups |
| `/frontend-design:frontend-design` | Create distinctive, production-grade frontend interfaces with high design quality |
| `/new-component` | Scaffold a new Vue component in the correct smart/dumb directory for a given role |
| `/pencil-vuetify-sync` | Design-to-code scaffolding and sync using Pencil.dev `.pen` files as the visual source of truth |

## Performance & Debugging

| Command | Description |
| --- | --- |
| `/console-error-triage` | Scan pages for console errors, failed network requests, and runtime exceptions |
| `/cls-debugging` | Investigate Cumulative Layout Shift and visual instability |
| `/memory-leak-detection` | Investigate memory leaks, growing heap, detached DOM nodes, zombie listeners |
| `/performance-audit` | Audit overall page performance, Core Web Vitals, network waterfalls |
| `/spa-route-performance` | Measure SPA route navigation performance and lazy-loaded chunk sizes |

## Chrome DevTools

| Command | Description |
| --- | --- |
| `/chrome-devtools-mcp:chrome-devtools` | Browser automation, debugging, performance analysis, network inspection via Chrome DevTools MCP |
| `/chrome-devtools-mcp:chrome-devtools-cli` | Write shell scripts or run CLI commands to automate Chrome DevTools tasks |
| `/chrome-devtools-mcp:a11y-debugging` | Accessibility auditing: semantic HTML, ARIA, focus states, keyboard nav, contrast |
| `/chrome-devtools-mcp:debug-optimize-lcp` | Debug and optimize Largest Contentful Paint (LCP) |
| `/chrome-devtools-mcp:troubleshooting` | Troubleshoot Chrome DevTools MCP connection and target issues |

## Configuration & Setup

| Command | Description |
| --- | --- |
| `/update-config` | Configure Claude Code settings: hooks, permissions, env vars, settings.json |
| `/keybindings-help` | Customize keyboard shortcuts and keybindings |
| `/statusline` | Set up Claude Code's status line UI |
| `/init` | Initialize a new CLAUDE.md file with codebase documentation |

## CLAUDE.md Management

| Command | Description |
| --- | --- |
| `/claude-md-management:revise-claude-md` | Update CLAUDE.md with learnings from the current session |
| `/claude-md-management:claude-md-improver` | Audit and improve CLAUDE.md files in repositories |

## Hooks

| Command | Description |
| --- | --- |
| `/hookify:hookify` | Create hooks to prevent unwanted behaviors from conversation analysis or explicit instructions |
| `/hookify:configure` | Enable or disable hookify rules interactively |
| `/hookify:list` | List all configured hookify rules |
| `/hookify:help` | Get help with the hookify plugin |
| `/hookify:writing-rules` | Guidance on hookify rule syntax and patterns |

## Skills & Automation

| Command | Description |
| --- | --- |
| `/skill-creator:skill-creator` | Create new skills, modify existing skills, run evals, benchmark performance |
| `/superpowers:writing-skills` | Create, edit, or verify skills before deployment |
| `/claude-api` | Build, debug, and optimize Claude API / Anthropic SDK apps |
| `/loop` | Run a prompt or slash command on a recurring interval (e.g., `/loop 5m /foo`) |
| `/schedule` | Create, update, list, or run scheduled remote agents on a cron schedule |

## Analytics

| Command | Description |
| --- | --- |
| `/insights` | Generate a report analyzing your Claude Code sessions |
| `/team-onboarding` | Help teammates ramp on Claude Code with a guide from your usage |

## Deprecated (use replacements)

| Command | Replacement |
| --- | --- |
| `/superpowers:brainstorm` | `/superpowers:brainstorming` |
| `/superpowers:execute-plan` | `/superpowers:executing-plans` |
| `/superpowers:write-plan` | `/superpowers:writing-plans` |
