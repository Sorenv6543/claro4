<template>
  <div
    class="skeleton-loader"
    :class="[
      `skeleton-${type}`,
      `skeleton-${variant}`,
      { 'skeleton-animated': animated }
    ]"
    :style="customStyles"
  >
    <!-- Card-style skeleton -->
    <template v-if="type === 'card'">
      <div class="skeleton-card">
        <div class="skeleton-header">
          <div class="skeleton-avatar" />

          <div class="skeleton-title-section">
            <div class="skeleton-title" />
            <div class="skeleton-subtitle" />
          </div>

          <div class="skeleton-badge" />
        </div>

        <div class="skeleton-content">
          <div class="skeleton-metrics">
            <div class="skeleton-metric" />
            <div class="skeleton-metric" />
          </div>

          <div class="skeleton-text-lines">
            <div class="skeleton-line full" />
            <div class="skeleton-line medium" />
            <div class="skeleton-line small" />
          </div>
        </div>

        <div class="skeleton-actions">
          <div class="skeleton-button" />
          <div class="skeleton-button" />
          <div class="skeleton-button-icon" />
        </div>
      </div>
    </template>

    <!-- List item skeleton -->
    <template v-else-if="type === 'list-item'">
      <div class="skeleton-list-item">
        <div class="skeleton-list-avatar" />

        <div class="skeleton-list-content">
          <div class="skeleton-list-title" />
          <div class="skeleton-list-subtitle" />

          <div class="skeleton-list-meta">
            <div class="skeleton-chip" />
            <div class="skeleton-chip" />
          </div>
        </div>

        <div class="skeleton-list-actions">
          <div class="skeleton-icon-btn" />
          <div class="skeleton-icon-btn" />
        </div>
      </div>
    </template>

    <!-- Table row skeleton -->
    <template v-else-if="type === 'table-row'">
      <div class="skeleton-table-row">
        <div class="skeleton-cell checkbox" />
        <div class="skeleton-cell primary" />
        <div class="skeleton-cell secondary" />
        <div class="skeleton-cell tertiary" />
        <div class="skeleton-cell actions" />
      </div>
    </template>

    <!-- Calendar event skeleton -->
    <template v-else-if="type === 'calendar-event'">
      <div class="skeleton-calendar-event">
        <div class="skeleton-event-time" />
        <div class="skeleton-event-title" />
        <div class="skeleton-event-details" />
      </div>
    </template>

    <!-- Form field skeleton -->
    <template v-else-if="type === 'form-field'">
      <div class="skeleton-form-field">
        <div class="skeleton-field-label" />
        <div class="skeleton-field-input" />
        <div class="skeleton-field-helper" />
      </div>
    </template>

    <!-- Dashboard widget skeleton -->
    <template v-else-if="type === 'dashboard-widget'">
      <div class="skeleton-dashboard-widget">
        <div class="skeleton-widget-header">
          <div class="skeleton-widget-title" />
          <div class="skeleton-widget-value" />
        </div>

        <div class="skeleton-widget-chart">
          <div
            class="skeleton-chart-bar"
            style="height: 60%"
          />

          <div
            class="skeleton-chart-bar"
            style="height: 80%"
          />

          <div
            class="skeleton-chart-bar"
            style="height: 40%"
          />

          <div
            class="skeleton-chart-bar"
            style="height: 90%"
          />

          <div
            class="skeleton-chart-bar"
            style="height: 70%"
          />
        </div>
      </div>
    </template>

    <!-- Navigation menu skeleton -->
    <template v-else-if="type === 'nav-menu'">
      <div class="skeleton-nav-menu">
        <div
          v-for="item in menuItemCount"
          :key="item"
          class="skeleton-nav-item"
        >
          <div class="skeleton-nav-icon" />
          <div class="skeleton-nav-text" />
          <div class="skeleton-nav-badge" />
        </div>
      </div>
    </template>

    <!-- Custom text skeleton -->
    <template v-else-if="type === 'text'">
      <div class="skeleton-text">
        <div
          v-for="line in textLines"
          :key="line"
          class="skeleton-line"
          :class="getTextLineClass(line)"
        />
      </div>
    </template>

    <!-- Image skeleton -->
    <template v-else-if="type === 'image'">
      <div class="skeleton-image">
        <div class="skeleton-image-placeholder">
          <v-icon
            class="skeleton-image-icon"
            icon="mdi-image-outline"
            size="large"
          />
        </div>
      </div>
    </template>

    <!-- Generic rectangular skeleton -->
    <template v-else>
      <div class="skeleton-rectangle" />
    </template>

    <!-- Loading progress indicator (optional) -->
    <div
      v-if="showProgress"
      class="skeleton-progress"
    >
      <v-progress-linear
        class="skeleton-progress-bar"
        :color="progressColor"
        height="2"
        indeterminate
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  type SkeletonType
    = | 'card'
      | 'list-item'
      | 'table-row'
      | 'calendar-event'
      | 'form-field'
      | 'dashboard-widget'
      | 'nav-menu'
      | 'text'
      | 'image'
      | 'rectangle'

  type SkeletonVariant = 'wave' | 'pulse' | 'shimmer' | 'static'

  interface Props {
    type?: SkeletonType
    variant?: SkeletonVariant
    animated?: boolean
    width?: string | number
    height?: string | number
    lines?: number
    menuItems?: number
    showProgress?: boolean
    progressColor?: string
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    type: 'rectangle',
    variant: 'shimmer',
    animated: true,
    lines: 3,
    menuItems: 5,
    showProgress: false,
    progressColor: 'primary',
    loading: true,
  })

  // Computed styles for custom dimensions
  const customStyles = computed(() => {
    const styles: Record<string, string> = {}

    if (props.width) {
      styles.width = typeof props.width === 'number' ? `${props.width}px` : props.width
    }

    if (props.height) {
      styles.height = typeof props.height === 'number' ? `${props.height}px` : props.height
    }

    return styles
  })

  // Text lines for text skeleton
  const textLines = computed(() => props.lines || 3)

  // Menu items for navigation skeleton
  const menuItemCount = computed(() => props.menuItems || 5)

  // Generate text line classes for varying widths
  function getTextLineClass (lineIndex: number): string {
    const classes = ['full', 'large', 'medium', 'small']
    return classes[lineIndex % classes.length] || 'medium'
  }
</script>
