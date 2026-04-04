<template>
  <div class="admin-prop-owners">
    <div class="owners-content">
      <!-- Header (Desktop only) -->
      <div
        v-if="!mobile"
        class="owners-header"
      >
        <v-container fluid>
          <v-row align="center">
            <v-col>
              <h1 class="text-h4 font-weight-bold mb-2">
                Property Owners
              </h1>
              <p class="text-subtitle-1 text-medium-emphasis">
                Manage property owners and their portfolios
              </p>
            </v-col>
            <v-col cols="auto">
              <v-btn
                color="primary"
                prepend-icon="mdi-account-plus"
                @click="inviteDialog = true"
              >
                Invite Owner
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </div>

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

      <!-- Filters and Search -->
      <div class="filters-section">
        <v-container fluid>
          <v-row align="center">
            <v-col cols="12" md="4">
              <v-text-field
                v-model="searchQuery"
                clearable
                density="compact"
                label="Search by name, email, or company..."
                prepend-inner-icon="mdi-magnify"
              />
            </v-col>
            <v-col cols="6" md="2">
              <v-select
                v-model="statusFilter"
                clearable
                density="compact"
                :items="statusOptions"
                label="Status"
              />
            </v-col>
            <v-col class="d-flex align-center gap-2" cols="12" md="4">
              <v-chip
                v-if="filteredOwners.length !== propertyOwners.length"
                color="primary"
                size="small"
                variant="outlined"
              >
                {{ filteredOwners.length }} of {{ propertyOwners.length }} owners
              </v-chip>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <!-- Owners Table -->
      <div class="main-content">
        <v-container fluid>
          <v-card>
            <v-data-table
              class="owners-table"
              density="compact"
              :headers="tableHeaders"
              :items="filteredOwners"
              :loading="loading"
              :mobile-breakpoint="0"
              :search="searchQuery"
            >
              <!-- Owner name + email -->
              <template #[`item.name`]="{ item }">
                <div class="d-flex align-center py-2">
                  <v-avatar
                    class="me-3"
                    :color="getAvatarColor(item.id)"
                    :size="mobile ? 28 : 32"
                  >
                    <span class="text-white font-weight-bold">
                      {{ getInitials(item.name) }}
                    </span>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">{{ item.name }}</div>
                    <div class="text-caption text-medium-emphasis">{{ item.email }}</div>
                  </div>
                </div>
              </template>

              <!-- Company -->
              <template #[`item.company_name`]="{ item }">
                <span v-if="item.company_name">{{ item.company_name }}</span>
                <span v-else class="text-medium-emphasis">—</span>
              </template>

              <!-- Properties count -->
              <template #[`item.propertyCount`]="{ item }">
                <v-chip
                  :color="item.properties.length > 0 ? 'primary' : 'default'"
                  size="small"
                  variant="tonal"
                >
                  <v-icon size="14" start>mdi-home-group</v-icon>
                  {{ item.properties.length }}
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
                  {{ item.created_at ? formatDate(item.created_at) : '—' }}
                </span>
              </template>

              <!-- Actions -->
              <template #[`item.actions`]="{ item }">
                <div class="d-flex align-center gap-1">
                  <v-btn
                    aria-label="View owner details"
                    icon="mdi-eye-outline"
                    size="small"
                    variant="text"
                    @click.stop="viewOwner(item.id)"
                  />
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
                      <v-list-item @click="viewOwner(item.id)">
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
            </v-data-table>
          </v-card>
        </v-container>
      </div>
    </div>

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

    <!-- Mobile FAB -->
    <v-btn
      v-if="mobile"
      class="fab-btn"
      color="primary"
      icon="mdi-account-plus"
      location="bottom end"
      position="fixed"
      size="large"
      @click="inviteDialog = true"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import StatCard from '@/components/dumb/shared/StatCard.vue'
  import { supabase } from '@/plugins/supabase'

  const router = useRouter()
  const { mobile } = useDisplay()

  const loading = ref(false)
  const fetchError = ref<string | null>(null)
  const searchQuery = ref('')
  const statusFilter = ref<string | null>(null)
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

  const statusOptions = [
    { title: 'Active', value: 'active' },
    { title: 'Inactive', value: 'inactive' },
  ]

  const totalProperties = computed(() =>
    propertyOwners.value.reduce((sum, o) => sum + o.properties.length, 0),
  )

  const activeOwnerCount = computed(() =>
    propertyOwners.value.filter(o => !!o.last_sign_in_at).length,
  )

  const ownersWithProperties = computed(() =>
    propertyOwners.value.filter(o => o.properties.length > 0).length,
  )

  const COLORS = ['#5c6bc0', '#43a047', '#8e24aa', '#f57c00', '#00897b', '#e53935']

  function getAvatarColor (id: string): string {
    let hash = 0
    for (const ch of id) hash = ch.codePointAt(0)! + ((hash << 5) - hash)
    return COLORS[Math.abs(hash) % COLORS.length]
  }

  function getInitials (name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function formatDate (d: string) {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const tableHeaders = computed(() => {
    const h = [
      { title: 'Owner', key: 'name', sortable: true },
      { title: 'Company', key: 'company_name', sortable: true },
      { title: 'Properties', key: 'propertyCount', sortable: true },
      { title: 'Status', key: 'status', sortable: true },
      { title: 'Joined', key: 'created_at', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, width: 100 },
    ]
    if (mobile.value) {
      return h.filter(c => c.key !== 'company_name' && c.key !== 'created_at')
    }
    return h
  })

  const filteredOwners = computed(() => {
    let owners = propertyOwners.value

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      owners = owners.filter(o =>
        o.name.toLowerCase().includes(q)
        || o.email.toLowerCase().includes(q)
        || (o.company_name && o.company_name.toLowerCase().includes(q)),
      )
    }

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
      const { data: owners, error: ownerError } = await supabase
        .from('user_profiles')
        .select('id, name, email, company_name, created_at, last_sign_in_at')
        .eq('role', 'owner')
        .order('name')

      if (ownerError) throw ownerError

      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, address_street, owner_id')

      if (propError) throw propError

      const propsByOwner = new Map<string, { id: string, address_street: string }[]>()
      for (const p of properties ?? []) {
        if (!propsByOwner.has(p.owner_id)) propsByOwner.set(p.owner_id, [])
        propsByOwner.get(p.owner_id)!.push({ id: p.id, address_street: p.address_street })
      }

      propertyOwners.value = (owners ?? []).map(o => ({
        ...o,
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
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}

.owners-content {
  min-height: 100vh;
}

.owners-header {
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
  padding: 24px 0;
}

.stats-section {
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
  padding: 16px 0;
}

.filters-section {
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
  padding: 16px 0;
}

.main-content {
  padding: 24px 0;
}

.owners-table {
  background: rgb(var(--v-theme-surface));
}

.owners-table :deep(.v-data-table__tbody tr) {
  cursor: pointer;
}

.owners-table :deep(.v-data-table__tbody tr:hover) {
  background: rgb(var(--v-theme-surface-variant));
}

.owners-table :deep(.v-data-table__td),
.owners-table :deep(.v-data-table__th) {
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.fab-btn {
  margin: 16px;
}

@media (max-width: 599px) {
  .main-content {
    padding: 12px 0;
  }
}
</style>
