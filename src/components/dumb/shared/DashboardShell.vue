<script setup lang="ts">
  defineProps<{
    maxWidth?: string | number
    noPadding?: boolean
  }>()
</script>

<template>
  <div
    class="dashboard-shell"
    :class="{ 'dashboard-shell--no-padding': noPadding }"
    :style="maxWidth ? { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth, marginInline: 'auto' } : undefined"
  >
    <slot name="header" />

    <div class="dashboard-shell__content">
      <slot />
    </div>

    <slot name="footer" />
  </div>
</template>
