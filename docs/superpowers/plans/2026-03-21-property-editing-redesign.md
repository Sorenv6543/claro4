# Property Editing Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign property creation as a two-step modal and property detail page with inline-editable grouped sections, plus add new operational fields and a 5-color user-selectable palette.

**Architecture:** New dumb section components wrap view/edit states inside a reusable `PropertySectionCard`. The smart `OwnerPropertyView` orchestrates per-section edit state and saves via the existing `updateMyProperty()` composable. `PropertyModal` gains a `stepper` prop for two-step owner creation. A Supabase migration adds 9 new columns.

**Tech Stack:** Vue 3, Vuetify 4, Pinia, Supabase, Vitest

**Spec:** `docs/superpowers/specs/2026-03-21-property-editing-redesign-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `supabase/migrations/20260321000000_property_operational_fields.sql` | Add 9 new columns to properties table |
| `src/components/dumb/owner/PropertyColorPicker.vue` | 5 circular color swatches with selection ring |
| `src/components/dumb/owner/PropertySectionCard.vue` | Reusable view/edit card wrapper with save/cancel |
| `src/components/dumb/owner/PropertyInfoSection.vue` | Address, type, beds, baths, sqft, floor, color |
| `src/components/dumb/owner/PropertyCleaningSection.vue` | Duration, pricing tier, linens location |
| `src/components/dumb/owner/PropertyAccessSection.vue` | Access info, alarm info, parking |
| `src/components/dumb/owner/PropertyContactSection.vue` | Contact name/phone, instructions, trash day |
| `src/components/dumb/owner/PropertyPhotosSection.vue` | Placeholder for future photo management |
| `src/__tests__/components/owner/PropertyColorPicker.spec.ts` | Color picker tests |
| `src/__tests__/components/owner/PropertySectionCard.spec.ts` | Section card tests |

### New Files (cont.)
| `src/utils/constants.ts` | Centralized `PROPERTY_COLORS` array (5 colors) — file does not exist yet |

### Modified Files
| File | Changes |
|------|---------|
| `src/types/property.ts` | Add 9 new fields to Property interface, update isProperty() |
| `src/__tests__/stores/property.spec.ts` | Update `makeProperty()` helper with `color` field |
| `src/__tests__/utils/calendarHelpers.spec.ts` | Add `color` to `mockProperty` fixture |
| `src/__tests__/utils/businessLogic.spec.ts` | Add `color` to any Property fixtures |
| `src/components/smart/owner/OwnerPropertyView.vue` | Replace flat layout with section card grid |
| `src/components/dumb/shared/PropertyModal.vue` | Add `stepper` prop, two-step creation flow |
| `src/components/smart/owner/OwnerNavigationDrawer.vue` | Import `PROPERTY_COLORS` from constants, use `property.color` |
| `src/components/smart/owner/OwnerProperties.vue` | Pass `stepper` prop, use `property.color` for cards |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260321000000_property_operational_fields.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Add operational fields for cleaning company property management
ALTER TABLE public.properties
  ADD COLUMN color TEXT NOT NULL DEFAULT '#5c6bc0',
  ADD COLUMN floor_type TEXT DEFAULT NULL,
  ADD COLUMN access_info TEXT DEFAULT NULL,
  ADD COLUMN parking_instructions TEXT DEFAULT NULL,
  ADD COLUMN alarm_info TEXT DEFAULT NULL,
  ADD COLUMN contact_name TEXT DEFAULT NULL,
  ADD COLUMN contact_phone TEXT DEFAULT NULL,
  ADD COLUMN trash_day TEXT DEFAULT NULL,
  ADD COLUMN linens_location TEXT DEFAULT NULL;

-- Add CHECK constraint for floor_type enum
ALTER TABLE public.properties
  ADD CONSTRAINT chk_floor_type CHECK (
    floor_type IS NULL OR floor_type IN ('hardwood', 'carpet', 'tile', 'mixed')
  );

COMMENT ON COLUMN public.properties.color IS 'User-selected property color hex, used for cards/sidebar/calendar';
COMMENT ON COLUMN public.properties.access_info IS 'Free text: lockbox codes, smart lock details, key location, gate/garage codes';
COMMENT ON COLUMN public.properties.alarm_info IS 'Alarm system code and arming/disarming instructions';
COMMENT ON COLUMN public.properties.contact_name IS 'Emergency contact name for property issues';
COMMENT ON COLUMN public.properties.contact_phone IS 'Emergency contact phone for property issues';
COMMENT ON COLUMN public.properties.trash_day IS 'Trash/recycling pickup day or schedule';
COMMENT ON COLUMN public.properties.linens_location IS 'Where sheets, towels, and cleaning supplies are stored';
```

