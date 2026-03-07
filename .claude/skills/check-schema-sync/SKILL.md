---
name: check-schema-sync
description: Check that src/types/ TypeScript definitions match the Supabase schema in supabase/migrations/. Run before PRs or after touching migrations.
disable-model-invocation: true
---

Invoke the `schema-sync-reviewer` agent to cross-reference migrations against TypeScript types.

After the agent reports:
1. Show a summary: total mismatches found, severity breakdown
2. For each mismatch, offer to fix it immediately
3. After all fixes, run `pnpm build` to confirm `vue-tsc --noEmit` passes
4. If the build passes with no errors, confirm sync is complete
