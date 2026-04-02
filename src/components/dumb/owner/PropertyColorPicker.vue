<template>
  <div class="color-picker d-flex gap-2 align-center">
    <button
      v-for="color in PROPERTY_COLORS"
      :key="color"
      class="color-swatch"
      :class="{ selected: modelValue === color }"
      :data-color="color"
      data-testid="color-swatch"
      :style="{ backgroundColor: color }"
      type="button"
      @click="$emit('update:modelValue', color)"
    />
  </div>
</template>

<script setup lang="ts">
  import { PROPERTY_COLORS } from '@/utils/cal';

  defineProps<{
    modelValue: string
  }>()

  defineEmits<{
    (e: 'update:modelValue', color: string): void
  }>()
</script>

<style scoped>
.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.15s;
}

.color-swatch:hover {
  transform: scale(1.15);
}

.color-swatch.selected {
  border-color: rgba(var(--v-theme-on-surface), 0.7);
  box-shadow: 0 0 0 2px rgba(var(--v-theme-surface), 1), 0 0 0 4px currentColor;
}
</style>
