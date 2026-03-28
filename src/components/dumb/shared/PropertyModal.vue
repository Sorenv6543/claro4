<template>
  <v-dialog
    v-model="isOpen"
    max-height="90vh"
    max-width="700px"
    persistent
    scrollable
    @keydown.esc="handleClose"
  >
    <v-card class="modal-card">
      <v-card-title class="text-h5 pb-2 shrink-0">
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
      </v-card-title>

      <v-divider />

      <!-- TWO-STEP CREATION FLOW -->
      <template v-if="stepper && mode === 'create'">
        <v-stepper v-model="currentStep" flat>
          <v-stepper-header>
            <v-stepper-item
              :complete="currentStep === '2'"
              title="Property Details"
              value="1"
            />
            <v-divider />
            <v-stepper-item
              title="Cleaning Settings"
              value="2"
            />
          </v-stepper-header>

          <v-stepper-window>
            <!-- Step 1: Address, bedrooms, bathrooms, color -->
            <v-stepper-window-item value="1">
              <v-card-text class="modal-content">
                <v-form
                  ref="step1FormRef"
                  v-model="step1Valid"
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
                          variant="outlined"
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
                          variant="outlined"
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
                          variant="outlined"
                        />
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="6" sm="6">
                        <v-text-field
                          v-model="form.address_state"
                          :disabled="loading"
                          :error-messages="errors.get('address_state')"
                          label="State"
                          placeholder="TX"
                          prepend-inner-icon="mdi-map-marker"
                          required
                          :rules="stateRules"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="6" sm="6">
                        <v-text-field
                          v-model="form.address_zip"
                          :disabled="loading"
                          :error-messages="errors.get('address_zip')"
                          label="ZIP Code"
                          placeholder="78701"
                          prepend-inner-icon="mdi-mailbox"
                          required
                          :rules="zipRules"
                          variant="outlined"
                        />
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="6">
                        <v-text-field
                          v-model.number="form.bedrooms"
                          :disabled="loading"
                          label="Bedrooms"
                          min="0"
                          prepend-inner-icon="mdi-bed"
                          type="number"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model.number="form.bathrooms"
                          :disabled="loading"
                          label="Bathrooms"
                          min="0"
                          prepend-inner-icon="mdi-shower"
                          type="number"
                          variant="outlined"
                        />
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12">
                        <div class="text-body-2 mb-2">
                          Property Color
                        </div>
                        <PropertyColorPicker :model-value="form.color ?? PROPERTY_COLORS[0]" @update:model-value="form.color = $event" />
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
                  color="primary"
                  :disabled="loading"
                  :loading="loading"
                  variant="text"
                  @click="handleNextStep"
                >
                  Next
                </v-btn>
              </v-card-actions>
            </v-stepper-window-item>

            <!-- Step 2: property_type, cleaning_duration, pricing_tier -->
            <v-stepper-window-item value="2">
              <v-card-text class="modal-content">
                <v-form
                  ref="step2FormRef"
                  v-model="step2Valid"
                  @submit.prevent="handleSubmit"
                >
                  <v-container>
                    <!-- Property Type -->
                    <v-row>
                      <v-col cols="12">
                        <v-select
                          v-model="form.property_type"
                          :disabled="loading"
                          :items="propertyTypeItems"
                          label="Property Type"
                          prepend-inner-icon="mdi-home-city"
                          variant="outlined"
                        />
                      </v-col>
                    </v-row>

                    <!-- Cleaning Duration and Pricing Tier -->
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model.number="form.cleaning_duration"
                          :disabled="loading"
                          :error-messages="errors.get('cleaning_duration')"
                          hint="Time required for standard cleaning"
                          label="Cleaning Duration (minutes)"
                          min="1"
                          persistent-hint
                          prepend-inner-icon="mdi-clock-outline"
                          required
                          :rules="durationRules"
                          type="number"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="form.pricing_tier"
                          :disabled="loading"
                          :error-messages="errors.get('pricing_tier')"
                          hint="Determines pricing and service level"
                          :items="pricingTierItems"
                          label="Pricing Tier"
                          persistent-hint
                          prepend-inner-icon="mdi-currency-usd"
                          required
                          :rules="pricingTierRules"
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
                  @click="currentStep = '1'"
                >
                  Back
                </v-btn>
                <v-spacer />
                <v-btn
                  :disabled="loading"
                  variant="text"
                  @click="handleSkip"
                >
                  Skip for now
                </v-btn>
                <v-btn
                  color="primary"
                  :disabled="!step2Valid || loading"
                  :loading="loading"
                  variant="text"
                  @click="handleSubmit"
                >
                  Save
                </v-btn>
              </v-card-actions>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>
      </template>

      <!-- SINGLE-FORM (edit mode or stepper=false) -->
      <template v-else>
        <v-card-text class="modal-content">
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
                    variant="outlined"
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
                    variant="outlined"
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
                    variant="outlined"
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="6" sm="6">
                  <v-text-field
                    v-model="form.address_state"
                    :disabled="loading"
                    :error-messages="errors.get('address_state')"
                    label="State"
                    placeholder="TX"
                    prepend-inner-icon="mdi-map-marker"
                    required
                    :rules="stateRules"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="6" sm="6">
                  <v-text-field
                    v-model="form.address_zip"
                    :disabled="loading"
                    :error-messages="errors.get('address_zip')"
                    label="ZIP Code"
                    placeholder="78701"
                    prepend-inner-icon="mdi-mailbox"
                    required
                    :rules="zipRules"
                    variant="outlined"
                  />
                </v-col>
              </v-row>

              <!-- Cleaning Duration and Pricing Tier -->
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model.number="form.cleaning_duration"
                    :disabled="loading"
                    :error-messages="errors.get('cleaning_duration')"
                    hint="Time required for standard cleaning"
                    label="Cleaning Duration (minutes)"
                    min="1"
                    persistent-hint
                    prepend-inner-icon="mdi-clock-outline"
                    required
                    :rules="durationRules"
                    type="number"
                    variant="outlined"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-select
                    v-model="form.pricing_tier"
                    :disabled="loading"
                    :error-messages="errors.get('pricing_tier')"
                    hint="Determines pricing and service level"
                    :items="pricingTierItems"
                    label="Pricing Tier"
                    persistent-hint
                    prepend-inner-icon="mdi-currency-usd"
                    required
                    :rules="pricingTierRules"
                    variant="outlined"
                  />
                </v-col>
              </v-row>

              <!-- Special Instructions -->
              <v-row>
                <v-col cols="12">
                  <v-textarea
                    v-model="form.special_instructions"
                    :counter="1000"
                    :disabled="loading"
                    :error-messages="errors.get('special_instructions')"
                    hint="Any special cleaning requirements or notes"
                    label="Special Instructions"
                    persistent-hint
                    prepend-inner-icon="mdi-note-text"
                    rows="4"
                    variant="outlined"
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
                    hint="Inactive properties won't appear in booking calendars"
                    label="Active Property"
                    persistent-hint
                  />
                </v-col>
              </v-row>

              <!-- Color Picker -->
              <v-row>
                <v-col cols="12">
                  <div class="text-body-2 mb-2">
                    Property Color
                  </div>
                  <PropertyColorPicker :model-value="form.color ?? PROPERTY_COLORS[0]" @update:model-value="form.color = $event" />
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
            :disabled="!formValid || loading"
            :loading="loading"
            variant="text"
            @click="handleSubmit"
          >
            {{ submitButtonText }}
          </v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { VForm } from 'vuetify/components'
  import type { PricingTier, Property, PropertyFormData } from '@/types'
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import PropertyColorPicker from '@/components/dumb/owner/PropertyColorPicker.vue'
  import { useAuthStore } from '@/stores/auth'
  import { PROPERTY_COLORS } from '@/utils/constants'

  // PROPS & EMITS
  interface Props {
    open?: boolean
    mode?: 'create' | 'edit'
    property?: Property
    stepper?: boolean
    existingPropertyCount?: number
  }

  interface Emits {
    (e: 'close'): void
    (e: 'save' | 'skip', property: PropertyFormData): void
    (e: 'delete', id: string): void
  }

  const props = withDefaults(defineProps<Props>(), {
    open: false,
    mode: 'create',
    property: undefined,
    stepper: false,
    existingPropertyCount: 0,
  })

  const emit = defineEmits<Emits>()

  // STORES
  const authStore = useAuthStore()

  // FORM REFS
  const formRef = ref<VForm | null>(null)
  const step1FormRef = ref<VForm | null>(null)
  const step2FormRef = ref<VForm | null>(null)
  const formValid = ref<boolean>(false)
  const step1Valid = ref<boolean>(false)
  const step2Valid = ref<boolean>(false)
  const loading = ref<boolean>(false)
  const errors = ref<Map<string, string>>(new Map())

  // STEPPER STATE
  const currentStep = ref<string>('1')

  // FORM DATA
  const form = reactive<Partial<PropertyFormData>>({
    address_street: '',
    address_unit: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    cleaning_duration: 120, // Default to 2 hours
    pricing_tier: 'standard',
    special_instructions: '',
    active: true,
    owner_id: '', // Will be set by the parent component or from auth store
    color: PROPERTY_COLORS[0],
  })

  // COMPUTED PROPERTIES
  const isOpen = computed({
    get: () => props.open,
    set: (value: boolean) => {
      if (!value) emit('close')
    },
  })

  const formTitle = computed((): string => {
    return props.mode === 'create' ? 'Create Property' : 'Edit Property'
  })

  const submitButtonText = computed((): string => {
    return props.mode === 'create' ? 'Create' : 'Save'
  })

  // DROPDOWN OPTIONS
  const propertyTypeItems = [
    { title: 'House', value: 'house' },
    { title: 'Apartment', value: 'apartment' },
    { title: 'Condo', value: 'condo' },
    { title: 'Townhouse', value: 'townhouse' },
  ]

  const pricingTierItems = [
    { title: 'Basic', value: 'basic', subtitle: 'Essential cleaning service' },
    { title: 'Standard', value: 'standard', subtitle: 'Standard cleaning service' },
    { title: 'Premium', value: 'premium', subtitle: 'Enhanced cleaning with additional services' },
    { title: 'Luxury', value: 'luxury', subtitle: 'Comprehensive premium cleaning package' },
  ]

  // VALIDATION RULES
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
    (v: number) => (v && v > 0) || 'Duration must be greater than 0',
    (v: number) => (v && v <= 480) || 'Duration cannot exceed 8 hours (480 minutes)',
  ]

  const pricingTierRules = [
    (v: string) => !!v || 'Pricing tier is required',
    (v: string) => ['basic', 'standard', 'premium', 'luxury'].includes(v) || 'Invalid pricing tier',
  ]

  // METHODS
  // Reset form to default or to property data
  function resetForm (): void {
    errors.value.clear()
    currentStep.value = '1'

    if (props.mode === 'edit' && props.property) {
      // Populate form with existing property data
      Object.assign(form, {
        address_street: props.property.address_street,
        address_unit: props.property.address_unit || '',
        address_city: props.property.address_city,
        address_state: props.property.address_state,
        address_zip: props.property.address_zip,
        cleaning_duration: props.property.cleaning_duration,
        pricing_tier: props.property.pricing_tier,
        special_instructions: props.property.special_instructions || '',
        active: props.property.active,
        owner_id: props.property.owner_id,
        color: props.property.color || PROPERTY_COLORS[0],
      })
    } else {
      // Reset to defaults for create mode
      // Auto-assign color based on how many properties the owner has (cycling)
      const assignedColor = PROPERTY_COLORS[props.existingPropertyCount % PROPERTY_COLORS.length]
      Object.assign(form, {
        address_street: '',
        address_unit: '',
        address_city: '',
        address_state: '',
        address_zip: '',
        cleaning_duration: 120,
        pricing_tier: 'standard',
        special_instructions: '',
        active: true,
        owner_id: authStore.user?.id || '',
        color: assignedColor,
      })
    }
  }

  // Validate full form
  async function validate (): Promise<boolean> {
    errors.value.clear()

    if (!formRef.value) return false

    const { valid } = await formRef.value.validate()
    if (!valid) return false

    // Additional validation
    if (!form.address_street || String(form.address_street).trim() === '') {
      errors.value.set('address_street', 'Street address cannot be empty')
      return false
    }

    if (!form.address_city || String(form.address_city).trim() === '') {
      errors.value.set('address_city', 'City cannot be empty')
      return false
    }

    if (!form.address_state || String(form.address_state).trim() === '') {
      errors.value.set('address_state', 'State cannot be empty')
      return false
    }

    if (!form.address_zip || String(form.address_zip).trim() === '') {
      errors.value.set('address_zip', 'ZIP code cannot be empty')
      return false
    }

    if (!form.cleaning_duration || Number(form.cleaning_duration) <= 0) {
      errors.value.set('cleaning_duration', 'Cleaning duration must be greater than 0')
      return false
    }

    if (!form.pricing_tier || !['basic', 'standard', 'premium', 'luxury'].includes(String(form.pricing_tier))) {
      errors.value.set('pricing_tier', 'Invalid pricing tier')
      return false
    }

    // All validation passed
    return true
  }

  // Validate step 1 fields only
  async function validateStep1 (): Promise<boolean> {
    if (!step1FormRef.value) return false
    const { valid } = await step1FormRef.value.validate()
    return valid
  }

  // Handle advancing to step 2
  async function handleNextStep (): Promise<void> {
    loading.value = true
    try {
      const valid = await validateStep1()
      if (valid) {
        currentStep.value = '2'
      }
    } finally {
      loading.value = false
    }
  }

  // Build the property data payload
  function buildPropertyData (): PropertyFormData {
    return {
      address_street: form.address_street!,
      address_unit: form.address_unit || '',
      address_city: form.address_city!,
      address_state: form.address_state!,
      address_zip: form.address_zip!,
      cleaning_duration: form.cleaning_duration!,
      pricing_tier: form.pricing_tier as PricingTier,
      special_instructions: form.special_instructions,
      active: form.active!,
      owner_id: form.owner_id || authStore.user?.id || '',
      color: form.color || PROPERTY_COLORS[0],
    }
  }

  // Handle form submission
  async function handleSubmit (): Promise<void> {
    loading.value = true

    try {
      // For stepper create mode, validate step 2 form
      if (props.stepper && props.mode === 'create') {
        if (!step2FormRef.value) {
          loading.value = false
          return
        }
        const { valid } = await step2FormRef.value.validate()
        if (!valid) {
          loading.value = false
          return
        }
        // Ensure required fields are present
        if (!form.address_street || !form.address_city || !form.address_state || !form.address_zip || !form.cleaning_duration || !form.pricing_tier || form.active === undefined) {
          errors.value.set('form', 'Please fill in all required fields')
          loading.value = false
          return
        }
        emit('save', buildPropertyData())
        loading.value = false
        resetForm()
        isOpen.value = false
        return
      }

      const isValid = await validate()
      if (!isValid) {
        loading.value = false
        return
      }

      // Ensure all required fields are present
      if (!form.address_street || !form.address_city || !form.address_state || !form.address_zip || !form.cleaning_duration || !form.pricing_tier || form.active === undefined) {
        errors.value.set('form', 'Please fill in all required fields')
        loading.value = false
        return
      }

      // Emit save event with property data
      emit('save', buildPropertyData())

      // Reset and close (parent component will handle actual saving)
      loading.value = false
      resetForm()
      isOpen.value = false
    } catch (error) {
      console.error('Error submitting form:', error)
      errors.value.set('form', error instanceof Error ? error.message : 'An error occurred')
      loading.value = false
    }
  }

  // Handle "Skip for now" — emit skip with defaults for step 2 fields
  function handleSkip (): void {
    const skipData: PropertyFormData = {
      address_street: form.address_street!,
      address_unit: form.address_unit || '',
      address_city: form.address_city!,
      address_state: form.address_state!,
      address_zip: form.address_zip!,
      cleaning_duration: 120,
      pricing_tier: 'standard' as PricingTier,
      special_instructions: form.special_instructions,
      active: form.active ?? true,
      owner_id: form.owner_id || authStore.user?.id || '',
      color: form.color || PROPERTY_COLORS[0],
    }
    emit('skip', skipData)
    resetForm()
    isOpen.value = false
  }

  // Handle property deletion
  function handleDelete (): void {
    if (props.mode !== 'edit' || !props.property) return

    loading.value = true
    emit('delete', props.property.id)

    // Parent component will handle actual deletion
    loading.value = false
    isOpen.value = false
  }

  // Handle modal close
  function handleClose (): void {
    resetForm()
    emit('close')
  }

  // LIFECYCLE HOOKS
  onMounted(() => {
    resetForm()
  })

  // WATCHERS
  watch(() => props.open, newValue => {
    if (newValue) {
      resetForm()
    }
  })

  watch(() => props.property, () => {
    if (props.open && props.mode === 'edit') {
      resetForm()
    }
  })
