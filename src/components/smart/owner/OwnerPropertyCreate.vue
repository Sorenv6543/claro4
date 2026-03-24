<template>
  <div class="property-create-page">
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
              Create New Property
            </h1>
          </div>
        </v-col>
      </v-row>

      <v-row>
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
                mdi-home-plus
              </v-icon>
              Property Details
            </v-card-title>

            <v-card-text>
              <PropertyModal
                mode="create"
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
              Tips
            </v-card-title>
            <v-card-text>
              <div class="text-body-2">
                <p><strong>Property Name:</strong> Use a clear, descriptive name</p>
                <p><strong>Address:</strong> Include full street address</p>
                <p><strong>Type:</strong> Select the property type that best fits</p>
                <p><strong>Bedrooms/Bathrooms:</strong> Accurate counts help with scheduling</p>
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
  import { useRouter } from 'vue-router'
  import PropertyModal from '@/components/dumb/shared/PropertyModal.vue'
  import { useAuthStore } from '@/stores/auth'
  import { usePropertyStore } from '@/stores/property'

  defineOptions({
    name: 'OwnerPropertyCreateComponent',
  })

  const router = useRouter()
  const propertyStore = usePropertyStore()
  const authStore = useAuthStore()

  async function handleSave (propertyData: Partial<Property>) {
    try {
      const newProperty = {
        ...propertyData,
        owner_id: authStore.user?.id,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true,
      } as Property

      propertyStore.setProperty(newProperty.id, newProperty)
      router.push('/owner/properties')
    } catch (error) {
      console.error('Failed to create property:', error)
    }
  }

  function handleCancel () {
    router.push('/owner/properties')
  }
</script>

<style scoped>
.property-create-page {
  min-height: 100vh;
  background: #f8f9fa;
}
</style>