- [ ] **Step 2: Apply migration**

Run: `npx supabase migration up` (or apply via Supabase dashboard if using hosted)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260321000000_property_operational_fields.sql
git commit -m "feat: add operational fields to properties table (color, access, parking, etc.)"
```

---

## Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types/property.ts` (lines 16-34 for interface, lines 92-106 for type guard)

- [ ] **Step 1: Add new fields to Property interface**

In `src/types/property.ts`, add these fields to the `Property` interface after `active: boolean`:

```typescript
// New operational fields
color: string
floor_type?: 'hardwood' | 'carpet' | 'tile' | 'mixed'
access_info?: string
parking_instructions?: string
alarm_info?: string
contact_name?: string
contact_phone?: string
trash_day?: string
linens_location?: string
```

- [ ] **Step 2: Update isProperty() type guard**

Add `&& typeof p.color === 'string'` to the return expression in `isProperty()`:

```typescript
return (
  typeof p.id === 'string'
  && typeof p.address_street === 'string'
  && typeof p.address_city === 'string'
  && typeof p.address_state === 'string'
  && typeof p.address_zip === 'string'
  && typeof p.cleaning_duration === 'number'
  && typeof p.active === 'boolean'
  && typeof p.color === 'string'
)
```

- [ ] **Step 3: Update test helper**

In `src/__tests__/stores/property.spec.ts`, add `color: '#5c6bc0'` to the `makeProperty()` helper (line 7-19):

```typescript
function makeProperty (overrides: Partial<Property> = {}): Property {
  return {
    id: 'prop1',
    owner_id: 'owner1',
    address_street: '123 Main St',
    address_city: 'Austin',
    address_state: 'TX',
    address_zip: '78701',
    cleaning_duration: 120,
    pricing_tier: 'premium',
    active: true,
    color: '#5c6bc0',
    ...overrides,
  }
}
```

- [ ] **Step 4: Update ALL test fixtures that construct Property objects**

Run `pnpm build` to find all type errors. Known files that need `color: '#5c6bc0'` added to their Property fixtures:
- `src/__tests__/stores/property.spec.ts` — `makeProperty()` (done in Step 3)
- `src/__tests__/utils/calendarHelpers.spec.ts` — `mockProperty` object
- `src/__tests__/utils/businessLogic.spec.ts` — any Property literals
- Any other files that fail type-check

Add `color: '#5c6bc0'` to every Property object literal in test files.

- [ ] **Step 5: Run tests and type check**

Run: `pnpm test:run && pnpm build`
Expected: All tests pass and type check is clean.

- [ ] **Step 6: Commit**

```bash
git add src/types/property.ts src/__tests__/stores/property.spec.ts
git commit -m "feat: add operational fields to Property type and update type guard"
```

---

## Task 3: Add PROPERTY_COLORS Constant

