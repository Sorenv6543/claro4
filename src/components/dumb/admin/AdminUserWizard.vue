<template>
  <v-dialog v-model="dialogOpen" max-width="700" persistent>
    <MaterioFormWizard
      v-model="currentStep"
      :steps="steps"
      :submit-loading="loading"
      submit-text="Create User"
      @submit="handleSubmit"
    >
      <!-- Step 0: Account Details -->
      <template #step-0>
        <v-form ref="step1FormRef" v-model="step1Valid">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="form.email"
                label="Email Address"
                placeholder="user@example.com"
                prepend-inner-icon="mdi-email-outline"
                :rules="emailRules"
                type="email"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="form.displayName"
                label="Display Name"
                placeholder="Jane Smith"
                prepend-inner-icon="mdi-account-outline"
                :rules="nameRules"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-select
                v-model="form.role"
                :items="roleOptions"
                label="Role"
                prepend-inner-icon="mdi-shield-account-outline"
                :rules="roleRules"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-form>
      </template>

      <!-- Step 1: Profile Info -->
      <template #step-1>
        <v-form ref="step2FormRef" v-model="step2Valid">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="form.phone"
                label="Phone Number"
                placeholder="+1 (555) 123-4567"
                prepend-inner-icon="mdi-phone-outline"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="form.company"
                label="Company / Organization"
                placeholder="Acme Rentals LLC"
                prepend-inner-icon="mdi-domain"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-textarea
                v-model="form.notes"
                label="Notes"
                placeholder="Any additional notes about this user..."
                prepend-inner-icon="mdi-note-text-outline"
                rows="3"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-form>
      </template>

      <!-- Step 2: Review -->
      <template #step-2>
        <v-card class="pa-4" variant="outlined">
          <div class="text-caption text-uppercase text-medium-emphasis mb-3">Account Summary</div>

          <v-list class="bg-transparent" density="compact">
            <v-list-item>
              <template #prepend>
                <v-icon class="mr-3" size="20">mdi-email-outline</v-icon>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">Email</v-list-item-title>
              <v-list-item-subtitle>{{ form.email || '(not provided)' }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon class="mr-3" size="20">mdi-account-outline</v-icon>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">Display Name</v-list-item-title>
              <v-list-item-subtitle>{{ form.displayName || '(not provided)' }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon class="mr-3" size="20">mdi-shield-account-outline</v-icon>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">Role</v-list-item-title>
              <v-list-item-subtitle class="text-capitalize">{{ form.role || '(not selected)' }}</v-list-item-subtitle>
            </v-list-item>

            <v-divider class="my-2" />

            <v-list-item v-if="form.phone">
              <template #prepend>
                <v-icon class="mr-3" size="20">mdi-phone-outline</v-icon>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">Phone</v-list-item-title>
              <v-list-item-subtitle>{{ form.phone }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="form.company">
              <template #prepend>
                <v-icon class="mr-3" size="20">mdi-domain</v-icon>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">Company</v-list-item-title>
              <v-list-item-subtitle>{{ form.company }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="form.notes">
              <template #prepend>
                <v-icon class="mr-3" size="20">mdi-note-text-outline</v-icon>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">Notes</v-list-item-title>
              <v-list-item-subtitle class="text-wrap">{{ form.notes }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </template>
    </MaterioFormWizard>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { VForm } from 'vuetify/components'
  import { computed, reactive, ref, watch } from 'vue'
  import MaterioFormWizard from '@/components/dumb/shared/MaterioFormWizard.vue'

  export interface UserFormData {
    email: string
    displayName: string
    role: 'owner' | 'admin' | ''
    phone: string
    company: string
    notes: string
  }

  const props = defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'created': [data: UserFormData]
  }>()

  const dialogOpen = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
  })

  const currentStep = ref(0)
  const loading = ref(false)

  const step1FormRef = ref<VForm | null>(null)
  const step2FormRef = ref<VForm | null>(null)
  const step1Valid = ref(false)
  const step2Valid = ref(false)

  const steps = [
    { title: 'Account Details', subtitle: 'Email, role & display name' },
    { title: 'Profile Info', subtitle: 'Phone, company & notes' },
    { title: 'Review', subtitle: 'Confirm and create user' },
  ]

  const form = reactive<UserFormData>({
    email: '',
    displayName: '',
    role: '',
    phone: '',
    company: '',
    notes: '',
  })

  const roleOptions = [
    { title: 'Property Owner', value: 'owner' },
    { title: 'Admin', value: 'admin' },
  ]

  // Validation rules
  const emailRules = [
    (v: string) => !!v || 'Email is required',
    (v: string) => /.+@.+\..+/.test(v) || 'Enter a valid email address',
  ]

  const nameRules = [
    (v: string) => !!v || 'Display name is required',
    (v: string) => (v && v.length >= 2) || 'Name must be at least 2 characters',
  ]

  const roleRules = [
    (v: string) => !!v || 'Role is required',
  ]

  function resetForm () {
    currentStep.value = 0
    Object.assign(form, {
      email: '',
      displayName: '',
      role: '',
      phone: '',
      company: '',
      notes: '',
    })
  }

  async function handleSubmit () {
    loading.value = true
    try {
      emit('created', { ...form })
      resetForm()
      dialogOpen.value = false
    } finally {
      loading.value = false
    }
  }

  // Reset form when dialog opens
  watch(() => props.modelValue, newVal => {
    if (newVal) {
      resetForm()
    }
  })
</script>
