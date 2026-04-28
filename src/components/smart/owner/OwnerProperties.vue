<!-- Owner-specific property management page.
     Uses owner-scoped composables (useOwnerProperties, useOwnerBookings)
     to ensure all data is filtered to the current owner only.
     Do NOT bypass these composables to call stores directly. -->

<template>
  <div class="owner-properties-page">
    <v-container class="pt-0" fluid>
      <!-- Hero banner replaces OwnerPageHeader -->
      <OwnerWelcomeBanner
        class="mb-6"
        page-title="My Properties"
        subtitle="Manage your rental properties and cleaning operations"
        :stats="[
          { icon: 'mdi-home-group',     label: 'Active',    value: myProperties.length  },
          { icon: 'mdi-swap-horizontal', label: 'Turns Today', value: myTodayTurns.length },
          { icon: 'mdi-calendar-check', label: 'Total Bookings', value: totalBookingsCount },
        ]"
      />

      <!-- C3 — Compact Inline Bar -->
      <div class="c3-inline-bar mb-5">
        <div class="c3-cell">
          <v-icon color="primary" size="20">mdi-home-city</v-icon>
          <span class="c3-value">{{ myProperties.length }}</span>
          <span class="c3-label">Properties</span>
        </div>
        <div class="c3-divider" />
        <div class="c3-cell">
          <v-icon color="success" size="20">mdi-check-circle</v-icon>
          <span class="c3-value">{{ myActiveProperties.length }}</span>
          <span class="c3-label">Active</span>
        </div>
        <div class="c3-divider" />
        <div class="c3-cell">
          <v-icon color="info" size="20">mdi-calendar-multiple</v-icon>
          <span class="c3-value">{{ myBookings.length }}</span>
          <span class="c3-label">Bookings</span>
        </div>
        <div class="c3-divider" />
        <div class="c3-cell">
          <v-icon color="warning" size="20">mdi-swap-horizontal</v-icon>
          <span class="c3-value">{{ myTodayTurns.length }}</span>
          <span class="c3-label">Turns</span>
        </div>
      </div>

      <!-- Segment filter -->
      <div class="d-flex ga-2 flex-wrap mb-4">
        <v-btn
          v-for="seg in segments"
          :key="seg.value"
          :color="selectedSegment === seg.value ? 'primary' : undefined"
          density="compact"
          size="small"
          :variant="selectedSegment === seg.value ? 'flat' : 'outlined'"
          @click="selectedSegment = seg.value"
        >
          {{ seg.title }}
        </v-btn>
      </div>

      <!-- Property list -->
      <PropertyList
        :items="listItems"
        @assign-cleaner="handleAssignCleaner"
        @edit="handleListEdit"
        @more="handleListMore"
        @view-calendar="handleViewCalendar"
      />
    </v-container>

    <!-- Property Modal - Same modal system as HomeOwner -->
    <PropertyModal
      :existing-property-count="myProperties.length"
      :mode="propertyModalMode"
      :open="propertyModalOpen"
      :owner-id="authStore.user?.id || ''"
      :property="propertyModalData"
      :stepper="propertyModalMode === 'create'"
      @close="handlePropertyModalClose"
      @delete="handlePropertyModalDelete"
      @save="handlePropertyModalSave"
      @skip="handlePropertyModalSkip"
    />

    <!-- Confirmation Dialog - Same system as HomeOwner -->
    <ConfirmationDialog
      :cancel-text="confirmDialogCancelText"
      :confirm-text="confirmDialogConfirmText"
      :dangerous="confirmDialogDangerous"
      :message="confirmDialogMessage"
      :open="confirmDialogOpen"
      :title="confirmDialogTitle"
      @cancel="handleConfirmDialogCancel"
      @close="handleConfirmDialogClose"
      @confirm="handleConfirmDialogConfirm"
    />
  </div>
</template>

