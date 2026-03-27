<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>

<template>
  <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mt-3 mb-2 pb-1" style="letter-spacing: 0.5px; border-bottom: 1px solid rgb(var(--v-border-color));">
    {{ label }}
  </div>
</template>
