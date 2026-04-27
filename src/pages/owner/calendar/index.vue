<template>
  <div class="calendar-page">
    <ErrorAlert v-if="error" :message="error" class="ma-4" />
    <OwnerCalendar
      :bookings="myBookings"
      :loading="loading"
      :properties="myProperties"
    />
  </div>
</template>

<script setup lang="ts">
  import ErrorAlert from '@/components/dumb/shared/ErrorAlert.vue'
import OwnerCalendar from '@/components/smart/owner/OwnerCalendar.vue'
import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
import { computed, onMounted } from 'vue'

  defineOptions({ name: 'OwnerCalendarPage' })

  const { myBookings, loading: bookingsLoading, error: bookingsError, fetchMyBookings } = useOwnerBookings()
  const { myProperties, loading: propertiesLoading, error: propertiesError, fetchMyProperties } = useOwnerProperties()

  const loading = computed(() => bookingsLoading.value || propertiesLoading.value)
  const error = computed(() => bookingsError.value ?? propertiesError.value ?? null)

  onMounted(async () => {
    await Promise.allSettled([fetchMyBookings(), fetchMyProperties()])
  })
</script>

<style scoped>
.calendar-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
