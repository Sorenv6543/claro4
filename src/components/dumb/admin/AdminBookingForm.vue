<template>
  <v-dialog
    v-model="isOpen"
    max-width="800px"
    persistent
    scrollable
    @keydown.esc="handleClose"
  >
    <v-card>
      <v-card-title class="text-h5 pb-2 d-flex align-center">
        {{ formTitle }}
        <v-chip
          v-if="form.booking_type === 'turn'"
          class="ml-2"
          color="error"
          size="small"
          variant="elevated"
        >
          <v-icon start>
            mdi-clock-alert
          </v-icon>
          URGENT TURN
        </v-chip>

        <v-chip
          v-if="form.priority === 'high'"
          class="ml-2"
          color="warning"
          size="small"
        >
          HIGH PRIORITY
        </v-chip>

        <v-spacer />

        <v-chip
          :color="getStatusColor((form.status as string) || 'pending')"
          size="small"
          variant="tonal"
        >
          {{ ((form.status as string) || 'pending').toUpperCase() }}
        </v-chip>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0">
        <v-form
          ref="formRef"
          v-model="formValid"
          @submit.prevent="handleSubmit"
        >
          <v-container>
            <!-- Property and Owner Information -->
            <v-row>
              <v-col
                cols="12"
                md="8"
              >
                <v-select
                  v-model="form.property_id"
                  :disabled="loading || mode === 'edit'"
                  :error-messages="errors.get('property_id')"
                  :hint="mode === 'edit' ? 'Property cannot be changed after booking creation' : undefined"
                  item-title="displayAddress"
                  item-value="id"
                  :items="propertiesArray"
                  label="Property"
                  persistent-hint
                  prepend-inner-icon="mdi-home"
                  required
                  :rules="propertyRules"
                  variant="outlined"
                >
                  <template #item="{ props: itemProps, item }">
                    <v-list-item v-bind="itemProps">
                      <template #prepend>
                        <v-avatar
                          color="primary"
                          size="small"
                        >
                          <v-icon>mdi-home</v-icon>
                        </v-avatar>
                      </template>

                      <template #subtitle>
                        {{ getPropertyOwnerName(item.owner_id) }} • {{ item.fullAddress }}
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>

              <v-col
                cols="12"
                md="4"
              >
                <v-select
                  v-model="form.status"
                  :disabled="loading"
                  :error-messages="errors.get('status')"
                  :items="statusOptions"
                  label="Booking Status"
                  prepend-inner-icon="mdi-clipboard-list"
                  variant="outlined"
                >
                  <template #item="{ props: itemProps, item }">
                    <v-list-item v-bind="itemProps">
                      <template #prepend>
                        <v-chip
                          :color="getStatusColor(item.value)"
                          size="x-small"
                          variant="tonal"
                        />
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <!-- Dates -->
            <v-row>
              <v-col
                cols="12"
                sm="6"
              >
                <DatePickerField
                  v-model="form.checkin_date"
                  :disabled="loading"
                  :error-messages="errors.get('checkin_date')"
                  hint="When new guests arrive"
                  label="Checkin Date"
                  :min="todayIso"
                  :rules="dateRules"
                  @update:model-value="updateBookingType"
                />
              </v-col>

              <v-col
                cols="12"
                sm="6"
              >
                <DatePickerField
                  v-model="form.checkout_date"
                  :disabled="loading"
                  :error-messages="errors.get('checkout_date')"
                  hint="When guests depart"
                  label="Checkout Date"
                  :min="todayIso"
                  :rules="dateRules"
                  @update:model-value="updateBookingType"
                />
              </v-col>
            </v-row>

            <!-- Times -->
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <TimePickerField
                  v-model="form.checkin_time"
                  :disabled="loading"
                  :error-messages="errors.get('checkin_time')"
                  hint="When new guests arrive"
                  label="Checkin Time"
                  :rules="timeRules"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <TimePickerField
                  v-model="form.checkout_time"
                  :disabled="loading"
                  :error-messages="errors.get('checkout_time')"
                  hint="When guests depart"
                  label="Checkout Time"
                  :rules="timeRules"
                />
              </v-col>
            </v-row>

            <!-- Cleaner Assignment Section -->
            <v-row>
              <v-col cols="12">
                <v-card
                  class="mb-4"
                  variant="outlined"
                >
                  <v-card-title class="text-subtitle-1 py-2">
                    <v-icon class="mr-2">
                      mdi-account-hard-hat
                    </v-icon>
                    Cleaner Assignment
                  </v-card-title>

                  <v-divider />

                  <v-card-text>
                    <v-row>
                      <v-col
                        cols="12"
                        md="6"
                      >
                        <v-select
                          v-model="form.assigned_cleaner_id"
                          clearable
                          :disabled="loading"
                          :error-messages="errors.get('assigned_cleaner_id')"
                          item-title="name"
                          item-value="id"
                          :items="availableCleaners"
                          label="Assigned Cleaner"
                          prepend-inner-icon="mdi-account"
                          variant="outlined"
                        >
                          <template #item="{ props: itemProps, item }">
                            <v-list-item v-bind="itemProps">
                              <template #prepend>
                                <v-avatar
                                  :color="getCleanerAvailabilityColor(item as unknown as Cleaner)"
                                  size="small"
                                >
                                  <v-icon>mdi-account</v-icon>
                                </v-avatar>
                              </template>

                              <template #subtitle>
                                {{ getCleanerSubtitle(item as unknown as Cleaner) }}
                              </template>

                              <template #append>
                                <v-chip
                                  :color="getCleanerAvailabilityColor(item as unknown as Cleaner)"
                                  size="x-small"
                                  variant="tonal"
                                >
                                  {{ getCleanerAvailabilityText(item as unknown as Cleaner) }}
                                </v-chip>
                              </template>
                            </v-list-item>
                          </template>
                        </v-select>
                      </v-col>

                      <v-col
                        cols="12"
                        md="6"
                      >
                        <v-btn
                          color="primary"
                          :disabled="!form.property_id || !form.checkout_date"
                          variant="outlined"
                          @click="openCleanerAssignmentModal"
                        >
                          <v-icon start>
                            mdi-magnify
                          </v-icon>
                          Find Best Cleaner
                        </v-btn>
                      </v-col>
                    </v-row>

                    <!-- Cleaner Details -->
                    <v-row v-if="selectedCleaner">
                      <v-col cols="12">
                        <v-alert
                          class="mt-2"
                          type="info"
                          variant="tonal"
                        >
                          <template #title>
                            Cleaner: {{ selectedCleaner.name }}
                          </template>

                          <p class="mb-1">
                            <strong>Skills:</strong> {{ (selectedCleaner.skills ?? []).join(', ') }}
                          </p>

                          <p class="mb-1">
                            <strong>Today's Bookings:</strong> {{ getCleanerTodayBookings(selectedCleaner.id) }}/{{ selectedCleaner.max_daily_bookings }}
                          </p>

                          <p class="mb-0">
                            <strong>Performance Rating:</strong>

                            <v-rating
                              class="d-inline-flex ml-2"
                              density="compact"
                              :model-value="getCleanerRating(selectedCleaner.id)"
                              readonly
                              size="small"
                            />
                          </p>
                        </v-alert>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Booking Details -->
            <v-row>
              <v-col
                cols="12"
                sm="6"
              >
                <v-text-field
                  v-model.number="form.guest_count"
                  :disabled="loading"
                  :error-messages="errors.get('guest_count')"
                  hint="Affects cleaning duration estimate"
                  label="Guest Count"
                  max="20"
                  min="1"
                  persistent-hint
                  prepend-inner-icon="mdi-account-group"
                  type="number"
                  variant="outlined"
                />
              </v-col>

              <v-col
                cols="12"
                sm="6"
              >
                <v-select
                  v-model="form.priority"
                  :disabled="loading"
                  :error-messages="errors.get('priority')"
                  :items="priorityOptions"
                  label="Priority Level"
                  prepend-inner-icon="mdi-flag"
                  variant="outlined"
                >
                  <template #item="{ props: itemProps, item }">
                    <v-list-item v-bind="itemProps">
                      <template #prepend>
                        <v-icon :color="getPriorityColor(item.value)">
                          {{ getPriorityIcon(item.value) }}
                        </v-icon>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <!-- Notes and Instructions -->
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="form.notes"
                  :counter="500"
                  :disabled="loading"
                  :error-messages="errors.get('notes')"
                  hint="Special requirements, client preferences, or operational notes"
                  label="Cleaning Instructions & Notes"
                  persistent-hint
                  prepend-inner-icon="mdi-note-text"
                  rows="3"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <!-- Business Impact Alerts -->
            <v-row v-if="showBusinessImpactAlert">
              <v-col cols="12">
                <v-alert
                  class="mb-0"
                  :title="businessImpactAlert.title"
                  :type="businessImpactAlert.type"
                  variant="tonal"
                >
                  <p
                    v-for="message in businessImpactAlert.messages"
                    :key="message"
                    class="mb-1"
                  >
                    {{ message }}
                  </p>
                </v-alert>
              </v-col>
            </v-row>

            <!-- Validation Errors -->
            <v-row v-if="showDateError">
              <v-col cols="12">
                <v-alert
                  class="mb-0"
                  text="Invalid date configuration detected. Please review checkout/checkin times."
                  title="Scheduling Conflict"
                  type="error"
                  variant="tonal"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn
          color="grey-darken-1"
          :disabled="loading"
          variant="text"
          @click="handleClose"
        >
          Cancel
        </v-btn>

        <v-btn
          v-if="mode === 'edit'"
          color="error"
          :disabled="loading"
          variant="outlined"
          @click="handleDelete"
        >
          <v-icon start>
            mdi-delete
          </v-icon>
          Delete
        </v-btn>

        <v-spacer />

        <v-btn
          v-if="mode === 'edit' && form.status !== 'completed'"
          color="success"
          :disabled="loading || !form.assigned_cleaner_id"
          variant="tonal"
          @click="handleMarkComplete"
        >
          <v-icon start>
            mdi-check
          </v-icon>
          Mark Complete
        </v-btn>

        <v-btn
          color="primary"
          :disabled="!formValid"
          :loading="loading"
          variant="elevated"
          @click="handleSubmit"
        >
          <v-icon start>
            {{ mode === 'create' ? 'mdi-plus' : 'mdi-content-save' }}
          </v-icon>
          {{ submitButtonText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { Booking, BookingFormData } from '@/types/booking'
  import type { Property } from '@/types/property'
  import type { Cleaner } from '@/types/user'
  import DatePickerField from '@components/dumb/shared/DatePickerField.vue'
  import TimePickerField from '@components/dumb/shared/TimePickerField.vue'
  import { computed, nextTick, ref, watch } from 'vue'
  import { formatPropertyAddress } from '@/types/property'
  import { isCleaner } from '@/types/user'

  // Props
  interface Props {
    modelValue: boolean
    mode: 'create' | 'edit'
    booking?: Booking | null
    properties: Property[]
    cleaners: Cleaner[]
    loading?: boolean
    errors?: Map<string, string[]>
  }

  const props = withDefaults(defineProps<Props>(), {
    booking: null,
    loading: false,
    errors: () => new Map(),
  })

  // Emits
  interface Emits {
    'update:modelValue': [value: boolean]
    'submit': [data: BookingFormData]
    'delete': [id: string]
    'mark-complete': [id: string]
    'assign-cleaner': [bookingId: string, cleanerId: string]
    'open-cleaner-modal': [booking: Partial<BookingFormData>]
  }

  const emit = defineEmits<Emits>()

  // Form state
  const formRef = ref()
  const formValid = ref(false)

  // Date picker state
  const _now = new Date()
  const todayIso = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`

  // Default form data
  const defaultForm: BookingFormData = {
    owner_id: '', // Required field for admin forms
    property_id: '',
    checkout_date: '',
    checkin_date: '',
    checkin_time: '15:00',
    checkout_time: '11:00',
    booking_type: 'standard',
    guest_count: undefined,
    notes: '',
    status: 'pending',
    assigned_cleaner_id: '',
    priority: 'normal',
  }

  const form = ref<BookingFormData>({ ...defaultForm })

  // Computed properties
  const isOpen = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  const propertyName = computed(() => {
    if (!props.booking?.property_id) return 'Unknown Property'
    const property = props.properties.find(p => p.id === props.booking?.property_id)
    return property ? formatPropertyAddress(property, 'short') : 'Unknown Property'
  })

  const formTitle = computed(() => {
    if (props.mode === 'create') {
      return 'Schedule New Cleaning'
    }
    return `Edit Booking "${propertyName.value}"`
  })

  const submitButtonText = computed(() => {
    return props.mode === 'create' ? 'Schedule Cleaning' : 'Update Booking'
  })

  const propertiesArray = computed(() => {
    return Array.from(props.properties).map(property => ({
      ...property,
      displayAddress: formatPropertyAddress(property, 'short'),
      fullAddress: formatPropertyAddress(property),
    }))
  })

  const availableCleaners = computed(() => {
    return props.cleaners.filter(c => isCleaner(c))
  })

  const selectedCleaner = computed(() => {
    if (!form.value.assigned_cleaner_id) return null
    return availableCleaners.value.find(c => c.id === form.value.assigned_cleaner_id)
  })

  const statusOptions = [
    { title: 'Pending', value: 'pending' },
    { title: 'Scheduled', value: 'scheduled' },
    { title: 'In Progress', value: 'in_progress' },
    { title: 'Completed', value: 'completed' },
    { title: 'Cancelled', value: 'cancelled' },
  ]

  const priorityOptions = [
    { title: 'Low', value: 'low' },
    { title: 'Normal', value: 'normal' },
    { title: 'High', value: 'high' },
    { title: 'Urgent', value: 'urgent' },
  ]

  // Commented out unused computed - was causing TS warning
  // const showSameDayAlert = computed(() => {
  //   if (!form.value.checkout_date || !form.value.checkin_date) return false
  //   const checkoutDate = new Date(form.value.checkout_date).toDateString()
  //   const checkinDate = new Date(form.value.checkin_date).toDateString()
  //   return checkoutDate === checkinDate
  // })

  const showDateError = computed(() => {
    if (!form.value.checkout_date || !form.value.checkin_date) return false
    return new Date(form.value.checkout_date as string) < new Date(form.value.checkin_date as string)
  })

  const showBusinessImpactAlert = computed(() => {
    return businessImpactAlert.value.messages.length > 0
  })

  const businessImpactAlert = computed(() => {
    const alert = {
      type: 'info' as 'info' | 'warning' | 'error',
      title: '',
      messages: [] as string[],
    }

    if (form.value.booking_type === 'turn') {
      alert.type = 'warning'
      alert.title = 'High Business Impact'
      alert.messages.push('Same-day turnovers require immediate attention', 'Client satisfaction and revenue directly affected')
    }

    if (form.value.priority === 'urgent' && !form.value.assigned_cleaner_id) {
      alert.type = 'error'
      alert.title = 'Critical: Urgent Booking Unassigned'
      alert.messages.push('Urgent bookings must have assigned cleaners')
    }

    return alert
  })

  // Validation rules
  const propertyRules = [
    (v: string) => !!v || 'Property selection is required',
  ]

  const dateRules = [
    (v: string) => !!v || 'Date is required',
    (v: string) => {
      // Allow any date when editing an existing booking
      if (!v || props.mode === 'edit') return true

      // Parse date as local date to avoid timezone issues
      const [year, month, day] = v.split('-').map(Number)
      const selectedDate = new Date(year, month - 1, day) // month is 0-indexed
      const today = new Date()

      // Set both dates to midnight for fair comparison (date only, no time)
      const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      return selectedDateOnly >= todayOnly || 'Date cannot be in the past'
    },
  ]

  const timeRules = [
    (v: string) => !!v || 'Time is required',
    (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v) || 'Invalid time format',
  ]

  // Methods
  function updateBookingType () {
    if (!form.value.checkout_date || !form.value.checkin_date) return

    // Parse dates as local dates to avoid timezone issues
    const parseDateString = (dateStr: string) => {
      if (!dateStr) return null
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(year, month - 1, day).toDateString()
    }

    const checkoutDate = parseDateString(form.value.checkout_date as string)
    const checkinDate = parseDateString(form.value.checkin_date as string)

    if (checkoutDate === checkinDate) {
      form.value.booking_type = 'turn'
      form.value.priority = 'urgent'
    } else {
      form.value.booking_type = 'standard'
      if (form.value.priority === 'urgent') {
        form.value.priority = 'normal'
      }
    }
  }

  function getStatusColor (status: string) {
    const colors = {
      pending: 'orange',
      scheduled: 'blue',
      in_progress: 'purple',
      completed: 'green',
      cancelled: 'red',
    }
    return colors[status as keyof typeof colors] || 'grey'
  }

  function getPriorityColor (priority: string) {
    const colors = {
      standard: 'grey',
      high: 'orange',
      urgent: 'red',
    }
    return colors[priority as keyof typeof colors] || 'grey'
  }

  function getPriorityIcon (priority: string) {
    const icons = {
      standard: 'mdi-flag',
      high: 'mdi-flag-triangle',
      urgent: 'mdi-alert',
    }
    return icons[priority as keyof typeof icons] || 'mdi-flag'
  }

  function getPropertyOwnerName (ownerId: string) {
    // This would typically come from a users store or prop
    return `Owner ${ownerId.slice(-4)}`
  }

  function getCleanerAvailabilityColor (cleaner: Cleaner | undefined) {
    if (!cleaner?.id) return 'grey'
    const todayBookings = getCleanerTodayBookings(cleaner.id)
    if (todayBookings >= cleaner.max_daily_bookings) return 'red'
    if (todayBookings >= cleaner.max_daily_bookings * 0.8) return 'orange'
    return 'green'
  }

  function getCleanerAvailabilityText (cleaner: Cleaner | undefined) {
    if (!cleaner?.id) return 'Unknown'
    const todayBookings = getCleanerTodayBookings(cleaner.id)
    if (todayBookings >= cleaner.max_daily_bookings) return 'Unavailable'
    if (todayBookings >= cleaner.max_daily_bookings * 0.8) return 'Limited'
    return 'Available'
  }

  function getCleanerSubtitle (cleaner: Cleaner | undefined) {
    if (!cleaner?.skills) return ''
    return `${cleaner.skills.slice(0, 2).join(', ')} • ${getCleanerTodayBookings(cleaner.id)}/${cleaner.max_daily_bookings} bookings`
  }

  function getCleanerTodayBookings (cleanerId: string) {
    // This would typically come from bookings store
    console.debug('Getting bookings for cleaner:', cleanerId)
    return Math.floor(Math.random() * 5) // Mock data
  }

  function getCleanerRating (cleanerId: string) {
    // This would typically come from performance data
    console.debug('Getting rating for cleaner:', cleanerId)
    return 4 + Math.random() // Mock rating between 4-5
  }

  function openCleanerAssignmentModal () {
    emit('open-cleaner-modal', form.value)
  }

  async function handleSubmit () {
    if (!formRef.value) return

    const { valid } = await formRef.value.validate()
    if (!valid) return

    // Derive owner_id from selected property if not already set
    const ownerId = form.value.owner_id
      || props.properties.find(p => p.id === form.value.property_id)?.owner_id
      || (props.mode === 'edit' ? props.booking?.owner_id : undefined)
      || ''

    // Clean form data - convert empty strings to undefined for UUID fields
    const cleanFormData: BookingFormData = {
      ...form.value,
      assigned_cleaner_id: form.value.assigned_cleaner_id || undefined,
      owner_id: ownerId,
      property_id: props.mode === 'edit' ? (props.booking?.property_id || form.value.property_id || '') : (form.value.property_id || ''),
    }

    emit('submit', cleanFormData)
  }

  function handleClose () {
    isOpen.value = false
  }

  function handleDelete () {
    if (props.booking?.id) {
      emit('delete', props.booking.id)
    }
  }

  function handleMarkComplete () {
    if (props.booking?.id) {
      emit('mark-complete', props.booking.id)
    }
  }

  // Watch for booking changes
  watch(() => props.booking, newBooking => {
    if (newBooking) {
      // Format dates for HTML date input (YYYY-MM-DD) without timezone conversion
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return ''

        // If it's already in YYYY-MM-DD format, return it directly
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString
        }

        // Parse date as local date to avoid timezone conversion issues
        const date = new Date(dateString)

        // Handle timezone conversion by using local date methods
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')

        return `${year}-${month}-${day}`
      }

      form.value = {
        owner_id: newBooking.owner_id,
        property_id: newBooking.property_id,
        checkin_date: formatDateForInput(newBooking.checkin_date),
        checkout_date: formatDateForInput(newBooking.checkout_date),
        checkin_time: (newBooking.checkin_time || '15:00').slice(0, 5),
        checkout_time: (newBooking.checkout_time || '11:00').slice(0, 5),
        booking_type: newBooking.booking_type,
        guest_count: newBooking.guest_count,
        notes: newBooking.notes || '',
        status: newBooking.status,
        assigned_cleaner_id: newBooking.assigned_cleaner_id || '',
        priority: newBooking.priority || 'normal',
      }
    } else {
      form.value = { ...defaultForm }
    }
  }, { immediate: true })

  // Derive owner_id from selected property in create mode
  watch(() => form.value.property_id, newPropertyId => {
    if (props.mode === 'create' && newPropertyId) {
      const property = props.properties.find(p => p.id === newPropertyId)
      if (property) {
        form.value.owner_id = property.owner_id
      }
    }
  })

  // Watch for modal open/close
  watch(isOpen, newValue => {
    if (newValue && props.mode === 'edit') {
      // Vuetify 4 doesn't auto-validate on mount — run it so formValid is true
      // when the admin opens an existing booking and hasn't changed any fields.
      nextTick(() => formRef.value?.validate())
    } else if (!newValue) {
      nextTick(() => {
        form.value = { ...defaultForm }
        formRef.value?.resetValidation()
      })
    }
  })
</script>

<style scoped>
.v-card-title {
  background-color: rgb(var(--v-theme-surface-variant));
}

.v-alert {
  border-left: 4px solid rgb(var(--v-theme-primary));
}
</style>
