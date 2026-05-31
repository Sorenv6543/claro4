# Claude Code Skills Reference

All available skills for this session. Invoke with `/skill-name` in the prompt.
Namespaced skills (e.g. `claude-mem:mem-search`) are invoked as `/claude-mem:mem-search`.

---

## Project Management (GSD)

GSD = "Get Stuff Done" — a structured workflow system for planning and executing software projects.

| Skill | Description | How to use |
|-------|-------------|------------|
| `/gsd-new-project` | Kick off a brand-new project: generates roadmap, milestones, and initial phase plan. | Start of a greenfield project. |
| `/gsd-new-milestone` | Define a new milestone within an existing project. | When adding a major new goal to an existing project. |
| `/gsd-phase` | Show current phase status, tasks, and next steps. | Check where you are in the current phase. |
| `/gsd-plan-phase` | Plan a phase in detail: breaks goals into tasks with dependencies. | Before starting a new phase of work. |
| `/gsd-execute-phase` | Execute the current phase plan step by step with atomic commits. | After planning a phase, ready to build. |
| `/gsd-ultraplan-phase` | Deeper planning pass with multi-agent research before planning. | Complex phases that need extra upfront research. |
| `/gsd-spec-phase` | Write a technical spec for a phase before implementing. | When a phase needs a formal spec doc first. |
| `/gsd-ui-phase` | Plan and execute a UI-focused phase with design contract. | Building or reworking a frontend feature. |
| `/gsd-ai-integration-phase` | Plan an AI/LLM feature phase with eval strategy. | Adding AI features to the app. |
| `/gsd-mvp-phase` | Rapid MVP execution — speed over perfection. | When you need something shipped fast. |
| `/gsd-secure-phase` | Audit and fix security issues in a phase. | Before shipping, security hardening. |
| `/gsd-discuss-phase` | Brainstorm and discuss a phase before committing to a plan. | When unsure how to approach a phase. |
| `/gsd-progress` | Show progress across all phases and milestones. | Weekly check-in on overall project health. |
| `/gsd-health` | Audit the project for technical debt, test coverage, and quality issues. | Periodic health check. |
| `/gsd-milestone-summary` | Summarize what was accomplished in a milestone. | After completing a milestone. |
| `/gsd-complete-milestone` | Mark a milestone as done and prep the next one. | Milestone completion ceremony. |
| `/gsd-resume-work` | Resume from a saved checkpoint after a break. | Coming back to work after time away. |
| `/gsd-pause-work` | Save current state and context for later resumption. | Ending a work session cleanly. |
| `/gsd-update` | Write a progress update or status report. | Standup notes, PR descriptions, stakeholder updates. |
| `/gsd-review` | Review work done in a phase or session for quality. | End-of-phase review. |
| `/gsd-review-backlog` | Review and prioritize the current backlog. | Backlog grooming. |
| `/gsd-verify-work` | Verify that completed work actually meets the phase goal. | Before marking a phase done. |
| `/gsd-validate-phase` | Validate a phase plan before execution starts. | Sanity check a plan before building. |
| `/gsd-ship` | Prepare and ship a release: changelog, tags, deployment steps. | Release day. |
| `/gsd-pr-branch` | Create a PR branch from current work with a proper description. | Submitting work for review. |
| `/gsd-undo` | Undo the last GSD action or revert a phase change. | Made a mistake, need to roll back. |
| `/gsd-cleanup` | Clean up stale branches, old files, and dead code after a phase. | Post-phase housekeeping. |
| `/gsd-import` | Import an existing codebase into the GSD system. | Adopting GSD on an existing project. |
| `/gsd-ingest-docs` | Ingest planning docs (PRDs, ADRs, specs) into the GSD context. | Loading existing documentation. |
| `/gsd-map-codebase` | Generate a structured map of the codebase architecture. | Understanding a new or complex codebase. |
| `/gsd-explore` | Explore the codebase to answer a specific question. | "Where is X defined / how does Y work?" |
| `/gsd-forensics` | Investigate a mystery: why does X behave this way? Trace history. | Debugging strange behavior with git archaeology. |
| `/gsd-spike` | Run a time-boxed technical spike to de-risk an unknown. | "Can we even do X?" feasibility check. |
| `/gsd-sketch` | Sketch a rough implementation idea before committing to it. | Whiteboard-style thinking on paper. |
| `/gsd-stats` | Show project stats: commits, test coverage, bundle size, etc. | Quick metrics overview. |
| `/gsd-surface` | Surface hidden risks, assumptions, and gaps in the current plan. | Risk review before committing. |
| `/gsd-debug` | Start a structured multi-cycle debug session with checkpoints. | When stuck on a hard bug. |
| `/gsd-add-tests` | Add tests for existing code that lacks coverage. | Improving test coverage on working code. |
| `/gsd-docs-update` | Update project documentation to reflect recent changes. | Keeping docs in sync after a phase. |
| `/gsd-extract-learnings` | Extract lessons learned from a session into reusable knowledge. | Post-mortem / retro. |
| `/gsd-profile-user` | Analyze past session behavior to build a developer profile. | Understanding working style patterns. |
| `/gsd-inbox` | Process incoming tasks, issues, or requests into the backlog. | Triaging new work. |
| `/gsd-workstreams` | Manage parallel workstreams across multiple features. | When running multiple tracks simultaneously. |
| `/gsd-workspace` | Show current workspace state: active phase, recent changes. | Quick orientation. |
| `/gsd-manager` | Run GSD in manager mode: delegate and track work. | Orchestrating multiple agents. |
| `/gsd-autonomous` | Run GSD autonomously without prompting. | Fully automated execution. |
| `/gsd-fast` | Fast-mode GSD: skip ceremony, just execute. | Speed-optimized execution. |
| `/gsd-quick` | Quick one-off task outside the normal GSD flow. | Small tasks that don't need a full phase. |
| `/gsd-config` | Configure GSD settings and preferences. | Customizing GSD behavior. |
| `/gsd-settings` | View and edit GSD project settings. | Project-level configuration. |
| `/gsd-capture` | Capture an idea, decision, or observation to memory. | Saving something important mid-session. |
| `/gsd-thread` | Start a focused sub-thread on a specific topic. | Deep-diving without losing main context. |
| `/gsd-graphify` | Generate a diagram or visual from code or data. | Visualizing architecture or data flow. |
| `/gsd-eval-review` | Review AI eval coverage against the implementation. | Auditing AI feature quality. |
| `/gsd-audit-fix` | Find and fix issues flagged in an audit. | Post-audit remediation. |
| `/gsd-audit-milestone` | Audit an entire milestone for quality and completeness. | Milestone-level QA pass. |
| `/gsd-audit-uat` | Run user acceptance testing checklist for a milestone. | Pre-release UAT. |
| `/gsd-plan-review-convergence` | Review multiple plans and converge on the best one. | When multiple approaches need comparison. |
| `/gsd-ui-review` | Audit the UI against design specs and accessibility. | UI quality review. |

