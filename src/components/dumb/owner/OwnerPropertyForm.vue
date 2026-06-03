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
          v-if="form.active"
          class="ml-2"
          color="success"
          size="small"
        >
          ACTIVE
        </v-chip>

        <v-chip
          v-else
          class="ml-2"
          color="grey"
          size="small"
        >
          INACTIVE
        </v-chip>

        <v-chip
          v-if="!isOnline"
          class="ml-2"
          color="warning"
          prepend-icon="mdi-wifi-off"
          size="small"
        >
          OFFLINE MODE
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
            <!-- Property Address -->
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="form.address_street"
                  :disabled="loading"
                  :error-messages="errors.get('address_street')"
                  label="Street Address"
                  placeholder="123 Main St"
                  prepend-inner-icon="mdi-home"
                  required
                  :rules="streetRules"
                  variant="filled"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="form.address_unit"
                  :disabled="loading"
                  :error-messages="errors.get('address_unit')"
                  label="Unit / Apt"
                  placeholder="Apt 4B"
                  prepend-inner-icon="mdi-door"
                  variant="filled"
                />
              </v-col>

              <v-col cols="12" sm="8">
                <v-text-field
                  v-model="form.address_city"
                  :disabled="loading"
                  :error-messages="errors.get('address_city')"
                  label="City"
                  prepend-inner-icon="mdi-city"
                  required
                  :rules="cityRules"
                  variant="filled"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="form.address_state"
                  :disabled="loading"
                  :error-messages="errors.get('address_state')"
                  label="State"
                  placeholder="TX"
                  prepend-inner-icon="mdi-map-marker"
                  required
                  :rules="stateRules"
                  variant="filled"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="form.address_zip"
                  :disabled="loading"
                  :error-messages="errors.get('address_zip')"
                  label="ZIP Code"
                  placeholder="78701"
                  prepend-inner-icon="mdi-mailbox"
                  required
                  :rules="zipRules"
                  variant="filled"
                />
              </v-col>
            </v-row>

            <!-- Property Details -->
            <v-row>
              <v-col
                cols="6"
                sm="4"
              >
                <v-text-field
                  v-model.number="form.bedrooms"
                  :disabled="loading"
                  :error-messages="errors.get('bedrooms')"
                  hint="Number of bedrooms"
                  label="Bedrooms"
                  max="20"
                  min="0"
                  persistent-hint
                  prepend-inner-icon="mdi-bed"
                  type="number"
                  variant="filled"
                />
              </v-col>

              <v-col
                cols="6"
                sm="4"
              >
                <v-text-field
                  v-model.number="form.bathrooms"
                  :disabled="loading"
                  :error-messages="errors.get('bathrooms')"
                  hint="Number of bathrooms"
                  label="Bathrooms"
                  max="20"
                  min="0"
                  persistent-hint
                  prepend-inner-icon="mdi-shower"
                  step="0.5"
                  type="number"
                  variant="filled"
                />
              </v-col>

              <v-col
                cols="12"
                sm="4"
              >
                <v-select
                  v-model="form.property_type"
                  :disabled="loading"
                  :error-messages="errors.get('property_type')"
                  hint="Type of property"
                  :items="propertyTypeItems"
                  label="Property Type"
                  persistent-hint
                  prepend-inner-icon="mdi-home-variant"
                  variant="filled"
                />
              </v-col>
            </v-row>

            <!-- Cleaning Duration and Pricing -->
            <v-row>
              <v-col
                cols="12"
                sm="6"
              >
                <v-text-field
                  v-model.number="form.cleaning_duration"
                  :disabled="loading"
                  :error-messages="errors.get('cleaning_duration')"
                  hint="Typical cleaning time needed"
                  label="Cleaning Time (minutes)"
                  max="480"
                  min="30"
                  persistent-hint
                  prepend-inner-icon="mdi-clock"
                  required
                  :rules="durationRules"
                  step="15"
                  type="number"
                  variant="filled"
                />
              </v-col>

              <v-col
                cols="12"
                sm="6"
              >
                <v-select
                  v-model="form.pricing_tier"
                  :disabled="loading"
                  :error-messages="errors.get('pricing_tier')"
                  hint="Determines service level"
                  :items="pricingTierItems"
                  label="Service Level"
                  persistent-hint
                  prepend-inner-icon="mdi-star"
                  required
                  :rules="pricingTierRules"
                  variant="filled"
                />
              </v-col>
            </v-row>

            <!-- Special Instructions -->
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="form.special_instructions"
                  :counter="500"
                  :disabled="loading"
                  :error-messages="errors.get('special_instructions')"
                  hint="Any special cleaning requirements, access instructions, or notes"
                  label="Special Instructions (Optional)"
                  persistent-hint
                  prepend-inner-icon="mdi-note-text"
                  rows="3"
                  variant="filled"
                />
              </v-col>
            </v-row>

            <!-- Active Status -->
            <v-row>
              <v-col cols="12">
                <v-checkbox
                  v-model="form.active"
                  :disabled="loading"
                  :error-messages="errors.get('active')"
                  hint="Inactive properties won't appear in booking options"
                  label="Property is active for bookings"
                  persistent-hint
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
          :disabled="!formValid || loading"
          :loading="loading"
          variant="elevated"
          @click="handleSubmit"
        >
          <v-icon
            v-if="!isOnline"
            class="mr-2"
          >
            mdi-cloud-sync
          </v-icon>
          {{ isOnline ? submitButtonText : `Queue ${props.mode === 'create' ? 'Create' : 'Update'}` }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { PricingTier, Property, PropertyFormData } from '@/types/property'
  import { computed, nextTick, ref, watch } from 'vue'
  import { usePWA } from '@/composables/shared/usePWA'
  import { mapLegacyPropertyColor, PROPERTY_COLORS } from '@/utils/constants'

  // Props
  interface Props {
    modelValue: boolean
    mode: 'create' | 'edit'
    property?: Property | null
    loading?: boolean
    errors?: Map<string, string[]>
  }

  const props = withDefaults(defineProps<Props>(), {
    property: null,
    loading: false,
    errors: () => new Map(),
  })

  // Emits
  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'submit', data: PropertyFormData): void
    (e: 'close'): void
  }

  const emit = defineEmits<Emits>()

  // PWA composable for online status
  const { isOnline } = usePWA()

  // Reactive data
  const formRef = ref()
  const formValid = ref(false)

  // Form data
  const form = ref<PropertyFormData>({
    owner_id: '',
    address_street: '',
    address_unit: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    bedrooms: undefined,
    bathrooms: undefined,
    square_feet: undefined,
    property_type: undefined,
    cleaning_duration: 120,
    special_instructions: '',
    pricing_tier: 'standard',
    active: true,
    color: PROPERTY_COLORS[0],
  })

  // Computed properties
  const isOpen = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
  })

  const formTitle = computed(() => {
    return props.mode === 'create' ? 'Add New Property' : 'Edit Property'
  })

  const submitButtonText = computed(() => {
    return props.mode === 'create' ? 'Add Property' : 'Update Property'
  })

  // Form options
  const propertyTypeItems = [
    { title: 'Apartment', value: 'apartment' },
    { title: 'House', value: 'house' },
    { title: 'Condo', value: 'condo' },
    { title: 'Townhouse', value: 'townhouse' },
  ]

  const pricingTierItems = [
    { title: 'Basic Service', value: 'basic' },
    { title: 'Standard Service', value: 'standard' },
    { title: 'Premium Service', value: 'premium' },
    { title: 'Luxury Service', value: 'luxury' },
  ]

  // Validation rules
  const streetRules = [
    (v: string) => !!v || 'Street address is required',
    (v: string) => (v && v.length <= 150) || 'Street must be less than 150 characters',
  ]

  const cityRules = [
    (v: string) => !!v || 'City is required',
    (v: string) => (v && v.length <= 100) || 'City must be less than 100 characters',
  ]

  const stateRules = [
    (v: string) => !!v || 'State is required',
    (v: string) => (v && v.length <= 50) || 'State must be less than 50 characters',
  ]

  const zipRules = [
    (v: string) => !!v || 'ZIP code is required',
    (v: string) => /^\d{5}(-\d{4})?$/.test(v) || 'Enter a valid ZIP code (e.g. 78701)',
  ]

  const durationRules = [
    (v: number) => !!v || 'Cleaning duration is required',
    (v: number) => v >= 30 || 'Minimum cleaning time is 30 minutes',
    (v: number) => v <= 480 || 'Maximum cleaning time is 8 hours',
  ]

  const pricingTierRules = [
    (v: PricingTier) => !!v || 'Service level is required',
  ]

  // Methods
  function resetForm () {
    form.value = {
      owner_id: '',
      address_street: '',
      address_unit: '',
      address_city: '',
      address_state: '',
      address_zip: '',
      bedrooms: undefined,
      bathrooms: undefined,
      square_feet: undefined,
      property_type: undefined,
      cleaning_duration: 120,
      special_instructions: '',
      pricing_tier: 'standard',
      active: true,
      color: PROPERTY_COLORS[0],
    }

    if (formRef.value) {
      formRef.value.resetValidation()
    }
  }

  function populateForm (property: Property) {
    form.value = {
      owner_id: property.owner_id,
      address_street: property.address_street,
      address_unit: property.address_unit || '',
      address_city: property.address_city,
      address_state: property.address_state,
      address_zip: property.address_zip,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      square_feet: property.square_feet,
      property_type: property.property_type,
      cleaning_duration: property.cleaning_duration,
      special_instructions: property.special_instructions || '',
      pricing_tier: property.pricing_tier,
      active: property.active,
      color: mapLegacyPropertyColor(property.color),
    }
  }

  async function handleSubmit () {
    if (!formRef.value) return

    const { valid } = await formRef.value.validate()
    if (!valid) return

    emit('submit', { ...form.value })
  }

  function handleClose () {
    emit('close')
    emit('update:modelValue', false)
  }

  // Watchers
  watch(() => props.modelValue, newValue => {
    if (newValue) {
      if (props.mode === 'edit' && props.property) {
        populateForm(props.property)
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

  watch(() => props.property, newProperty => {
    if (newProperty && props.mode === 'edit') {
      populateForm(newProperty)
    }
  })
</script>
