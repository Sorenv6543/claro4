<script setup lang="ts">
export interface TimelineActivityItem {
  type: 'checkout' | 'checkin' | 'turn' | 'assigned'
  description: string
  timeLabel: string
}

defineProps<{
  items: TimelineActivityItem[]
}>()

const DOT_COLORS: Record<TimelineActivityItem['type'], string> = {
  checkout: 'var(--claro-error)',
  checkin:  'var(--claro-success)',
  turn:     'var(--claro-warning)',
  assigned: 'var(--claro-primary)',
}

function dotColor(type: TimelineActivityItem['type']): string {
  return DOT_COLORS[type]
}
</script>

<template>
  <v-card class="dat">
    <div class="dat-header">
      <span class="dat-title">Recent Activity</span>
    </div>

    <div v-if="!items.length" class="dat-empty">
      <v-icon aria-hidden="true" class="mb-1" size="28">mdi-clock-outline</v-icon>
      <span>No recent activity</span>
    </div>

    <div v-else class="dat-list">
      <div v-for="(item, idx) in items" :key="idx" class="dat-item">
        <!-- Spine column -->
        <div class="dat-dot-col">
          <div class="dat-dot" :style="{ background: dotColor(item.type) }" />
          <div v-if="idx < items.length - 1" class="dat-line" />
        </div>
        <!-- Content -->
        <div class="dat-content">
          <span class="dat-desc">{{ item.description }}</span>
          <span class="dat-time">{{ item.timeLabel }}</span>
        </div>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.dat {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.dat-header {
  margin-bottom: 16px;
}

.dat-title {
  font-size: var(--claro-text-md);
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
}

.dat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  color: var(--claro-fg3);
  font-size: var(--claro-text-sm);
  gap: 4px;
}

.dat-list {
  display: flex;
  flex-direction: column;
}

.dat-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
}

/* Dot + connector */
.dat-dot-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 10px;
  flex-shrink: 0;
  padding-top: 3px;
}

.dat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dat-line {
  width: 2px;
  flex: 1;
  min-height: 16px;
  background: var(--claro-border);
  margin-top: 6px;
}

/* Text */
.dat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.dat-desc {
  font-size: var(--claro-text-sm);
  font-weight: var(--claro-font-weight-medium);
  color: var(--claro-fg1);
  line-height: 1.3;
}

.dat-time {
  font-size: var(--claro-text-xs);
  color: var(--claro-fg3);
}
</style>