---

## GSD Narrative / Structured (NS) variants

Structured conversation modes within GSD for specific decision types.

| Skill | Description | How to use |
|-------|-------------|------------|
| `/gsd-ns-context` | Set context for a structured GSD conversation. | Opening a structured discussion. |
| `/gsd-ns-ideate` | Brainstorm ideas in a structured format. | Generating options before deciding. |
| `/gsd-ns-manage` | Manage tasks and priorities in narrative mode. | Conversational task management. |
| `/gsd-ns-project` | Discuss project-level decisions in structured format. | Project strategy conversations. |
| `/gsd-ns-review` | Structured review conversation. | Code or design review dialogue. |
| `/gsd-ns-workflow` | Discuss and design a workflow. | Planning automation or process flows. |

---

## Claro4 Project-Specific

These skills are built specifically for this codebase.

| Skill | Description | How to use |
|-------|-------------|------------|
| `/claro-design` | Reference for Claro4's design system: tokens, colors, spacing, component patterns. | Before building any UI component. |
| `/claro4-business-logic` | API reference for `businessLogic.ts`: booking rules, priority calculation, conflict detection. | Before writing any booking/cleaning logic. |
| `/claro4-typescript` | TypeScript error patterns, type locations, and Supabase-to-app type mapping for Claro4. | When fixing type errors in this codebase. |
| `/claro4-vuetify` | Vuetify usage rules for Claro4: elevation, radius, variants, component patterns. | Before writing any Vuetify component code. |
| `/new-component` | Scaffold a new Vue component following Claro4's smart/dumb pattern. | Creating a new component from scratch. |
| `/run-claro4` | Start the Claro4 dev server and open Chrome with remote debugging. | Starting the app for development. |
| `/killchrome` | Kill all Chrome processes and free ports 3000–3002. | When Chrome is locked up or ports are blocked. |
| `/openchrome` | Launch Chrome with remote debugging on port 9222. | Required before using chrome-devtools MCP. |
| `/console-error-triage` | Scan all routes for console errors and runtime exceptions, trace to source. | After deployments or when something feels broken. |
| `/performance-audit` | Audit bundle size, load time, and render performance. | Before a release or when the app feels slow. |
| `/spa-route-performance` | Analyze per-route performance and chunk loading. | When specific routes are slow. |
| `/memory-leak-detection` | Hunt for Vue component memory leaks and subscription cleanup issues. | When memory usage grows over time. |
| `/cls-debugging` | Debug Claro4-specific layout shift and styling issues. | When CSS or layout is broken. |
| `/supabase` | Supabase workflow guide: migrations, RLS, queries, realtime for Claro4. | Before writing any Supabase integration code. |
| `/supabase-postgres-best-practices` | Postgres best practices for Supabase: indexes, RLS patterns, query optimization. | When designing or optimizing DB queries. |

