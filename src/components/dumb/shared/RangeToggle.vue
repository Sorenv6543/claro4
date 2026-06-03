<script setup lang="ts">
  defineOptions({ name: 'RangeToggle' })

  defineProps<{
    modelValue: number
    variant?: 'dark' | 'light'
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: number]
  }>()

  const labels = ['Today', '3 days', '7 days']
</script>

<template>
  <div aria-label="Time range" class="range-toggle" :class="variant ?? 'light'" role="group">
    <button
      v-for="(label, i) in labels"
      :key="i"
      :aria-pressed="modelValue === i"
      class="toggle-pill"
      :class="{ 'toggle-pill--active': modelValue === i }"
      type="button"
      @click="emit('update:modelValue', i)"
    >
      {{ label }}
    </button>
  </div>
</template>
