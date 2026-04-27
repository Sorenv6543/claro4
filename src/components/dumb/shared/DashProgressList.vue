<script setup lang="ts">
export interface ProgressListItem {
  name: string
  color: string
  percentage: number
}

defineProps<{
  title?: string
  items: ProgressListItem[]
}>()
</script>

<template>
  <v-card class="dpl">
    <div class="dpl-header">
      <span class="dpl-title">{{ title ?? 'Cleaning Completion' }}</span>
    </div>

    <div v-if="!items.length" class="dpl-empty">
      No data available
    </div>

    <template v-else>
      <div
        v-for="(item, idx) in items"
        :key="idx"
        class="dpl-item"
        :class="{ 'dpl-item--last': idx === items.length - 1 }"
      >
        <!-- Avatar -->
        <div
          class="dpl-avatar"
          :style="{ background: item.color + '20' }"
        >
          <v-icon :color="item.color" size="18">mdi-home-outline</v-icon>
        </div>

        <!-- Name + bar -->
        <div class="dpl-info">
          <span class="dpl-name">{{ item.name }}</span>
          <div class="dpl-bar-wrap">
            <div
              class="dpl-bar-fill"
              :style="{ width: `${item.percentage}%`, background: item.color }"
            />
          </div>
        </div>

        <!-- Percentage -->
        <span class="dpl-pct">{{ item.percentage }}%</span>
      </div>
    </template>
  </v-card>
</template>

<style scoped>
.dpl {
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.dpl-header {
  margin-bottom: 4px;
}

.dpl-title {
  font-size: var(--claro-text-md);
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
}

.dpl-empty {
  font-size: var(--claro-text-sm);
  color: var(--claro-fg3);
  padding: 16px 0;
}

.dpl-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--claro-border);
}

.dpl-item--last {
  border-bottom: none;
}

.dpl-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--claro-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dpl-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.dpl-name {
  font-size: var(--claro-text-sm);
  font-weight: var(--claro-font-weight-medium);
  color: var(--claro-fg1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dpl-bar-wrap {
  height: 6px;
  background: var(--claro-border);
  border-radius: 3px;
  overflow: hidden;
}

.dpl-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width var(--claro-dur-slow) var(--claro-ease);
}

.dpl-pct {
  font-size: 12px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg3);
  flex-shrink: 0;
  width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
