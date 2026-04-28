<script setup lang="ts">
  defineProps<{
    title: string
    value: string | number
    icon: string
    iconColor?: string
    subtitle?: string
  }>()
</script>

<template>
  <v-card class="bsc" elevation="3" hover>
    <div
      class="bsc-avatar"
      :style="{ background: `color-mix(in srgb, ${iconColor ?? 'var(--claro-primary)'} 12.5%, transparent)` }"
    >
      <v-icon
        :color="iconColor ?? 'primary'"
        :icon="icon"
        size="22"
      />
    </div>

    <div class="bsc-info">
      <span class="bsc-value">{{ value }}</span>
      <span class="bsc-label">{{ title }}</span>
    </div>
  </v-card>
</template>

<style scoped>
.bsc {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.bsc-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--claro-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bsc-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.bsc-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--claro-fg1);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.bsc-label {
  font-size: var(--claro-text-sm);
  color: var(--claro-fg3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
