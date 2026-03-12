# Removing the Theme Picker Dev Tool

## Files to delete

```
src/layouts/ownerThemes.ts
src/__tests__/layouts/ownerThemes.spec.ts
```

## Changes to revert in `src/layouts/owner.vue`

**Template** — delete the entire `<template v-if="import.meta.env.DEV">` block (DEV chip + palette menu):

```vue
        <!-- DEV: theme picker (dev builds only) -->
        <template v-if="import.meta.env.DEV">
        ...
        </template>
```

**Script** — remove these two lines:

```typescript
import { useTheme } from 'vuetify'          // remove useTheme from this import
import { THEMES } from '@/layouts/ownerThemes'
```

Change the vuetify import back to:

```typescript
import { useDisplay } from 'vuetify'
```

Also remove the two lines in `<script setup>`:

```typescript
const theme = useTheme()

function applyTheme(id: string) {
  theme.name.value = id
}
```

## Verify

```bash
pnpm test:run
pnpm build
```
