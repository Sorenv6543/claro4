<template>
  <v-dialog
    max-width="600px"
    :model-value="modelValue"
    persistent
    scrollable
    @update:model-value="updateModelValue"
  >
    <v-card>
      <v-card-title class="d-flex align-center pa-6 pb-4">
        <v-icon
          class="me-3"
          :icon="isEditing ? 'mdi-account-edit' : 'mdi-account-plus'"
        />

        <span class="text-h5 font-weight-bold">
          {{ isEditing ? 'Edit User' : 'Create New User' }}
        </span>

        <v-spacer />

        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          @click="closeDialog"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <v-form
          ref="formRef"
          v-model="formValid"
          validate-on="submit"
          @submit.prevent="handleSubmit"
        >
          <!-- Personal Information Section -->
          <div class="mb-6">
            <h3 class="text-h6 font-weight-medium mb-4 text-primary">
              <v-icon
                class="me-2"
                icon="mdi-account"
              />
              Personal Information
            </h3>

            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.name"
                  density="comfortable"
                  :error-messages="errors.name"
                  label="Full Name *"
                  prepend-inner-icon="mdi-account"
                  :rules="[rules.required, rules.minLength(2)]"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="formData.email"
                  density="comfortable"
                  :disabled="isEditing"
                  :error-messages="errors.email"
                  :hint="isEditing ? 'Email cannot be changed after creation' : ''"
                  label="Email Address *"
                  :persistent-hint="isEditing"
                  prepend-inner-icon="mdi-email"
                  :rules="[rules.required, rules.email]"
                  type="email"
                  variant="outlined"
                />
              </v-col>

              <v-col
                v-if="!isEditing"
                cols="12"
              >
                <v-text-field
                  v-model="formData.password"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  density="comfortable"
                  :error-messages="errors.password"
                  :hint="!isEditing ? 'Minimum 8 characters required' : ''"
                  label="Password *"
                  :persistent-hint="!isEditing"
                  prepend-inner-icon="mdi-lock"
                  :rules="isEditing ? [] : [rules.required, rules.minLength(8)]"
                  :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                  @click:append-inner="showPassword = !showPassword"
                />
              </v-col>

              <v-col
                v-if="!isEditing"
                cols="12"
              >
                <v-text-field
                  v-model="formData.confirmPassword"
                  :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  density="comfortable"
                  :error-messages="errors.confirmPassword"
                  label="Confirm Password *"
                  prepend-inner-icon="mdi-lock-check"
                  :rules="isEditing ? [] : [rules.required, rules.passwordMatch]"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  variant="outlined"
                  @click:append-inner="showConfirmPassword = !showConfirmPassword"
                />
              </v-col>
            </v-row>
          </div>

          <!-- Role and Access Section -->
          <div class="mb-6">
            <h3 class="text-h6 font-weight-medium mb-4 text-primary">
              <v-icon
                class="me-2"
                icon="mdi-shield-account"
              />
              Role and Access
            </h3>

            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="formData.role"
                  density="comfortable"
                  :error-messages="errors.role"
                  :items="roleOptions"
                  label="User Role *"
                  prepend-inner-icon="mdi-account-group"
                  :rules="[rules.required]"
                  variant="outlined"
                >
                  <template #item="{ props: itemProps, item }">
                    <v-list-item v-bind="itemProps">
                      <template #prepend>
                        <v-icon
                          :color="item.color"
                          :icon="item.icon"
                        />
                      </template>

                      <v-list-item-title>{{ item.title }}</v-list-item-title>
                      <v-list-item-subtitle>{{ item.description }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>

              <v-col
                v-if="formData.role === 'admin'"
                cols="12"
              >
                <v-select
                  v-model="formData.accessLevel"
                  density="comfortable"
                  hint="Controls what admin features this user can access"
                  :items="accessLevelOptions"
                  label="Access Level"
                  persistent-hint
                  prepend-inner-icon="mdi-security"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </div>

          <!-- Company Information Section -->
          <div
            v-if="formData.role === 'owner'"
            class="mb-6"
          >
            <h3 class="text-h6 font-weight-medium mb-4 text-primary">
              <v-icon
                class="me-2"
                icon="mdi-domain"
              />
              Company Information
            </h3>

            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.company_name"
                  density="comfortable"
                  :error-messages="errors.company_name"
                  label="Company Name"
                  prepend-inner-icon="mdi-office-building"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </div>

          <!-- Cleaner Information Section -->
          <div
            v-if="formData.role === 'cleaner'"
            class="mb-6"
          >
            <h3 class="text-h6 font-weight-medium mb-4 text-primary">
              <v-icon
                class="me-2"
                icon="mdi-broom"
              />
              Cleaner Information
            </h3>

            <v-row>
              <v-col cols="12">
                <v-combobox
                  v-model="formData.skills"
                  chips
                  density="comfortable"
                  hint="Select or type skills (press Enter to add custom skills)"
                  :items="availableSkills"
                  label="Skills"
                  multiple
                  persistent-hint
                  prepend-inner-icon="mdi-star"
                  variant="outlined"
                />
              </v-col>

              <v-col
                cols="12"
                sm="6"
              >
                <v-text-field
                  v-model.number="formData.max_daily_bookings"
                  density="comfortable"
                  :error-messages="errors.max_daily_bookings"
                  label="Max Daily Bookings"
                  max="20"
                  min="1"
                  prepend-inner-icon="mdi-calendar-today"
                  type="number"
                  variant="outlined"
                />
              </v-col>

              <v-col
                cols="12"
                sm="6"
              >
                <v-text-field
                  v-model="formData.location"
                  density="comfortable"
                  :error-messages="errors.location"
                  label="Service Location"
                  placeholder="City, State"
                  prepend-inner-icon="mdi-map-marker"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </div>

          <!-- User Preferences Section -->
          <div class="mb-6">
            <h3 class="text-h6 font-weight-medium mb-4 text-primary">
              <v-icon
                class="me-2"
                icon="mdi-cog"
              />
              User Preferences
            </h3>

            <v-row>
              <v-col
                cols="12"
                sm="6"
              >
                <v-select
                  v-model="formData.timezone"
                  density="comfortable"
                  :items="timezoneOptions"
                  label="Timezone"
                  prepend-inner-icon="mdi-clock"
                  variant="outlined"
                />
              </v-col>

              <v-col
                cols="12"
                sm="6"
              >
                <v-select
                  v-model="formData.language"
                  density="comfortable"
                  :items="languageOptions"
                  label="Language"
                  prepend-inner-icon="mdi-translate"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="formData.notifications_enabled"
                  color="primary"
                  hide-details
                  inset
                  label="Enable Email Notifications"
                />
              </v-col>
            </v-row>
          </div>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-6 pt-4">
        <v-spacer />

        <v-btn
          :disabled="loading"
          size="large"
          variant="outlined"
          @click="closeDialog"
        >
          Cancel
        </v-btn>

        <v-btn
          color="primary"
          :loading="loading"
          size="large"
          variant="elevated"

          @click="handleSubmit"
        >
          {{ isEditing ? 'Update User' : 'Create User' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { User, UserFormData, UserRole } from '@/types/user'
  import { nextTick, ref, watch } from 'vue'

  // Props and Emits
  interface Props {
    modelValue: boolean
    user?: User | null
    isEditing?: boolean
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    user: null,
    isEditing: false,
    loading: false,
  })

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'submit': [data: UserFormData]
  }>()

  // Form state
  const formRef = ref()
  const formValid = ref(false)
  const showPassword = ref(false)
  const showConfirmPassword = ref(false)

  // Form data
  const formData = ref({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'owner' as UserRole,
    company_name: '',
    accessLevel: 'full',
    skills: [] as string[],
    max_daily_bookings: 5,
    location: '',
    timezone: 'America/New_York',
    language: 'en',
    notifications_enabled: true,
  })

  // Error messages
  const errors = ref({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    company_name: '',
    max_daily_bookings: '',
    location: '',
  })

  // Options
  const roleOptions = [
    {
      title: 'Property Owner',
      value: 'owner',
      description: 'Manages properties and bookings',
      icon: 'mdi-home-account',
      color: 'primary',
    },
    {
      title: 'Administrator',
      value: 'admin',
      description: 'Full system access and user management',
      icon: 'mdi-shield-account',
      color: 'red',
    },
    {
      title: 'Cleaner',
      value: 'cleaner',
      description: 'Performs cleaning services',
      icon: 'mdi-broom',
      color: 'success',
    },
  ]

  const accessLevelOptions = [
    { title: 'Full Access', value: 'full' },
    { title: 'Limited Access', value: 'limited' },
  ]

  const availableSkills = [
    'Deep Cleaning',
    'Standard Cleaning',
    'Carpet Cleaning',
    'Window Cleaning',
    'Laundry Service',
    'Organization',
    'Green Cleaning',
    'Pet-Friendly Cleaning',
  ]

  const timezoneOptions = [
    { title: 'Eastern Time', value: 'America/New_York' },
    { title: 'Central Time', value: 'America/Chicago' },
    { title: 'Mountain Time', value: 'America/Denver' },
    { title: 'Pacific Time', value: 'America/Los_Angeles' },
  ]

  const languageOptions = [
    { title: 'English', value: 'en' },
    { title: 'Spanish', value: 'es' },
    { title: 'French', value: 'fr' },
  ]

  // Validation rules
  const rules = {
    required: (value: string) => !!value || 'This field is required',
    email: (value: string) => {
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return pattern.test(value) || 'Please enter a valid email address'
    },
    minLength: (min: number) => (value: string) =>
      value.length >= min || `Must be at least ${min} characters`,
    passwordMatch: (value: string) =>
      value === formData.value.password || 'Passwords do not match',
  }

  // Computed
  function updateModelValue (value: boolean) {
    emit('update:modelValue', value)
  }

  // Methods
  function closeDialog () {
    updateModelValue(false)
    resetForm()
  }

  function resetForm () {
    formData.value = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'owner',
      company_name: '',
      accessLevel: 'full',
      skills: [],
      max_daily_bookings: 5,
      location: '',
      timezone: 'America/New_York',
      language: 'en',
      notifications_enabled: true,
    }

    // Clear errors
    for (const key of Object.keys(errors.value)) {
      errors.value[key as keyof typeof errors.value] = ''
    }

    // Reset form validation
    nextTick(() => {
      formRef.value?.resetValidation()
    })
  }

  function loadUserData () {
    if (props.user && props.isEditing) {
      formData.value = {
        name: props.user.name || '',
        email: props.user.email || '',
        password: '',
        confirmPassword: '',
        role: props.user.role || 'owner',
        company_name: props.user.company_name || '',
        accessLevel: props.user.access_level || 'full',
        skills: props.user.skills || [],
        max_daily_bookings: props.user.max_daily_bookings || 5,
        location: props.user.location_lat && props.user.location_lng ? `${props.user.location_lat},${props.user.location_lng}` : '',
        timezone: props.user.timezone || 'America/New_York',
        language: props.user.language || 'en',
        notifications_enabled: props.user.notifications_enabled ?? true,
      }
    }
  }

  async function handleSubmit () {
    if (!formRef.value) return
    const { valid } = await formRef.value.validate()

    if (!valid) {
      return
    }

    emit('submit', {
      name: formData.value.name,
      email: formData.value.email,
      password: formData.value.password,
      role: formData.value.role,
      company_name: formData.value.company_name,
      access_level: formData.value.accessLevel,
      skills: formData.value.skills,
      max_daily_bookings: formData.value.max_daily_bookings,
      location: formData.value.location,
      timezone: formData.value.timezone,
      language: formData.value.language,
      notifications_enabled: formData.value.notifications_enabled,
    })
  }

  // Watchers
  watch(() => props.modelValue, newValue => {
    if (newValue) {
      loadUserData()
    } else {
      resetForm()
    }
  })
</script>
