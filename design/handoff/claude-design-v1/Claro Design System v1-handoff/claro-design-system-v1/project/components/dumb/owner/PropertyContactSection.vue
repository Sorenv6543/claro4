<template>
  <PropertySectionCard
    :editing="editing"
    :error="error"
    icon="mdi-account-box"
    icon-color="info"
    :loading="loading"
    :save-disabled="!isDirty"
    title="Contact & Instructions"
    @cancel="closeEdit"
    @edit="editing = true"
    @save="handleSave"
  >
    <!-- View mode -->
    <div class="section-field">
      <span class="field-label">Contact Name</span>
      <div v-if="property.contact_name">{{ property.contact_name }}</div>
      <div v-else class="not-set">Not set</div>
    </div>
    <div class="section-field">
      <span class="field-label">Contact Phone</span>
      <div v-if="property.contact_phone">{{ property.contact_phone }}</div>
      <div v-else class="not-set">Not set</div>
    </div>
    <div class="section-field">
      <span class="field-label">Special Instructions</span>
      <div v-if="property.special_instructions">{{ property.special_instructions }}</div>
      <div v-else class="not-set">Not set</div>
    </div>
    <div class="section-field">
      <span class="field-label">Trash Day</span>
      <div v-if="property.trash_day">{{ property.trash_day }}</div>
      <div v-else class="not-set">Not set</div>
    </div>

    <!-- Edit mode -->
    <template #edit>
      <v-form v-model="formValid">
        <v-row density="comfortable">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.contact_name"
              label="Contact Name"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.contact_phone"
              label="Contact Phone"
            />
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="form.special_instructions"
              :counter="1000"
              label="Special Instructions"
              :maxlength="1000"
              :rows="3"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.trash_day"
              hint="e.g. Tuesday or Mon/Thu"
              label="Trash Day"
              persistent-hint
            />
          </v-col>
        </v-row>
      </v-form>
    </template>
  </PropertySectionCard>
</template>

<script setup lang="ts">
  import type { Property } from '@/types'
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
    contact_name: '',
    contact_phone: '',
    special_instructions: '',
    trash_day: '',
  })

  function resetForm () {
    form.contact_name = props.property.contact_name ?? ''
    form.contact_phone = props.property.contact_phone ?? ''
    form.special_instructions = props.property.special_instructions ?? ''
    form.trash_day = props.property.trash_day ?? ''
  }

  const isDirty = computed(() => {
    return (
      (form.contact_name || undefined) !== props.property.contact_name
      || (form.contact_phone || undefined) !== props.property.contact_phone
      || (form.special_instructions || undefined) !== props.property.special_instructions
      || (form.trash_day || undefined) !== props.property.trash_day
    )
  })

  function closeEdit () {
    editing.value = false
  }

  function handleSave () {
    emit('save', {
      contact_name: form.contact_name || undefined,
      contact_phone: form.contact_phone || undefined,
      special_instructions: form.special_instructions || undefined,
      trash_day: form.trash_day || undefined,
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
