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

<style scoped>
.dashboard-shell {
  width: 100%;
  min-height: 100%;
  background: var(--claro-background);
  padding: var(--claro-content-padding);
}

.dashboard-shell--no-padding {
  padding: 0;
}

.dashboard-shell__content {
  display: flex;
  flex-direction: column;
  gap: var(--claro-section-gap);
}

@media (max-width: 599px) {
  .dashboard-shell {
    padding: var(--claro-content-padding-mobile);
  }
}
</style>