<script setup lang="ts">
  import type { Property, PropertyFormData, PropertyRecord } from '@/types'
  import type { PropertyListEvent, PropertyListItem, PropertyStats, PropertyTimelineEvent } from '@/components/dumb/owner/PropertyList.vue'
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import PropertyModal from '@/components/dumb/shared/PropertyModal.vue'
  import PropertyList from '@/components/dumb/owner/PropertyList.vue'
  import OwnerWelcomeBanner from '@/components/dumb/owner/OwnerWelcomeBanner.vue'

  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useAuthStore } from '@/stores/auth'
  import { useUIStore } from '@/stores/ui'
  import { formatPropertyAddress } from '@/types/property'

  // Component metadata
  defineOptions({
    name: 'OwnerProperties',
  })

  const uiStore = useUIStore()
  const authStore = useAuthStore()
  const router = useRouter()
  const { mobile } = useDisplay()

  const {
    myProperties,
    myActiveProperties,
    fetchMyProperties,
    createMyProperty,
    updateMyProperty,
    deleteMyProperty,
    error: propertyError,
  } = useOwnerProperties()

  const {
    myBookings,
    myTodayTurns,
    fetchMyBookings,
  } = useOwnerBookings()

  // Segment filter
  const selectedSegment = ref('all')
  const segments = [
    { title: 'All', value: 'all' },
    { title: 'Active', value: 'active' },
    { title: 'Inactive', value: 'inactive' },
  ]

  // Count bookings per property (for delete guard)
  const bookingCountByProperty = computed(() => {
    const counts = new Map<string, number>()
    for (const booking of myBookings.value) {
      counts.set(booking.property_id, (counts.get(booking.property_id) ?? 0) + 1)
    }
    return counts
  })

  // ─── PropertyList data mapping ───────────────────────────────────────────

  function formatTime12h(time24: string): string {
    const [h, m] = time24.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h)
    return `${displayH}:${String(m ?? 0).padStart(2, '0')} ${ampm}`
  }

  function formatEventDate(dateStr: string, todayStr: string): string {
    if (dateStr === todayStr) return 'Today'
    const d = new Date(`${dateStr}T12:00:00`)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const totalBookingsCount = computed(() =>
    myBookings.value.filter(b => b.status !== 'cancelled').length,
  )

  const listItems = computed<PropertyListItem[]>(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const currentYear = new Date().getFullYear()

    let properties = myProperties.value
    if (selectedSegment.value === 'active') properties = properties.filter(p => p.active)
    else if (selectedSegment.value === 'inactive') properties = properties.filter(p => !p.active)

    return properties.map(property => {
      const propBookings = myBookings.value.filter(b =>
        b.property_id === property.id &&
        b.status !== 'cancelled' &&
        b.status !== 'completed',
      )

      // Today's turn (checkout_date or checkin_date is today, booking_type is turn)
      const todayTurn = propBookings.find(b =>
        b.booking_type === 'turn' &&
        (b.checkout_date === todayStr || b.checkin_date === todayStr || b.turn_date === todayStr),
      )
      const isTurnToday = !!todayTurn

      // Next upcoming booking by checkin_date
      const nextBooking = propBookings
        .filter(b => b.checkin_date >= todayStr)
        .sort((a, b) => a.checkin_date.localeCompare(b.checkin_date))[0]

      // Next check-in label
      let nextCheckin: PropertyListItem['nextCheckin']
      if (nextBooking) {
        const isToday = nextBooking.checkin_date === todayStr
        const datePart = isToday
          ? 'Today'
          : new Date(`${nextBooking.checkin_date}T12:00:00`).toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
            })
        nextCheckin = {
          label: `${datePart} · ${formatTime12h(nextBooking.checkin_time.slice(0, 5))}`,
          isTurnDay: isTurnToday,
        }
      }

      // B2: timebar events (turn day only)
      let todayEvents: PropertyListEvent[] | undefined
      if (isTurnToday && todayTurn) {
        const outTime = (todayTurn.turn_start_time ?? todayTurn.checkout_time).slice(0, 5)
        const inTime = (todayTurn.turn_checkin_time ?? todayTurn.checkin_time).slice(0, 5)
        const isUnassigned = !todayTurn.assigned_cleaner_id && !todayTurn.assigned_team_id
        todayEvents = [
          { type: 'checkout', time: formatTime12h(outTime), time24: outTime },
          { type: 'cleaning', time: `${formatTime12h(outTime)} → ${formatTime12h(inTime)}`, time24: outTime, isUnassigned },
          { type: 'checkin', time: formatTime12h(inTime), time24: inTime },
        ]
      }

      // B1: upcoming event spine (non-turn days)
      let upcomingEvents: PropertyTimelineEvent[] | undefined
      if (!isTurnToday) {
        type SortedEvent = PropertyTimelineEvent & { sortKey: string }
        const events: SortedEvent[] = []
        for (const b of propBookings.filter(ev => ev.checkout_date >= todayStr).slice(0, 3)) {
          if (b.checkout_date >= todayStr) {
            events.push({
              sortKey: `${b.checkout_date} ${b.checkout_time}`,
              dateLabel: `${formatEventDate(b.checkout_date, todayStr)} · ${formatTime12h(b.checkout_time.slice(0, 5))}`,
              title: 'Guest check-out',
            })
          }
          if (b.checkin_date >= todayStr) {
            events.push({
              sortKey: `${b.checkin_date} ${b.checkin_time}`,
              dateLabel: `${formatEventDate(b.checkin_date, todayStr)} · ${formatTime12h(b.checkin_time.slice(0, 5))}`,
              title: 'Guest check-in',
            })
          }
        }
        events.sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        if (events.length > 0) {
          upcomingEvents = events.slice(0, 4).map(({ sortKey: _sk, ...ev }) => ev)
        }
      }

      // Stats
      const allPropBookings = myBookings.value.filter(b => b.property_id === property.id)
      const turnsYtd = allPropBookings.filter(b =>
        b.booking_type === 'turn' &&
        new Date(`${b.checkout_date}T12:00:00`).getFullYear() === currentYear,
      ).length

      const relevantBooking = todayTurn ?? nextBooking
      const isAssigned = !!(relevantBooking?.assigned_cleaner_id || relevantBooking?.assigned_team_id)

      const stats: PropertyStats = {
        turnsYtd,
        avgCleanMin: property.cleaning_duration,
        assignmentLabel: isTurnToday ? 'Today' : 'Next check-in',
        assignedCleanerName: isAssigned ? 'Assigned' : undefined,
      }

      return { property, nextCheckin, isTurnToday, todayEvents, upcomingEvents, stats }
    })
  })

  // ============================================================================
  // UI STATE - SAME MODAL MANAGEMENT AS HomeOwner
  // ============================================================================

  // Property Modal - Same pattern as HomeOwner
  const propertyModalOpen = computed(() => uiStore.isModalOpen('propertyModal'))
  const propertyModalMode = computed(() => {
    const modal = uiStore.getModalState('propertyModal')
    return (modal?.mode as 'create' | 'edit') || 'create'
  })
  const propertyModalData = computed(() => {
    const modal = uiStore.getModalState('propertyModal')
    return modal?.data as Property | undefined
  })

  // Confirmation Dialog - Same pattern as HomeOwner
  const confirmDialogOpen = computed(() => uiStore.isConfirmDialogOpen('confirmDialog'))
  const confirmDialogTitle = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.title || 'Confirm'
  })
  const confirmDialogMessage = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.message || 'Are you sure you want to proceed?'
  })
  const confirmDialogConfirmText = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.confirmText || 'Confirm'
  })
  const confirmDialogCancelText = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.cancelText || 'Cancel'
  })
  const confirmDialogDangerous = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.dangerous || false
  })
  const confirmDialogData = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.data
  })

  // ============================================================================
  // PROPERTY LIST EMIT HANDLERS
  // ============================================================================

  function handleAssignCleaner (_propertyId: string): void {
    uiStore.addNotification('info', 'Cleaner Assignment', 'Contact your admin to assign a cleaner for this turn.')
  }

  function handleViewCalendar (propertyId: string): void {
    router.push({ path: '/owner/overview', query: { property: propertyId } })
  }

  function handleListEdit (propertyId: string): void {
    const property = myProperties.value.find(p => p.id === propertyId)
    if (property) editProperty(property)
  }

  function handleListMore (propertyId: string): void {
    const property = myProperties.value.find(p => p.id === propertyId)
    if (property) viewProperty(property)
  }

  // ============================================================================
  // EVENT HANDLERS - SAME ORCHESTRATION PATTERN AS HomeOwner
  // ============================================================================

  function handleCreateProperty (): void {
    const propertyData = {
      owner_id: authStore.user?.id,
    }
    uiStore.openModal('propertyModal', 'create', propertyData)
  }

  async function handleDeleteProperty (propertyId: string): Promise<void> {
    const property = myProperties.value.find(p => p.id === propertyId)
    if (!property) return

    const bookingCount = bookingCountByProperty.value.get(propertyId) ?? 0
    const label = formatPropertyAddress(property, 'short')

    if (bookingCount > 0) {
      uiStore.openConfirmDialog('confirmDialog', {
        title: 'Cannot Delete Property',
        message: `"${label}" has ${bookingCount} booking${bookingCount === 1 ? '' : 's'}. Please delete or complete them before removing this property.`,
        confirmText: 'View Bookings',
        cancelText: 'OK',
        dangerous: false,
        data: { type: 'property-blocked', id: propertyId },
      })
      return
    }

    uiStore.openConfirmDialog('confirmDialog', {
      title: 'Delete Property',
      message: `Are you sure you want to delete "${label}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      dangerous: true,
      data: { type: 'property', id: propertyId },
    })
  }

  // Navigation functions
  function editProperty (property: Property): void {
    uiStore.openModal('propertyModal', 'edit', property as PropertyRecord)
  }

  function viewProperty (property: Property): void {
    router.push(`/owner/properties/${property.id}`)
  }

  // ============================================================================
  // MODAL EVENT HANDLERS - SAME PATTERN AS HomeOwner
  // ============================================================================

  function handlePropertyModalClose (): void {
    uiStore.closeModal('propertyModal')
  }

  async function handlePropertyModalSave (data: PropertyFormData): Promise<void> {
    try {
      const propertyData = {
        ...data,
        owner_id: authStore.user?.id,
      }

      if (propertyModalMode.value === 'create') {
        const id = await createMyProperty(propertyData as PropertyFormData)
        if (!id) {
          const message = propertyError.value || 'Failed to create your property'
          uiStore.addNotification('error', 'Save Failed', message)
          return
        }
      } else if (propertyModalData.value) {
        // Verify owner can update this property (same check as HomeOwner)
        if (propertyModalData.value.owner_id !== authStore.user?.id) {
          throw new Error('Cannot update property not owned by current user')
        }
        const success = await updateMyProperty(propertyModalData.value.id, propertyData as Partial<PropertyFormData>)
        if (!success) {
          const message = propertyError.value || 'Failed to update your property'
          uiStore.addNotification('error', 'Save Failed', message)
          return
        }
      }
      uiStore.closeModal('propertyModal')
    } catch (error) {
      const message = propertyError.value || (error instanceof Error ? error.message : 'Failed to save your property')
      console.error('[OwnerProperties] Failed to save property:', error)
      uiStore.addNotification('error', 'Save Failed', message)
    }
  }

  async function handlePropertyModalSkip (data: PropertyFormData): Promise<void> {
    const id = await createMyProperty(data)
    if (id) {
      uiStore.closeModal('propertyModal')
      router.push(`/owner/properties/${id}`)
    } else {
      const message = propertyError.value || 'Property creation failed'
      console.error('[OwnerProperties] Property creation failed during skip:', propertyError.value)
      uiStore.addNotification('error', 'Creation Failed', message)
    }
  }

  async function handlePropertyModalDelete (propertyId: string): Promise<void> {
    const property = myProperties.value.find(p => p.id === propertyId)
    if (!property || property.owner_id !== authStore.user?.id) {
      console.warn('Cannot delete property not owned by current user')
      return
    }

    await handleDeleteProperty(propertyId)
  }

  // ============================================================================
  // CONFIRMATION DIALOG HANDLERS - SAME PATTERN AS HomeOwner
  // ============================================================================

  async function handleConfirmDialogConfirm (): Promise<void> {
    const data = confirmDialogData.value

    if (data?.type === 'property-blocked') {
      uiStore.closeConfirmDialog('confirmDialog')
      router.push('/owner/bookings')
      return
    }

    if (data?.type === 'property' && data?.id) {
      try {
        const success = await deleteMyProperty(data.id as string)
        if (success) {
          uiStore.closeModal('propertyModal')
        } else {
          const message = propertyError.value || 'Failed to delete your property'
          console.error('[OwnerProperties] Failed to delete property:', message)
          uiStore.addNotification('error', 'Delete Failed', message)
        }
      } catch (error) {
        const message = propertyError.value || (error instanceof Error ? error.message : 'Failed to delete your property')
        console.error('[OwnerProperties] Failed to delete property:', error)
        uiStore.addNotification('error', 'Delete Failed', message)
      }
    }

    uiStore.closeConfirmDialog('confirmDialog')
  }

  function handleConfirmDialogCancel (): void {
    uiStore.closeConfirmDialog('confirmDialog')
  }

  function handleConfirmDialogClose (): void {
    uiStore.closeConfirmDialog('confirmDialog')
  }

  // ============================================================================
  // LIFECYCLE - SAME INITIALIZATION AS HomeOwner
  // ============================================================================

  onMounted(async () => {
    if (authStore.isAuthenticated && authStore.user?.role === 'owner') {
      try {
        await Promise.all([
          fetchMyProperties(),
          fetchMyBookings(),
        ])
      } catch (error: unknown) {
        console.error('Failed to load properties data:', error)
        uiStore.addNotification('error', 'Error', 'Failed to load properties. Please refresh.')
      }
    }
  })
</script>

<style scoped>
.owner-properties-page {
  padding: 0 1rem 1rem 1rem;
  min-height: calc(100vh - var(--app-bar-height, 64px));
}

/* C3 — Compact Inline Bar */
.c3-inline-bar {
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
  min-height: 64px;
  border-radius: var(--claro-radius-sm);
  background: var(--claro-surface);
  border: 1px solid var(--claro-divider);
  overflow: hidden;
}

.c3-cell {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
}

.c3-divider {
  width: 1px;
  align-self: stretch;
  background: var(--claro-divider);
}

.c3-value {
  font-size: 20px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-on-surface);
  line-height: 1;
}

.c3-label {
  font-size: 12px;
  color: var(--claro-text-secondary);
}

</style>
