<script setup lang="ts">
  import type { Booking, BookingFormData } from '@/types'
  import { computed } from 'vue'
  import { useDisplay } from 'vuetify'
  import BookingForm from '@/components/dumb/shared/BookingForm.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useUIStore } from '@/stores/ui'

  const { mobile } = useDisplay()
  const uiStore = useUIStore()
  const { myProperties } = useOwnerProperties()
  const { createMyBooking, updateMyBooking, deleteMyBooking } = useOwnerBookings()

  const eventModalOpen = computed(() => uiStore.isModalOpen('eventModal'))
  const eventModalState = computed(() => uiStore.getModalState('eventModal'))
  const eventModalMode = computed(() => (eventModalState.value?.mode ?? 'create') as 'create' | 'edit')
  const eventModalData = computed(() => eventModalState.value?.data)

  function handleClose () {
    uiStore.closeModal('eventModal')
  }

  async function handleSave (data: BookingFormData) {
    try {
      if (eventModalMode.value === 'create') {
        await createMyBooking(data)
      } else if (eventModalData.value) {
        const booking = eventModalData.value as { id: string }
        await updateMyBooking(booking.id, data)
      }
      uiStore.closeModal('eventModal')
      uiStore.addNotification('success', 'Saved', 'Booking saved successfully.')
    } catch (error) {
      console.error('[GlobalBookingModal] save failed:', error)
      uiStore.addNotification('error', 'Error', 'Failed to save booking. Please try again.')
    }
  }

  async function handleDelete (id: string) {
    try {
      await deleteMyBooking(id)
      uiStore.closeModal('eventModal')
      uiStore.addNotification('success', 'Deleted', 'Booking deleted.')
    } catch (error) {
      console.error('[GlobalBookingModal] delete failed:', error)
      uiStore.addNotification('error', 'Error', 'Failed to delete booking.')
    }
  }
</script>

<template>
  <BookingForm
    :booking="eventModalMode === 'edit' ? (eventModalData as Booking | undefined) : undefined"
    :fullscreen="mobile"
    :initial-data="eventModalMode === 'create' ? (eventModalData ?? undefined) : undefined"
    :mode="eventModalMode"
    :open="eventModalOpen"
    :properties="myProperties"
    @close="handleClose"
    @delete="handleDelete"
    @save="handleSave"
  />
</template>
