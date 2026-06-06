<template>
  <v-text-field
    autocomplete="off"
    density="compact"
    :disabled="disabled"
    :error-messages="errorMessages"
    :hint="hint"
    :label="label"
    :model-value="displayValue"
    persistent-hint
    prepend-inner-icon="mdi-clock-time-four-outline"
    readonly
    :rules="wrappedRules"
    variant="filled"
  >
    <v-menu
      v-model="showMenu"
      activator="parent"
      :close-on-content-click="false"
      min-width="0"
    >
      <v-time-picker
        elevation="1"
        format="ampm"
        :model-value="modelValue"
        @update:minute="showMenu = false"
        @update:model-value="onUpdate"
      />
    </v-menu>
  </v-text-field>
</template>

<script setup lang="ts">
  import { fmt12 } from '@/utils/timelineMath'
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

  const showMenu = ref(false)

  const displayValue = computed(() => {
    if (!props.modelValue) return ''
    return fmt12(props.modelValue)
  })

  const wrappedRules = computed(() =>
    (props.rules ?? []).map(rule => () => rule(props.modelValue ?? '')),
  )

  function onUpdate (value: string | null) {
    if (value !== null) emit('update:modelValue', value)
  }
</script>
