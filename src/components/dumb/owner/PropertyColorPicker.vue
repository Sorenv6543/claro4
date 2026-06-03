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
  import { PROPERTY_COLORS } from '@/utils/constants'

  defineProps<{
    modelValue: string
  }>()

  defineEmits<{
    (e: 'update:modelValue', color: string): void
  }>()
</script>