---

## Code Quality & Review

| Skill | Description | How to use |
|-------|-------------|------------|
| `/code-review` | Review the current diff for bugs and simplification opportunities. Add `--fix` to auto-apply. | Before committing or opening a PR. `/ code-review --fix` to auto-apply. |
| `/code-review:code-review` | Full PR code review with inline comments. | Reviewing a GitHub PR. |
| `/simplify` | Review recently changed code for reuse/simplification and apply fixes. | After writing a chunk of code. |
| `/verify` | Run the app and manually verify a change works end-to-end. | Confirming a fix actually works in the real app. |
| `/security-review` | Review Supabase RLS, auth guards, and data-fetching for security issues. | Before shipping auth or data changes. |
| `/pr-review-toolkit:review-pr` | Full PR review: bugs, tests, types, silent failures, style. | Pre-merge PR review. |
| `/systematic-debugging` | Apply the systematic debugging process (root cause first, no guessing). | Any time you're stuck on a bug. |
| `/superpowers:systematic-debugging` | Same as above — the canonical version from superpowers plugin. | Bug investigation. |
| `/gsd-debug` | Multi-cycle debug session with checkpoints and specialist agents. | Hard bugs that need multiple investigation cycles. |

---

## Memory (claude-mem)

Cross-session memory tools. Observations from past sessions are stored and searchable.

