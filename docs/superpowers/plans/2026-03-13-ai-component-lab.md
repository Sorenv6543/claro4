# AI Component Lab Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dev-only `/lab` page in the `ui-mockups` worktree where Claude writes `.vue` files into `src/ai-mockups/`, Vite HMR reloads them instantly, and the shell renders the selected component using the real Vuetify 4 theme + Tailwind CSS utilities.

**Architecture:** A bare-layout page (`src/pages/lab/index.vue`) uses `import.meta.glob` to auto-discover all `.vue` files under `src/ai-mockups/`, renders the selected one via `defineAsyncComponent`, and catches runtime errors with `onErrorCaptured`. Tailwind CSS is scoped exclusively to `src/ai-mockups/` and `src/pages/lab/` to keep the main bundle clean.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Vuetify 4, Tailwind CSS 3 (preflight disabled), Vite `import.meta.glob`, `defineAsyncComponent`

**Working directory:** `C:/Users/Soren/claro4-ui-mockups`

**State summary (already done — do NOT redo):**
- `package.json` has `"type": "module"` ✅
- `src/router/guards.ts` — both `authGuard` and `developmentGuard` cover `/lab` ✅
- `tsconfig.json` — `"src/ai-mockups"` and `"src/pages/lab"` in `exclude` ✅
- `src/styles/` directory exists ✅

---

## Chunk 1: Tailwind CSS Setup

### Task 1: Install Tailwind dependencies

**Files:** none created/modified yet

- [ ] **Step 1: Install packages**

```bash
cd C:/Users/Soren/claro4-ui-mockups
pnpm add -D tailwindcss postcss autoprefixer
```

Expected: packages appear in `package.json` devDependencies, `pnpm-lock.yaml` updated.

- [ ] **Step 2: Verify install**

```bash
pnpm list tailwindcss postcss autoprefixer
```

Expected: all three listed with version numbers.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add tailwindcss postcss autoprefixer for AI lab"
```

---

### Task 2: Create Tailwind + PostCSS config files

**Files:**
- Create: `tailwind.config.js`
- Create: `postcss.config.js`

- [ ] **Step 1: Create `tailwind.config.js`**

```js
// tailwind.config.js
export default {
  content: [
    './src/ai-mockups/**/*.vue',
    './src/pages/lab/**/*.vue',
  ],
  corePlugins: {
    preflight: false, // prevents fighting Vuetify's CSS reset
  },
}
```

- [ ] **Step 2: Create `postcss.config.js`**

```js
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js postcss.config.js
git commit -m "chore: add tailwind and postcss config (scoped to ai-mockups + lab)"
```

---

### Task 3: Create Tailwind CSS entry file and import it

**Files:**
- Create: `src/styles/tailwind.css`
- Modify: `src/main.ts` (add one import line)

- [ ] **Step 1: Create `src/styles/tailwind.css`**

```css
/* src/styles/tailwind.css */
/* preflight is disabled in tailwind.config.js to avoid fighting Vuetify */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 2: Add import to `src/main.ts`**

Current `main.ts` imports `'./assets/main.scss'`. Add the Tailwind import immediately after it:

```ts
import './assets/main.scss'
import './styles/tailwind.css'   // ← add this line
```

Do NOT add a second `vuetify/styles` import — it is already handled by `vite-plugin-vuetify`.

- [ ] **Step 3: Start dev server to verify no CSS conflicts**

```bash
pnpm dev
```

Expected: server starts, no errors about unknown at-rules, Vuetify styling unchanged on existing pages (login page, etc.).

- [ ] **Step 4: Commit**

```bash
git add src/styles/tailwind.css src/main.ts
git commit -m "feat: add tailwind CSS entry file scoped to ai-mockups and lab"
```

---

## Chunk 2: Bare Layout + Router Wiring

### Task 4: Create `bare` layout

**Files:**
- Create: `src/layouts/bare.vue`

