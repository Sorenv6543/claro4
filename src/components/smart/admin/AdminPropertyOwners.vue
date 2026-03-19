<template>
  <div class="admin-prop-owner">
    <div class="owners-content">
      <!-- Header -->
      <div
        v-if="!mobile"
        class="owners-header"
      >
        <v-container fluid>
          <v-row align="center">
            <v-col>
              <h1 class="text-h4 font-weight-bold mb-1">
                Property Owners
              </h1>
              <p class="text-body-2 text-medium-emphasis">
                {{ propertyOwners.length }} owners &middot; {{ totalProperties }} properties
              </p>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <!-- Search -->
      <div class="filters-section">
        <v-container fluid>
          <v-row align="center">
            <v-col
              cols="12"
              md="5"
            >
              <v-text-field
                v-model="searchQuery"
                prepend-inner-icon="mdi-magnify"
                label="Search by name, email, or company..."
                density="compact"
                clearable
              />
            </v-col>
            <v-col
              cols="12"
              md="7"
              class="d-flex align-center gap-2"
            >
              <v-chip
                v-if="filteredOwners.length !== propertyOwners.length"
                color="primary"
                variant="outlined"
                size="small"
              >
                {{ filteredOwners.length }} of {{ propertyOwners.length }}
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
              :headers="tableHeaders"
              :items="filteredOwners"
              :loading="loading"
              :search="searchQuery"
              class="owners-table"
              :mobile-breakpoint="0"
            >
              <!-- Owner name + email + company -->
              <template #[`item.name`]="{ item }">
                <div class="d-flex align-center py-2">
                  <v-avatar
                    :color="getAvatarColor(item.id)"
                    :size="mobile ? 32 : 40"
                    class="me-3"
                  >
                    <span class="text-white font-weight-bold">
                      {{ getInitials(item.name) }}
                    </span>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">
                      {{ item.name }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ item.email }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- Company -->
              <template #[`item.company_name`]="{ item }">
                <span v-if="item.company_name">{{ item.company_name }}</span>
                <span
                  v-else
                  class="text-medium-emphasis"
                >—</span>
              </template>

              <!-- Properties count -->
              <template #[`item.propertyCount`]="{ item }">
                <v-chip
                  size="small"
                  :color="item.properties.length > 0 ? 'primary' : 'default'"
                  variant="tonal"
                >
                  <v-icon
                    start
                    size="14"
                  >
                    mdi-home-group
                  </v-icon>
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
                <v-btn
                  icon="mdi-eye-outline"
                  size="small"
                  variant="text"
                  aria-label="View owner details"
                  @click.stop="viewOwner(item.id)"
                />
                <v-btn
                  icon="mdi-email-outline"
                  size="small"
                  variant="text"
                  aria-label="Email owner"
                  :href="`mailto:${item.email}`"
                  @click.stop
                />
              </template>
            </v-data-table>
          </v-card>
        </v-container>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { supabase } from '@/plugins/supabase'

const router = useRouter()
const { mobile } = useDisplay()

const loading = ref(false)
const searchQuery = ref('')

interface OwnerRow {
  id: string
  name: string
  email: string
  company_name: string | null
  created_at: string | null
  last_sign_in_at: string | null
  properties: { id: string; address_street: string }[]
}

const propertyOwners = ref<OwnerRow[]>([])

const totalProperties = computed(() =>
  propertyOwners.value.reduce((sum, o) => sum + o.properties.length, 0)
)

const COLORS = ['#5c6bc0', '#43a047', '#8e24aa', '#f57c00', '#00897b', '#e53935']

const getAvatarColor = (id: string): string => {
  let hash = 0
  for (const ch of id) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

const tableHeaders = computed(() => {
  const h = [
    { title: 'Owner', key: 'name', sortable: true },
    { title: 'Company', key: 'company_name', sortable: true },
    { title: 'Properties', key: 'propertyCount', sortable: true },
    { title: 'Status', key: 'status', sortable: true },
    { title: 'Joined', key: 'created_at', sortable: true },
    { title: '', key: 'actions', sortable: false, align: 'end' as const, width: 100 }
  ]
  if (mobile.value) {
    // On mobile, drop Company and Joined columns
    return h.filter(c => c.key !== 'company_name' && c.key !== 'created_at')
  }
  return h
})

const filteredOwners = computed(() => {
  if (!searchQuery.value) return propertyOwners.value
  const q = searchQuery.value.toLowerCase()
  return propertyOwners.value.filter(o =>
    o.name.toLowerCase().includes(q) ||
    o.email.toLowerCase().includes(q) ||
    (o.company_name && o.company_name.toLowerCase().includes(q))
  )
})

const viewOwner = (id: string) => {
  router.push(`/admin/owners/${id}`)
}

async function fetchOwners() {
  loading.value = true
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

    const propsByOwner = new Map<string, { id: string; address_street: string }[]>()
    for (const p of properties ?? []) {
      if (!propsByOwner.has(p.owner_id)) propsByOwner.set(p.owner_id, [])
      propsByOwner.get(p.owner_id)!.push({ id: p.id, address_street: p.address_street })
    }

    propertyOwners.value = (owners ?? []).map(o => ({
      ...o,
      properties: propsByOwner.get(o.id) ?? []
    }))
  } catch (err) {
    console.error('Failed to fetch owners:', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchOwners)
</script>

<style scoped>
.admin-prop-owner {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}

.owners-header {
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
  padding: 24px 0;
}

.filters-section {
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
  padding: 16px 0;
}

.main-content {
  padding: 24px 0;
}

.owners-table :deep(.v-data-table__tbody tr) {
  cursor: pointer;
}

.owners-table :deep(.v-data-table__tbody tr:hover) {
  background: rgb(var(--v-theme-surface-variant));
}
</style>
