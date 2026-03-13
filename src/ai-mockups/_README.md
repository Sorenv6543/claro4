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
