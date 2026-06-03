<template>
  <v-chip
    :class="[
      'priority-badge',
      `priority-${priority}`,
      {
        'priority-badge--animated': animated,
        'priority-badge--clickable': clickable,
        'priority-badge--closable': closable,
        'owner-interface': userRole === 'owner',
        'admin-interface': userRole === 'admin'
      }
    ]"
    :closable="closable"
    :color="getBadgeColor()"
    :label="label"
    :size="size"
    :variant="variant"
    @click="handleClick"
    @click:close="handleClose"
  >
    <template
      v-if="showIcon"
      #prepend
    >
      <v-icon
        class="mr-1"
        :icon="getPriorityIcon()"
        :size="getIconSize()"
      />
    </template>

    <span class="priority-text">
      {{ getPriorityText() }}
    </span>

    <template
      v-if="showTimeRemaining && timeRemaining"
      #append
    >
      <v-chip
        class="ml-1 time-chip"
        :color="getTimeColor()"
        label
        size="x-small"
      >
        {{ formatTimeRemaining() }}
      </v-chip>
    </template>
  </v-chip>
</template>

<script setup lang="ts">
  type BookingPriority = 'low' | 'normal' | 'high' | 'urgent'

  interface Props {
    priority: BookingPriority
    userRole?: 'owner' | 'admin' | 'cleaner'
    animated?: boolean
    clickable?: boolean
    closable?: boolean
    label?: boolean
    showIcon?: boolean
    showTimeRemaining?: boolean
    timeRemaining?: number // minutes
    size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
    variant?: 'flat' | 'tonal' | 'outlined' | 'text' | 'elevated'
  }

  interface Emits {
    (e: 'click' | 'close'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    userRole: 'owner',
    animated: true,
    clickable: false,
    closable: false,
    label: true,
    showIcon: true,
    showTimeRemaining: false,
    size: 'small',
    variant: 'flat',
  })

  const emit = defineEmits<Emits>()

  // Get role-based colors
  function getBadgeColor (): string {
    const isOwner = props.userRole === 'owner'

    switch (props.priority) {
      case 'urgent': {
        return isOwner ? 'warning' : 'error'
      }
      case 'high': {
        return 'warning'
      }
      case 'normal': {
        return 'primary'
      }
      case 'low': {
        return 'info'
      }
      default: {
        return 'primary'
      }
    }
  }

  // Get priority icons
  function getPriorityIcon (): string {
    switch (props.priority) {
      case 'urgent': {
        return 'mdi-alert-circle'
      }
      case 'high': {
        return 'mdi-clock-fast'
      }
      case 'normal': {
        return 'mdi-clock-outline'
      }
      case 'low': {
        return 'mdi-clock-check-outline'
      }
      default: {
        return 'mdi-information-outline'
      }
    }
  }

  // Get icon size based on chip size
  function getIconSize (): string {
    switch (props.size) {
      case 'x-small': {
        return 'x-small'
      }
      case 'small': {
        return 'small'
      }
      case 'large': {
        return 'default'
      }
      case 'x-large': {
        return 'large'
      }
      default: {
        return 'small'
      }
    }
  }

  // Get role-based priority text
  function getPriorityText (): string {
    const isOwner = props.userRole === 'owner'

    switch (props.priority) {
      case 'urgent': {
        return isOwner ? 'Needs Attention' : 'URGENT'
      }
      case 'high': {
        return isOwner ? 'High Priority' : 'HIGH'
      }
      case 'normal': {
        return isOwner ? 'Normal' : 'NORMAL'
      }
      case 'low': {
        return isOwner ? 'Low Priority' : 'LOW'
      }
      default: {
        return 'Standard'
      }
    }
  }

  // Get time remaining color
  function getTimeColor (): string {
    if (!props.timeRemaining) return 'grey'

    if (props.timeRemaining <= 30) {
      return 'error'
    } else if (props.timeRemaining <= 60) {
      return 'warning'
    } else {
      return 'success'
    }
  }

  // Format time remaining
  function formatTimeRemaining (): string {
    if (!props.timeRemaining) return ''

    const hours = Math.floor(props.timeRemaining / 60)
    const minutes = props.timeRemaining % 60

    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  // Event handlers
  function handleClick (): void {
    if (props.clickable) {
      emit('click')
    }
  }

  function handleClose (): void {
    if (props.closable) {
      emit('close')
    }
  }
</script>
