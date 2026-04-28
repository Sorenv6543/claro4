<template>
  <v-card>
    <v-card-title class="d-flex align-center pa-4">
      <v-icon
        class="me-2"
        color="primary"
        icon="mdi-home-group"
      />
      Properties ({{ properties.length }})
      <v-spacer />

      <v-btn
        v-if="editable"
        color="primary"
        prepend-icon="mdi-plus"
        size="small"
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
        class="mb-4"
        color="medium-emphasis"
        icon="mdi-home-outline"
        size="64"
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
            class="property-card h-100"
            variant="outlined"
          >
            <v-card-text class="pa-4">
              <!-- Header row -->
              <div class="d-flex align-center mb-2">
                <v-icon
                  class="me-2"
                  :color="prop.active ? 'primary' : 'medium-emphasis'"
                  :icon="propertyTypeIcon(prop.property_type)"
                  size="20"
                />

                <span class="text-subtitle-1 font-weight-medium text-truncate">
                  {{ formatPropertyAddress(prop, 'short') }}
                </span>

                <v-spacer />

                <v-chip
                  v-if="!prop.active"
                  color="error"
                  size="x-small"
                  variant="tonal"
                >
                  Inactive
                </v-chip>

                <v-chip
                  v-else
                  :color="tierColor(prop.pricing_tier)"
                  size="x-small"
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
                  class="me-1"
                  icon="mdi-map-marker-outline"
                  size="14"
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
                    class="me-1"
                    color="medium-emphasis"
                    icon="mdi-bed-outline"
                    size="16"
                  />
                  {{ prop.bedrooms }} bd
                </div>

                <div
                  v-if="prop.bathrooms != null"
                  class="d-flex align-center text-body-2"
                >
                  <v-icon
                    class="me-1"
                    color="medium-emphasis"
                    icon="mdi-shower"
                    size="16"
                  />
                  {{ prop.bathrooms }} ba
                </div>

                <div
                  v-if="prop.square_feet"
                  class="d-flex align-center text-body-2"
                >
                  <v-icon
                    class="me-1"
                    color="medium-emphasis"
                    icon="mdi-ruler-square"
                    size="16"
                  />
                  {{ prop.square_feet.toLocaleString() }} ft²
                </div>

                <div class="d-flex align-center text-body-2">
                  <v-icon
                    class="me-1"
                    color="medium-emphasis"
                    icon="mdi-clock-outline"
                    size="16"
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
                    class="me-1"
                    icon="mdi-note-text-outline"
                    size="12"
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
                aria-label="Edit property"
                icon="mdi-pencil-outline"
                size="x-small"
                variant="text"
                @click="$emit('edit-property', prop)"
              />

              <v-btn
                aria-label="Delete property"
                color="error"
                icon="mdi-delete-outline"
                size="x-small"
                variant="text"
                @click="$emit('delete-property', prop)"
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
    editable: false,
  })

  defineEmits<{
    'add': []
    'edit-property': [property: Property]
    'delete-property': [property: Property]
  }>()

  function propertyTypeIcon (type?: string) {
    const icons: Record<string, string> = {
      apartment: 'mdi-office-building-outline',
      house: 'mdi-home-outline',
      condo: 'mdi-domain',
      townhouse: 'mdi-home-city-outline',
    }
    return icons[type ?? ''] || 'mdi-home-outline'
  }

  function tierColor (tier: string) {
    const colors: Record<string, string> = {
      basic: 'info',
      standard: 'primary',
      premium: 'warning',
      luxury: 'error',
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
