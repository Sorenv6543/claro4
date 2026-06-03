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
