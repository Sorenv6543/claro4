<template>
  <PropertySectionCard
    :editing="editing"
    :error="error"
    icon="mdi-key-variant"
    icon-color="warning"
    :loading="loading"
    :save-disabled="!isDirty"
    title="Access & Parking"
    @cancel="closeEdit"
    @edit="editing = true"
    @save="handleSave"
  >
    <!-- View mode -->
    <div class="section-field">
      <span class="field-label">Access Info</span>
      <div v-if="property.access_info">{{ property.access_info }}</div>
      <div v-else class="not-set">Not set</div>
    </div>
    <div class="section-field">
      <span class="field-label">Alarm Info</span>
      <div v-if="property.alarm_info">{{ property.alarm_info }}</div>
      <div v-else class="not-set">Not set</div>
    </div>
    <div class="section-field">
      <span class="field-label">Parking Instructions</span>
      <div v-if="property.parking_instructions">{{ property.parking_instructions }}</div>
      <div v-else class="not-set">Not set</div>
    </div>

    <!-- Edit mode -->
    <template #edit>
      <v-form v-model="formValid">
        <v-row density="comfortable">
          <v-col cols="12">
            <v-textarea
              v-model="form.access_info"
              label="Access Info"
              :rows="3"
            />
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="form.alarm_info"
              label="Alarm Info"
              :rows="3"
            />
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="form.parking_instructions"
              label="Parking Instructions"
              :rows="3"
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
    access_info: '',
    alarm_info: '',
    parking_instructions: '',
  })

  function resetForm () {
    form.access_info = props.property.access_info ?? ''
    form.alarm_info = props.property.alarm_info ?? ''
    form.parking_instructions = props.property.parking_instructions ?? ''
  }

  const isDirty = computed(() => {
    return (
      (form.access_info || undefined) !== props.property.access_info
      || (form.alarm_info || undefined) !== props.property.alarm_info
      || (form.parking_instructions || undefined) !== props.property.parking_instructions
    )
  })

  function closeEdit () {
    editing.value = false
  }

  function handleSave () {
    emit('save', {
      access_info: form.access_info || undefined,
      alarm_info: form.alarm_info || undefined,
      parking_instructions: form.parking_instructions || undefined,
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
