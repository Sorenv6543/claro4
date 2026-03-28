# Removing the Theme Picker

## Files to delete

```
src/layouts/ownerThemes.ts
src/__tests__/layouts/ownerThemes.spec.ts
```

## Changes to revert in `src/layouts/owner.vue`

**Template** — remove the theme picker UI (the theme chip and its palette menu) from the layout template so that no theme-selection controls are rendered.

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
  theme.global.name.value = id
}
```

## Verify

```bash
pnpm test:run
pnpm build
```
