<template>
  <DashboardCard icon="mdi-history" title="Recent Activity">
    <div v-if="activities.length === 0" class="text-center text-medium-emphasis py-6">
      <v-icon class="mb-2" size="48">mdi-clock-outline</v-icon>
      <div class="text-body-2">No recent activity</div>
    </div>

    <v-timeline v-else density="compact" side="end" truncate-line="both">
      <v-timeline-item
        v-for="(activity, index) in activities"
        :key="index"
        :dot-color="activityColor(activity.type)"
        :icon="activityIcon(activity.type)"
        size="x-small"
      >
        <div class="d-flex flex-column">
          <div class="text-body-2">{{ activity.description }}</div>

          <div class="text-caption text-medium-emphasis">
            {{ relativeTime(activity.timestamp) }}
          </div>
        </div>
      </v-timeline-item>
    </v-timeline>
  </DashboardCard>
</template>

<script setup lang="ts">
  import DashboardCard from '@/components/dumb/shared/DashboardCard.vue'

  interface ActivityItem {
    type: 'created' | 'modified' | 'cancelled'
    description: string
    timestamp: string
    property: string
  }

  defineProps<{
    activities: ActivityItem[]
  }>()

  function activityIcon (type: string): string {
    switch (type) {
      case 'created': { return 'mdi-plus-circle-outline'
      }
      case 'modified': { return 'mdi-pencil-outline'
      }
      case 'cancelled': { return 'mdi-close-circle-outline'
      }
      default: { return 'mdi-information-outline'
      }
    }
  }

  function activityColor (type: string): string {
    switch (type) {
      case 'created': { return 'success'
      }
      case 'modified': { return 'info'
      }
      case 'cancelled': { return 'error'
      }
      default: { return 'grey'
      }
    }
  }

  function relativeTime (timestamp: string): string {
    const now = Date.now()
    const then = new Date(timestamp).getTime()
    const diffMs = now - then

    const seconds = Math.floor(diffMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 7) {
      return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }
</script>