The bare layout is `<v-app><router-view /></v-app>` with no sidebar, no toolbar, no `<v-main>`. This lets the page component own its entire layout (sidebar + main area via `v-navigation-drawer` + `v-main`).

- [ ] **Step 1: Create `src/layouts/bare.vue`**

```vue
<template>
  <v-app>
    <router-view />
  </v-app>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/bare.vue
git commit -m "feat: add bare layout for lab and demo pages"
```

---

### Task 5: Add `'bare'` to RouteMeta layout union

**Files:**
- Modify: `src/types/router.ts` (line 7 — layout union)

- [ ] **Step 1: Edit `src/types/router.ts`**

Change:
```ts
layout?: 'default' | 'admin' | 'auth' | 'owner'
```
To:
```ts
layout?: 'default' | 'admin' | 'auth' | 'owner' | 'bare'
```

- [ ] **Step 2: Commit**

```bash
git add src/types/router.ts
git commit -m "chore: add bare to RouteMeta layout union"
```

---

### Task 6: Register BareLayout in App.vue

**Files:**
- Modify: `src/App.vue` (import + layouts map)

- [ ] **Step 1: Add BareLayout import to `src/App.vue`**

After the existing layout imports (DefaultLayout, AuthLayout, AdminLayout, OwnerLayout), add:
```ts
import BareLayout from '@/layouts/bare.vue'
```

- [ ] **Step 2: Add `bare` entry to the layouts map**

Change the `layouts` const from:
```ts
const layouts = {
  default: markRaw(DefaultLayout),
  auth: markRaw(AuthLayout),
  admin: markRaw(AdminLayout),
  owner: markRaw(OwnerLayout),
}
```
To:
```ts
const layouts = {
  default: markRaw(DefaultLayout),
  auth: markRaw(AuthLayout),
  admin: markRaw(AdminLayout),
  owner: markRaw(OwnerLayout),
  bare: markRaw(BareLayout),
}
```

- [ ] **Step 3: Verify the existing layout computed still works**

The computed reads `route.meta.layout as string` and falls back to `'default'`. No change needed there.

- [ ] **Step 4: Commit**

```bash
git add src/App.vue
git commit -m "feat: register BareLayout in App.vue layout map"
```

---

### Task 7: Add `/lab` route to router

**Files:**
- Modify: `src/router/index.ts` (add one route entry)

- [ ] **Step 1: Add the `/lab` route**

In `src/router/index.ts`, add before the closing `]` of the routes array (after the existing dev routes):

```ts
// ── AI Component Lab (ui-mockups worktree only) ─────────────────────────
{
  path: '/lab',
  name: 'lab',
  component: () => import('@/pages/lab/index.vue'),
  meta: { layout: 'bare', demo: true },
},
```

- [ ] **Step 2: Verify the route is reachable (no TypeScript errors)**

```bash
pnpm build:fast
```

Expected: build succeeds (or only fails on unrelated pre-existing issues). The `/lab` route itself should cause no type errors because `src/pages/lab` is excluded from `tsconfig.json`.

- [ ] **Step 3: Commit**

```bash
git add src/router/index.ts
git commit -m "feat: add /lab route with bare layout and demo meta"
```

---

## Chunk 3: AI Mockups Directory

### Task 8: Create `src/ai-mockups/` with starter files

**Files:**
- Create: `src/ai-mockups/example.vue`
- Create: `src/ai-mockups/_README.md`

The directory **must exist before** `pnpm dev` is run, because Vite evaluates `import.meta.glob` at startup. If the directory is empty or missing, the glob returns an empty object — that's fine, but a starter `example.vue` is better UX.

- [ ] **Step 1: Create `src/ai-mockups/example.vue`**