| Skill | Description | How to use |
|-------|-------------|------------|
| `/claude-mem:mem-search` | Search past session observations by keyword, date, or type. | "Did we fix this before?" / "What did we decide about X?" |
| `/claude-mem:learn-codebase` | Read and index the codebase into memory for future sessions. | Onboarding to a new project. |
| `/claude-mem:smart-explore` | Explore the codebase and save structured observations to memory. | Deep-dive exploration with persistence. |
| `/claude-mem:make-plan` | Draft a plan and save it to memory for future sessions. | Planning across sessions. |
| `/claude-mem:do` | Execute a task using memory context from past sessions. | Task execution with full historical context. |
| `/claude-mem:how-it-works` | Explain how a system works using past observations + live code. | "How does the auth flow work?" |
| `/claude-mem:knowledge-agent` | Build a queryable knowledge base from observation history. | Synthesized answers from past work. |
| `/claude-mem:pathfinder` | Find the code path for a specific behavior or user action. | Tracing "what happens when user does X". |
| `/claude-mem:oh-my-issues` | Summarize open issues and bugs from memory. | Issue triage from past findings. |
| `/claude-mem:babysit` | Monitor a long-running task and log progress to memory. | Watching a slow build, test run, or deploy. |
| `/claude-mem:timeline-report` | Generate a timeline of work done across sessions. | Progress report / retrospective. |
| `/claude-mem:weekly-digests` | Generate a weekly digest of all session work. | Weekly standup or stakeholder update. |
| `/claude-mem:design-is` | Record a design decision to memory with rationale. | ADR-style decision logging. |
| `/claude-mem:version-bump` | Bump the project version and update changelog from memory. | Release prep. |
| `/claude-mem:wowerpoint` | Generate a presentation from memory observations. | Stakeholder demo prep. |

---

## Superpowers (Meta-skills)

Process skills that govern HOW to work, not what to build.

| Skill | Description | How to use |
|-------|-------------|------------|
| `/superpowers:brainstorming` | Structured brainstorm before entering plan mode. | Before `/plan` on any complex task. |
| `/superpowers:writing-plans` | Write high-quality, executable implementation plans. | When drafting a plan for a complex feature. |
| `/superpowers:executing-plans` | Execute a plan with atomic commits and deviation handling. | Running a multi-step plan. |
| `/superpowers:test-driven-development` | TDD workflow: write failing test first, then implement. | Any new feature or bug fix. |
| `/superpowers:verification-before-completion` | Verify work actually works before declaring done. | End of any task. |
| `/superpowers:requesting-code-review` | Request and prepare for a code review. | Before asking for a review. |
| `/superpowers:receiving-code-review` | Process and respond to code review feedback. | After getting review comments. |
| `/superpowers:finishing-a-development-branch` | Checklist for finishing a branch: tests, build, docs, PR. | Before opening a PR. |
| `/superpowers:dispatching-parallel-agents` | Launch multiple agents in parallel for independent tasks. | When multiple independent tasks can run at once. |
| `/superpowers:subagent-driven-development` | Delegate implementation to specialized subagents. | Complex tasks that benefit from parallel work. |
| `/superpowers:using-git-worktrees` | Use git worktrees for parallel isolated development. | Working on multiple features simultaneously. |
| `/superpowers:using-superpowers` | Introduction to the skills system itself. | If you're confused about how skills work. |
| `/superpowers:writing-skills` | Create a new skill for this project. | Automating a repeated workflow. |

---

## Figma

| Skill | Description | How to use |
|-------|-------------|------------|
| `/figma:figma-use` | **Required** before calling Figma MCP tools. Sets up the Figma workflow. | Always invoke first when doing any Figma work. |
| `/figma:figma-generate-design` | Translate an app page or layout into a Figma design. | Code-to-design: push a page into Figma. |
| `/figma:figma-generate-library` | Build a design system / component library in Figma from code. | Syncing the codebase components into Figma. |
| `/figma:figma-code-connect` | Map Figma components to codebase components (Code Connect). | Linking Figma and code for handoff. |
| `/figma:figma-create-new-file` | Create a new Figma file. | Starting a new design file. |
| `/figma:figma-generate-diagram` | Generate a diagram in FigJam. | Architecture or flow diagrams in Figma. |
| `/figma:figma-use-figjam` | Work with FigJam boards. | Collaborative diagrams and workshops. |
| `/figma:figma-use-slides` | Create Figma Slides presentations. | Presentation decks in Figma. |
| `/frontend-design:frontend-design` | Create polished, production-grade frontend UI. | Building high-quality UI components and pages. |

