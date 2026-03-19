<template>
  <v-card>
    <v-card-title class="d-flex align-center pa-4">
      <v-icon
        icon="mdi-home-group"
        class="me-2"
        color="primary"
      />
      Properties ({{ properties.length }})
      <v-spacer />
      <v-btn
        v-if="editable"
        color="primary"
        size="small"
        prepend-icon="mdi-plus"
        @click="$emit('add')"
      >
        Add Property
      </v-btn>
    </v-card-title>

    <v-divider />

    <!-- Empty state -->
    <v-card-text
      v-if="properties.length === 0"
      class="text-center pa-8"
    >
      <v-icon
        icon="mdi-home-outline"
        size="64"
        color="medium-emphasis"
        class="mb-4"
      />
      <p class="text-body-1 text-medium-emphasis">
        No properties yet
      </p>
    </v-card-text>

    <!-- Property cards -->
    <div
      v-else
      class="pa-4"
    >
      <v-row>
        <v-col
          v-for="prop in properties"
          :key="prop.id"
          cols="12"
          sm="6"
        >
          <v-card
            variant="outlined"
            class="property-card h-100"
          >
            <v-card-text class="pa-4">
              <!-- Header row -->
              <div class="d-flex align-center mb-2">
                <v-icon
                  :icon="propertyTypeIcon(prop.property_type)"
                  :color="prop.active ? 'primary' : 'medium-emphasis'"
                  size="20"
                  class="me-2"
                />
                <span class="text-subtitle-1 font-weight-medium text-truncate">
                  {{ formatPropertyAddress(prop, 'short') }}
                </span>
                <v-spacer />
                <v-chip
                  v-if="!prop.active"
                  size="x-small"
                  color="error"
                  variant="tonal"
                >
                  Inactive
                </v-chip>
                <v-chip
                  v-else
                  size="x-small"
                  :color="tierColor(prop.pricing_tier)"
                  variant="tonal"
                >
                  {{ prop.pricing_tier }}
                </v-chip>
              </div>

              <!-- Address -->
              <div
                class="d-flex align-center text-body-2 text-medium-emphasis mb-3"
              >
                <v-icon
                  icon="mdi-map-marker-outline"
                  size="14"
                  class="me-1"
                />
                {{ formatPropertyAddress(prop) }}
              </div>

              <!-- Stats row -->
              <div class="d-flex flex-wrap gap-3">
                <div
                  v-if="prop.bedrooms != null"
                  class="d-flex align-center text-body-2"
                >
                  <v-icon
                    icon="mdi-bed-outline"
                    size="16"
                    class="me-1"
                    color="medium-emphasis"
                  />
                  {{ prop.bedrooms }} bd
                </div>
                <div
                  v-if="prop.bathrooms != null"
                  class="d-flex align-center text-body-2"
                >
                  <v-icon
                    icon="mdi-shower"
                    size="16"
                    class="me-1"
                    color="medium-emphasis"
                  />
                  {{ prop.bathrooms }} ba
                </div>
                <div
                  v-if="prop.square_feet"
                  class="d-flex align-center text-body-2"
                >
                  <v-icon
                    icon="mdi-ruler-square"
                    size="16"
                    class="me-1"
                    color="medium-emphasis"
                  />
                  {{ prop.square_feet.toLocaleString() }} ft²
                </div>
                <div class="d-flex align-center text-body-2">
                  <v-icon
                    icon="mdi-clock-outline"
                    size="16"
                    class="me-1"
                    color="medium-emphasis"
                  />
                  {{ prop.cleaning_duration }}m clean
                </div>
              </div>

              <!-- Special instructions -->
              <div
                v-if="prop.special_instructions"
                class="mt-3 pa-2 rounded bg-surface-variant"
              >
                <div class="d-flex align-center text-caption text-medium-emphasis mb-1">
                  <v-icon
                    icon="mdi-note-text-outline"
                    size="12"
                    class="me-1"
                  />
                  Special Instructions
                </div>
                <div class="text-body-2">
                  {{ prop.special_instructions }}
                </div>
              </div>
            </v-card-text>

            <v-card-actions v-if="editable">
              <v-spacer />
              <v-btn
                icon="mdi-pencil-outline"
                size="x-small"
                variant="text"
                aria-label="Edit property"
                @click="$emit('editProperty', prop)"
              />
              <v-btn
                icon="mdi-delete-outline"
                size="x-small"
                variant="text"
                color="error"
                aria-label="Delete property"
                @click="$emit('deleteProperty', prop)"
              />
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import type { Property } from '@/types/property'
import { formatPropertyAddress } from '@/types/property'

interface Props {
  properties: Property[]
  editable?: boolean
}

withDefaults(defineProps<Props>(), {
  editable: false
})

defineEmits<{
  add: []
  editProperty: [property: Property]
  deleteProperty: [property: Property]
}>()

const propertyTypeIcon = (type?: string) => {
  const icons: Record<string, string> = {
    apartment: 'mdi-office-building-outline',
    house: 'mdi-home-outline',
    condo: 'mdi-domain',
    townhouse: 'mdi-home-city-outline'
  }
  return icons[type ?? ''] || 'mdi-home-outline'
}

const tierColor = (tier: string) => {
  const colors: Record<string, string> = {
    basic: 'info',
    standard: 'primary',
    premium: 'warning',
    luxury: 'error'
  }
  return colors[tier] || 'primary'
}
</script>

<style scoped>
.property-card {
  transition: border-color 0.2s;
}

.property-card:hover {
  border-color: rgb(var(--v-theme-primary));
}
</style>