```vue
<script setup lang="ts">
// Example AI Lab component — feel free to delete or replace this
</script>

<template>
  <v-container class="py-8">
    <v-card max-width="480" class="mx-auto">
      <v-card-title class="text-h5 pt-5 px-5">
        Welcome to AI Lab
      </v-card-title>
      <v-card-text>
        <p class="text-body-1 mb-4">
          This is your component scratch space. Ask Claude to generate a component
          and it will appear in the sidebar automatically.
        </p>
        <div class="flex flex-col gap-3">
          <v-chip color="primary" variant="tonal" prepend-icon="mdi-palette">
            Vuetify 4 theme tokens available
          </v-chip>
          <v-chip color="secondary" variant="tonal" prepend-icon="mdi-tailwind">
            Tailwind utilities available
          </v-chip>
          <v-chip color="success" variant="tonal" prepend-icon="mdi-lightning-bolt">
            HMR — changes appear instantly
          </v-chip>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>
```

- [ ] **Step 2: Create `src/ai-mockups/_README.md`**

```markdown
# AI Lab — Component Context

Claude reads this file at the start of every `/ui-designer` session. It describes what's available in the app so generated components use real components, real tokens, and correct import paths.

---

## Available Dumb Components (`src/components/dumb/shared/`)

| Component | Key Props |
|-----------|-----------|
| `ConfirmationDialog.vue` | `v-model`, `title`, `message`, `confirm-text`, `cancel-text`, `loading` |
| `LoadingSpinner.vue` | `size`, `color`, `message` |
| `ErrorAlert.vue` | `error` (string or Error), `title`, `dismissible` |
| `SkeletonLoader.vue` | `type` (`card`\|`list`\|`table`), `count` |
| `EnhancedToast.vue` | global via composable `useToast()` |
| `PropertyCard.vue` | `property` (Property type), `color`, `@click` |
| `DatePickerField.vue` | `v-model`, `label`, `min`, `max`, `:rules` |
| `TimePickerField.vue` | `v-model`, `label`, `:rules` |
| `TurnPriorityBadge.vue` | `priority` (`low`\|`normal`\|`high`\|`urgent`) |

Import pattern:
```ts
import ConfirmationDialog from '@components/dumb/shared/ConfirmationDialog.vue'
```

---

## Vuetify Theme Color Tokens

Use these in `color="..."` props and `rgb(var(--v-theme-<token>))` in CSS.

| Token | Usage |
|-------|-------|
| `primary` | Main brand color |
| `secondary` | Secondary brand |
| `error` | Destructive actions, errors |
| `warning` | Caution, turn bookings |
| `success` | Confirmations, completed states |
| `info` | Informational |
| `turn-urgent` | Urgent turn booking highlight |
| `turn-standard` | Standard turn booking |
| `booking-standard` | Regular booking |

---

## Design Conventions (globally configured Vuetify defaults)

Do NOT override these unless the design requires it:
- `VBtn`: `variant="flat"`, `rounded`
- `VCard`: `elevation="2"`, `rounded="lg"`
- `VTextField / VSelect / VTextarea`: `variant="outlined"`, `density="comfortable"`, `rounded="lg"`
- `VDialog`: `max-width="700px"`, `rounded="lg"`
- `VChip / VBadge`: `rounded="pill"`

---

## Import Patterns

```ts
// Stores
import { useAuthStore } from '@stores/auth'
import { useBookingStore } from '@stores/booking'
import { usePropertyStore } from '@stores/property'

// Utilities
import { validateBooking, calculateBookingPriority } from '@utils/businessLogic'
import { safeDate, safeString } from '@utils/typeHelpers'

