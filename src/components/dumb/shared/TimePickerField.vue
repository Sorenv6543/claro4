<template>
  <v-menu v-model="menu" :close-on-content-click="false">
    <template #activator="{ props: menuProps }">
      <v-text-field
        v-bind="menuProps"
        :model-value="displayValue"
        :label="label"
        :hint="hint"
        :rules="wrappedRules"
        :disabled="disabled"
        :error-messages="errorMessages"
        persistent-hint
        readonly
        prepend-inner-icon="mdi-clock-outline"
      />
    </template>
    <v-time-picker
      :model-value="modelValue"
      format="ampm"
      color="primary"
      elevation="4"
      @update:model-value="onUpdate"
      @update:minute="menu = false"
    />
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string | undefined
  label: string
  hint?: string
  rules?: ((v: string) => boolean | string)[]
  disabled?: boolean
  errorMessages?: string | string[]
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const menu = ref(false)

// Convert "15:00" → "3:00 PM"
const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const [hourStr, minStr] = props.modelValue.split(':')
  const hour = parseInt(hourStr, 10)
  if (isNaN(hour)) return props.modelValue
  const min = minStr ?? '00'
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${min} ${period}`
})

// Rules validate the stored modelValue (HH:mm), not the display string.
const wrappedRules = computed(() =>
  (props.rules ?? []).map(rule => () => rule(props.modelValue ?? ''))
)

function onUpdate(value: string) {
  emit('update:modelValue', value)
}
</script>
