<template>
  <v-menu v-model="menu" :close-on-content-click="false">
    <template #activator="{ props: menuProps }">
      <v-text-field
        v-bind="menuProps"
        :disabled="disabled"
        :error-messages="errorMessages"
        :hint="hint"
        :label="label"
        :model-value="displayValue"
        persistent-hint
        prepend-inner-icon="mdi-clock-outline"
        readonly
        :rules="wrappedRules"
      />
    </template>
    <v-time-picker
      color="primary"
      elevation="4"
      format="ampm"
      :model-value="modelValue"
      @update:minute="menu = false"
      @update:model-value="onUpdate"
    />
  </v-menu>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'

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
    const hour = Number.parseInt(hourStr, 10)
    if (Number.isNaN(hour)) return props.modelValue
    const min = minStr ?? '00'
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${min} ${period}`
  })

  // Rules validate the stored modelValue (HH:mm), not the display string.
  const wrappedRules = computed(() =>
    (props.rules ?? []).map(rule => () => rule(props.modelValue ?? '')),
  )

  function onUpdate (value: string | null) {
    if (value !== null) emit('update:modelValue', value)
  }
</script>
