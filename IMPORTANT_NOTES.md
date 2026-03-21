# Personal Claude Workflow

## Question
After making many changes to my codebase and being happy with them, should I run a commit and then a PR and have you review it? Or should I make a large plan.md commit and changes then implement the plan, commit it after, push, ask for a PR then have you review it?

## Answer
The answer depends on the size of what you're building:

### Small Changes / Bug Fixes
**What you've been doing today:**

```
implement → pnpm test:run + pnpm build → commit → push → done
```

- No PR needed
- Review is optional and most useful before pushing if you're unsure

### Large Feature
**New page, new domain concept, significant refactor:**

```
/superpowers:brainstorming → /superpowers:writing-plans → implement → commit chunks as you go → push → PR → /coderabbit:code-review or ask me to review
```

- The plan goes in a `plans/` or `docs/` file, not committed to main — it's a working document, not part of the codebase
- **Commit the code, not the plan**

## Key Rules

**The key rule:** Commit early and often during implementation (one logical unit at a time), not in one giant commit at the end. This makes review useful — a 500-line single commit is hard to review meaningfully.

### When to Ask for Review

- Before pushing a feature branch (catch issues before they're in main)
- When you're unsure about an architectural decision
- After a complex refactor touching stores/composables/router

### When NOT to Bother

- Simple bug fixes where the change is obvious
- Adding a new dumb component that's self-contained
- Documentation / CLAUDE.md updates

## Your Setup Flow

Since you have Vercel and the `commit-commands:commit-push-pr` skill available:

```
brainstorm → write plan → implement → /commit-commands:commit-push-pr → ask me to review the PR
```