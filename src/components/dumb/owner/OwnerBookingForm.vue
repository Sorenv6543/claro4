<template>
  <v-dialog
    v-model="isOpen"
    max-width="600px"
    persistent
    @keydown.esc="handleClose"
  >
    <v-card>
      <v-card-title class="d-flex align-center text-h5 pb-2">
        {{ formTitle }}
        <v-chip
          v-if="form.booking_type === 'turn'"
          class="ml-2"
          color="error"
          size="small"
        >
          SAME-DAY CLEANING
        </v-chip>
        <v-spacer />
        <v-btn
          aria-label="Close"
          icon
          rounded="circle"
          size="small"
          style="min-width:44px;min-height:44px;"
          variant="text"
          @click="handleClose"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
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
                  label="Select Property"
                  prepend-inner-icon="mdi-home"
                  required
                  :rules="propertyRules"
                  variant="filled"
                />
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
                  hint="When guests leave"
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
                  hint="When guests leave"
                  label="Checkout Time"
                  :rules="timeRules"
                />
              </v-col>
            </v-row>

            <!-- Guest Count -->
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="form.guest_count"
                  clearable
                  :disabled="loading"
                  :error-messages="errors.get('guest_count')"
                  hint="Helps determine cleaning requirements"
                  :items="[1,2,3,4,5,6,7,8]"
                  label="Number of Guests (Optional)"
                  persistent-hint
                  prepend-inner-icon="mdi-account-group"
                  variant="filled"
                />
              </v-col>
            </v-row>

            <!-- Notes -->
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="form.notes"
                  :counter="300"
                  :disabled="loading"
                  :error-messages="errors.get('notes')"
                  hint="Any special cleaning requirements or notes"
                  label="Special Instructions (Optional)"
                  persistent-hint
                  prepend-inner-icon="mdi-note-text"
                  rows="3"
                  variant="filled"
                />
              </v-col>
            </v-row>

            <!-- Same-Day Cleaning Alert -->
            <v-row v-if="showSameDayAlert">
              <v-col cols="12">
                <v-alert
                  class="mb-0"
                  title="Same-Day Cleaning Required"
                  type="info"
                  variant="tonal"
                >
                  <p>Your guests are checking out and new guests are checking in on the same day.</p>

                  <p class="mb-0">
                    This requires priority same-day cleaning service.
                  </p>
                </v-alert>
              </v-col>
            </v-row>

            <!-- Date Validation Error -->
            <v-row v-if="showDateError">
              <v-col cols="12">
                <v-alert
                  class="mb-0"
                  text="Checkout date cannot be before checkin date. Please check your dates."
                  title="Invalid Dates"
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

        <v-spacer />

        <v-btn
          color="primary"
          :disabled="!formValid"
          :loading="loading"
          variant="elevated"
          @click="handleSubmit"
        >
          {{ submitButtonText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { Booking, BookingFormData } from '@/types/booking'
  import type { Property } from '@/types/property'
  import DatePickerField from '@components/dumb/shared/DatePickerField.vue'
  import TimePickerField from '@components/dumb/shared/TimePickerField.vue'
  import { computed, nextTick, ref, watch } from 'vue'
  import { formatPropertyAddress } from '@/types/property'

  // Props
  interface Props {
    modelValue: boolean
    mode: 'create' | 'edit'
    booking?: Booking | null
    properties: Property[]
    loading?: boolean
    errors?: Map<string, string[]>
    initialDates?: { checkinDate: string, checkoutDate: string }
  }

  const props = withDefaults(defineProps<Props>(), {
    booking: null,
    loading: false,
    errors: () => new Map(),
    initialDates: undefined,
  })

  // Emits
  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'submit', data: BookingFormData): void
    (e: 'close'): void
  }

  const emit = defineEmits<Emits>()

  // Reactive data
  const formRef = ref()
  const formValid = ref(false)
  const autoDetectType = ref(true)

  // Date picker state
  const _now = new Date()
  const todayIso = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`

  // Form data
  const form = ref<BookingFormData>({
    property_id: '',
    owner_id: '',
    checkout_date: '',
    checkin_date: '',
    checkin_time: '15:00',
    checkout_time: '11:00',
    booking_type: 'standard',
    status: 'pending',
    priority: 'normal',
    guest_count: undefined,
    notes: '',
  })

  // Computed properties
  const isOpen = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
  })

  const formTitle = computed(() => {
    return props.mode === 'create' ? 'Schedule Cleaning' : 'Update Booking'
  })

  const submitButtonText = computed(() => {
    return props.mode === 'create' ? 'Schedule Cleaning' : 'Update Booking'
  })

  const propertiesArray = computed(() => {
    return Array.from(props.properties).map(property => ({
      id: property.id,
      displayAddress: formatPropertyAddress(property, 'short'),
    }))
  })

  const showSameDayAlert = computed(() => {
    return form.value.checkout_date
      && form.value.checkin_date
      && form.value.checkout_date === form.value.checkin_date
  })

  const showDateError = computed(() => {
    if (!form.value.checkout_date || !form.value.checkin_date) return false
    const checkinDate = new Date(String(form.value.checkin_date || ''))
    const checkoutDate = new Date(String(form.value.checkout_date || ''))
    if (Number.isNaN(checkinDate.getTime()) || Number.isNaN(checkoutDate.getTime())) return false
    return checkoutDate < checkinDate
  })

  // Validation rules
  const propertyRules = [
    (v: string) => !!v || 'Please select a property',
  ]

  const dateRules = [
    (v: string) => !!v || 'Date is required',
    (v: string) => {
      const date = new Date(v)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date >= today || 'Date cannot be in the past'
    },
  ]

  const timeRules = [
    (v: string) => !!v || 'Time is required',
    (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v) || 'Invalid time format',
  ]

  // Methods
  function updateBookingType () {
    if (!autoDetectType.value) return

    if (form.value.checkout_date && form.value.checkin_date) {
      const checkoutDate = new Date(String(form.value.checkout_date || ''))
      const checkinDate = new Date(String(form.value.checkin_date || ''))

      // Check if dates are valid
      if (Number.isNaN(checkoutDate.getTime()) || Number.isNaN(checkinDate.getTime())) return

      // Same day = turn booking
      form.value.booking_type = checkoutDate.toDateString() === checkinDate.toDateString() ? 'turn' : 'standard'
    }
  }

  function resetForm () {
    form.value = {
      property_id: '',
      owner_id: '',
      checkin_date: props.initialDates?.checkinDate ?? '',
      checkout_date: props.initialDates?.checkoutDate ?? '',
      checkin_time: '15:00',
      checkout_time: '11:00',
      booking_type: 'standard',
      status: 'pending',
      priority: 'normal',
      guest_count: undefined,
      notes: '',
    }

    if (formRef.value) {
      formRef.value.resetValidation()
    }

    updateBookingType()
  }

  function populateForm (booking: Booking) {
    form.value = {
      property_id: booking.property_id,
      owner_id: booking.owner_id,
      checkout_date: booking.checkout_date,
      checkin_date: booking.checkin_date,
      checkin_time: booking.checkin_time || '15:00',
      checkout_time: booking.checkout_time || '11:00',
      booking_type: booking.booking_type,
      status: booking.status,
      priority: booking.priority || 'normal',
      guest_count: booking.guest_count,
      notes: booking.notes || '',
    }
  }

  async function handleSubmit () {
    if (!formRef.value) return

    const { valid } = await formRef.value.validate()
    if (!valid) return

    // Additional validation
    if (showDateError.value) return

    emit('submit', { ...form.value })
  }

  function handleClose () {
    emit('close')
    emit('update:modelValue', false)
  }

  // Watchers
  watch(() => props.modelValue, newValue => {
    if (newValue) {
      if (props.mode === 'edit' && props.booking) {
        populateForm(props.booking)
      } else {
        resetForm()
      }

      nextTick(() => {
        if (formRef.value) {
          formRef.value.resetValidation()
        }
      })
    }
  })

  watch(() => props.booking, newBooking => {
    if (newBooking && props.mode === 'edit') {
      populateForm(newBooking)
    }
  })
</script>

<style scoped>
.v-card-title {
  background-color: rgb(var(--v-theme-primary));
  color: #fff;
}

.v-card-actions {
  background-color: rgb(var(--v-theme-surface-variant));
}

/* Mobile optimizations */
@media (max-width: 600px) {
  .v-dialog {
    margin: 16px;
  }

  .v-card {
    margin: 0;
  }
}
</style>
