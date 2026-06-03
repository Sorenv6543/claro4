<template>
  <v-dialog
    v-model="isOpen"
    max-width="500px"
    persistent
    @keydown.esc="handleClose"
  >
    <v-card>
      <v-card-title class="d-flex align-center text-h5 pb-2">
        <v-icon
          class="mr-2"
          size="22"
        >
          mdi-swap-horizontal
        </v-icon>
        Create Turn Booking
        <v-chip
          class="ml-2"
          color="error"
          size="small"
        >
          SAME-DAY
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
            <!-- Read-only context -->
            <v-row>
              <v-col cols="12">
                <v-text-field
                  density="compact"
                  hint="Property for this turn"
                  label="Property"
                  :model-value="propertyLabel"
                  persistent-hint
                  prepend-inner-icon="mdi-home"
                  readonly
                  variant="filled"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col
                cols="12"
                sm="6"
              >
                <v-text-field
                  density="compact"
                  hint="Same-day checkout and checkin"
                  label="Turn Date"
                  :model-value="turnDateFormatted"
                  persistent-hint
                  prepend-inner-icon="mdi-calendar"
                  readonly
                  variant="filled"
                />
              </v-col>

              <v-col
                cols="12"
                sm="6"
              >
                <v-text-field
                  density="compact"
                  hint="Previous guests leave"
                  label="Previous Guests Depart"
                  :model-value="departureTimeDisplay"
                  persistent-hint
                  prepend-inner-icon="mdi-clock-out"
                  readonly
                  variant="filled"
                />
              </v-col>
            </v-row>

            <v-divider class="my-3" />

            <!-- Editable: arrival time -->
            <v-row>
              <v-col cols="12">
                <TimePickerField
                  v-model="checkin_time"
                  hint="When incoming guests arrive"
                  label="New Guest Arrival Time"
                  :rules="arrivalTimeRules"
                />
              </v-col>
            </v-row>

            <!-- Optional: guest count -->
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="guest_count"
                  clearable
                  hint="Helps determine cleaning requirements"
                  :items="[1,2,3,4,5,6,7,8]"
                  label="Number of Guests (Optional)"
                  persistent-hint
                  prepend-inner-icon="mdi-account-group"
                  variant="filled"
                />
              </v-col>
            </v-row>

            <!-- Optional: notes -->
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="notes"
                  :counter="300"
                  hint="Any special cleaning requirements or notes"
                  label="Special Instructions (Optional)"
                  persistent-hint
                  prepend-inner-icon="mdi-note-text"
                  rows="3"
                  variant="filled"
                />
              </v-col>
            </v-row>

            <!-- Early arrival warning -->
            <v-row v-if="checkin_time && checkin_time < '14:00'">
              <v-col cols="12">
                <v-alert
                  class="mb-0"
                  text="Early arrival may leave insufficient time for cleaning preparation."
                  title="Tight Cleaning Window"
                  type="warning"
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
          variant="text"
          @click="handleClose"
        >
          Cancel
        </v-btn>

        <v-spacer />

        <v-btn
          color="primary"
          :disabled="!formValid || !checkin_time"
          :loading="loading"
          variant="elevated"
          @click="handleSubmit"
        >
          Schedule Turn
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { Booking, BookingFormData } from '@/types/booking'
  import type { Property } from '@/types/property'
  import TimePickerField from '@components/dumb/shared/TimePickerField.vue'
  import { computed, nextTick, ref, watch } from 'vue'
  import { formatPropertyAddress } from '@/types/property'
  import { calculateBookingPriority } from '@/utils/businessLogic'

  interface Props {
    modelValue: boolean
    sourceBooking: Booking
    properties: Property[]
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
  })

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'submit', data: BookingFormData): void
    (e: 'close'): void
  }

  const emit = defineEmits<Emits>()

  const formRef = ref()
  const formValid = ref(false)
  const checkin_time = ref('')
  const guest_count = ref<number | null>(null)
  const notes = ref('')

  const isOpen = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
  })

  const sourceProperty = computed(() =>
    props.properties.find(p => p.id === props.sourceBooking.property_id),
  )

  const propertyLabel = computed(() =>
    sourceProperty.value
      ? formatPropertyAddress(sourceProperty.value, 'full')
      : props.sourceBooking.property_id,
  )

  const turnDateFormatted = computed(() =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(props.sourceBooking.checkout_date + 'T00:00:00Z')),
  )

  const departureTimeDisplay = computed(() => {
    const t = props.sourceBooking.checkout_time
    if (!t) return ''
    const [hourStr, minStr] = t.split(':')
    const hour = Number.parseInt(hourStr, 10)
    if (Number.isNaN(hour)) return t
    const min = minStr ?? '00'
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${min} ${period}`
  })

  const arrivalTimeRules = [
    (v: string) => !!v || 'Arrival time is required',
    (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v) || 'Invalid time format',
    (v: string) => !v || v > props.sourceBooking.checkout_time
      ? true
      : `Arrival must be after departure (${departureTimeDisplay.value})`,
  ]

  async function handleSubmit () {
    if (!formRef.value) return
    const { valid } = await formRef.value.validate()
    if (!valid) return

    const data: BookingFormData = {
      property_id: props.sourceBooking.property_id,
      owner_id: '',
      checkin_date: props.sourceBooking.checkout_date,
      checkout_date: props.sourceBooking.checkout_date,
      checkin_time: checkin_time.value,
      checkout_time: props.sourceBooking.checkout_time,
      booking_type: 'turn',
      status: 'pending',
      priority: calculateBookingPriority({
        booking_type: 'turn',
        checkout_date: props.sourceBooking.checkout_date,
        checkin_date: props.sourceBooking.checkout_date,
      } as Booking),
      guest_count: guest_count.value ?? null,
      notes: notes.value || null,
    }

    emit('submit', data)
  }

  function handleClose () {
    emit('close')
    emit('update:modelValue', false)
  }

  watch(() => props.modelValue, newValue => {
    if (newValue) {
      checkin_time.value = ''
      guest_count.value = null
      notes.value = ''
      nextTick(() => {
        formRef.value?.resetValidation()
      })
    }
  })
</script>
