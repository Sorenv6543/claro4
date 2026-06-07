# Coding Conventions

**Analysis Date:** 2026-03-09

## Naming Patterns

**Files:**
- Vue SFCs: `PascalCase.vue` (e.g., `LoadingSpinner.vue`)
- Composables: `useCamelCase.ts` (e.g., `useSupabaseAuth.ts`)
- Stores/Utils: `camelCase.ts` (e.g., `businessLogic.ts`)

**Functions:**
- Use camelCase for regular functions and actions.
- Use `use` prefix for composables.
- Use descriptive verbs: `calculateBookingPriority`, `validateBooking`.

**Variables:**
- Use camelCase for local variables and reactive refs.
- Use PascalCase for Type/Interface definitions.
- Use SCREAMING_SNAKE_CASE for constants (e.g., `VITE_SUPABASE_URL`).

**Types:**
- Interfaces: `IPascalCase` or `PascalCase` (project uses both, but `PascalCase` is more common in Vue 3).
- Enums: `PascalCase`.

## Code Style

**Formatting:**
- Prettier managed via `.prettierrc`.
- Use 2-space indentation.
- No semi-colons (standard JS style).
- Single quotes for strings.

**Linting:**
- ESLint with `eslint-plugin-vue` and `eslint-config-vuetify`.
- Strict TypeScript checking enforced by `vue-tsc`.

## Import Organization

**Order:**
1. External libraries (e.g., `vue`, `pinia`, `vuetify`).
2. Internal aliases (`@/components`, `@/composables`, etc.).
3. Relative path imports.
4. Assets and styles.

**Path Aliases:**
- `@`: `src/`
- `@components`: `src/components/`
- `@composables`: `src/composables/`
- `@stores`: `src/stores/`
- `@utils`: `src/utils/`
- `@types`: `src/types/`

## Error Handling

**Patterns:**
- Use the `useErrorHandler` composable for consistent UI feedback.
- Wrap async operations in try-catch blocks with Supabase rollback logic for optimistic updates.
- Centralize business rule validation in `src/utils/businessLogic.ts`.

## Logging

**Framework:** Sentry for production; `console.info`/`warn`/`error` for development.

**Patterns:**
- Log operational errors to Sentry.
- Avoid verbose `console.log` in production builds (handled by Sentry filtering in `main.ts`).

## Comments

**When to Comment:**
- Use comments to explain the "why" behind complex business logic or workarounds.
- Document Supabase RLS dependencies or specific browser hacks (e.g., iPhone SE specific CSS).

**JSDoc/TSDoc:**
- Encouraged for shared utilities and complex composables to improve IDE autocomplete and developer onboarding.

## Function Design

**Size:** Aim for small, single-responsibility functions. Extract complex logic into helpers or composables.

**Parameters:** Prefer named parameters (object destructuring) for functions with more than three arguments to improve readability.

**Return Values:** Consistent return types, typically using objects in composables to allow flexible destructuring.

## Module Design

**Exports:**
- Named exports preferred for utilities and types.
- Default export used for Vue components and some plugins.

**Barrel Files:**
- Used sparingly (e.g., `src/router/guards.ts` may group related guards).

---

*Convention analysis: 2026-03-09*
