<template>
  <v-card
    class="dashboard-card"
    :class="{ 'dashboard-card--accent': !!accentColor, 'dashboard-card--flat': flat }"
    :elevation="flat ? 0 : 24"
    :style="accentColor ? { '--card-accent': accentColor } : undefined"
  >
    <!-- Header: shown when title/icon prop provided OR #header slot is used -->
    <v-card-title
      v-if="hasHeader"
      class="dashboard-card__header"
    >
      <slot name="header">
        <v-icon
          v-if="icon"
          class="mr-2"
          :icon="icon"
        />
        <span>{{ title }}</span>
      </slot>
      <v-spacer />
      <slot name="header-actions" />
    </v-card-title>

    <v-divider v-if="hasHeader" />

    <!-- Main content -->
    <v-card-text class="dashboard-card__content">
      <slot />
    </v-card-text>

    <!-- Footer actions -->
    <template v-if="$slots.actions">
      <v-divider />
      <v-card-actions class="dashboard-card__actions">
        <slot name="actions" />
      </v-card-actions>
    </template>
  </v-card>
</template>

<script setup lang="ts">
  import { computed, useSlots } from 'vue'

  interface Props {
    title?: string
    icon?: string
    accentColor?: string
    flat?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    title: undefined,
    icon: undefined,
    accentColor: undefined,
    flat: false,
  })

  const slots = useSlots()

  /** Header row is visible when a title/icon prop is set OR the #header slot is filled */
  const hasHeader = computed(() => !!(props.title || props.icon || slots.header))
</script>

<style scoped>
.dashboard-card {
  background: var(--claro-card-bg, rgb(var(--v-theme-surface))) !important;
  border-radius: var(--claro-radius-md, 8px) !important;
  padding: var(--claro-card-padding, 0);
}

.dashboard-card--flat {
  box-shadow: none !important;
}

.dashboard-card--accent {
  border-left: 4px solid var(--card-accent) !important;
}

.dashboard-card__header {
  display: flex;
  flex-direction: row;
  align-items: center;
  font-weight: var(--claro-font-weight-semibold, 600);
  padding: var(--claro-space-lg, 24px) var(--claro-space-lg, 24px) var(--claro-space-sm, 8px);
}

.dashboard-card__content {
  padding: var(--claro-space-lg, 24px) !important;
}

.dashboard-card__actions {
  padding: var(--claro-space-sm, 8px) var(--claro-space-lg, 24px) !important;
}
</style>
