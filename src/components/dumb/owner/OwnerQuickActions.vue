<template>
  <v-card
    class="owner-quick-actions"
    :elevation="elevation"
    :variant="variant"
  >
    <v-card-title class="text-h6 pb-2">
      <v-icon class="mr-2">
        mdi-lightning-bolt
      </v-icon>
      Quick Actions
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-3">
      <v-container
        class="pa-0"
        fluid
      >
        <!-- Primary Actions Row -->
        <v-row class="mb-2">
          <v-col
            cols="6"
            lg="6"
            md="12"
            sm="6"
          >
            <v-btn
              block
              color="primary"
              :disabled="disabled"
              :loading="loading"
              size="large"
              variant="elevated"
              @click="handleAction('add-booking')"
            >
              <v-icon class="mr-2">
                mdi-calendar-plus
              </v-icon>

              <span class="d-none d-sm-inline">Schedule</span>
              <span class="d-sm-none">Book</span>
              Cleaning
            </v-btn>
          </v-col>

          <v-col
            cols="6"
            lg="6"
            md="12"
            sm="6"
          >
            <v-btn
              block
              color="secondary"
              :disabled="disabled"
              :loading="loading"
              size="large"
              variant="elevated"
              @click="handleAction('add-property')"
            >
              <v-icon class="mr-2">
                mdi-home-plus
              </v-icon>

              <span class="d-none d-sm-inline">Add</span>
              Property
            </v-btn>
          </v-col>
        </v-row>

        <!-- Secondary Actions Row -->
        <v-row>
          <v-col
            cols="6"
            lg="6"
            md="12"
            sm="6"
          >
            <v-btn
              block
              color="info"
              :disabled="disabled"
              :loading="loading"
              variant="tonal"
              @click="handleAction('view-calendar')"
            >
              <v-icon class="mr-2">
                mdi-calendar
              </v-icon>

              <span class="d-none d-sm-inline">View</span>
              Calendar
            </v-btn>
          </v-col>

          <v-col
            cols="6"
            lg="6"
            md="12"
            sm="6"
          >
            <v-btn
              block
              color="success"
              :disabled="disabled"
              :loading="loading"
              variant="tonal"
              @click="handleAction('view-properties')"
            >
              <v-icon class="mr-2">
                mdi-home-group
              </v-icon>

              <span class="d-none d-sm-inline">My</span>
              Properties
            </v-btn>
          </v-col>
        </v-row>

        <!-- Additional Actions (Collapsible) -->
        <v-expand-transition>
          <div v-if="showMoreActions">
            <v-divider class="my-3" />

            <v-row>
              <v-col
                cols="6"
                lg="6"
                md="12"
                sm="6"
              >
                <v-btn
                  block
                  color="warning"
                  :disabled="disabled"
                  :loading="loading"
                  variant="outlined"
                  @click="handleAction('view-bookings')"
                >
                  <v-icon class="mr-2">
                    mdi-clipboard-list
                  </v-icon>

                  <span class="d-none d-sm-inline">My</span>
                  Bookings
                </v-btn>
              </v-col>

              <v-col
                cols="6"
                lg="6"
                md="12"
                sm="6"
              >
                <v-btn
                  block
                  color="purple"
                  :disabled="disabled"
                  :loading="loading"
                  variant="outlined"
                  @click="handleAction('contact-support')"
                >
                  <v-icon class="mr-2">
                    mdi-help-circle
                  </v-icon>

                  <span class="d-none d-sm-inline">Get</span>
                  Help
                </v-btn>
              </v-col>
            </v-row>
          </div>
        </v-expand-transition>

        <!-- Show More/Less Toggle -->
        <v-row class="mt-2">
          <v-col cols="12">
            <v-btn
              block
              size="small"
              variant="text"
              @click="showMoreActions = !showMoreActions"
            >
              <v-icon class="mr-1">
                {{ showMoreActions ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
              </v-icon>
              {{ showMoreActions ? 'Show Less' : 'More Actions' }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  // Props
  interface Props {
    loading?: boolean
    disabled?: boolean
    elevation?: number
    variant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'text' | 'plain'
  }

  withDefaults(defineProps<Props>(), {
    loading: false,
    disabled: false,
    elevation: 2,
    variant: 'elevated',
  })

  // Emits
  interface Emits {
    (e: 'action', actionType: OwnerActionType): void
  }

  const emit = defineEmits<Emits>()

  // Types
  type OwnerActionType
    = | 'add-booking'
      | 'add-property'
      | 'view-calendar'
      | 'view-properties'
      | 'view-bookings'
      | 'contact-support'

  // Reactive data
  const showMoreActions = ref(false)

  // Methods
  function handleAction (actionType: OwnerActionType) {
    emit('action', actionType)
  }
</script>