---

## Sentry

| Skill | Description | How to use |
|-------|-------------|------------|
| `/sentry:seer` | Use Sentry's AI (Seer) to analyze and fix an error. | When investigating a Sentry error. |
| `/sentry:sentry-sdk-setup` | Set up Sentry SDK in the project. | Initial Sentry integration. |
| `/sentry:sentry-feature-setup` | Configure specific Sentry features (replay, profiling, etc.). | Enabling advanced Sentry capabilities. |
| `/sentry:sentry-workflow` | Full Sentry workflow: find issue → analyze → fix → verify. | End-to-end error resolution. |

---

## Supabase

| Skill | Description | How to use |
|-------|-------------|------------|
| `/supabase:supabase` | Supabase workflow: schema, RLS, queries, auth, realtime. | Any Supabase integration work. |
| `/supabase:supabase-postgres-best-practices` | Postgres best practices for Supabase projects. | Schema design and query optimization. |

---

## Dev Tooling & Automation

| Skill | Description | How to use |
|-------|-------------|------------|
| `/commit-commands:commit` | Stage and commit changes with a well-formed message. | Making a commit. |
| `/commit-commands:commit-push-pr` | Commit, push, and open a PR in one flow. | Full PR creation workflow. |
| `/commit-commands:clean_gone` | Delete local branches whose remote has been deleted. | Branch cleanup after merges. |
| `/run` | Start this project's app and verify a change works. | Confirming a feature works in the real app. |
| `/init` | Initialize Claude Code for a new project. | First-time setup in a new repo. |
| `/review` | Review recent changes for correctness. | Quick review before committing. |
| `/loop` | Run a command on a recurring interval. | `/ loop 5m /gsd-health` — periodic checks. |
| `/schedule` | Schedule a remote agent on a cron schedule. | Automated recurring tasks. |
| `/fewer-permission-prompts` | Scan transcripts and add allowlisted commands to reduce prompts. | When permission dialogs are slowing you down. |
| `/update-config` | Configure Claude Code settings.json (hooks, permissions, env vars). | "Allow X", "run Y before each commit", etc. |
| `/keybindings-help` | Customize keyboard shortcuts in Claude Code. | Rebinding keys or adding chord shortcuts. |
| `/claude-hud:setup` | Set up the Claude HUD status overlay. | Visual status display in the terminal. |
| `/claude-hud:configure` | Configure the Claude HUD display options. | Customizing the HUD. |
| `/claude-api` | Build, debug, and optimize Claude API / Anthropic SDK apps. | Any code using `anthropic` / `@anthropic-ai/sdk`. |

---

## MCP Server Development

| Skill | Description | How to use |
|-------|-------------|------------|
| `/mcp-server-dev:build-mcp-server` | Build a new MCP server from scratch. | Creating a custom MCP integration. |
| `/mcp-server-dev:build-mcp-app` | Build a full app powered by MCP. | MCP-first application development. |
| `/mcp-server-dev:build-mcpb` | Build with the mcpb framework. | MCP builder framework workflow. |
| `/skill-creator:skill-creator` | Create a new skill for Claude Code. | Packaging a workflow into a reusable skill. |
| `/claude-code-setup:claude-automation-recommender` | Analyze codebase and recommend hooks, subagents, skills, and MCP servers. | "What Claude Code automations should I set up?" |

---

## Tips

- **Namespaced skills** like `claude-mem:mem-search` are invoked as `/claude-mem:mem-search`
- **Claude invokes skills automatically** when it recognizes a match — you don't always need to type the slash command
- **Project-specific skills** (claro4-*, run-claro4, etc.) only apply in this project
- **Superpowers skills** are process skills — Claude checks for them before every task
- **GSD skills** work best together: `/gsd-plan-phase` → `/gsd-execute-phase` → `/gsd-verify-work`