</script>

<style scoped>
/* Dialog theming */
:deep(.v-dialog .v-card) {
  background: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
}

/* Card title theming */
:deep(.v-card-title) {
  background: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
}

/* Form field theming */
:deep(.v-field) {
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

:deep(.v-field:hover) {
  border-color: rgba(var(--v-theme-primary), 0.5) !important;
}

:deep(.v-field--focused) {
  border-color: rgb(var(--v-theme-primary)) !important;
}

:deep(.v-field__input) {
  color: rgb(var(--v-theme-on-surface)) !important;
}

:deep(.v-label) {
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}

:deep(.v-label--active) {
  color: rgb(var(--v-theme-primary)) !important;
}

/* Select menu theming */
:deep(.v-select__selection) {
  color: rgb(var(--v-theme-on-surface)) !important;
}

:deep(.v-list) {
  background: rgb(var(--v-theme-surface)) !important;
}

:deep(.v-list-item) {
  color: rgb(var(--v-theme-on-surface)) !important;
}

:deep(.v-list-item:hover) {
  background: rgba(var(--v-theme-primary), 0.08) !important;
}

/* Button theming */
:deep(.v-btn) {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

:deep(.v-btn--variant-elevated),
:deep(.v-btn--variant-flat) {
  background: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
}

:deep(.v-btn--variant-outlined) {
  border-color: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-primary)) !important;
}

:deep(.v-btn--variant-text) {
  color: rgb(var(--v-theme-primary)) !important;
}

:deep(.v-btn.text-error) {
  color: rgb(var(--v-theme-error)) !important;
}

:deep(.v-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.3);
}

/* Icon theming */
:deep(.v-icon) {
  color: rgb(var(--v-theme-on-surface)) !important;
}

:deep(.v-btn .v-icon) {
  color: inherit !important;
}

/* Switch theming */
:deep(.v-switch .v-selection-control__input) {
  color: rgb(var(--v-theme-primary)) !important;
}

/* Error message theming */
:deep(.v-messages__message) {
  color: rgb(var(--v-theme-error)) !important;
}

/* Divider theming */
:deep(.v-divider) {
  border-color: rgba(var(--v-theme-on-surface), 0.12) !important;
}

/* Modal viewport constraints */
.modal-card {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-content {
  overflow-y: auto;
  flex: 1;
  max-height: calc(90vh - 120px); /* Subtract header and footer space */
}
</style>
