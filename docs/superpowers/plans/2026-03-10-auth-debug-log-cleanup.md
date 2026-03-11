# Auth Debug Log Cleanup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove leftover `[Auth Debug]` console logs from `useSupabaseAuth.ts` and gate the Supabase startup logs in `supabase.ts` behind `import.meta.env.DEV`.

**Architecture:** Pure cleanup — no logic changes. Two files, four log calls removed or gated. The `isAuthenticated` computed currently logs on every access (every route guard check, every template render); removing the log stops the console spam. Startup logs in `supabase.ts` are useful during development but should not appear in production.

**Tech Stack:** Vue 3, Vite (`import.meta.env.DEV` for dev-only guards)

---

## Chunk 1: Remove debug logs

### Task 1: Gate startup logs in `src/plugins/supabase.ts`

**Files:**
- Modify: `src/plugins/supabase.ts:16` and `src/plugins/supabase.ts:49`

- [ ] **Step 1: Wrap both startup logs in `import.meta.env.DEV`**

In `src/plugins/supabase.ts`, change line 16:

```typescript
// Before
console.log('🔗 Connecting to Supabase:', supabaseUrl);

// After
if (import.meta.env.DEV) console.log('🔗 Connecting to Supabase:', supabaseUrl);
```

And the connection-success log at line 49:

```typescript
// Before
console.log('✅ Supabase connected successfully. Auth service operational.');

// After
if (import.meta.env.DEV) console.log('✅ Supabase connected successfully. Auth service operational.');
```

- [ ] **Step 2: Verify build still passes**

```bash
pnpm build
```

Expected: `✓ built in X.XXs` — no TypeScript errors.

---

### Task 2: Remove `[Auth Debug]` logs from `src/composables/supabase/useSupabaseAuth.ts`

**Files:**
- Modify: `src/composables/supabase/useSupabaseAuth.ts:14-23` (isAuthenticated computed)
- Modify: `src/composables/supabase/useSupabaseAuth.ts:39-41` (auth state change handler)

- [ ] **Step 3: Remove log from `isAuthenticated` computed (line 16)**

```typescript
// Before
const isAuthenticated = computed(() => {
  const authenticated = !!session.value && !!user.value;
  console.log('[Auth Debug] isAuthenticated check:', {
    session: !!session.value,
    user: !!user.value,
    authenticated,
    userRole: user.value?.role
  });
  return authenticated;
});

// After
const isAuthenticated = computed(() => {
  return !!session.value && !!user.value;
});
```

- [ ] **Step 4: Remove log from `onAuthStateChange` handler (line 40)**

```typescript
// Before
supabase.auth.onAuthStateChange(async (event, newSession) => {
  console.log('[Auth Debug] Auth state changed:', { event, userId: newSession?.user?.id });
  // ...

// After
supabase.auth.onAuthStateChange(async (event, newSession) => {
  // ...
```

- [ ] **Step 5: Run tests**

```bash
pnpm test:run
```

Expected: `102 passed (102)` — all green.

- [ ] **Step 6: Run build**

```bash
pnpm build
```

Expected: `✓ built in X.XXs` — no errors.

- [ ] **Step 7: Commit**

```bash
git add src/plugins/supabase.ts src/composables/supabase/useSupabaseAuth.ts
git commit -m "fix: remove auth debug logs, gate startup logs behind DEV flag"
```
