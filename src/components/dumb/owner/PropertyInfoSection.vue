<template>
  <PropertySectionCard
    :editing="editing"
    :error="error"
    icon="mdi-home"
    :loading="loading"
    :save-disabled="!isDirty || !formValid"
    title="Property Info"
    @cancel="closeEdit"
    @edit="editing = true"
    @save="handleSave"
  >
    <!-- View mode -->
    <div class="section-field">
      <span class="field-label">Address</span>
      <div>{{ formatPropertyAddress(property) }}</div>
    </div>
    <div class="section-field">
      <span class="field-label">Type</span>
      <div v-if="property.property_type">{{ property.property_type }}</div>
      <div v-else class="not-set">Not set</div>
    </div>
    <div class="section-field">
      <span class="field-label">Beds</span>
      <div v-if="property.bedrooms != null">{{ property.bedrooms }}</div>
      <div v-else class="not-set">Not set</div>
    </div>
    <div class="section-field">
      <span class="field-label">Baths</span>
      <div v-if="property.bathrooms != null">{{ property.bathrooms }}</div>
      <div v-else class="not-set">Not set</div>
    </div>
    <div class="section-field">
      <span class="field-label">SqFt</span>
      <div v-if="property.square_feet != null">{{ property.square_feet }}</div>
      <div v-else class="not-set">Not set</div>
    </div>
    <div class="section-field">
      <span class="field-label">Floor Type</span>
      <div v-if="property.floor_type">{{ property.floor_type }}</div>
      <div v-else class="not-set">Not set</div>
    </div>
    <div class="section-field">
      <span class="field-label">Color</span>
      <span
        class="color-dot"
        :style="{ backgroundColor: property.color }"
      />
    </div>

    <!-- Edit mode -->
    <template #edit>
      <v-form v-model="formValid">
        <v-row density="comfortable">
          <v-col cols="12" md="8">
            <v-text-field
              v-model="form.address_street"
              label="Street Address"
              :maxlength="150"
              :rules="[requiredRule]"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.address_unit"
              label="Unit / Apt"
            />
          </v-col>
          <v-col cols="12" md="5">
            <v-text-field
              v-model="form.address_city"
              label="City"
              :rules="[requiredRule]"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="form.address_state"
              label="State"
              :rules="[requiredRule]"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.address_zip"
              label="ZIP Code"
              :rules="[requiredRule, zipRule]"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.property_type"
              clearable
              :items="propertyTypeItems"
              label="Property Type"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              v-model.number="form.bedrooms"
              label="Bedrooms"
              :max="20"
              :min="0"
              type="number"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              v-model.number="form.bathrooms"
              label="Bathrooms"
              :max="20"
              :min="0"
              :step="0.5"
              type="number"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="form.square_feet"
              label="Square Feet"
              :min="0"
              type="number"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.floor_type"
              clearable
              :items="floorTypeItems"
              label="Floor Type"
            />
          </v-col>
          <v-col cols="12">
            <div class="field-label mb-2">Color</div>
            <PropertyColorPicker v-model="form.color" />
          </v-col>
        </v-row>
      </v-form>
    </template>
  </PropertySectionCard>
</template>

<script setup lang="ts">
  import type { Property } from '@/types'
  import { computed, reactive, ref, watch } from 'vue'
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

  const form = reactive({
    address_street: '',
    address_unit: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    property_type: null as Property['property_type'] | null,
    bedrooms: null as number | null,
    bathrooms: null as number | null,
    square_feet: null as number | null,
    floor_type: null as Property['floor_type'] | null,
    color: '',
  })

  const propertyTypeItems = ['apartment', 'house', 'condo', 'townhouse']
  const floorTypeItems = ['hardwood', 'carpet', 'tile', 'mixed']

  const requiredRule = (v: string) => !!v || 'Required'
  const zipRule = (v: string) => /^\d{5}(-\d{4})?$/.test(v) || 'Invalid ZIP code'

  function resetForm () {
    form.address_street = props.property.address_street
    form.address_unit = props.property.address_unit ?? ''
    form.address_city = props.property.address_city
    form.address_state = props.property.address_state
    form.address_zip = props.property.address_zip
    form.property_type = props.property.property_type ?? null
    form.bedrooms = props.property.bedrooms ?? null
    form.bathrooms = props.property.bathrooms ?? null
    form.square_feet = props.property.square_feet ?? null
    form.floor_type = props.property.floor_type ?? null
    form.color = props.property.color
  }

  const isDirty = computed(() => {
    return (
      form.address_street !== props.property.address_street
      || (form.address_unit || '') !== (props.property.address_unit || '')
      || form.address_city !== props.property.address_city
      || form.address_state !== props.property.address_state
      || form.address_zip !== props.property.address_zip
      || (form.property_type ?? undefined) !== props.property.property_type
      || (form.bedrooms ?? undefined) !== props.property.bedrooms
      || (form.bathrooms ?? undefined) !== props.property.bathrooms
      || (form.square_feet ?? undefined) !== props.property.square_feet
      || (form.floor_type ?? undefined) !== props.property.floor_type
      || form.color !== props.property.color
    )
  })

  function closeEdit () {
    editing.value = false
  }

  function handleSave () {
    emit('save', {
      address_street: form.address_street,
      address_unit: form.address_unit || undefined,
      address_city: form.address_city,
      address_state: form.address_state,
      address_zip: form.address_zip,
      property_type: form.property_type ?? undefined,
      bedrooms: form.bedrooms ?? undefined,
      bathrooms: form.bathrooms ?? undefined,
      square_feet: form.square_feet ?? undefined,
      floor_type: form.floor_type ?? undefined,
      color: form.color,
    })
  }

  watch(editing, val => {
    if (val) resetForm()
  })

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
.not-set {
  color: rgb(var(--v-theme-on-surface-variant));
  font-style: italic;
}
.color-dot {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  vertical-align: middle;
}
</style>
