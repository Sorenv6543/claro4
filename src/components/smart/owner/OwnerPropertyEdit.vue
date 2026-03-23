<template>
  <div class="property-edit-page">
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center mb-4">
            <v-btn
              icon="mdi-arrow-left"
              variant="text"
              @click="$router.go(-1)"
            />
            <h1 class="text-h4 ml-4">
              Edit Property
            </h1>
          </div>
        </v-col>
      </v-row>

      <v-row v-if="property">
        <v-col
          cols="12"
          md="8"
        >
          <v-card>
            <v-card-title>
              <v-icon
                class="mr-2"
                color="primary"
              >
                mdi-home-edit
              </v-icon>
              {{ formatPropertyAddress(property, 'short') }}
            </v-card-title>

            <v-card-text>
              <PropertyModal
                mode="edit"
                :property="property"
                :show="true"
                @cancel="handleCancel"
                @save="handleSave"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col
          cols="12"
          md="4"
        >
          <v-card>
            <v-card-title>
              <v-icon
                class="mr-2"
                color="info"
              >
                mdi-information
              </v-icon>
              Property Info
            </v-card-title>
            <v-card-text>
              <div class="text-body-2">
                <p><strong>Created:</strong> {{ formatDate(property.created_at!) }}</p>
                <p><strong>Last Updated:</strong> {{ formatDate(property.updated_at!) }}</p>
                <p><strong>Status:</strong> Active</p>
                <p><strong>Total Bookings:</strong> 0</p>
              </div>
            </v-card-text>
          </v-card>

          <v-card class="mt-4">
            <v-card-title>
              <v-icon
                class="mr-2"
                color="warning"
              >
                mdi-alert
              </v-icon>
              Danger Zone
            </v-card-title>
            <v-card-text>
              <v-btn
                block
                color="error"
                variant="outlined"
                @click="handleDelete"
              >
                Delete Property
              </v-btn>
              <div class="text-caption text-medium-emphasis mt-2">
                This action cannot be undone. All associated bookings will be affected.
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col cols="12">
          <v-card>
            <v-card-text class="text-center">
              <v-progress-circular
                color="primary"
                indeterminate
              />
              <div class="mt-4">
                Loading property...
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
  import type { Property } from '@/types'
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import PropertyModal from '@/components/dumb/shared/PropertyModal.vue'
  import { usePropertyStore } from '@/stores/property'
  import { formatPropertyAddress } from '@/types/property'

  defineOptions({
    name: 'OwnerPropertyEditComponent',
  })

  const router = useRouter()
  const route = useRoute()
  const propertyStore = usePropertyStore()

  const property = ref<Property | null>(null)
  const propertyId = route.params.id as string

  onMounted(async () => {
    try {
      await propertyStore.fetchProperties()
      property.value = propertyStore.properties.get(propertyId) || null

      if (!property.value) {
        router.push('/owner/properties')
      }
    } catch (error) {
      console.error('Failed to load property:', error)
      router.push('/owner/properties')
    }
  })

  async function handleSave (propertyData: Partial<Property>) {
    try {
      if (property.value) {
        await propertyStore.updateProperty(property.value.id, propertyData)
        router.push('/owner/properties')
      }
    } catch (error) {
      console.error('Failed to update property:', error)
    }
  }

  function handleCancel () {
    router.push('/owner/properties')
  }

  async function handleDelete () {
    if (property.value && confirm(`Are you sure you want to delete "${formatPropertyAddress(property.value, 'short')}"?`)) {
      try {
        await propertyStore.removeProperty(property.value.id)
        router.push('/owner/properties')
      } catch (error) {
        console.error('Failed to delete property:', error)
      }
    }
  }

  function formatDate (dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
</script>

<style scoped>
.property-edit-page {
  min-height: 100vh;
  background: #f8f9fa;
}
</style>
