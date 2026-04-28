<template>
  <v-card class="h-100">
    <v-card-text class="pa-5">
      <div class="d-flex align-center justify-space-between mb-4">
        <h3 class="text-h6 font-weight-bold">
          Urgent Turns
        </h3>

        <v-chip
          v-if="turns.length > 0"
          color="error"
          size="small"
          variant="flat"
        >
          {{ turns.length }}
        </v-chip>
      </div>

      <div
        v-if="turns.length === 0"
        class="text-center py-8"
      >
        <v-icon
          color="success"
          size="40"
        >
          mdi-check-circle-outline
        </v-icon>

        <p class="text-body-2 text-medium-emphasis mt-2">
          No urgent turns right now
        </p>
      </div>

      <v-list
        v-else
        class="pa-0"
        density="compact"
      >
        <v-list-item
          v-for="(turn, index) in turns"
          :key="index"
          class="px-0"
        >
          <template #prepend>
            <v-avatar
              :color="priorityColor(turn.priority)"
              size="36"
              variant="tonal"
            >
              <v-icon size="18">
                mdi-fire
              </v-icon>
            </v-avatar>
          </template>

          <v-list-item-title class="text-body-2 font-weight-medium">
            {{ turn.property }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption">
            {{ turn.time }}
          </v-list-item-subtitle>

          <template #append>
            <v-chip
              :color="priorityColor(turn.priority)"
              size="x-small"
              variant="flat"
            >
              {{ turn.priority }}
            </v-chip>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  defineProps<{
    turns: Array<{ property: string, time: string, priority: string }>
  }>()

  function priorityColor (priority: string): string {
    switch (priority) {
      case 'urgent': {
        return 'error'
      }
      case 'high': {
        return 'warning'
      }
      case 'normal': {
        return 'info'
      }
      case 'low': {
        return 'success'
      }
      default: {
        return 'grey'
      }
    }
  }
</script>
