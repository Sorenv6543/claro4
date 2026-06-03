<template>
  <v-dialog
    v-model="isOpen"
    max-width="900px"
    persistent
    scrollable
    @keydown.esc="handleClose"
  >
    <v-card>
      <v-card-title class="text-h5 pb-2 d-flex align-center">
        <v-icon class="mr-2">
          mdi-account-hard-hat
        </v-icon>
        Assign Cleaner
        <v-spacer />

        <v-chip
          v-if="booking?.booking_type === 'turn'"
          color="error"
          size="small"
          variant="elevated"
        >
          <v-icon start>
            mdi-clock-alert
          </v-icon>
          URGENT
        </v-chip>
      </v-card-title>

      <v-divider />

      <!-- Booking Information -->
      <v-card-text class="pa-0">
        <v-container>
          <v-row v-if="booking">
            <v-col cols="12">
              <v-card
                class="mb-4"
                variant="outlined"
              >
                <v-card-title class="text-subtitle-1 py-2">
                  <v-icon class="mr-2">
                    mdi-information
                  </v-icon>
                  Booking Details
                </v-card-title>

                <v-divider />

                <v-card-text>
                  <v-row>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <div class="text-body-2 text-medium-emphasis mb-1">
                        Property
                      </div>

                      <div class="text-body-1 font-weight-medium">
                        {{ selectedProperty ? formatPropertyAddress(selectedProperty, 'short') : '' }}
                      </div>

                      <div class="text-body-2 text-medium-emphasis">
                        {{ selectedProperty ? formatPropertyAddress(selectedProperty) : '' }}
                      </div>
                    </v-col>

                    <v-col
                      cols="12"
                      md="6"
                    >
                      <div class="text-body-2 text-medium-emphasis mb-1">
                        Schedule
                      </div>

                      <div class="text-body-1">
                        <v-icon
                          class="mr-1"
                          size="small"
                        >
                          mdi-calendar-export
                        </v-icon>
                        {{ booking.checkout_date ? formatDateTime(booking.checkout_date as string) : 'Not set' }}
                      </div>

                      <div class="text-body-1">
                        <v-icon
                          class="mr-1"
                          size="small"
                        >
                          mdi-calendar-import
                        </v-icon>
                        {{ booking.checkin_date ? formatDateTime(booking.checkin_date as string) : 'Not set' }}
                      </div>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <div class="text-body-2 text-medium-emphasis mb-1">
                        Cleaning Window
                      </div>

                      <div class="text-body-1">
                        {{ getCleaningWindow() }}
                      </div>
                    </v-col>

                    <v-col
                      cols="12"
                      md="6"
                    >
                      <div class="text-body-2 text-medium-emphasis mb-1">
                        Estimated Duration
                      </div>

                      <div class="text-body-1">
                        {{ selectedProperty?.cleaning_duration || 120 }} minutes
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Filters and Search -->
          <v-row>
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="searchQuery"
                clearable
                hint="Search by name or skills"
                label="Search Cleaners"
                persistent-hint
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
              />
            </v-col>

            <v-col
              cols="12"
              md="3"
            >
              <v-select
                v-model="availabilityFilter"
                clearable
                :items="availabilityFilterOptions"
                label="Availability"
                variant="outlined"
              />
            </v-col>

            <v-col
              cols="12"
              md="3"
            >
              <v-select
                v-model="skillFilter"
                clearable
                :items="skillFilterOptions"
                label="Required Skill"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <!-- Cleaner Selection -->
          <v-row>
            <v-col cols="12">
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1 py-2 d-flex align-center">
                  <v-icon class="mr-2">
                    mdi-account-group
                  </v-icon>
                  Available Cleaners
                  <v-spacer />

                  <v-chip
                    size="small"
                    variant="tonal"
                  >
                    {{ filteredCleaners.length }} available
                  </v-chip>
                </v-card-title>

                <v-divider />

                <v-list
                  class="pa-0"
                  max-height="400"
                  style="overflow-y: auto;"
                >
                  <template
                    v-for="(cleaner, index) in filteredCleaners"
                    :key="cleaner.id"
                  >
                    <v-list-item
                      :class="{ 'bg-primary-lighten-5': selectedCleanerId === cleaner.id }"
                      @click="selectCleaner(cleaner.id)"
                    >
                      <template #prepend>
                        <v-avatar
                          :color="getAvailabilityColor(cleaner)"
                          size="40"
                        >
                          <v-icon>mdi-account</v-icon>
                        </v-avatar>
                      </template>

                      <v-list-item-title class="font-weight-medium">
                        {{ cleaner.name }}
                        <v-chip
                          v-if="selectedCleanerId === cleaner.id"
                          class="ml-2"
                          color="primary"
                          size="x-small"
                        >
                          SELECTED
                        </v-chip>
                      </v-list-item-title>

                      <v-list-item-subtitle>
                        <div class="d-flex flex-wrap gap-1 mb-1">
                          <v-chip
                            v-for="skill in cleaner.skills.slice(0, 3)"
                            :key="skill"
                            size="x-small"
                            variant="outlined"
                          >
                            {{ skill }}
                          </v-chip>

                          <v-chip
                            v-if="cleaner.skills.length > 3"
                            size="x-small"
                            variant="text"
                          >
                            +{{ cleaner.skills.length - 3 }} more
                          </v-chip>
                        </div>

                        <div class="text-caption">
                          Today: {{ getCleanerTodayBookings(cleaner.id) }}/{{ cleaner.max_daily_bookings }} bookings
                          • Rating: {{ getCleanerRating(cleaner.id).toFixed(1) }}/5.0
                        </div>
                      </v-list-item-subtitle>

                      <template #append>
                        <div class="d-flex flex-column align-end">
                          <v-chip
                            class="mb-1"
                            :color="getAvailabilityColor(cleaner)"
                            size="small"
                            variant="tonal"
                          >
                            {{ getAvailabilityText(cleaner) }}
                          </v-chip>

                          <div class="text-caption text-medium-emphasis">
                            {{ getDistanceText(cleaner) }}
                          </div>
                        </div>
                      </template>
                    </v-list-item>

                    <v-divider v-if="index < filteredCleaners.length - 1" />
                  </template>

                  <!-- No cleaners available -->
                  <v-list-item v-if="filteredCleaners.length === 0">
                    <v-list-item-title class="text-center text-medium-emphasis">
                      <v-icon class="mb-2">
                        mdi-account-off
                      </v-icon>

                      <div>No cleaners match your criteria</div>

                      <div class="text-caption">
                        Try adjusting your filters
                      </div>
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
          </v-row>

          <!-- Selected Cleaner Details -->
          <v-row v-if="selectedCleanerDetails">
            <v-col cols="12">
              <v-card
                color="primary"
                variant="outlined"
              >
                <v-card-title class="text-subtitle-1 py-2">
                  <v-icon class="mr-2">
                    mdi-account-check
                  </v-icon>
                  Selected Cleaner Details
                </v-card-title>

                <v-divider />

                <v-card-text>
                  <v-row>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <div class="text-center">
                        <v-avatar
                          class="mb-2"
                          :color="getAvailabilityColor(selectedCleanerDetails)"
                          size="80"
                        >
                          <v-icon size="40">
                            mdi-account
                          </v-icon>
                        </v-avatar>

                        <div class="text-h6 font-weight-medium">
                          {{ selectedCleanerDetails.name }}
                        </div>

                        <v-rating
                          class="justify-center mt-1"
                          density="compact"
                          :model-value="getCleanerRating(selectedCleanerDetails.id)"
                          readonly
                          size="small"
                        />
                      </div>
                    </v-col>

                    <v-col
                      cols="12"
                      md="4"
                    >
                      <div class="text-body-2 text-medium-emphasis mb-1">
                        Skills & Specializations
                      </div>

                      <div class="d-flex flex-wrap gap-1 mb-3">
                        <v-chip
                          v-for="skill in selectedCleanerDetails.skills"
                          :key="skill"
                          color="primary"
                          size="small"
                          variant="tonal"
                        >
                          {{ skill }}
                        </v-chip>
                      </div>

                      <div class="text-body-2 text-medium-emphasis mb-1">
                        Availability Status
                      </div>

                      <v-chip
                        :color="getAvailabilityColor(selectedCleanerDetails)"
                        variant="elevated"
                      >
                        <v-icon start>
                          {{ getAvailabilityIcon(selectedCleanerDetails) }}
                        </v-icon>
                        {{ getAvailabilityText(selectedCleanerDetails) }}
                      </v-chip>
                    </v-col>

                    <v-col
                      cols="12"
                      md="4"
                    >
                      <div class="text-body-2 text-medium-emphasis mb-1">
                        Today's Schedule
                      </div>

                      <div class="text-body-1 mb-2">
                        {{ getCleanerTodayBookings(selectedCleanerDetails.id) }}/{{ selectedCleanerDetails.max_daily_bookings }} bookings
                      </div>

                      <div class="text-body-2 text-medium-emphasis mb-1">
                        Distance from Property
                      </div>

                      <div class="text-body-1 mb-2">
                        {{ getDistanceText(selectedCleanerDetails) }}
                      </div>

                      <div class="text-body-2 text-medium-emphasis mb-1">
                        Estimated Travel Time
                      </div>

                      <div class="text-body-1">
                        {{ getTravelTime(selectedCleanerDetails) }}
                      </div>
                    </v-col>
                  </v-row>

                  <!-- Conflict Warning -->
                  <v-row v-if="hasScheduleConflict(selectedCleanerDetails)">
                    <v-col cols="12">
                      <v-alert
                        class="mt-2"
                        title="Potential Schedule Conflict"
                        type="warning"
                        variant="tonal"
                      >
                        This cleaner has overlapping bookings. Please verify availability before confirming assignment.
                      </v-alert>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
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
          color="primary"
          :disabled="loading"
          variant="outlined"
          @click="handleAutoAssign"
        >
          <v-icon start>
            mdi-auto-fix
          </v-icon>
          Auto-Assign Best Match
        </v-btn>

        <v-spacer />

        <v-btn
          color="primary"
          :disabled="!selectedCleanerId"
          :loading="loading"
          variant="elevated"
          @click="handleAssign"
        >
          <v-icon start>
            mdi-account-check
          </v-icon>
          Assign Cleaner
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { BookingFormData } from '@/types/booking'
  import type { Property } from '@/types/property'
  import type { Cleaner } from '@/types/user'
  import { computed, ref, watch } from 'vue'
  import { formatPropertyAddress } from '@/types/property'

  // Props
  interface Props {
    modelValue: boolean
    booking?: Partial<BookingFormData> | null
    properties: Property[]
    cleaners: Cleaner[]
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    booking: null,
    loading: false,
  })

  // Emits
  interface Emits {
    'update:modelValue': [value: boolean]
    'assign': [cleanerId: string]
    'auto-assign': []
  }

  const emit = defineEmits<Emits>()

  // State
  const selectedCleanerId = ref<string>('')
  const searchQuery = ref('')
  const availabilityFilter = ref<string>('')
  const skillFilter = ref<string>('')

  // Computed properties
  const isOpen = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  const selectedProperty = computed(() => {
    if (!props.booking?.property_id) return null
    return props.properties.find(p => p.id === props.booking?.property_id)
  })

  const selectedCleanerDetails = computed(() => {
    if (!selectedCleanerId.value) return null
    return props.cleaners.find(c => c.id === selectedCleanerId.value)
  })

  const availabilityFilterOptions = [
    { title: 'Available', value: 'available' },
    { title: 'Limited Availability', value: 'limited' },
    { title: 'Fully Booked', value: 'booked' },
  ]

  const skillFilterOptions = computed(() => {
    const allSkills = new Set<string>()
    for (const cleaner of props.cleaners) {
      for (const skill of cleaner.skills) allSkills.add(skill)
    }
    return Array.from(allSkills).map(skill => ({ title: skill, value: skill }))
  })

  const filteredCleaners = computed(() => {
    let filtered = [...props.cleaners]

    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(cleaner =>
        cleaner.name.toLowerCase().includes(query)
        || cleaner.skills.some(skill => skill.toLowerCase().includes(query)),
      )
    }

    // Availability filter
    if (availabilityFilter.value) {
      filtered = filtered.filter(cleaner => {
        const availability = getAvailabilityStatus(cleaner)
        return availability === availabilityFilter.value
      })
    }

    // Skill filter
    if (skillFilter.value) {
      filtered = filtered.filter(cleaner =>
        cleaner.skills.includes(skillFilter.value),
      )
    }

    // Sort by availability and rating
    return filtered.toSorted((a, b) => {
      const aAvailable = getAvailabilityStatus(a) === 'available'
      const bAvailable = getAvailabilityStatus(b) === 'available'

      if (aAvailable && !bAvailable) return -1
      if (!aAvailable && bAvailable) return 1

      // If same availability, sort by rating
      return getCleanerRating(b.id) - getCleanerRating(a.id)
    })
  })

  // Methods
  function selectCleaner (cleanerId: string) {
    selectedCleanerId.value = cleanerId
  }

  function getAvailabilityStatus (cleaner: Cleaner): string {
    const todayBookings = getCleanerTodayBookings(cleaner.id)
    if (todayBookings >= cleaner.max_daily_bookings) return 'booked'
    if (todayBookings >= cleaner.max_daily_bookings * 0.8) return 'limited'
    return 'available'
  }

  function getAvailabilityColor (cleaner: Cleaner) {
    const status = getAvailabilityStatus(cleaner)
    const colors: Record<string, string> = {
      available: 'green',
      limited: 'orange',
      booked: 'red',
    }
    return colors[status] || 'grey'
  }

  function getAvailabilityText (cleaner: Cleaner) {
    const status = getAvailabilityStatus(cleaner)
    const texts: Record<string, string> = {
      available: 'Available',
      limited: 'Limited',
      booked: 'Fully Booked',
    }
    return texts[status] || 'Unknown'
  }

  function getAvailabilityIcon (cleaner: Cleaner) {
    const status = getAvailabilityStatus(cleaner)
    const icons: Record<string, string> = {
      available: 'mdi-check-circle',
      limited: 'mdi-clock',
      booked: 'mdi-close-circle',
    }
    return icons[status] || 'mdi-help-circle'
  }

  function getCleanerTodayBookings (_: string) {
    // Mock data - would come from bookings store
    return Math.floor(Math.random() * 6)
  }

  function getCleanerRating (_: string) {
    // Mock data - would come from performance data
    return 3.5 + Math.random() * 1.5
  }

  function getDistanceText (_: Cleaner) {
    // Mock data - would calculate from cleaner location and property
    const distance = Math.floor(Math.random() * 20) + 1
    return `${distance} km away`
  }

  function getTravelTime (_: Cleaner) {
    // Mock data - would calculate based on distance and traffic
    const time = Math.floor(Math.random() * 30) + 10
    return `${time} minutes`
  }

  function hasScheduleConflict (_: Cleaner) {
    // Mock conflict detection - would check against existing bookings
    return Math.random() < 0.2 // 20% chance of conflict
  }

  function formatDateTime (dateTime: string) {
    if (!dateTime) return ''
    const date = new Date(dateTime)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  function getCleaningWindow () {
    if (!props.booking?.checkout_date || !props.booking?.checkin_date) return ''

    const checkout = new Date(props.booking.checkout_date as string)
    const checkin = new Date(props.booking.checkin_date as string)
    const diffHours = Math.abs(checkin.getTime() - checkout.getTime()) / (1000 * 60 * 60)

    if (diffHours < 1) {
      return 'Same-day turnaround (< 1 hour)'
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} hours available`
    } else {
      return `${Math.floor(diffHours / 24)} days available`
    }
  }

  function handleAssign () {
    if (selectedCleanerId.value) {
      emit('assign', selectedCleanerId.value)
    }
  }

  function handleAutoAssign () {
    emit('auto-assign')
  }

  function handleClose () {
    isOpen.value = false
  }

  // Reset selection when modal opens
  watch(isOpen, newValue => {
    if (newValue) {
      selectedCleanerId.value = ''
      searchQuery.value = ''
      availabilityFilter.value = ''
      skillFilter.value = ''
    }
  })
</script>
