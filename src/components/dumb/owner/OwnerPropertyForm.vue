<template>
  <v-dialog
    v-model="isOpen"
    max-width="600px"
    persistent
    @keydown.esc="handleClose"
  >
    <v-card>
      <v-card-title class="text-h5 pb-2">
        {{ formTitle }}
        <v-chip
          v-if="form.active"
          color="success"
          size="small"
          class="ml-2"
        >
          ACTIVE
        </v-chip>
        <v-chip
          v-else
          color="grey"
          size="small"
          class="ml-2"
        >
          INACTIVE
        </v-chip>
        
        <!-- Offline indicator -->
        <v-chip
          v-if="!isOnline"
          color="warning"
          size="small"
          class="ml-2"
          prepend-icon="mdi-wifi-off"
        >
          OFFLINE MODE
        </v-chip>
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
                  label="Street Address"
                  :rules="streetRules"
                  required
                  variant="outlined"
                  :disabled="loading"
                  :error-messages="errors.get('address_street')"
                  placeholder="123 Main St"
                  prepend-inner-icon="mdi-home"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="form.address_unit"
                  label="Unit / Apt"
                  variant="outlined"
                  :disabled="loading"
                  :error-messages="errors.get('address_unit')"
                  placeholder="Apt 4B"
                  prepend-inner-icon="mdi-door"
                />
              </v-col>
              <v-col cols="12" sm="8">
                <v-text-field
                  v-model="form.address_city"
                  label="City"
                  :rules="cityRules"
                  required
                  variant="outlined"
                  :disabled="loading"
                  :error-messages="errors.get('address_city')"
                  prepend-inner-icon="mdi-city"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="form.address_state"
                  label="State"
                  :rules="stateRules"
                  required
                  variant="outlined"
                  :disabled="loading"
                  :error-messages="errors.get('address_state')"
                  placeholder="TX"
                  prepend-inner-icon="mdi-map-marker"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="form.address_zip"
                  label="ZIP Code"
                  :rules="zipRules"
                  required
                  variant="outlined"
                  :disabled="loading"
                  :error-messages="errors.get('address_zip')"
                  placeholder="78701"
                  prepend-inner-icon="mdi-mailbox"
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
                  label="Bedrooms"
                  type="number"
                  min="0"
                  max="20"
                  variant="outlined"
                  :disabled="loading"
                  :error-messages="errors.get('bedrooms')"
                  hint="Number of bedrooms"
                  persistent-hint
                  prepend-inner-icon="mdi-bed"
                />
              </v-col>
              
              <v-col
                cols="6"
                sm="4"
              >
                <v-text-field
                  v-model.number="form.bathrooms"
                  label="Bathrooms"
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  variant="outlined"
                  :disabled="loading"
                  :error-messages="errors.get('bathrooms')"
                  hint="Number of bathrooms"
                  persistent-hint
                  prepend-inner-icon="mdi-shower"
                />
              </v-col>
              
              <v-col
                cols="12"
                sm="4"
              >
                <v-select
                  v-model="form.property_type"
                  :items="propertyTypeItems"
                  label="Property Type"
                  variant="outlined"
                  :disabled="loading"
                  :error-messages="errors.get('property_type')"
                  hint="Type of property"
                  persistent-hint
                  prepend-inner-icon="mdi-home-variant"
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
                  label="Cleaning Time (minutes)"
                  type="number"
                  min="30"
                  max="480"
                  step="15"
                  :rules="durationRules"
                  required
                  variant="outlined"
                  :disabled="loading"
                  :error-messages="errors.get('cleaning_duration')"
                  hint="Typical cleaning time needed"
                  persistent-hint
                  prepend-inner-icon="mdi-clock"
                />
              </v-col>
              
              <v-col
                cols="12"
                sm="6"
              >
                <v-select
                  v-model="form.pricing_tier"
                  :items="pricingTierItems"
                  label="Service Level"
                  :rules="pricingTierRules"
                  required
                  variant="outlined"
                  :disabled="loading"
                  :error-messages="errors.get('pricing_tier')"
                  hint="Determines service level"
                  persistent-hint
                  prepend-inner-icon="mdi-star"
                />
              </v-col>
            </v-row>
            
            <!-- Special Instructions -->
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="form.special_instructions"
                  label="Special Instructions (Optional)"
                  variant="outlined"
                  :disabled="loading"
                  :error-messages="errors.get('special_instructions')"
                  hint="Any special cleaning requirements, access instructions, or notes"
                  persistent-hint
                  :counter="500"
                  rows="3"
                  prepend-inner-icon="mdi-note-text"
                />
              </v-col>
            </v-row>
            
            <!-- Active Status -->
            <v-row>
              <v-col cols="12">
                <v-checkbox
                  v-model="form.active"
                  label="Property is active for bookings"
                  :disabled="loading"
                  :error-messages="errors.get('active')"
                  hint="Inactive properties won't appear in booking options"
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
          variant="text"
          :disabled="loading"
          @click="handleClose"
        >
          Cancel
        </v-btn>
        
        <v-spacer />
        
        <v-btn
          color="primary"
          variant="elevated"
          :disabled="!formValid || loading"
          :loading="loading"
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
import { ref, computed, watch, nextTick } from 'vue'
import type { Property, PropertyFormData, PricingTier } from '@/types/property'
import { usePWA } from '@/composables/shared/usePWA'

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
  errors: () => new Map()
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: PropertyFormData): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

