<template>
  <PropertySectionCard
    :editing="editing"
    :error="error"
    icon="mdi-broom"
    icon-color="warning"
    :loading="loading"
    :save-disabled="!isDirty || !formValid"
    title="Cleaning"
    @cancel="closeEdit"
    @edit="editing = true"
    @save="handleSave"
  >
    <!-- View mode -->
    <div class="section-field">
      <span class="field-label">Duration</span>
      <div>{{ property.cleaning_duration }} min</div>
    </div>

    <div class="section-field">
      <span class="field-label">Pricing Tier</span>
      <div>{{ capitalize(property.pricing_tier) }}</div>
    </div>

    <div class="section-field">
      <span class="field-label">Linens Location</span>
      <div v-if="property.linens_location">{{ property.linens_location }}</div>
      <div v-else class="not-set">Not set</div>
    </div>

    <!-- Edit mode -->
    <template #edit>
      <v-form v-model="formValid">
        <v-row density="comfortable">
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="form.cleaning_duration"
              label="Cleaning Duration"
              :max="480"
              :min="30"
              :rules="[requiredRule, durationRule]"
              :step="15"
              suffix="min"
              type="number"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="form.pricing_tier"
              :items="pricingTierItems"
              label="Pricing Tier"
              :rules="[requiredRule]"
            />
          </v-col>

          <v-col cols="12">
            <v-textarea
              v-model="form.linens_location"
              label="Linens Location"
              :rows="2"
            />
          </v-col>
        </v-row>
      </v-form>
    </template>
  </PropertySectionCard>
</template>

<script setup lang="ts">
  import type { PricingTier, Property } from '@/types'
  import { computed, reactive, ref, watch } from 'vue'
  import PropertySectionCard from '@/components/dumb/owner/PropertySectionCard.vue'

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
    cleaning_duration: 120,
    pricing_tier: 'standard' as PricingTier,
    linens_location: '',
  })

  const pricingTierItems = [
    { title: 'Basic', value: 'basic' },
    { title: 'Standard', value: 'standard' },
    { title: 'Premium', value: 'premium' },
    { title: 'Luxury', value: 'luxury' },
  ]

  const requiredRule = (v: unknown) => !!v || 'Required'
  function durationRule (v: number) {
    return (v >= 30 && v <= 480) || 'Duration must be between 30 and 480 minutes'
  }

  function capitalize (str: string) {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  function resetForm () {
    form.cleaning_duration = props.property.cleaning_duration
    form.pricing_tier = props.property.pricing_tier
    form.linens_location = props.property.linens_location ?? ''
  }

  const isDirty = computed(() => {
    return (
      form.cleaning_duration !== props.property.cleaning_duration
      || form.pricing_tier !== props.property.pricing_tier
      || (form.linens_location || undefined) !== props.property.linens_location
    )
  })

  function closeEdit () {
    editing.value = false
  }

  function handleSave () {
    emit('save', {
      cleaning_duration: form.cleaning_duration,
      pricing_tier: form.pricing_tier,
      linens_location: form.linens_location || undefined,
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
</style>
