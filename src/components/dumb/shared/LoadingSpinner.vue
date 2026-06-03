<template>
  <div
    :class="containerClasses"
    :style="containerStyle"
  >
    <v-progress-circular
      class="loading-spinner"
      :color="color"
      :indeterminate="!progress"
      :model-value="progress"
      :size="size"
      :width="width"
    />

    <div
      v-if="message"
      class="loading-message"
      :class="messageClasses"
    >
      {{ message }}
    </div>

    <div
      v-if="showProgress && progress !== undefined"
      class="loading-progress"
    >
      {{ Math.round(progress) }}%
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    /** Size of the spinner */
    size?: number | string
    /** Width of the spinner stroke */
    width?: number | string
    /** Color of the spinner */
    color?: string
    /** Loading message to display */
    message?: string
    /** Progress value (0-100) for determinate progress */
    progress?: number
    /** Show progress percentage */
    showProgress?: boolean
    /** Variant for different use cases */
    variant?: 'inline' | 'overlay' | 'page' | 'button'
    /** Center the spinner */
    centered?: boolean
    /** Minimum height for the container */
    minHeight?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 40,
    width: 4,
    color: 'primary',
    variant: 'inline',
    centered: true,
    minHeight: 'auto',
  })

  // Computed classes and styles
  const containerClasses = computed(() => [
    'loading-spinner-container',
    `loading-spinner--${props.variant}`,
    {
      'loading-spinner--centered': props.centered,
      'loading-spinner--with-message': props.message,
      'loading-spinner--with-progress': props.showProgress && props.progress !== undefined,
    },
  ])

  const containerStyle = computed(() => ({
    minHeight: props.minHeight,
  }))

  const messageClasses = computed(() => [
    'text-body-2',
    {
      'text-center': props.centered,
      'mt-3': props.variant !== 'button',
    },
  ])
</script>
