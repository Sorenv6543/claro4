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
        prepend-inner-icon="mdi-calendar"
      />
    </template>
    <v-date-picker
      :model-value="strToDate(modelValue)"
      :min="min"
      :max="max"
      color="primary"
      elevation="4"
      hide-title
      @update:model-value="onSelect"
    />
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string | null | undefined
  label: string
  min?: string
  max?: string
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

function strToDate(str: string | null | undefined): Date | undefined {
  if (!str) return undefined
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function dateToStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Display value: "Mon, Apr 5 2026" when set, empty string when null/empty
const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const d = strToDate(props.modelValue)
  if (!d) return ''
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  })
})

// Rules validate the stored modelValue (YYYY-MM-DD), not the display string.
// Without this wrapper, date format rules like /^\d{4}-\d{2}-\d{2}$/ would
// incorrectly test "Mon, Apr 5 2026" instead of "2026-04-05".
const wrappedRules = computed(() =>
  (props.rules ?? []).map(rule => () => rule(props.modelValue ?? ''))
)

function onSelect(date: unknown) {
  if (date instanceof Date) {
    emit('update:modelValue', dateToStr(date))
    menu.value = false
  }
}
</script>
