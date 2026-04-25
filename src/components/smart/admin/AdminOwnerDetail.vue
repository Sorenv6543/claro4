<template>
  <div class="admin-owner-detail">
    <v-snackbar
      v-model="showSaveError"
      color="error"
      location="top"
      :timeout="6000"
    >
      {{ saveError }}
    </v-snackbar>

    <v-container
      class="pa-4 pa-md-6"
      fluid
    >
      <!-- Back nav -->
      <v-btn
        class="mb-4"
        prepend-icon="mdi-arrow-left"
        variant="text"
        @click="router.push('/admin/property-owners')"
      >
        All Owners
      </v-btn>

      <!-- Loading -->
      <div
        v-if="loading"
        class="d-flex justify-center pa-16"
      >
        <v-progress-circular
          color="primary"
          indeterminate
          size="48"
        />
      </div>

      <!-- Not found -->
      <v-alert
        v-else-if="!owner"
        type="error"
      >
        Owner not found.
      </v-alert>

      <!-- Content -->
      <template v-else>
        <v-row>
          <!-- Left column: Profile card -->
          <v-col
            cols="12"
            md="4"
          >
            <OwnerDetailCard
              :avatar-color="avatarColor"
              :owner="owner"
              :property-count="properties.length"
              @copy="copyToClipboard"
              @edit="showEditDialog = true"
            />
          </v-col>

          <!-- Right column: Properties -->
          <v-col
            cols="12"
            md="8"
          >
            <OwnerPropertyList
              editable
              :properties="properties"
              @add="openAddProperty"
              @delete-property="confirmDeleteProperty"
              @edit-property="openEditProperty"
            />
          </v-col>
        </v-row>
      </template>
    </v-container>

    <!-- Edit Owner Dialog -->
    <v-dialog
      v-model="showEditDialog"
      max-width="600"
      persistent
      scrollable
    >
      <v-card v-if="owner">
        <v-card-title class="d-flex align-center pa-6 pb-4">
          <v-icon
            class="me-2"
            icon="mdi-account-edit"
          />
          Edit Owner Profile
          <v-spacer />
          <v-btn
            icon="mdi-close"
            size="small"
            variant="text"
            @click="showEditDialog = false"
          />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-form
            ref="editFormRef"
            v-model="editFormValid"
          >
            <v-text-field
              v-model="editForm.name"
              class="mb-2"
              label="Full Name *"
              prepend-inner-icon="mdi-account-outline"
              :rules="[v => !!v || 'Name is required']"
            />
            <v-text-field
              v-model="editForm.email"
              class="mb-2"
              disabled
              hint="Email cannot be changed"
              label="Email"
              persistent-hint
              prepend-inner-icon="mdi-email-outline"
            />
            <v-text-field
              v-model="editForm.company_name"
              class="mb-2"
              label="Company Name"
              prepend-inner-icon="mdi-office-building-outline"
            />
            <v-row>
              <v-col
                cols="12"
                sm="6"
              >
                <v-select
                  v-model="editForm.timezone"
                  :items="timezoneOptions"
                  label="Timezone"
                  prepend-inner-icon="mdi-clock-outline"
                />
              </v-col>
              <v-col
                cols="12"
                sm="6"
              >
                <v-select
                  v-model="editForm.language"
                  :items="languageOptions"
                  label="Language"
                  prepend-inner-icon="mdi-translate"
                />
              </v-col>
            </v-row>
            <v-switch
              v-model="editForm.notifications_enabled"
              color="primary"
              hide-details
              inset
              label="Email Notifications"
            />
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            variant="outlined"
            @click="showEditDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!editFormValid"
            :loading="saving"
            @click="saveOwnerProfile"
          >
            Save Changes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add/Edit Property Dialog -->
    <v-dialog
      v-model="showPropertyDialog"
      max-width="600"
      persistent
      scrollable
    >
      <v-card>
        <v-card-title class="d-flex align-center pa-6 pb-4">
          <v-icon
            class="me-2"
            :icon="editingProperty ? 'mdi-home-edit-outline' : 'mdi-home-plus-outline'"
          />
          {{ editingProperty ? 'Edit Property' : 'Add Property' }}
          <v-spacer />
          <v-btn
            icon="mdi-close"
            size="small"
            variant="text"
            @click="showPropertyDialog = false"
          />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-form
            ref="propFormRef"
            v-model="propFormValid"
          >
            <v-text-field
              v-model="propForm.address_street"
              class="mb-2"
              label="Street Address *"
              prepend-inner-icon="mdi-map-marker-outline"
              :rules="[v => !!v || 'Street address is required']"
            />
            <v-text-field
              v-model="propForm.address_unit"
              class="mb-2"
              label="Unit / Apt"
              prepend-inner-icon="mdi-door"
            />
            <v-row>
              <v-col cols="12" sm="5">
                <v-text-field
                  v-model="propForm.address_city"
                  label="City *"
                  :rules="[v => !!v || 'City is required']"
                />
              </v-col>
              <v-col cols="6" sm="3">
                <v-text-field
                  v-model="propForm.address_state"
                  label="State *"
                  :rules="[v => !!v || 'State is required']"
                />
              </v-col>
              <v-col cols="6" sm="4">
                <v-text-field
                  v-model="propForm.address_zip"
                  label="ZIP *"
                  :rules="[v => !!v || 'ZIP is required']"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col
                cols="6"
                sm="3"
              >
                <v-text-field
                  v-model.number="propForm.bedrooms"
                  label="Beds"
                  min="0"
                  type="number"
                />
              </v-col>
              <v-col
                cols="6"
                sm="3"
              >
                <v-text-field
                  v-model.number="propForm.bathrooms"
                  label="Baths"
                  min="0"
                  type="number"
                />
              </v-col>
              <v-col
                cols="6"
                sm="3"
              >
                <v-text-field
                  v-model.number="propForm.square_feet"
                  label="Sq ft"
                  min="0"
                  type="number"
                />
              </v-col>
              <v-col
                cols="6"
                sm="3"
              >
                <v-text-field
                  v-model.number="propForm.cleaning_duration"
                  label="Clean (min)"
                  min="30"
                  type="number"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col
                cols="12"
                sm="6"
              >
                <v-select
                  v-model="propForm.property_type"
                  :items="propertyTypeOptions"
                  label="Property Type"
                />
              </v-col>
              <v-col
                cols="12"
                sm="6"
              >
                <v-select
                  v-model="propForm.pricing_tier"
                  :items="pricingTierOptions"
                  label="Pricing Tier"
                />
              </v-col>
            </v-row>
            <v-textarea
              v-model="propForm.special_instructions"
              auto-grow
              label="Special Instructions"
              rows="2"
            />
            <v-switch
              v-model="propForm.active"
              color="primary"
              hide-details
              inset
              label="Active"
            />
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            variant="outlined"
            @click="showPropertyDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!propFormValid"
            :loading="saving"
            @click="saveProperty"
          >
            {{ editingProperty ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirmation -->
    <ConfirmationDialog
      confirm-text="Delete"
      dangerous
      :message="`Are you sure you want to delete '${propertyToDelete ? formatPropertyAddress(propertyToDelete, 'short') : ''}'? This cannot be undone.`"
      :open="showDeleteDialog"
      title="Delete Property"
      @cancel="showDeleteDialog = false"
      @close="showDeleteDialog = false"
      @confirm="deleteProperty"
    />
  </div>
</template>

<script setup lang="ts">
  import type { VForm } from 'vuetify/components'
  import type { Property, PropertyFormData } from '@/types/property'
  import type { User } from '@/types/user'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import OwnerDetailCard from '@/components/dumb/admin/OwnerDetailCard.vue'
  import OwnerPropertyList from '@/components/dumb/admin/OwnerPropertyList.vue'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import { useSupabaseProperties } from '@/composables/supabase/useSupabaseProperties'
  import { useSupabaseUserProfiles } from '@/composables/supabase/useSupabaseUserProfiles'
  import { usePropertyStore } from '@/stores/property'
  import { formatPropertyAddress } from '@/types/property'
  import { OWNER_COLORS, PROPERTY_COLORS } from '@/utils/constants'

  const route = useRoute()
  const router = useRouter()
  const supaUserProfiles = useSupabaseUserProfiles()
  const supaProperties = useSupabaseProperties()
  const propertyStore = usePropertyStore()

  const loading = ref(true)
  const saving = ref(false)
  const saveError = ref<string | null>(null)
  const showSaveError = computed({
    get: () => !!saveError.value,
    set: (val: boolean) => {
      if (!val) saveError.value = null
    },
  })
  const owner = ref<User | null>(null)
  const properties = ref<Property[]>([])

  // Avatar color
  const avatarColor = ref<string>(OWNER_COLORS[0])

  // Edit owner dialog
  const showEditDialog = ref(false)
  const editFormRef = ref<VForm | null>(null)
  const editFormValid = ref(false)
  const editForm = ref({
    name: '',
    email: '',
    company_name: '',
    timezone: 'America/New_York',
    language: 'en',
    notifications_enabled: true,
  })

  // Property dialog
  const showPropertyDialog = ref(false)
  const propFormRef = ref<VForm | null>(null)
  const propFormValid = ref(false)
  const editingProperty = ref<Property | null>(null)
  const propForm = ref({
    address_street: '',
    address_unit: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    bedrooms: null as number | null,
    bathrooms: null as number | null,
    square_feet: null as number | null,
    property_type: 'house' as string,
    cleaning_duration: 120,
    special_instructions: '',
    pricing_tier: 'standard' as string,
    active: true,
  })

  // Delete property
  const showDeleteDialog = ref(false)
  const propertyToDelete = ref<Property | null>(null)

  // Options
  const timezoneOptions = [
    { title: 'Eastern', value: 'America/New_York' },
    { title: 'Central', value: 'America/Chicago' },
    { title: 'Mountain', value: 'America/Denver' },
    { title: 'Pacific', value: 'America/Los_Angeles' },
  ]
  const languageOptions = [
    { title: 'English', value: 'en' },
    { title: 'Spanish', value: 'es' },
    { title: 'French', value: 'fr' },
  ]
  const propertyTypeOptions = [
    { title: 'House', value: 'house' },
    { title: 'Apartment', value: 'apartment' },
    { title: 'Condo', value: 'condo' },
    { title: 'Townhouse', value: 'townhouse' },
  ]
  const pricingTierOptions = [
    { title: 'Basic', value: 'basic' },
    { title: 'Standard', value: 'standard' },
    { title: 'Premium', value: 'premium' },
    { title: 'Luxury', value: 'luxury' },
  ]

  // Properties for the current owner — derived from propertyStore (already loaded by useRealtimeSync)
  const ownerProperties = computed(() => {
    const ownerId = route.params.id as string
    if (!ownerId) return []
    return Array.from(propertyStore.propertiesByOwner(ownerId).values())
  })

  // Fetch
  async function fetchOwnerData () {
    const ownerId = route.params.id as string
    loading.value = true

    try {
      const ownerData = await supaUserProfiles.fetchById(ownerId)
      if (!ownerData) throw new Error('Owner not found')
      owner.value = ownerData

      // Set avatar color deterministically from id
      let hash = 0
      for (const ch of ownerId) hash = ch.codePointAt(0)! + ((hash << 5) - hash)
      avatarColor.value = OWNER_COLORS[Math.abs(hash) % OWNER_COLORS.length]

      // Properties come from propertyStore (loaded by useRealtimeSync)
      properties.value = ownerProperties.value
    } catch (error) {
      console.error('Failed to load owner:', error)
      owner.value = null
    } finally {
      loading.value = false
    }
  }

  // Copy to clipboard
  async function copyToClipboard (text: string) {
    try {
      await navigator.clipboard.writeText(text)
      saveError.value = null
      copiedFeedback.value = true
      setTimeout(() => {
        copiedFeedback.value = false
      }, 2000)
    } catch (error) {
      console.error('Clipboard write failed:', error)
      saveError.value = 'Copy failed — please select and copy manually'
    }
  }
  const copiedFeedback = ref(false)

  // Save owner profile
  async function saveOwnerProfile () {
    if (!owner.value) return
    const { valid } = await editFormRef.value!.validate()
    if (!valid) return
    saving.value = true
    try {
      const updated = await supaUserProfiles.updateProfile(owner.value.id, {
        name: editForm.value.name,
        company_name: editForm.value.company_name || undefined,
        timezone: editForm.value.timezone,
        language: editForm.value.language,
        notifications_enabled: editForm.value.notifications_enabled,
      })
      owner.value = updated
      saveError.value = null
      showEditDialog.value = false
    } catch (error) {
      console.error('Failed to update owner:', error)
      saveError.value = error instanceof Error ? error.message : 'Failed to update owner profile. Please try again.'
    } finally {
      saving.value = false
    }
  }

  // Property CRUD
  function openAddProperty () {
    editingProperty.value = null
    propForm.value = {
      address_street: '', address_unit: '', address_city: '', address_state: '', address_zip: '',
      bedrooms: null, bathrooms: null,
      square_feet: null, property_type: 'house', cleaning_duration: 120,
      special_instructions: '', pricing_tier: 'standard', active: true,
    }
    showPropertyDialog.value = true
  }

  function openEditProperty (prop: Property) {
    editingProperty.value = prop
    propForm.value = {
      address_street: prop.address_street,
      address_unit: prop.address_unit ?? '',
      address_city: prop.address_city,
      address_state: prop.address_state,
      address_zip: prop.address_zip,
      bedrooms: prop.bedrooms ?? null,
      bathrooms: prop.bathrooms ?? null,
      square_feet: prop.square_feet ?? null,
      property_type: prop.property_type ?? 'house',
      cleaning_duration: prop.cleaning_duration,
      special_instructions: prop.special_instructions ?? '',
      pricing_tier: prop.pricing_tier,
      active: prop.active,
    }
    showPropertyDialog.value = true
  }

  function confirmDeleteProperty (prop: Property) {
    propertyToDelete.value = prop
    showDeleteDialog.value = true
  }

  async function saveProperty () {
    if (!owner.value) return
    const { valid } = await propFormRef.value!.validate()
    if (!valid) return
    saving.value = true
    try {
      const payload = {
        owner_id: owner.value.id,
        address_street: propForm.value.address_street,
        address_unit: propForm.value.address_unit || undefined,
        address_city: propForm.value.address_city,
        address_state: propForm.value.address_state,
        address_zip: propForm.value.address_zip,
        bedrooms: propForm.value.bedrooms ?? undefined,
        bathrooms: propForm.value.bathrooms ?? undefined,
        square_feet: propForm.value.square_feet ?? undefined,
        property_type: propForm.value.property_type as Property['property_type'],
        cleaning_duration: propForm.value.cleaning_duration,
        special_instructions: propForm.value.special_instructions || undefined,
        pricing_tier: propForm.value.pricing_tier as Property['pricing_tier'],
        active: propForm.value.active,
      }

      await (editingProperty.value
        ? supaProperties.updateProperty(editingProperty.value.id, payload)
        : supaProperties.createProperty({
          ...payload,
          color: PROPERTY_COLORS[properties.value.length % PROPERTY_COLORS.length],
        } as PropertyFormData))

      saveError.value = null
      showPropertyDialog.value = false
      properties.value = ownerProperties.value
    } catch (error) {
      console.error('Failed to save property:', error)
      saveError.value = error instanceof Error ? error.message : 'Failed to save property. Please try again.'
    } finally {
      saving.value = false
    }
  }

  async function deleteProperty () {
    if (!propertyToDelete.value) return
    try {
      await supaProperties.deleteProperty(propertyToDelete.value.id)
      saveError.value = null
      showDeleteDialog.value = false
      propertyToDelete.value = null
      properties.value = ownerProperties.value
    } catch (error) {
      console.error('Failed to delete property:', error)
      saveError.value = error instanceof Error ? error.message : 'Failed to delete property. Please try again.'
    }
  }
  watch(showEditDialog, val => {
    if (val && owner.value) {
      editForm.value = {
        name: owner.value.name,
        email: owner.value.email,
        company_name: owner.value.company_name ?? '',
        timezone: owner.value.timezone || 'America/New_York',
        language: owner.value.language || 'en',
        notifications_enabled: owner.value.notifications_enabled,
      }
    }
  })

  onMounted(fetchOwnerData)
</script>

<style scoped>
.admin-owner-detail {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}
</style>
