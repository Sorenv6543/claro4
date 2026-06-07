# Codebase Structure

**Analysis Date:** 2026-03-09

## Directory Layout

```
[project-root]/
├── .agents/            # Agentic-workflow subagents and skills
├── .claude/            # Claude-specific skills and agents
├── .github/            # GitHub Actions workflows and templates
├── .planning/          # GSD planning and codebase mapping docs
├── design/             # Design handoffs, tokens, and prompts
├── docs/               # Technical references and documentation
├── e2e/                # Playwright end-to-end tests
├── public/             # Static assets (favicons, manifests)
├── scripts/            # Build, maintenance, and tool scripts
├── src/                # Application source code
│   ├── __tests__/      # Unit and component tests (co-located or centralized)
│   ├── assets/         # Images, fonts, and global assets
│   ├── components/     # Vue components (Smart vs. Dumb)
│   ├── composables/    # Business logic encapsulation (Vue composables)
│   ├── layouts/        # Role-specific page layouts
│   ├── pages/          # View components mapped to routes
│   ├── plugins/        # Library initializations (Vuetify, Supabase)
│   ├── router/         # Vue Router configuration and guards
│   ├── stores/         # Pinia state management
│   ├── styles/         # Global SCSS, variables, and themes
│   ├── types/          # TypeScript definitions
│   └── utils/          # Shared helpers and business logic rules
├── supabase/           # Database migrations, functions, and config
└── tests/              # Additional test utilities or data
```

## Directory Purposes

**src/components/:**
- Purpose: Houses all UI components, separated by complexity and role.
- Contains: `dumb/` (presentational) and `smart/` (data-aware).
- Key files: `smart/shared/FullCalendar.vue`, `dumb/shared/LoadingSpinner.vue`.

**src/composables/:**
- Purpose: Reusable reactive logic.
- Contains: `admin/`, `owner/`, `shared/`, `supabase/`.
- Key files: `supabase/useSupabaseAuth.ts`, `shared/useErrorHandler.ts`.

**src/pages/:**
- Purpose: Route entry points.
- Contains: `admin/`, `owner/`, `auth/`.
- Key files: `admin/Dashboard.vue`, `owner/Overview.vue`.

**src/stores/:**
- Purpose: Global state management.
- Contains: Pinia stores.
- Key files: `auth.ts`, `booking.ts`, `property.ts`.

**supabase/migrations/:**
- Purpose: Database schema evolution.
- Contains: SQL migration files.

## Key File Locations

**Entry Points:**
- `src/main.ts`: Application initialization and plugin mounting.
- `src/App.vue`: Root component with layout resolution.

**Configuration:**
- `vite.config.ts`: Vite build and plugin config.
- `package.json`: Dependency and script management.
- `tsconfig.json`: TypeScript compiler options.

**Core Logic:**
- `src/utils/businessLogic.ts`: Central source of truth for business rules.
- `src/plugins/supabase.ts`: Supabase client initialization.

**Testing:**
- `vitest.config.ts`: Vitest configuration.
- `src/__tests__/setup/setupTests.ts`: Global test environment setup and mocks.

## Naming Conventions

**Files:**
- Vue Components: PascalCase (e.g., `LoadingSpinner.vue`).
- Composables: camelCase with `use` prefix (e.g., `useSupabaseAuth.ts`).
- Stores: camelCase (e.g., `auth.ts`).
- Utils/Plugins: camelCase (e.g., `businessLogic.ts`).

**Directories:**
- Feature/Module folders: kebab-case (e.g., `check-schema-sync`).
- Logic folders: lowercase/camelCase (e.g., `smart`, `dumb`, `admin`).

## Where to Add New Code

**New Feature:**
- Primary code: `src/pages/[role]/[FeatureName].vue`.
- Tests: `src/__tests__/pages/[role]/[FeatureName].spec.ts`.
- Logic: `src/composables/[role]/use[FeatureName].ts`.

**New Component:**
- Implementation: `src/components/[smart|dumb]/[role|shared]/[ComponentName].vue`.
- Tests: `src/__tests__/components/[smart|dumb]/[ComponentName].spec.ts`.

**Utilities:**
- Shared helpers: `src/utils/[helperName].ts`.
- Business rules: `src/utils/businessLogic.ts`.

## Special Directories

**.agents/ & .claude/:**
- Purpose: Contain metadata, skills, and prompts for AI assistants.
- Generated: No (hand-crafted).
- Committed: Yes.

**dist/:**
- Purpose: Production build output.
- Generated: Yes.
- Committed: No.

---

*Structure analysis: 2026-03-09*