**Files:**
- Modify: `src/utils/constants.ts` (create if it doesn't exist)
- Modify: `src/components/smart/owner/OwnerNavigationDrawer.vue` (line 133)

- [ ] **Step 1: Add PROPERTY_COLORS to constants**

Check if `src/utils/constants.ts` exists. If not, create it. Add:

```typescript
/**
 * 5 user-selectable property colors.
 * Used for property cards, sidebar icons, and calendar events.
 * Deliberately avoids Vuetify surface/on-surface theme variables.
 */
export const PROPERTY_COLORS = [
  '#5c6bc0', // indigo
  '#43a047', // green
  '#8e24aa', // purple
  '#f57c00', // orange
  '#e53935', // red
] as const

export type PropertyColor = typeof PROPERTY_COLORS[number]
```

- [ ] **Step 2: Update OwnerNavigationDrawer to import constant**

In `src/components/smart/owner/OwnerNavigationDrawer.vue`, replace the local `PROPERTY_COLORS` array (line 133) with an import:

Remove:
```typescript
const PROPERTY_COLORS = ['#5c6bc0', '#43a047', '#8e24aa', '#f57c00']
```

Add import:
```typescript
import { PROPERTY_COLORS } from '@/utils/constants'
```

Update `propertyColor()` to use property's stored color with fallback:
```typescript
function propertyColor (property: Property, index: number): string {
  return property.color ?? PROPERTY_COLORS[index % PROPERTY_COLORS.length]
}
```

Update the template's `v-for` to pass the property object. The existing template uses `v-for="(property, index) in properties"`, so update the style binding:
```vue
:style="{ '--property-icon-color': propertyColor(property, index) }"
```

- [ ] **Step 3: Run tests and type check**

Run: `pnpm test:run && pnpm build`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/utils/constants.ts src/components/smart/owner/OwnerNavigationDrawer.vue
git commit -m "feat: centralize PROPERTY_COLORS constant, use property.color in sidebar"
```

---

## Task 4: PropertyColorPicker Component

**Files:**
- Create: `src/components/dumb/owner/PropertyColorPicker.vue`
- Create: `src/__tests__/components/owner/PropertyColorPicker.spec.ts`

- [ ] **Step 1: Write test**

```typescript
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import PropertyColorPicker from '@/components/dumb/owner/PropertyColorPicker.vue'
import { PROPERTY_COLORS } from '@/utils/constants'

const vuetify = createVuetify()

function mountPicker (props = {}) {
  return mount(PropertyColorPicker, {
    props: { modelValue: PROPERTY_COLORS[0], ...props },
    global: { plugins: [vuetify] },
  })
}

describe('PropertyColorPicker', () => {
  it('renders 5 color swatches', () => {
    const wrapper = mountPicker()
    const swatches = wrapper.findAll('[data-testid="color-swatch"]')
    expect(swatches).toHaveLength(5)
  })

  it('marks the selected color', () => {
    const wrapper = mountPicker({ modelValue: PROPERTY_COLORS[2] })
    const swatches = wrapper.findAll('[data-testid="color-swatch"]')
    const selected = swatches.find(s => s.classes().includes('selected'))
    expect(selected?.attributes('data-color')).toBe(PROPERTY_COLORS[2])
  })

  it('emits update:modelValue on click', async () => {
    const wrapper = mountPicker({ modelValue: PROPERTY_COLORS[0] })
    const swatches = wrapper.findAll('[data-testid="color-swatch"]')
    await swatches[3].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([PROPERTY_COLORS[3]])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/__tests__/components/owner/PropertyColorPicker.spec.ts`
Expected: FAIL — component doesn't exist yet.

- [ ] **Step 3: Implement PropertyColorPicker.vue**

```vue
<template>
  <div class="color-picker d-flex gap-2 align-center">
    <button
      v-for="color in PROPERTY_COLORS"
      :key="color"
      class="color-swatch"
      :class="{ selected: modelValue === color }"
      :data-color="color"
      data-testid="color-swatch"
      :style="{ backgroundColor: color }"
      type="button"
      @click="$emit('update:modelValue', color)"
    />
  </div>
</template>

<script setup lang="ts">
  import { PROPERTY_COLORS } from '@/utils/constants'

  defineProps<{
    modelValue: string
  }>()

  defineEmits<{
    (e: 'update:modelValue', color: string): void
  }>()
</script>

<style scoped>
.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.15s;
}

.color-swatch:hover {
  transform: scale(1.15);
}

.color-swatch.selected {
  border-color: rgba(var(--v-theme-on-surface), 0.7);
  box-shadow: 0 0 0 2px rgba(var(--v-theme-surface), 1), 0 0 0 4px currentColor;
}
</style>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/__tests__/components/owner/PropertyColorPicker.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/dumb/owner/PropertyColorPicker.vue src/__tests__/components/owner/PropertyColorPicker.spec.ts
git commit -m "feat: add PropertyColorPicker component with 5-color palette"
```

---

## Task 5: PropertySectionCard Component

**Files:**
- Create: `src/components/dumb/owner/PropertySectionCard.vue`
- Create: `src/__tests__/components/owner/PropertySectionCard.spec.ts`

- [ ] **Step 1: Write test**

```typescript
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import PropertySectionCard from '@/components/dumb/owner/PropertySectionCard.vue'

const vuetify = createVuetify()

function mountCard (props = {}, slots = {}) {
  return mount(PropertySectionCard, {
    props: { title: 'Test Section', icon: 'mdi-home', ...props },
    slots: { default: '<div>view content</div>', edit: '<div>edit content</div>', ...slots },
    global: { plugins: [vuetify] },
  })
}

describe('PropertySectionCard', () => {
  it('renders title and icon', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('Test Section')
  })

  it('shows view slot by default', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('view content')
    expect(wrapper.text()).not.toContain('edit content')
  })

  it('shows edit slot when editing=true', () => {
    const wrapper = mountCard({ editing: true })
    expect(wrapper.text()).toContain('edit content')
  })

  it('emits edit when pencil clicked', async () => {
    const wrapper = mountCard()
    const editBtn = wrapper.find('[data-testid="section-edit-btn"]')
    await editBtn.trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
  })

  it('emits save and cancel from edit mode', async () => {
    const wrapper = mountCard({ editing: true })
    await wrapper.find('[data-testid="section-save-btn"]').trigger('click')
    expect(wrapper.emitted('save')).toBeTruthy()
    await wrapper.find('[data-testid="section-cancel-btn"]').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('hides edit button when readonly', () => {
    const wrapper = mountCard({ readonly: true })
    expect(wrapper.find('[data-testid="section-edit-btn"]').exists()).toBe(false)
  })

  it('disables save when saveDisabled is true', () => {
    const wrapper = mountCard({ editing: true, saveDisabled: true })
    const saveBtn = wrapper.find('[data-testid="section-save-btn"]')
    expect(saveBtn.attributes('disabled')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/__tests__/components/owner/PropertySectionCard.spec.ts`
Expected: FAIL

- [ ] **Step 3: Implement PropertySectionCard.vue**

```vue
<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" :color="iconColor">{{ icon }}</v-icon>
      {{ title }}
      <v-spacer />
      <v-btn
        v-if="!readonly && !editing"
        data-testid="section-edit-btn"
        icon="mdi-pencil"
        size="small"
        variant="text"
        @click="$emit('edit')"
      />
    </v-card-title>
    <v-card-text>
      <slot v-if="!editing" />
      <slot v-else name="edit" />

      <v-alert
        v-if="error && editing"
        class="mt-3"
        closable
        type="error"
        variant="tonal"
      >
        {{ error }}
      </v-alert>
    </v-card-text>
    <v-card-actions v-if="editing">
      <v-spacer />
      <v-btn
        data-testid="section-cancel-btn"
        variant="text"
        @click="$emit('cancel')"
      >
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        data-testid="section-save-btn"
        :disabled="saveDisabled"
        :loading="loading"
        @click="$emit('save')"
      >
        Save
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
  withDefaults(defineProps<{
    title: string
    icon: string
    iconColor?: string
    editing?: boolean
    loading?: boolean
    readonly?: boolean
    saveDisabled?: boolean
    error?: string | null
  }>(), {
    iconColor: 'primary',
    editing: false,
    loading: false,
    readonly: false,
    saveDisabled: false,
    error: null,
  })

  defineEmits<{
    (e: 'edit'): void
    (e: 'save'): void
    (e: 'cancel'): void
  }>()
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/__tests__/components/owner/PropertySectionCard.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/dumb/owner/PropertySectionCard.vue src/__tests__/components/owner/PropertySectionCard.spec.ts
git commit -m "feat: add PropertySectionCard reusable view/edit wrapper"
```

---

## Task 6: Section Components (Property Info, Cleaning, Access, Contact)

**Files:**
- Create: `src/components/dumb/owner/PropertyInfoSection.vue`
- Create: `src/components/dumb/owner/PropertyCleaningSection.vue`
- Create: `src/components/dumb/owner/PropertyAccessSection.vue`
- Create: `src/components/dumb/owner/PropertyContactSection.vue`
- Create: `src/components/dumb/owner/PropertyPhotosSection.vue`

Each section component follows the same pattern: receives `property` as a prop, emits `save` with a partial update object. Uses `PropertySectionCard` as wrapper. Has view mode (label/value pairs) and edit mode (form fields).

- [ ] **Step 1: Create PropertyInfoSection.vue**

This section displays/edits: address fields, property_type, bedrooms, bathrooms, square_feet, floor_type, color.

```vue
<template>
  <PropertySectionCard
    :editing="editing"
    :error="error"
    icon="mdi-home"
    :loading="loading"
    :save-disabled="!formValid"
    title="Property Information"
    @cancel="handleCancel"
    @edit="editing = true"
    @save="handleSave"
  >
    <!-- View mode -->
    <v-row>
      <v-col cols="12">
        <div class="section-field">
          <span class="field-label">Address</span>
          <span>{{ formatPropertyAddress(property) }}</span>
        </div>
      </v-col>
      <v-col cols="6" sm="4">
        <div class="section-field">
          <span class="field-label">Type</span>
          <span>{{ property.property_type || 'Not set' }}</span>
        </div>
      </v-col>
      <v-col cols="6" sm="4">
        <div class="section-field">
          <span class="field-label">Bedrooms</span>
          <span>{{ property.bedrooms ?? 'Not set' }}</span>
        </div>
      </v-col>
      <v-col cols="6" sm="4">
        <div class="section-field">
          <span class="field-label">Bathrooms</span>
          <span>{{ property.bathrooms ?? 'Not set' }}</span>
        </div>
      </v-col>
      <v-col cols="6" sm="4">
        <div class="section-field">
          <span class="field-label">Square Feet</span>
          <span>{{ property.square_feet ?? 'Not set' }}</span>
        </div>
      </v-col>
      <v-col cols="6" sm="4">
        <div class="section-field">
          <span class="field-label">Floor Type</span>
          <span>{{ property.floor_type || 'Not set' }}</span>
        </div>
      </v-col>
      <v-col cols="12">
        <div class="section-field">
          <span class="field-label">Color</span>
          <div
            class="color-dot"
            :style="{ backgroundColor: property.color }"
          />
        </div>
      </v-col>
    </v-row>

    <!-- Edit mode -->
    <template #edit>
      <v-form ref="formRef" v-model="formValid">
        <v-row>
          <v-col cols="12" sm="8">
            <v-text-field
              v-model="form.address_street"
              label="Street Address"
              :rules="[v => !!v || 'Required', v => v.length <= 150 || 'Max 150 chars']"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field v-model="form.address_unit" label="Unit" />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.address_city"
              label="City"
              :rules="[v => !!v || 'Required']"
            />
          </v-col>
          <v-col cols="6" sm="4">
            <v-text-field
              v-model="form.address_state"
              label="State"
              :rules="[v => !!v || 'Required']"
            />
          </v-col>
          <v-col cols="6" sm="4">
            <v-text-field
              v-model="form.address_zip"
              label="ZIP"
              :rules="[v => !!v || 'Required', v => /^\d{5}(-\d{4})?$/.test(v) || 'Invalid ZIP']"
            />
          </v-col>
          <v-col cols="6" sm="4">
            <v-select
              v-model="form.property_type"
              clearable
              :items="['apartment', 'house', 'condo', 'townhouse']"
              label="Property Type"
            />
          </v-col>
          <v-col cols="6" sm="4">
            <v-text-field
              v-model.number="form.bedrooms"
              label="Bedrooms"
              max="20"
              min="0"
              type="number"
            />
          </v-col>
          <v-col cols="6" sm="4">
            <v-text-field
              v-model.number="form.bathrooms"
              label="Bathrooms"
              max="20"
              min="0"
              step="0.5"
              type="number"
            />
          </v-col>
          <v-col cols="6" sm="4">
            <v-text-field
              v-model.number="form.square_feet"
              label="Square Feet"
              min="0"
              type="number"
            />
          </v-col>
          <v-col cols="6" sm="4">
            <v-select
              v-model="form.floor_type"
              clearable
              :items="['hardwood', 'carpet', 'tile', 'mixed']"
              label="Floor Type"
            />
          </v-col>
          <v-col cols="12">
            <div class="text-body-2 mb-1">Color</div>
            <PropertyColorPicker v-model="form.color" />
          </v-col>
        </v-row>
      </v-form>
    </template>
  </PropertySectionCard>
</template>

<script setup lang="ts">
  import type { Property } from '@/types'
  import { reactive, ref, watch } from 'vue'
  import PropertyColorPicker from '@/components/dumb/owner/PropertyColorPicker.vue'
  import PropertySectionCard from '@/components/dumb/owner/PropertySectionCard.vue'
  import { formatPropertyAddress } from '@/types/property'

  const props = defineProps<{
    property: Property
    loading?: boolean
    error?: string | null
  }>()

  const emit = defineEmits<{
    (e: 'save', data: Partial<Property>): void
  }>()

  const editing = ref(false)
  const formValid = ref(false)
  const formRef = ref()

  const form = reactive({
    address_street: '',
    address_unit: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    property_type: null as Property['property_type'] | null,
    bedrooms: undefined as number | undefined,
    bathrooms: undefined as number | undefined,
    square_feet: undefined as number | undefined,
    floor_type: null as Property['floor_type'] | null,
    color: '',
  })

  function resetForm () {
    Object.assign(form, {
      address_street: props.property.address_street,
      address_unit: props.property.address_unit ?? '',
      address_city: props.property.address_city,
      address_state: props.property.address_state,
      address_zip: props.property.address_zip,
      property_type: props.property.property_type ?? null,
      bedrooms: props.property.bedrooms,
      bathrooms: props.property.bathrooms,
      square_feet: props.property.square_feet,
      floor_type: props.property.floor_type ?? null,
      color: props.property.color,
    })
  }

  watch(editing, (val) => { if (val) resetForm() })

  // Track whether form has been modified from original values
  const isDirty = computed(() => {
    return form.address_street !== props.property.address_street
      || form.address_city !== props.property.address_city
      || form.color !== props.property.color
      // ... check all fields
  })

  function handleCancel () {
    editing.value = false
  }

  function handleSave () {
    emit('save', { ...form })
    // Do NOT set editing = false here — parent calls closeEdit() after async save succeeds
  }

  function closeEdit () {
    editing.value = false
  }

  defineExpose({ editing, isDirty, closeEdit })
</script>

<style scoped>
.section-field {
  margin-bottom: 12px;
}
.field-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 2px;
}
.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}
</style>
```

- [ ] **Step 2: Create PropertyCleaningSection.vue**

This section displays/edits: cleaning_duration, pricing_tier, linens_location.

Follow the same pattern as PropertyInfoSection: `PropertySectionCard` wrapper, view mode with label/value pairs, edit mode with form fields. Fields:

- `cleaning_duration`: `v-text-field` type="number", min=30, max=480, step=15, suffix="min", required
- `pricing_tier`: `v-select` with items `['basic', 'standard', 'premium', 'luxury']`, required
- `linens_location`: `v-textarea` rows=2, optional

View mode shows: "120 min" for duration, "Standard" for tier (capitalized), linens text or "Not set".

- [ ] **Step 3: Create PropertyAccessSection.vue**

This section displays/edits: access_info, alarm_info, parking_instructions.

All three are `v-textarea` rows=3, optional. View mode shows text or "Not set" for each. Icons: `mdi-key-variant` for access, `mdi-shield-lock` for alarm, `mdi-car` for parking.

- [ ] **Step 4: Create PropertyContactSection.vue**

This section displays/edits: contact_name, contact_phone, special_instructions, trash_day.

Fields:
- `contact_name`: `v-text-field`, optional
- `contact_phone`: `v-text-field`, optional
- `special_instructions`: `v-textarea` rows=3, max 1000 chars, optional
- `trash_day`: `v-text-field`, optional (e.g., "Tuesday" or "Mon/Thu")

- [ ] **Step 5: Create PropertyPhotosSection.vue**

Placeholder component:

```vue
<template>
  <PropertySectionCard
    icon="mdi-camera"
    icon-color="info"
    readonly
    title="Photos"
  >
    <div class="text-center py-4">
      <v-icon color="grey" size="48">mdi-camera-plus-outline</v-icon>
      <div class="text-body-2 text-medium-emphasis mt-2">
        Photo management coming soon
      </div>
    </div>
  </PropertySectionCard>
</template>

<script setup lang="ts">
  import PropertySectionCard from '@/components/dumb/owner/PropertySectionCard.vue'
</script>
```

- [ ] **Step 6: Run type check**

Run: `pnpm build`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/dumb/owner/Property*Section.vue
git commit -m "feat: add inline-editable section components for property detail page"
```

---

## Task 7: Redesign OwnerPropertyView Smart Component

**Files:**
- Modify: `src/components/smart/owner/OwnerPropertyView.vue` (full rewrite of template + script)

- [ ] **Step 1: Rewrite OwnerPropertyView.vue**

Replace the existing template and script with the new section-based layout. Key changes:

**Template structure:**
```
Header (back button, property name, status chip, delete button — remove Edit button)
v-row
  v-col md="8"  → PropertyInfoSection, PropertyCleaningSection, PropertyAccessSection, PropertyContactSection
  v-col md="4"  → PropertyPhotosSection, Statistics & Bookings card (existing stats + upcoming + recent)
```

**Script changes:**
- Remove: `editModalOpen`, `handleEdit`, `handleEditSave`, `PropertyModal` import
- Keep: `deleteDialogOpen`, `confirmDelete`, `ConfirmationDialog`, all booking computeds
- Add: per-section save handlers that call `updateMyProperty(propertyId, sectionData)`
- Add: per-section loading/error state using `reactive` map
- Add: `onBeforeRouteLeave` guard checking for dirty sections
- Add: `sectionState` reactive object tracking `{ editing, loading, error }` per section name

**Per-section save handler pattern:**
```typescript
const sectionState = reactive<Record<string, { loading: boolean; error: string | null }>>({
  info: { loading: false, error: null },
  cleaning: { loading: false, error: null },
  access: { loading: false, error: null },
  contact: { loading: false, error: null },
})

// Map section names to template refs for closeEdit() calls
const sectionRefs: Record<string, Ref> = { info: infoRef, cleaning: cleaningRef, access: accessRef, contact: contactRef }

async function handleSectionSave (section: string, data: Partial<Property>) {
  const state = sectionState[section]
  state.loading = true
  state.error = null
  const ok = await updateMyProperty(propertyId, data)
  state.loading = false
  if (ok) {
    sectionRefs[section]?.value?.closeEdit()  // Close edit mode only on success
  } else {
    state.error = error.value ?? 'Failed to save. Please try again.'
    // Section stays in edit mode so user can retry
  }
}
```

**Template for each section:**
```vue
<PropertyInfoSection
  :error="sectionState.info.error"
  :loading="sectionState.info.loading"
  :property="property"
  @save="(data) => handleSectionSave('info', data)"
/>
```

**Statistics & Bookings** stays as a plain `v-card` (read-only) — combine the existing Statistics, Details, Upcoming Arrivals, and Recent Bookings cards into one card with dividers.

**Navigation guard:**
```typescript
import { onBeforeRouteLeave } from 'vue-router'

// Track section refs to check editing state
const infoRef = ref()
const cleaningRef = ref()
const accessRef = ref()
const contactRef = ref()

onBeforeRouteLeave((_to, _from, next) => {
  const dirtySections = [infoRef, cleaningRef, accessRef, contactRef]
    .filter(ref => ref.value?.editing && ref.value?.isDirty)
  if (dirtySections.length > 0) {
    const leave = window.confirm('You have unsaved changes. Discard?')
    next(leave)
  } else {
    next()
  }
})
```

- [ ] **Step 2: Run type check and tests**

Run: `pnpm build && pnpm test:run`
Expected: All pass.

- [ ] **Step 3: Visual verification**

Navigate to a property detail page in the browser and verify:
- All 6 sections render correctly
- Each section toggles between view/edit
- Save persists changes
- Cancel discards changes
- Multiple sections can edit simultaneously

- [ ] **Step 4: Commit**

```bash
git add src/components/smart/owner/OwnerPropertyView.vue
git commit -m "feat: redesign property detail page with inline-editable sections"
```

---

## Task 8: Two-Step Creation Modal

**Files:**
- Modify: `src/components/dumb/shared/PropertyModal.vue`
- Modify: `src/components/smart/owner/OwnerProperties.vue` (pass `stepper` prop)

- [ ] **Step 1: Look up Vuetify 4 v-stepper API**

Use Context7 MCP to query Vuetify docs for `v-stepper` component API. Verify the props, slots, and events available in Vuetify 4.

- [ ] **Step 2: Add stepper prop and two-step layout to PropertyModal**

Add prop:
```typescript
stepper?: boolean // default false
```

When `stepper` is `true` and `mode` is `'create'`:
- Wrap the form in `v-stepper` with 2 items
- Step 1: address fields, bedrooms, bathrooms, `PropertyColorPicker`
- Step 2: property_type, cleaning_duration, pricing_tier
- Step 1 has "Next" button (validates step 1 fields first)
- Step 2 has "Save" and "Skip for now" buttons
- "Skip for now" emits a new `skip` event with defaults: `cleaning_duration: 120`, `pricing_tier: 'standard'`

In `OwnerProperties.vue`, handle the `skip` event by creating the property and then navigating to the detail page:
```typescript
async function handlePropertyModalSkip (data: PropertyFormData) {
  const id = await createMyProperty(data)
  uiStore.closeModal('propertyModal')
  if (id) router.push(`/owner/properties/${id}`)
}
```

When `stepper` is `false` OR `mode` is `'edit'`:
- Existing single-step form behavior, unchanged
- Add `PropertyColorPicker` to the edit form as well

Add `PropertyColorPicker` import and a `color` field to the form reactive.

Update `resetForm()` to initialize `color` from `props.property?.color` or auto-assign via `PROPERTY_COLORS`.

- [ ] **Step 3: Pass stepper prop from OwnerProperties**

In `src/components/smart/owner/OwnerProperties.vue`, add `stepper` to the PropertyModal:

```vue
<PropertyModal
  :open="propertyModalOpen"
  :mode="propertyModalMode"
  :property="propertyModalData"
  :stepper="propertyModalMode === 'create'"
  @close="uiStore.closeModal('propertyModal')"
  @save="handlePropertyModalSave"
  @delete="handlePropertyModalDelete"
/>
```

- [ ] **Step 4: Run type check and tests**

Run: `pnpm build && pnpm test:run`
Expected: All pass.

- [ ] **Step 5: Visual verification**

Open the property creation modal and verify:
- Step 1 shows address, beds, baths, color picker
- "Next" validates and advances
- Step 2 shows type, duration, pricing
- "Save" creates with all values
- "Skip for now" creates with defaults
- Edit modal still shows single-step full form

- [ ] **Step 6: Commit**

```bash
git add src/components/dumb/shared/PropertyModal.vue src/components/smart/owner/OwnerProperties.vue
git commit -m "feat: add two-step creation flow to PropertyModal with color picker"
```

---

## Task 9: Color Integration (Cards & Calendar)

**Files:**
- Modify: `src/components/smart/owner/OwnerProperties.vue` (property card colors)
- Modify: `src/utils/calendarHelpers.ts` (event colors from property.color)

- [ ] **Step 1: Update property cards to use property.color**

In `OwnerProperties.vue`, find where property cards get their color class (CSS classes `.property-card-blue`, etc.). Replace with inline `style` using `property.color`:

```vue
:style="{ borderLeft: `4px solid ${property.color}` }"
```

Remove the old CSS color classes if they become unused.

- [ ] **Step 2: Update calendar event colors**

In `src/utils/calendarHelpers.ts`, check `bookingToCalendarEvent()`. The function receives a `property` parameter. Update the returned event object to include `backgroundColor` and `borderColor` set to `property.color`. FullCalendar accepts these as standard event properties. If the current return type (`CalendarBookingEvent` or similar) doesn't include these fields, add them as optional properties to the type. Remove any existing index-based color assignment logic.

- [ ] **Step 3: Run tests**

Run: `pnpm test:run`
Expected: All pass (calendarHelpers tests may need property.color in fixtures).

- [ ] **Step 4: Visual verification**

Check that property cards, sidebar icons, and calendar events all use the property's stored color.

- [ ] **Step 5: Commit**

```bash
git add src/components/smart/owner/OwnerProperties.vue src/utils/calendarHelpers.ts
git commit -m "feat: use property.color for cards and calendar events"
```

---

## Task 10: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test:run`
Expected: All pass.

- [ ] **Step 2: Run type check**

Run: `pnpm build`
Expected: Clean build with no type errors.

- [ ] **Step 3: Run performance tests**

Run: `pnpm test:performance`
Expected: No regressions.

- [ ] **Step 4: End-to-end walkthrough**

In the browser:
1. Create a new property — verify two-step modal with color picker
2. "Skip for now" — verify defaults applied, landed on detail page
3. Edit each section inline — verify save/cancel per section
4. Navigate away mid-edit — verify unsaved changes warning
5. Check sidebar — property icon uses stored color
6. Check calendar — events use property color
7. Edit property from Properties list — verify single-step edit modal still works

- [ ] **Step 5: Commit any remaining fixes**

```bash
git add -A
git commit -m "fix: address remaining issues from property editing redesign"
```