// Types
import type { Booking, Property } from '@types'
```

---

## Tailwind Guidance

- Use Tailwind **utilities for layout and spacing**: `flex`, `gap-4`, `mt-2`, `px-6`, `grid grid-cols-2`, etc.
- Use **Vuetify semantic tokens for color** — never Tailwind color utilities (`bg-blue-500`) or hardcoded hex values.
- Tailwind `preflight` is disabled — Vuetify's CSS reset takes precedence.

---

## Component Template

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
const props = defineProps<{
  // your props
}>()

// Emits
const emit = defineEmits<{
  // 'event-name': [payload: Type]
}>()
</script>

<template>
  <v-card>
    <!-- your content -->
  </v-card>
</template>
```
```

- [ ] **Step 3: Commit**

```bash
git add src/ai-mockups/
git commit -m "feat: add ai-mockups starter files (example.vue + _README.md)"
```

---

## Chunk 4: AiLab Shell Component

### Task 9: Create `src/pages/lab/index.vue`

**Files:**
- Create: `src/pages/lab/index.vue`

This is the main deliverable. Key requirements:
- Left sidebar 280px permanent, showing all `src/ai-mockups/**/*.vue` files grouped by subfolder
- `localStorage` key `lab:selected` persists last-selected file path across reloads
- Selected component rendered via `defineAsyncComponent` (lazy)
- `onErrorCaptured` catches both load-time AND runtime/mount errors from the dynamic component
- Toolbar shows component name + file path chip
- Empty state when no `.vue` files exist in `src/ai-mockups/`

- [ ] **Step 1: Create `src/pages/lab/index.vue`**

```vue
<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onErrorCaptured, watch } from 'vue'

// Auto-discover all .vue files in src/ai-mockups/
const modules = import.meta.glob('/src/ai-mockups/**/*.vue')

interface LabEntry {
  name: string
  path: string
  group: string
  component: ReturnType<typeof defineAsyncComponent>
}

const entries: LabEntry[] = Object.entries(modules).map(([path, loader]) => {
  const relative = path.replace('/src/ai-mockups/', '').replace('.vue', '')
  const parts = relative.split('/')
  const group = parts.length > 1 ? parts[0] : 'General'
  const rawName = parts[parts.length - 1]
  const name = rawName
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .trim()
  return {
    name,
    path,
    group,
    component: defineAsyncComponent(loader as () => Promise<unknown>),
  }
})

const groups = computed(() => {
  const map = new Map<string, LabEntry[]>()
  for (const entry of entries) {
    if (!map.has(entry.group)) map.set(entry.group, [])
    map.get(entry.group)!.push(entry)
  }
  return map
})

// Persist last-selected path in localStorage
const STORAGE_KEY = 'lab:selected'

function findEntry(path: string | null) {
  return path ? entries.find(e => e.path === path) ?? null : null
}

const selected = ref<LabEntry | null>(
  findEntry(localStorage.getItem(STORAGE_KEY)) ?? entries[0] ?? null
)

watch(selected, entry => {
  if (entry) localStorage.setItem(STORAGE_KEY, entry.path)
  else localStorage.removeItem(STORAGE_KEY)
})

// Error boundary — catches load-time AND runtime/mount errors
const currentError = ref<string | null>(null)

onErrorCaptured((err) => {
  currentError.value = err instanceof Error ? err.message : String(err)
  return false // prevent propagation
})

function selectEntry(entry: LabEntry) {
  currentError.value = null
  selected.value = entry
}
</script>

