<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  badge?: number | string | null
}>()
</script>

<template>
  <div class="oph">
    <div class="oph-left">
      <div class="oph-title-row">
        <h1 class="oph-title">{{ title }}</h1>
        <v-chip
          v-if="badge !== null && badge !== undefined"
          class="oph-badge"
          color="primary"
          size="small"
          variant="tonal"
        >
          {{ badge }}
        </v-chip>
      </div>
      <p v-if="subtitle" class="oph-sub">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="oph-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.oph {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: var(--claro-space-xl) 0 var(--claro-space-lg);
}

.oph-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.oph-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.oph-title {
  font-size: var(--claro-text-xl);
  font-weight: 700;
  color: var(--claro-fg1);
  margin: 0;
  letter-spacing: -0.015em;
}

.oph-sub {
  font-size: var(--claro-text-sm);
  color: var(--claro-fg3);
  margin: 0;
}

.oph-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding-top: var(--claro-space-xl);
}
</style>
