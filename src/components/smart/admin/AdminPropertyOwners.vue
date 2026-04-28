<template>
  <div class="admin-prop-owners">
    <!-- Stats Cards -->
    <div class="stats-section">
      <v-container fluid>
        <v-row density="compact">
          <v-col cols="6" md="3">
            <StatCard color="primary" icon="mdi-account-group" label="Total Owners" :value="propertyOwners.length" />
          </v-col>

          <v-col cols="6" md="3">
            <StatCard color="success" icon="mdi-check-circle" label="Active" :value="activeOwnerCount" />
          </v-col>

          <v-col cols="6" md="3">
            <StatCard color="info" icon="mdi-home-group" label="With Properties" :value="ownersWithProperties" />
          </v-col>

          <v-col cols="6" md="3">
            <StatCard color="warning" icon="mdi-home-city" label="Total Properties" :value="totalProperties" />
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Error Alert -->
    <v-container
      v-if="fetchError"
      class="py-2"
      fluid
    >
      <v-alert
        closable
        type="error"
        @click:close="fetchError = null"
      >
        {{ fetchError }}
      </v-alert>
    </v-container>

    <!-- Owners Data Table -->
    <MaterioDataTable
      :active-filter-count="activeFilterCount"
      :headers="tableHeaders"
      :items="filteredOwners"
      :loading="loading"
      :search-keys="['name', 'email', 'company_name']"
      searchable
      subtitle="Manage property owners and their portfolios"
      title="Property Owners"
    >
      <!-- Header actions -->
      <template #header-actions>
        <v-btn
          color="primary"
          prepend-icon="mdi-account-plus"
          @click="inviteDialog = true"
        >
          Invite Owner
        </v-btn>
      </template>

      <!-- Segment tabs -->
      <template #segments>
        <div class="d-flex ga-2 flex-wrap">
          <v-btn
            v-for="seg in segments"
            :key="seg.value"
            color="primary"
            density="compact"
            size="small"
            :variant="selectedSegment === seg.value ? 'flat' : 'outlined'"
            @click="selectedSegment = seg.value"
          >
            {{ seg.title }}
          </v-btn>
        </div>
      </template>

      <!-- Collapsible filters -->
      <template #filters>
        <v-row align="center" density="comfortable">
          <v-col cols="6" md="3" sm="4">
            <v-select
              v-model="statusFilter"
              clearable
              density="compact"
              hide-details
              :items="statusOptions"
              placeholder="Status"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </template>

      <!-- Owner name + email -->
      <template #[`item.name`]="{ item }">
        <div class="d-flex align-center py-2">
          <v-avatar
            class="me-3"
            :color="getAvatarColor(item.id as string)"
            :size="mobile ? 28 : 32"
          >
            <span class="text-white font-weight-bold">
              {{ getInitials(item.name as string) }}
            </span>
          </v-avatar>

          <div style="min-width: 0">
            <div class="font-weight-medium text-truncate">{{ item.name }}</div>
            <div class="text-caption text-medium-emphasis text-truncate">{{ item.email }}</div>
          </div>
        </div>
      </template>

      <!-- Company -->
      <template #[`item.company_name`]="{ item }">
        <span v-if="item.company_name">{{ item.company_name }}</span>
        <span v-else class="text-medium-emphasis">&mdash;</span>
      </template>

      <!-- Properties count -->
      <template #[`item.propertyCount`]="{ item }">
        <v-chip
          :color="(item.properties as unknown[]).length > 0 ? 'primary' : 'default'"
          size="small"
          variant="tonal"
        >
          <v-icon size="14" start>mdi-home-group</v-icon>
          {{ (item.properties as unknown[]).length }}
        </v-chip>
      </template>

      <!-- Status -->
      <template #[`item.status`]="{ item }">
        <v-chip
          :color="item.last_sign_in_at ? 'success' : 'warning'"
          size="small"
          variant="flat"
        >
          {{ item.last_sign_in_at ? 'Active' : 'Inactive' }}
        </v-chip>
      </template>

      <!-- Joined -->
      <template #[`item.created_at`]="{ item }">
        <span class="text-body-2">
          {{ item.created_at ? formatDate(item.created_at as string) : '&mdash;' }}
        </span>
      </template>

      <!-- Actions -->
      <template #[`item.actions`]="{ item }">
        <div class="d-flex align-center ga-1">
          <v-tooltip location="top" text="View details">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                aria-label="View owner details"
                icon="mdi-eye-outline"
                size="small"
                variant="text"
                v-bind="tooltipProps"
                @click.stop="viewOwner(item.id as string)"
              />
            </template>
          </v-tooltip>

          <v-menu>
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                icon="mdi-dots-vertical"
                size="small"
                variant="text"
                @click.stop
              />
            </template>

            <v-list>
              <v-list-item @click="viewOwner(item.id as string)">
                <template #prepend><v-icon>mdi-eye-outline</v-icon></template>
                <v-list-item-title>View Details</v-list-item-title>
              </v-list-item>

              <v-list-item :href="`mailto:${item.email}`" @click.stop>
                <template #prepend><v-icon>mdi-email-outline</v-icon></template>
                <v-list-item-title>Send Email</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </template>
    </MaterioDataTable>

    <!-- Invite Owner Dialog (placeholder) -->
    <v-dialog v-model="inviteDialog" max-width="500px">
      <v-card>
        <v-card-title class="pa-6 pb-4">
          <span class="text-h6">Invite Property Owner</span>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-text-field
            v-model="inviteEmail"
            label="Email Address"
            prepend-inner-icon="mdi-email-outline"
            type="email"
          />
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="inviteDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="inviteDialog = false">Send Invite</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import MaterioDataTable from '@/components/dumb/shared/MaterioDataTable.vue'
  import StatCard from '@/components/dumb/shared/StatCard.vue'
  import { useSupabaseUserProfiles } from '@/composables/supabase/useSupabaseUserProfiles'
  import { usePropertyStore } from '@/stores/property'
  import { useUserProfileStore } from '@/stores/userProfile'
  import { OWNER_COLORS } from '@/utils/constants'

  const router = useRouter()
  const { mobile } = useDisplay()
  const supaUserProfiles = useSupabaseUserProfiles()
  const userProfileStore = useUserProfileStore()
  const propertyStore = usePropertyStore()

  const loading = ref(false)
  const fetchError = ref<string | null>(null)
  const statusFilter = ref<string | null>(null)
  const selectedSegment = ref('all')
  const inviteDialog = ref(false)
  const inviteEmail = ref('')

  interface OwnerRow {
    id: string
    name: string
    email: string
    company_name: string | null
    created_at: string | null
    last_sign_in_at: string | null
    properties: { id: string, address_street: string }[]
  }

  const propertyOwners = ref<OwnerRow[]>([])

  // Segments
  const segments = [
    { title: 'All', value: 'all' },
    { title: 'Active', value: 'active' },
    { title: 'Inactive', value: 'inactive' },
  ]

  const statusOptions = [
    { title: 'Active', value: 'active' },
    { title: 'Inactive', value: 'inactive' },
  ]

  // Active filter count
  const activeFilterCount = computed(() => {
    let count = 0
    if (statusFilter.value) count++
    return count
  })

  const totalProperties = computed(() =>
    propertyOwners.value.reduce((sum, o) => sum + o.properties.length, 0),
  )

  const activeOwnerCount = computed(() =>
    propertyOwners.value.filter(o => !!o.last_sign_in_at).length,
  )

  const ownersWithProperties = computed(() =>
    propertyOwners.value.filter(o => o.properties.length > 0).length,
  )

  function getAvatarColor (id: string): string {
    let hash = 0
    for (const ch of id) hash = ch.codePointAt(0)! + ((hash << 5) - hash)
    return OWNER_COLORS[Math.abs(hash) % OWNER_COLORS.length]
  }

  function getInitials (name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function formatDate (d: string) {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // Table headers with mobileHidden
  const tableHeaders = computed(() => [
    { title: 'Owner', key: 'name', sortable: true },
    { title: 'Company', key: 'company_name', sortable: true, mobileHidden: true },
    { title: 'Properties', key: 'propertyCount', sortable: true, width: '110px' },
    { title: 'Status', key: 'status', sortable: true, width: '100px', mobileHidden: true },
    { title: 'Joined', key: 'created_at', sortable: true, width: '130px', mobileHidden: true },
    { title: '', key: 'actions', sortable: false, align: 'end' as const, width: '100px', mobileHidden: true },
  ])

  const filteredOwners = computed(() => {
    let owners = propertyOwners.value

    // Segment filter
    if (selectedSegment.value === 'active') {
      owners = owners.filter(o => !!o.last_sign_in_at)
    } else if (selectedSegment.value === 'inactive') {
      owners = owners.filter(o => !o.last_sign_in_at)
    }

    // Status filter from collapsible filters
    if (statusFilter.value === 'active') {
      owners = owners.filter(o => !!o.last_sign_in_at)
    } else if (statusFilter.value === 'inactive') {
      owners = owners.filter(o => !o.last_sign_in_at)
    }

    return owners
  })

  function viewOwner (id: string) {
    router.push(`/admin/owners/${id}`)
  }

  async function fetchOwners () {
    loading.value = true
    fetchError.value = null
    try {
      await supaUserProfiles.fetchByRole('owner')

      // Properties are already loaded by useRealtimeSync — read from store
      const propsByOwner = new Map<string, { id: string, address_street: string }[]>()
      for (const p of propertyStore.propertiesArray) {
        if (!propsByOwner.has(p.owner_id)) propsByOwner.set(p.owner_id, [])
        propsByOwner.get(p.owner_id)!.push({ id: p.id, address_street: p.address_street })
      }

      propertyOwners.value = userProfileStore.ownersArray.map(o => ({
        id: o.id,
        name: o.name,
        email: o.email,
        company_name: o.company_name ?? null,
        created_at: o.created_at ?? null,
        last_sign_in_at: o.last_sign_in_at ?? null,
        properties: propsByOwner.get(o.id) ?? [],
      }))
    } catch (error) {
      console.error('Failed to fetch owners:', error)
      fetchError.value = error instanceof Error ? error.message : 'Failed to load property owners.'
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchOwners)
</script>

<style scoped>
.admin-prop-owners {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stats-section {
  flex-shrink: 0;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
  padding: 16px 0;
}

/* Force fixed-layout table so percentage column widths are respected on mobile */
@media (max-width: 599px) {
  :deep(.v-table table) {
    table-layout: fixed;
    width: 100%;
  }

  :deep(.v-table td),
  :deep(.v-table th) {
    overflow: hidden;
  }
}
</style>