// PWA composable for offline sync
const { isOnline, backgroundSync } = usePWA()

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
  active: true
})

// Computed properties
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
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
  { title: 'Townhouse', value: 'townhouse' }
]

const pricingTierItems = [
  { title: 'Basic Service', value: 'basic' },
  { title: 'Standard Service', value: 'standard' },
  { title: 'Premium Service', value: 'premium' },
  { title: 'Luxury Service', value: 'luxury' }
]

// Validation rules
const streetRules = [
  (v: string) => !!v || 'Street address is required',
  (v: string) => (v && v.length <= 150) || 'Street must be less than 150 characters'
]

const cityRules = [
  (v: string) => !!v || 'City is required',
  (v: string) => (v && v.length <= 100) || 'City must be less than 100 characters'
]

const stateRules = [
  (v: string) => !!v || 'State is required',
  (v: string) => (v && v.length <= 50) || 'State must be less than 50 characters'
]

const zipRules = [
  (v: string) => !!v || 'ZIP code is required',
  (v: string) => /^\d{5}(-\d{4})?$/.test(v) || 'Enter a valid ZIP code (e.g. 78701)'
]

const durationRules = [
  (v: number) => !!v || 'Cleaning duration is required',
  (v: number) => v >= 30 || 'Minimum cleaning time is 30 minutes',
  (v: number) => v <= 480 || 'Maximum cleaning time is 8 hours'
]

const pricingTierRules = [
  (v: PricingTier) => !!v || 'Service level is required'
]

// Methods
const resetForm = () => {
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
    active: true
  }
  
  if (formRef.value) {
    formRef.value.resetValidation()
  }
}

const populateForm = (property: Property) => {
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
    active: property.active
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  const { valid } = await formRef.value.validate()
  if (!valid) return
  
  // If offline, queue the operation for background sync
  if (!isOnline.value) {
    const operation = props.mode === 'create' ? 'create_property' : 'update_property'
    const data = props.mode === 'edit' && props.property 
      ? { id: props.property.id, ...form.value }
      : form.value
    
    backgroundSync.queueOperation(
      operation,
      data,
      String(form.value.owner_id || 'current-user'), // TODO: Get from auth
      'owner'
    )
    
    // Show offline confirmation
    console.log(`Property ${props.mode} queued for sync when online`)
    handleClose()
    return
  }
  
  emit('submit', { ...form.value })
}

const handleClose = () => {
  emit('close')
  emit('update:modelValue', false)
}

// Watchers
watch(() => props.modelValue, (newValue) => {
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

watch(() => props.property, (newProperty) => {
  if (newProperty && props.mode === 'edit') {
    populateForm(newProperty)
  }
})
</script>

<style scoped>
.v-card-title {
  background-color: rgb(var(--v-theme-surface-variant));
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