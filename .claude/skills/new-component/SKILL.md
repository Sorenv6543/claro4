---
name: new-component
description: Scaffold a new Vue component in the correct smart or dumb directory for the given role. Use when asked to create a new component.
---

Ask the user for (if not already provided):
- Component name (PascalCase)
- Type: `smart` or `dumb`
- Role: `owner`, `admin`, or `shared`

## Placement Rules

| Type | Role | Path |
|------|------|------|
| smart | owner | `src/components/smart/owner/{Name}.vue` |
| smart | admin | `src/components/smart/admin/{Name}.vue` |
| dumb | owner | `src/components/dumb/owner/{Name}.vue` |
| dumb | admin | `src/components/dumb/admin/{Name}.vue` |
| dumb | shared | `src/components/dumb/shared/{Name}.vue` |

Smart components cannot be `shared` — they are always role-specific.

## Smart Component Template

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { use[Role]Store } from '@stores/[role]' // or appropriate composable

// Props (if any)
// const props = defineProps<{}>()

// Store / composable
// const store = use...()
</script>

<template>
  <div>
    <!-- orchestration UI here -->
  </div>
</template>
```

Rules:
- May import from `@stores/`, `@composables/`, `@utils/`
- No direct Supabase calls — use composables
- No hardcoded data — all from store/composable

## Dumb Component Template

```vue
<script setup lang="ts">
// Props and emits only — no store imports
const props = defineProps<{
  // define props here
}>()

const emit = defineEmits<{
  // define emits here
}>()
</script>

<template>
  <div>
    <!-- pure UI here -->
  </div>
</template>
```

Rules:
- No imports from `@stores/`, `@composables/`, `@utils/businessLogic`
- All data via props, all actions via emits
- Use Vuetify components with project defaults (variant="outlined", density="comfortable")
- Check `src/components/dumb/shared/` for existing: ConfirmationDialog, LoadingSpinner, ErrorAlert, SkeletonLoader, EnhancedToast

After creating the file, remind the user if a corresponding page or parent smart component needs to mount it.