<template>
  <v-navigation-drawer permanent width="280">
    <v-list-item
      title="AI Lab"
      subtitle="DEV — scratch space"
      prepend-icon="mdi-robot-outline"
      class="py-4"
    >
      <template #append>
        <v-chip size="x-small" color="warning" variant="tonal" class="mr-2">DEV</v-chip>
      </template>
    </v-list-item>
    <v-divider />

    <!-- Empty state in sidebar -->
    <template v-if="entries.length === 0">
      <v-list-item class="py-6 text-center">
        <div class="text-body-2 text-medium-emphasis px-2">
          No mockups yet.<br>Ask Claude to generate one!
        </div>
      </v-list-item>
    </template>

    <v-list v-else density="compact" nav>
      <template v-for="[group, items] in groups" :key="group">
        <v-list-subheader>{{ group }}</v-list-subheader>
        <v-list-item
          v-for="entry in items"
          :key="entry.path"
          :title="entry.name"
          :active="selected?.path === entry.path"
          active-color="primary"
          rounded="lg"
          @click="selectEntry(entry)"
        />
      </template>
    </v-list>
  </v-navigation-drawer>

  <v-main>
    <!-- Empty state — no files at all -->
    <template v-if="entries.length === 0">
      <v-container class="py-12">
        <v-card max-width="480" class="mx-auto text-center" variant="outlined">
          <v-card-text class="py-8">
            <v-icon size="56" color="medium-emphasis" class="mb-4">mdi-robot-outline</v-icon>
            <div class="text-h6 mb-2">AI Lab is ready</div>
            <div class="text-body-2 text-medium-emphasis mb-4">
              No components yet. Open a chat with Claude and use <code>/ui-designer</code> to generate one.
            </div>
            <v-chip variant="tonal" color="primary" size="small" prepend-icon="mdi-folder-outline">
              src/ai-mockups/
            </v-chip>
          </v-card-text>
        </v-card>
      </v-container>
    </template>

    <!-- Component preview -->
    <template v-else-if="selected">
      <v-toolbar flat border="b">
        <v-toolbar-title>{{ selected.name }}</v-toolbar-title>
        <v-spacer />
        <v-chip size="small" color="info" variant="tonal" class="mr-3 font-mono text-xs">
          {{ selected.path.replace('/src/', 'src/') }}
        </v-chip>
      </v-toolbar>

      <!-- Error boundary display -->
      <template v-if="currentError">
        <v-container class="py-8">
          <v-alert
            type="error"
            title="Component Error"
            :text="currentError"
            variant="tonal"
          >
            <template #append>
              <v-btn size="small" variant="tonal" @click="currentError = null; selected = { ...selected! }">
                Retry
              </v-btn>
            </template>
          </v-alert>
        </v-container>
      </template>

      <component :is="selected.component" v-else />
    </template>
  </v-main>
</template>
```

- [ ] **Step 2: Start dev server and navigate to `/lab`**

```bash
pnpm dev
# Open http://localhost:3000/lab
```

Expected:
- Page loads without auth prompt
- Sidebar shows "AI Lab" header with "DEV" chip
- `example.vue` appears in sidebar under "General"
- Clicking it renders the welcome card
- No TypeScript errors in the console

- [ ] **Step 3: Test error boundary manually**

Create a file `src/ai-mockups/broken.vue` with invalid content (e.g., throw in setup), then select it in the lab. Expected: error card appears showing the error message, not a white screen / app crash.

Delete `src/ai-mockups/broken.vue` after verifying.

- [ ] **Step 4: Commit**

```bash
git add src/pages/lab/index.vue
git commit -m "feat: add AiLab shell with sidebar, error boundary, and localStorage persistence"
```

---

## Chunk 5: ui-designer Claude Command

### Task 10: Create `.claude/commands/ui-designer.md`

**Files:**
- Create: `.claude/commands/ui-designer.md`

This is a Claude Code custom command. Loaded via `/ui-designer` at the start of a lab session. It sets Claude's context and constraints for generating mockup components.

- [ ] **Step 1: Create `.claude/commands/ui-designer.md`**

```markdown
# UI Designer — AI Lab Mode

You are designing Vue 3 components for the AI Component Lab in this project.

## Stack

- **Vue 3** `<script setup lang="ts">` — always use the Composition API with script setup
- **Vuetify 4** — use Vuetify components for all UI elements; they are auto-imported
- **Tailwind CSS** (preflight disabled) — use utilities for layout and spacing only; do NOT use Tailwind color utilities (e.g., `bg-blue-500`); use Vuetify tokens for color

## Before Generating

Read `src/ai-mockups/_README.md` to understand:
- Available dumb components and their props
- Vuetify theme color tokens
- Design conventions (globally configured defaults)
- Import patterns

## Output Rules

- Write complete `.vue` SFC files (script + template, style only if needed)
- Save all output to `src/ai-mockups/` — use descriptive PascalCase filenames (e.g., `BookingDashboardCard.vue`)
- For multi-component designs, create one file per component in `src/ai-mockups/`
- Always mention the file path(s) you created

