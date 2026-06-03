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
