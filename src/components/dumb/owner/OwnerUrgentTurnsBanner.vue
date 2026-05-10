<template>
  <v-card v-if="turns.length > 0" class="urgent-turns-banner" color="warning" variant="tonal">
    <v-card-text class="d-flex align-center flex-wrap ga-3 py-3">
      <v-icon class="mr-1" color="warning" size="24">mdi-alert-circle</v-icon>

      <span class="text-body-1 font-weight-bold text-warning">
        {{ turns.length }} urgent turn{{ turns.length > 1 ? 's' : '' }} today
      </span>

      <v-divider class="mx-2 d-none d-sm-block" vertical />

      <div class="d-flex flex-wrap ga-2">
        <v-chip
          v-for="(turn, index) in turns"
          :key="index"
          :color="turn.priority === 'urgent' ? 'error' : 'warning'"
          size="small"
          variant="elevated"
        >
          <v-icon size="14" start>mdi-home</v-icon>
          {{ turn.property }} @ {{ formatTime(turn.time) }}
        </v-chip>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  interface TurnInfo {
    property: string
    time: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
  }

  defineProps<{
    turns: TurnInfo[]
  }>()

  function formatTime (time: string): string {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const h = Number.parseInt(hours, 10)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHour = h % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }
</script>

<style scoped>
.urgent-turns-banner {
  background: rgba(var(--v-theme-warning), 0.10);
  border: 1px solid rgba(var(--v-theme-warning), 0.25);
}
</style>
