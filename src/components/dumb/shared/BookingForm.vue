<template>
  <v-dialog
    v-model="isOpen"
    :fullscreen="props.fullscreen"
    :max-height="props.fullscreen ? undefined : '90vh'"
    :max-width="props.fullscreen ? undefined : '700px'"
    persistent
    scrollable
    @keydown.esc="handleClose"
  >
    <v-card class="modal-card">
      <v-card-title class="text-h5 pb-2 shrink-0">
        {{ formTitle }}
      </v-card-title>

      <v-divider />

      <v-card-text class="modal-content">
        <v-form
          ref="formRef"
          v-model="formValid"
          @submit.prevent="handleSubmit"
        >
          <v-container>
            <!-- Property Selection -->
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="form.property_id"
                  :disabled="loading"
                  :error-messages="errors.get('property_id')"
                  item-title="displayAddress"
                  item-value="id"
                  :items="propertiesArray"
                  label="Property"
                  prepend-inner-icon="mdi-home"
                  required
                  :rules="propertyRules"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <!-- Dates -->
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <DatePickerField
                  v-model="form.checkin_date"
                  :disabled="loading"
                  :error-messages="errors.get('checkin_date')"
                  hint="When guests arrive"
                  label="Checkin Date"
                  :rules="dateRules"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <DatePickerField
                  v-model="form.checkout_date"
                  :disabled="loading"
                  :error-messages="errors.get('checkout_date')"
                  hint="When guests depart"
                  label="Checkout Date"
                  :rules="dateRules"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <TimePickerField
                  v-model="form.checkin_time"
                  :disabled="loading"
                  :error-messages="errors.get('checkin_time')"
                  hint="When guests arrive"
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

            <!-- Turn Toggle -->
            <v-row>
              <v-col cols="12">
                <v-card
                  class="turn-toggle-card"
                  :color="addTurn ? 'primary' : undefined"
                  :variant="addTurn ? 'tonal' : 'outlined'"
                  @click="addTurn = !addTurn"
                >
                  <v-card-text class="d-flex align-center pa-3">
                    <v-icon
                      class="mr-3"
                      :color="addTurn ? 'primary' : 'medium-emphasis'"
                      size="24"
                    >
                      mdi-swap-horizontal
                    </v-icon>
                    <div class="flex-grow-1">
                      <div class="text-subtitle-2 font-weight-medium">
                        Schedule a same-day turn
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        Back-to-back guests? Add a turn cleaning between stays.
                      </div>
                    </div>
                    <v-switch
                      color="primary"
                      density="compact"
                      hide-details
                      :model-value="addTurn"
                      @click.stop
                      @update:model-value="addTurn = $event ?? false"
                    />
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Turn Booking Section -->
            <v-expand-transition>
              <div v-if="addTurn">
                <v-row>
                  <v-col cols="12">
                    <v-card
                      class="turn-section"
                      elevation="0"
                    >
                      <v-card-text class="pb-2">
                        <div class="d-flex align-center mb-3">
                          <v-icon
                            color="warning"
                            size="20"
                          >
                            mdi-alert-circle-outline
                          </v-icon>
                          <span class="text-subtitle-2 font-weight-bold ml-2">Turn Booking</span>
                          <v-chip
                            class="ml-2"
                            color="warning"
                            size="x-small"
                          >
                            URGENT
                          </v-chip>
                        </div>

                        <!-- Turn Start (defaults to main checkout) -->
                        <v-row density="comfortable">
                          <v-col
                            cols="12"
                            md="6"
                          >
                            <DatePickerField
                              v-model="turnForm.start_date"
                              :disabled="loading"
                              :error-messages="errors.get('turn_start_date')"
                              hint="Defaults to checkout date above"
                              label="Turn Start Date"
                              :rules="dateRules"
                            />
                          </v-col>
                          <v-col
                            cols="12"
                            md="6"
                          >
                            <TimePickerField
                              v-model="turnForm.start_time"
                              :disabled="loading"
                              :error-messages="errors.get('turn_start_time')"
                              hint="When previous guests depart"
                              label="Turn Start Time"
                              :rules="timeRules"
                            />
                          </v-col>
                        </v-row>

                        <!-- Turn Checkin Time (next guests arrive) -->
                        <v-row density="comfortable">
                          <v-col cols="12">
                            <TimePickerField
                              v-model="turnForm.checkin_time"
                              :disabled="loading"
                              :error-messages="errors.get('turn_checkin_time')"
                              hint="When next guests arrive"
                              label="Next Guest Checkin Time"
                              :rules="timeRules"
                            />
                          </v-col>
                        </v-row>

                        <!-- Turn Checkout (final departure) -->
                        <v-row density="comfortable">
                          <v-col
                            cols="12"
                            md="6"
                          >
                            <DatePickerField
                              v-model="turnForm.checkout_date"
                              :disabled="loading"
                              :error-messages="errors.get('turn_checkout_date')"
                              hint="When next guests depart"
                              label="Final Checkout Date"
                              :min="turnForm.start_date || undefined"
                              :rules="dateRules"
                            />
                          </v-col>
                          <v-col
                            cols="12"
                            md="6"
                          >
                            <TimePickerField
                              v-model="turnForm.checkout_time"
                              :disabled="loading"
                              :error-messages="errors.get('turn_checkout_time')"
                              hint="When next guests depart"
                              label="Final Checkout Time"
                              :rules="timeRules"
                            />
                          </v-col>
                        </v-row>

                        <!-- Turn validation warning -->
                        <v-row
                          v-if="turnTimeWarning"
                          density="comfortable"
                        >
                          <v-col cols="12">
                            <v-alert
                              class="mb-0 mt-1"
                              density="compact"
                              type="warning"
                              variant="tonal"
                            >
                              {{ turnTimeWarning }}
                            </v-alert>
                          </v-col>
                        </v-row>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </v-expand-transition>

            <!-- Guest Count -->
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model.number="form.guest_count"
                  :disabled="loading"
                  :error-messages="errors.get('guest_count')"
                  hint="Optional"
                  label="Guest Count"
                  min="1"
                  persistent-hint
                  prepend-inner-icon="mdi-account-group"
                  type="number"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <!-- Notes -->
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="form.notes"
                  :counter="500"
                  :disabled="loading"
                  :error-messages="errors.get('notes')"
                  hint="Special instructions, requirements, etc."
                  label="Notes"
                  persistent-hint
                  prepend-inner-icon="mdi-note-text"
                  rows="3"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <!-- Status (Edit mode only) -->
            <v-row v-if="mode === 'edit'">
              <v-col cols="12">
                <v-select
                  v-model="form.status"
                  :disabled="loading"
                  :error-messages="errors.get('status')"
                  :items="statusItems"
                  label="Status"
                  prepend-inner-icon="mdi-progress-check"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn
          color="grey-darken-1"
          :disabled="loading"
          variant="text"
          @click="handleClose"
        >
          Cancel
        </v-btn>

        <v-spacer />

        <v-btn
          v-if="mode === 'edit'"
          color="error"
          :disabled="loading"
          :loading="loading"
          variant="text"
          @click="handleDelete"
        >
          Delete
        </v-btn>

        <v-btn
          color="primary"
          :disabled="formValid === false || loading"
          :loading="loading"
          variant="text"
          @click="handleSubmit"
        >
          {{ submitButtonText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { VForm } from 'vuetify/components'
  import type { Booking, BookingFormData, BookingStatus, BookingType, Property } from '@/types'
  import DatePickerField from '@components/dumb/shared/DatePickerField.vue'
  import TimePickerField from '@components/dumb/shared/TimePickerField.vue'
  import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
  import { formatPropertyAddress } from '@/types/property'

  // PROPS & EMITS
  interface Props {
    open?: boolean
    mode?: 'create' | 'edit'
    booking?: Booking
    initialData?: Partial<BookingFormData>
    properties?: Property[]
    fullscreen?: boolean
  }

  interface Emits {
    (e: 'close'): void
    (e: 'save', booking: BookingFormData): void
    (e: 'delete', id: string): void
  }

  const props = withDefaults(defineProps<Props>(), {
    open: false,
    mode: 'create',
    booking: undefined,
    initialData: undefined,
    properties: () => [],
  })

  const emit = defineEmits<Emits>()

  // FORM REFS
  const formRef = ref<VForm | null>(null)
  const formValid = ref<boolean | null>(null)
  const loading = ref<boolean>(false)
  const errors = ref<Map<string, string>>(new Map())

  // Turn toggle state
  const addTurn = ref(false)

  // FORM DATA - main booking
  const form = reactive<Partial<BookingFormData>>({
    property_id: '',
    checkout_date: '',
    checkin_date: '',
    checkout_time: '',
    checkin_time: '',
    booking_type: 'standard',
    guest_count: undefined,
    notes: '',
    status: 'pending',
    owner_id: '',
  })

  // FORM DATA - turn booking (next guest stay)
  const turnForm = reactive({
    start_date: '',
    start_time: '',
    checkin_time: '15:00',
    checkout_date: '',
    checkout_time: '11:00',
  })

  // COMPUTED PROPERTIES
  const isOpen = computed({
    get: () => props.open,
    set: (value: boolean) => {
      if (!value) emit('close')
    },
  })

  const formTitle = computed((): string => {
    if (props.mode === 'edit') return 'Edit Booking'
    return addTurn.value ? 'Create Booking + Turn' : 'Create Booking'
  })

  const submitButtonText = computed((): string => {
    if (props.mode === 'edit') return 'Save'
    return addTurn.value ? 'Create Both' : 'Create'
  })

  const propertiesArray = computed(() => {
    return props.properties.map((p: Property) => ({
      ...p,
      displayAddress: formatPropertyAddress(p, 'short'),
    }))
  })

  // Turn time validation warning
  const turnTimeWarning = computed((): string | null => {
    if (!addTurn.value) return null
    if (!turnForm.start_time || !turnForm.checkin_time) return null

    // Warn if cleaning window is tight (less than 1 hour between start and checkin)
    const [startH, startM] = turnForm.start_time.split(':').map(Number)
    const [checkinH, checkinM] = turnForm.checkin_time.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const checkinMinutes = checkinH * 60 + checkinM
    const gap = checkinMinutes - startMinutes

    if (gap < 0) {
      return 'Next guest checkin time must be after the turn start time.'
    }
    if (gap > 0 && gap < 60) {
      return `Tight cleaning window: only ${gap} minutes between checkout and next checkin.`
    }
    return null
  })

  // DROPDOWN OPTIONS
  const statusItems = [
    { title: 'Pending', value: 'pending' },
    { title: 'Scheduled', value: 'scheduled' },
    { title: 'In Progress', value: 'in_progress' },
    { title: 'Completed', value: 'completed' },
    { title: 'Cancelled', value: 'cancelled' },
  ]

  // VALIDATION RULES
  const propertyRules = [
    (v: string) => !!v || 'Property is required',
    (v: string) => {
      const property = props.properties.find(p => p.id === v)
      return !!property || 'Selected property does not exist'
    },
  ]

  const dateRules = [
    (v: string) => !!v || 'Date is required',
    (v: string) => {
      const date = new Date(v)
      return !Number.isNaN(date.getTime()) || 'Invalid date format'
    },
  ]

  // Time validation rules for time input fields
  const timeRules = [
    (v: string) => !!v || 'Time is required',
    (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v) || 'Invalid time format (HH:MM, 24-hour)',
  ]

  // Sync turn start date/time from main booking checkout when they change
  watch([() => form.checkout_date, () => form.checkout_time], ([newDate, newTime]) => {
    if (addTurn.value) {
      turnForm.start_date = (newDate as string) || ''
      turnForm.start_time = (newTime as string) || ''
    }
  })

  // When turn is toggled on, initialize from current checkout values
  watch(addTurn, enabled => {
    if (enabled) {
      turnForm.start_date = (form.checkout_date as string) || ''
      turnForm.start_time = (form.checkout_time as string) || '11:00'
      turnForm.checkin_time = '15:00'
      turnForm.checkout_date = ''
      turnForm.checkout_time = '11:00'
    }
  })

  // Reset form to default or to booking data
  function resetForm (): void {
    errors.value.clear()
    addTurn.value = false

    if (props.mode === 'edit' && props.booking) {
      const checkoutDate = props.booking.checkout_date
      const checkinDate = props.booking.checkin_date
      const hasTurnData = !!props.booking.turn_date

      Object.assign(form, {
        property_id: props.booking.property_id,
        checkout_date: formatDateForInput(hasTurnData ? props.booking.turn_date! : checkoutDate),
        checkin_date: formatDateForInput(checkinDate),
        checkin_time: (props.booking.checkin_time || '15:00').slice(0, 5),
        checkout_time: hasTurnData
          ? (props.booking.turn_start_time || '11:00').slice(0, 5)
          : (props.booking.checkout_time || '11:00').slice(0, 5),
        booking_type: props.booking.booking_type,
        guest_count: props.booking.guest_count,
        notes: props.booking.notes,
        status: props.booking.status,
        priority: props.booking.priority || 'normal',
        owner_id: props.booking.owner_id,
      })

      // Populate turn fields if this is a turn booking
      if (hasTurnData) {
        addTurn.value = true
        Object.assign(turnForm, {
          start_date: formatDateForInput(props.booking.turn_date!),
          start_time: (props.booking.turn_start_time || '11:00').slice(0, 5),
          checkin_time: (props.booking.turn_checkin_time || '15:00').slice(0, 5),
          checkout_date: formatDateForInput(checkoutDate),
          checkout_time: (props.booking.checkout_time || '11:00').slice(0, 5),
        })
      }
    } else {
      const defaults = {
        property_id: '',
        checkout_date: '',
        checkin_date: '',
        checkin_time: '15:00',
        checkout_time: '11:00',
        booking_type: 'standard' as const,
        guest_count: undefined,
        notes: '',
        status: 'pending' as const,
        priority: 'normal' as const,
        owner_id: '',
      }

      const initialData = props.initialData || {}
      const formData = {
        ...defaults,
        ...initialData,
        checkin_date: initialData.start || initialData.checkin_date || '',
        checkout_date: initialData.end || initialData.checkout_date || '',
      }

      if (formData.checkout_date) {
        formData.checkout_date = formatDateForInput(String(formData.checkout_date))
      }
      if (formData.checkin_date) {
        formData.checkin_date = formatDateForInput(String(formData.checkin_date))
      }

      Object.assign(form, formData)
    }

    // Reset turn form only when not editing a turn booking
    if (!addTurn.value) {
      Object.assign(turnForm, {
        start_date: '',
        start_time: '',
        checkin_time: '15:00',
        checkout_date: '',
        checkout_time: '11:00',
      })
    }
  }

  // Validate form
  async function validate (): Promise<boolean> {
    errors.value.clear()

    if (!formRef.value) return false

    const { valid } = await formRef.value.validate()
    if (!valid) return false

    const checkoutDate = new Date(String(form.checkout_date || ''))
    const checkinDate = new Date(String(form.checkin_date || ''))

    if (Number.isNaN(checkoutDate.getTime()) || Number.isNaN(checkinDate.getTime())) {
      errors.value.set('checkout_date', 'Invalid date format')
      errors.value.set('checkin_date', 'Invalid date format')
      return false
    }

    if (checkoutDate < checkinDate) {
      errors.value.set('checkout_date', 'Checkout date must be on or after checkin date')
      return false
    }

    if (checkoutDate.toDateString() === checkinDate.toDateString()
      && form.checkout_time && form.checkin_time
      && form.checkout_time <= form.checkin_time) {
      errors.value.set('checkout_time', 'For same-day bookings, checkout time must be after checkin time')
      return false
    }

    // Validate turn booking fields if enabled
    if (addTurn.value) {
      if (!turnForm.start_date) {
        errors.value.set('turn_start_date', 'Turn start date is required')
        return false
      }
      if (!turnForm.start_time) {
        errors.value.set('turn_start_time', 'Turn start time is required')
        return false
      }
      if (!turnForm.checkin_time) {
        errors.value.set('turn_checkin_time', 'Next guest checkin time is required')
        return false
      }
      if (!turnForm.checkout_date) {
        errors.value.set('turn_checkout_date', 'Final checkout date is required')
        return false
      }
      if (!turnForm.checkout_time) {
        errors.value.set('turn_checkout_time', 'Final checkout time is required')
        return false
      }

      // Turn checkin time must be after turn start time (on the same day)
      if (turnForm.start_date === turnForm.checkout_date
        && turnForm.checkin_time <= turnForm.start_time) {
        errors.value.set('turn_checkin_time', 'Next guest checkin must be after turn start time')
        return false
      }

      // Final checkout must be on or after turn start date
      const turnStart = new Date(turnForm.start_date)
      const turnEnd = new Date(turnForm.checkout_date)
      if (turnEnd < turnStart) {
        errors.value.set('turn_checkout_date', 'Final checkout must be on or after turn start date')
        return false
      }
    }

    return true
  }

  // Handle form submission
  async function handleSubmit (): Promise<void> {
    loading.value = true

    try {
      const isValid = await validate()
      if (!isValid) {
        loading.value = false
        return
      }

      if (!form.property_id || !form.checkout_date || !form.checkin_date) {
        errors.value.set('form', 'Please fill in all required fields')
        loading.value = false
        return
      }

      const hasTurn = addTurn.value

      const bookingData: BookingFormData = {
        property_id: form.property_id,
        checkin_date: form.checkin_date,
        // When turn is enabled, the booking spans to the turn's final checkout
        checkout_date: hasTurn ? turnForm.checkout_date : form.checkout_date,
        checkin_time: (form.checkin_time as string) || '15:00',
        checkout_time: hasTurn ? turnForm.checkout_time : ((form.checkout_time as string) || '11:00'),
        booking_type: (hasTurn ? 'turn' : 'standard') as BookingType,
        status: (form.status as BookingStatus) || 'pending',
        priority: hasTurn ? 'high' : ((form.priority as 'low' | 'normal' | 'high' | 'urgent') || 'normal'),
        owner_id: form.owner_id as string,
        guest_count: form.guest_count,
        notes: form.notes,
        // Turn metadata — only set when turn is enabled
        turn_date: hasTurn ? turnForm.start_date : null,
        turn_start_time: hasTurn ? turnForm.start_time : null,
        turn_checkin_time: hasTurn ? turnForm.checkin_time : null,
      }

      emit('save', bookingData)

      loading.value = false
      resetForm()
      isOpen.value = false
    } catch (error) {
      console.error('Error submitting form:', error)
      errors.value.set('form', error instanceof Error ? error.message : 'An error occurred')
      loading.value = false
    }
  }

  function handleDelete (): void {
    if (props.mode !== 'edit' || !props.booking) return
    emit('delete', props.booking.id)
  }

  // Handle modal close
  function handleClose (): void {
    resetForm()
    emit('close')
  }

  // Format date for input field (ensure YYYY-MM-DD format)
  function formatDateForInput (dateStr: string): string {
    if (!dateStr) return ''

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }

    try {
      const date = new Date(dateStr)
      if (Number.isNaN(date.getTime())) {
        console.warn('Invalid date:', dateStr)
        return ''
      }

      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')

      return `${year}-${month}-${day}`
    } catch (error) {
      console.error('Error formatting date:', dateStr, error)
      return ''
    }
  }

  // LIFECYCLE HOOKS
  onMounted(() => {
    resetForm()
  })

  // WATCHERS
  watch(() => props.open, newValue => {
    if (newValue) {
      nextTick(() => {
        resetForm()
      })
    }
  })

  watch(() => props.booking, (newBooking, oldBooking) => {
    if (props.open && props.mode === 'edit' && newBooking && newBooking.id !== oldBooking?.id) {
      resetForm()
    }
  })

  watch(() => props.initialData, newInitialData => {
    if (props.open && props.mode === 'create' && newInitialData) {
      resetForm()
    }
  })
</script>

<style scoped>
/* Modal viewport constraints */
.modal-card {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-content {
  overflow-y: auto;
  flex: 1;
  max-height: calc(90vh - 120px);
}

/* Turn toggle card */
.turn-toggle-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.turn-toggle-card:hover {
  border-color: rgb(var(--v-theme-primary)) !important;
}

/* Turn section styling */
.turn-section {
  border: 1px solid rgba(var(--v-theme-warning), 0.4) !important;
  border-left: 3px solid rgb(var(--v-theme-warning)) !important;
  background: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}
</style>
