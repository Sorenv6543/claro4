<template>
  <v-bottom-navigation
    v-model="activeTab"
    class="mobile-bottom-nav"
    :class="{
      'nav-hidden': !isVisible,
      'nav-owner': userRole === 'owner',
      'nav-admin': userRole === 'admin'
    }"
    :color="primaryColor"
    density="comfortable"
    grow
    :height="navigationHeight"
    @update:model-value="handleNavigation"
  >
    <v-btn
      v-for="item in visibleNavItems"
      :key="item.id"
      class="nav-item"
      :class="{
        'nav-item-active': activeTab === item.value,
        'nav-item-urgent': item.urgent,
        'nav-item-disabled': item.disabled
      }"
      :disabled="item.disabled"
      size="small"
      :value="item.value"
      @click="handleItemClick(item)"
    >
      <!-- Icon with Badge Support -->
      <div class="nav-icon-container">
        <v-icon
          class="nav-icon"
          :class="{ 'icon-animated': item.urgent }"
          :color="getIconColor(item)"
          :icon="item.icon"
          :size="iconSize"
        />

        <!-- Notification Badge -->
        <v-badge
          v-if="item.badge && item.badge.count > 0"
          class="nav-badge"
          :class="badgeClasses(item.badge)"
          :color="item.badge.color || 'error'"
          :content="formatBadgeContent(item.badge)"
          :offset-x="badgeOffset.x"
          :offset-y="badgeOffset.y"
        />

        <!-- Urgent Indicator -->
        <div
          v-if="item.urgent"
          class="urgent-indicator"
        />
      </div>

      <!-- Label with Dynamic Text -->
      <span
        class="nav-label"
        :class="{ 'label-active': activeTab === item.value }"
      >
        {{ item.label }}
      </span>

      <!-- Loading Indicator -->
      <v-progress-circular
        v-if="item.loading"
        class="nav-loading"
        color="primary"
        indeterminate
        :size="16"
        :width="2"
      />
    </v-btn>

    <!-- Quick Action Indicator -->
    <div
      v-if="showQuickActionHint"
      class="quick-action-hint"
    >
      <v-icon
        class="hint-icon"
        color="primary"
        icon="mdi-gesture-swipe-up"
        size="small"
      />

      <span class="hint-text">Swipe up for quick actions</span>
    </div>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  export interface NavBadge {
    count: number
    max?: number
    color?: string
    urgent?: boolean
    pulse?: boolean
  }

  export interface NavItem {
    id: string
    value: string
    label: string
    icon: string
    route?: string
    badge?: NavBadge
    urgent?: boolean
    disabled?: boolean
    loading?: boolean
    role?: 'owner' | 'admin' | 'shared'
    condition?: () => boolean
    action?: () => void
  }

  interface Props {
    items: NavItem[]
    userRole: 'owner' | 'admin'
    currentRoute?: string
    height?: number
    primaryColor?: string
    autoHide?: boolean
    showQuickActionHint?: boolean
  }

  interface Emits {
    (e: 'navigate' | 'item-click', item: NavItem): void
    (e: 'tab-change', value: string): void
  }

  const props = withDefaults(defineProps<Props>(), {
    height: 64,
    primaryColor: 'primary',
    autoHide: true,
    showQuickActionHint: false,
  })

  const emit = defineEmits<Emits>()

  const router = useRouter()
  const route = useRoute()

  const activeTab = ref<string>('')
  const isVisible = ref(true)
  const lastScrollY = ref(0)

  // Computed properties
  const navigationHeight = computed(() => props.height)

  const iconSize = computed(() => {
    return activeTab.value ? 'default' : 'small'
  })

  const badgeOffset = computed(() => ({
    x: 12,
    y: 12,
  }))

  // Filter navigation items based on role and conditions
  const visibleNavItems = computed(() => {
    return props.items.filter(item => {
      // Role-based filtering
      if (item.role && item.role !== 'shared' && item.role !== props.userRole) {
        return false
      }

      // Condition-based filtering
      if (item.condition && !item.condition()) {
        return false
      }

      return true
    })
  })

  // Icon color logic
  function getIconColor (item: NavItem): string {
    if (item.disabled) return 'disabled'
    if (item.urgent) return 'error'
    if (activeTab.value === item.value) return 'primary'
    return 'on-surface-variant'
  }

  // Badge formatting
  function formatBadgeContent (badge: NavBadge): string {
    if (badge.max && badge.count > badge.max) {
      return `${badge.max}+`
    }
    return badge.count.toString()
  }

  function badgeClasses (badge: NavBadge) {
    return {
      'badge-pulse': badge.pulse,
      'badge-urgent': badge.urgent,
    }
  }

  // Navigation handlers
  function handleNavigation (value: string) {
    const item = visibleNavItems.value.find(item => item.value === value)
    if (item) {
      emit('tab-change', value)

      if (item.route) {
        router.push(item.route)
      }

      emit('navigate', item)
    }
  }

  function handleItemClick (item: NavItem) {
    if (item.disabled) return

    if (item.action) {
      item.action()
    }

    emit('item-click', item)
  }

  // Auto-hide functionality
  function handleScroll () {
    if (!props.autoHide) return

    const currentScrollY = window.scrollY

    if (currentScrollY > lastScrollY.value && currentScrollY > 100) {
      // Scrolling down - hide nav
      isVisible.value = false
    } else if (currentScrollY < lastScrollY.value) {
      // Scrolling up - show nav
      isVisible.value = true
    }

    lastScrollY.value = currentScrollY
  }

  // Route-based active tab detection
  function updateActiveTab () {
    const currentPath = route.path
    const matchingItem = visibleNavItems.value.find(item =>
      item.route && currentPath.startsWith(item.route),
    )

    if (matchingItem) {
      activeTab.value = matchingItem.value
    }
  }

  // Lifecycle
  onMounted(() => {
    updateActiveTab()

    if (props.autoHide) {
      window.addEventListener('scroll', handleScroll, { passive: true })
    }
  })

  onUnmounted(() => {
    if (props.autoHide) {
      window.removeEventListener('scroll', handleScroll)
    }
  })

  // Watch for route changes
  watch(
    () => route.path,
    () => updateActiveTab(),
    { immediate: true },
  )

  // Watch for current route prop changes
  watch(
    () => props.currentRoute,
    newRoute => {
      if (newRoute) {
        const matchingItem = visibleNavItems.value.find(item =>
          item.route === newRoute,
        )
        if (matchingItem) {
          activeTab.value = matchingItem.value
        }
      }
    },
  )
</script>
