<template>
  <div class="quick-actions-fab">
    <!-- Main FAB Trigger -->
    <v-fab
      v-model="isExpanded"
      app
      class="main-fab"
      :class="{
        'fab-expanded': isExpanded,
        'fab-pulse': showPulse
      }"
      :color="mainColor"
      :icon="isExpanded ? 'mdi-close' : mainIcon"
      location="bottom end"
      size="large"
      @click="toggleExpanded"
    />

    <!-- Expandable Action Items -->
    <v-slide-y-reverse-transition
      class="fab-menu"
      group
      tag="div"
    >
      <v-fab
        v-for="(action, index) in visibleActions"
        v-show="isExpanded"
        :key="action.id"
        class="action-fab"
        :class="`action-fab-${index}`"
        :color="action.color || 'primary'"
        :icon="action.icon"
        size="small"
        :style="{
          '--delay': `${index * 100}ms`,
          '--offset': `${(index + 1) * 70}px`
        }"
        @click="handleActionClick(action)"
      >
        <v-tooltip
          activator="parent"
          location="start"
          :text="action.tooltip"
        />
      </v-fab>
    </v-slide-y-reverse-transition>

    <!-- Backdrop -->
    <v-overlay
      v-model="isExpanded"
      class="fab-overlay"
      opacity="0.1"
      @click="closeMenu"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'

  export interface QuickAction {
    id: string
    icon: string
    tooltip: string
    color?: string
    action?: () => void
    condition?: () => boolean
    priority?: number
  }

  interface Props {
    actions: QuickAction[]
    mainIcon?: string
    mainColor?: string
    maxVisible?: number
    showPulse?: boolean
    autoClose?: boolean
  }

  interface Emits {
    (e: 'action-click', action: QuickAction): void
    (e: 'menu-toggle', isExpanded: boolean): void
  }

  const props = withDefaults(defineProps<Props>(), {
    mainIcon: 'mdi-plus',
    mainColor: 'primary',
    maxVisible: 4,
    showPulse: false,
    autoClose: true,
  })

  const emit = defineEmits<Emits>()

  const isExpanded = ref(false)

  // Filter and sort actions based on conditions and priority
  const visibleActions = computed(() => {
    return props.actions
      .filter(action => !action.condition || action.condition())
      .toSorted((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, props.maxVisible)
  })

  // Handle action click
  function handleActionClick (action: QuickAction) {
    if (action.action) {
      action.action()
    }
    emit('action-click', action)

    if (props.autoClose) {
      closeMenu()
    }
  }

  // Menu controls
  function toggleExpanded () {
    isExpanded.value = !isExpanded.value
    emit('menu-toggle', isExpanded.value)
  }

  function closeMenu () {
    isExpanded.value = false
    emit('menu-toggle', false)
  }

  // Auto-close on escape key
  function handleKeyDown (event: KeyboardEvent) {
    if (event.key === 'Escape' && isExpanded.value) {
      closeMenu()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  // Watch for changes in visible actions
  watch(() => visibleActions.value.length, newLength => {
    if (newLength === 0 && isExpanded.value) {
      closeMenu()
    }
  })
</script>