## Design Rules

- Use existing dumb components (`ConfirmationDialog`, `LoadingSpinner`, `ErrorAlert`, `SkeletonLoader`) — never reimplement them
- Use **Vuetify semantic color tokens** — never hardcode hex values or use Tailwind color classes
- Mobile-first: use `v-row` / `v-col` with responsive `cols`/`sm`/`md` props
- Accessible: add `aria-label` to icon-only buttons, use `<label>` or Vuetify `label` prop on inputs
- Use Vuetify `density="comfortable"` and `rounded="lg"` (globally configured defaults)

## Promotion

When the user is happy with a component, they will ask you to "promote" it. To promote:
1. Copy the file from `src/ai-mockups/` to the appropriate `src/components/dumb/` subdirectory
2. Fix any import paths (relative vs alias)
3. Delete the original from `src/ai-mockups/`
4. Confirm the new location

## Example Session

> "Build a booking summary card — property name, date range, status badge, two action buttons"

→ Read `_README.md` → Write `src/ai-mockups/BookingSummaryCard.vue` → Tell the user where it was saved.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/commands/ui-designer.md
git commit -m "feat: add ui-designer Claude command for AI lab sessions"
```

---

## Chunk 6: Final Verification

### Task 11: End-to-end verification

- [ ] **Step 1: Run tests**

```bash
pnpm test:run
```

Expected: all existing tests pass (the lab is dev-only scaffolding with no new logic to test).

- [ ] **Step 2: Run production build**

```bash
pnpm build
```

Expected: build succeeds. TypeScript errors inside `src/ai-mockups/` and `src/pages/lab/` are excluded by `tsconfig.json`.

- [ ] **Step 3: Verify `/lab` is blocked in production build preview**

```bash
pnpm preview
# Navigate to http://localhost:4173/lab
```

Expected: redirected to `/404` (via `developmentGuard`).

- [ ] **Step 4: Verify full lab workflow**

With `pnpm dev` running:
1. Navigate to `http://localhost:3000/lab`
2. Confirm sidebar shows `example.vue` → renders the welcome card
3. Add a new file `src/ai-mockups/TestCard.vue` with minimal content:
   ```vue
   <template><v-card class="ma-4"><v-card-text>It works!</v-card-text></v-card></template>
   ```
4. Confirm it appears in the sidebar without restarting dev server (HMR picks it up on next hot reload; may require a manual browser refresh since glob is evaluated at build time — this is expected Vite behavior)
5. Select it → renders correctly
6. Add a Tailwind class (e.g., `class="flex gap-4"`) → style applies without Vuetify conflicts
7. Delete `src/ai-mockups/TestCard.vue`

- [ ] **Step 5: Commit final verification note**

```bash
git commit --allow-empty -m "chore: AI lab verified — /lab renders, error boundary works, Tailwind scoped, build passes"
```

---

## Summary of Files Changed

| File | Action | Chunk |
|------|--------|-------|
| `package.json` + `pnpm-lock.yaml` | Modified (add deps) | 1 |
| `tailwind.config.js` | Created | 1 |
| `postcss.config.js` | Created | 1 |
| `src/styles/tailwind.css` | Created | 1 |
| `src/main.ts` | Modified (add 1 import) | 1 |
| `src/layouts/bare.vue` | Created | 2 |
| `src/types/router.ts` | Modified (union type) | 2 |
| `src/App.vue` | Modified (import + map) | 2 |
| `src/router/index.ts` | Modified (add route) | 2 |
| `src/ai-mockups/example.vue` | Created | 3 |
| `src/ai-mockups/_README.md` | Created | 3 |
| `src/pages/lab/index.vue` | Created | 4 |
| `.claude/commands/ui-designer.md` | Created | 5 |

**Already done (no action needed):**
- `src/router/guards.ts` — guards cover `/lab` ✅
- `tsconfig.json` — excludes `src/ai-mockups` and `src/pages/lab` ✅
