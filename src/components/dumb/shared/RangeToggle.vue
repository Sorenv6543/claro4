<script setup lang="ts">
  defineOptions({ name: 'RangeToggle' })

  defineProps<{
    modelValue: number
    variant?: 'dark' | 'light'
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: number]
  }>()

  const labels = ['Today', 'Week', '2 Weeks']
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

<style scoped>
.range-toggle {
  display: inline-flex;
  gap: 3px;
  border-radius: 2px;
  padding: 3px;
}

.range-toggle.dark {
  background: rgba(255, 255, 255, 0.10);
}

.range-toggle.light {
  background: rgba(var(--v-theme-primary), 0.08);
}

.toggle-pill {
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--claro-font-family, 'Inter', sans-serif);
  cursor: pointer;
  transition: background 0.18s, color 0.18s, border-color 0.18s;
  line-height: 1.4;
  white-space: nowrap;
  border: 1.5px solid transparent;
}

.dark .toggle-pill {
  background: transparent;
  color: rgba(255, 255, 255, 0.60);
}

.dark .toggle-pill--active {
  background: var(--claro-primary);
  color: #fff;
  border-color: var(--claro-primary);
}

.dark .toggle-pill:not(.toggle-pill--active):hover {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.08);
}

.light .toggle-pill {
  background: #fff;
  color: var(--claro-primary);
  border-color: rgba(var(--v-theme-primary), 0.22);
}

.light .toggle-pill--active {
  background: var(--claro-primary);
  color: #fff;
  border-color: var(--claro-primary);
}

.light .toggle-pill:not(.toggle-pill--active):hover {
  background: rgba(var(--v-theme-primary), 0.06);
}

.toggle-pill:focus-visible {
  outline: 2px solid var(--claro-primary);
  outline-offset: 2px;
}
</style>
