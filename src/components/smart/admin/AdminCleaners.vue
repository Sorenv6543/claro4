<template>
  <div class="admin-cleaners-page">
    <div class="cleaners-content">
      <!-- Header (Desktop only) -->
      <div
        v-if="!mobile"
        class="cleaners-header"
      >
        <v-container fluid>
          <v-row align="center">
            <v-col>
              <h1 class="text-h4 font-weight-bold mb-2">
                Cleaners
              </h1>
              <p class="text-subtitle-1 text-medium-emphasis">
                Manage cleaner profiles, skills, and availability
              </p>
            </v-col>
            <v-col cols="auto">
              <v-btn
                color="primary"
                prepend-icon="mdi-account-plus"
                @click="showAddDialog = true"
              >
                Add Cleaner
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
              <StatCard color="primary" icon="mdi-account-group" label="Total Cleaners" :value="cleanerStats.total" />
            </v-col>
            <v-col cols="6" md="3">
              <StatCard color="success" icon="mdi-check-circle" label="Available Today" :value="cleanerStats.available" />
            </v-col>
            <v-col cols="6" md="3">
              <StatCard color="warning" icon="mdi-clock-outline" label="Currently Busy" :value="cleanerStats.busy" />
            </v-col>
            <v-col cols="6" md="3">
              <StatCard color="info" icon="mdi-star" label="Avg Rating" value="4.8" />
            </v-col>
          </v-row>
        </v-container>
      </div>

      <!-- Error Alert -->
      <v-container
        v-if="cleanerError"
        class="py-2"
        fluid
      >
        <v-alert
          closable
          type="error"
          @click:close="cleanerError = null"
        >
          {{ cleanerError }}
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
                label="Search cleaners..."
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
                v-if="filteredCleaners.length !== allCleaners.length"
                color="primary"
                size="small"
                variant="outlined"
              >
                {{ filteredCleaners.length }} of {{ allCleaners.length }} cleaners
              </v-chip>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <!-- Cleaners Table -->
      <div class="main-content">
        <v-container fluid>
          <v-card>
            <v-data-table
              class="cleaners-table"
              density="compact"
              :headers="tableHeaders"
              :items="filteredCleaners"
              :loading="loading"
              :mobile-breakpoint="0"
              :search="searchQuery"
            >
              <template #[`item.avatar`]="{ item }">
                <v-avatar
                  class="my-1"
                  color="success"
                  :size="mobile ? 28 : 32"
                >
                  <span class="text-white font-weight-bold">
                    {{ getInitials(item.name) }}
                  </span>
                </v-avatar>
              </template>

              <template #[`item.name`]="{ item }">
                <div class="user-name-cell">
                  <div
                    class="font-weight-medium"
                    :class="mobile ? 'text-body-2' : 'text-body-1'"
                  >
                    {{ item.name }}
                  </div>
                  <div
                    class="text-medium-emphasis"
                    :class="mobile ? 'text-caption' : 'text-body-2'"
                  >
                    {{ item.email }}
                  </div>
                </div>
              </template>

              <template #[`item.skills`]="{ item }">
                <div class="d-flex flex-wrap ga-1 py-1">
                  <v-chip
                    v-for="skill in item.skills.slice(0, 2)"
                    :key="skill"
                    size="x-small"
                    variant="outlined"
                  >
                    {{ skill }}
                  </v-chip>
                  <v-chip
                    v-if="item.skills.length > 2"
                    size="x-small"
                    variant="outlined"
                  >
                    +{{ item.skills.length - 2 }}
                  </v-chip>
                </div>
              </template>

              <template #[`item.max_daily_bookings`]="{ item }">
                <v-chip color="info" size="small" variant="tonal">
                  {{ item.max_daily_bookings }}/day
                </v-chip>
              </template>

              <template #[`item.status`]>
                <v-chip color="success" size="small" variant="flat">
                  Active
                </v-chip>
              </template>

              <template #[`item.actions`]="{ item }">
                <div class="d-flex align-center gap-1">
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    @click.stop="editCleaner(item)"
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
                      <v-list-item @click="viewSchedule(item)">
                        <template #prepend>
                          <v-icon>mdi-calendar</v-icon>
                        </template>
                        <v-list-item-title>View Schedule</v-list-item-title>
                      </v-list-item>
                      <v-divider />
                      <v-list-item
                        class="text-error"
                        @click="confirmDelete(item)"
                      >
                        <v-list-item-title>Delete Cleaner</v-list-item-title>
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

    <!-- Add/Edit Cleaner Dialog -->
    <v-dialog v-model="showAddDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="pa-6 pb-4">
          <span class="text-h6">{{ editingCleaner ? 'Edit' : 'Add' }} Cleaner</span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <v-form ref="form" v-model="formValid">
            <v-text-field
              v-model="formData.name"
              class="mb-3"
              label="Full Name"
              :rules="[rules.required]"
            />
            <v-text-field
              v-model="formData.email"
              class="mb-3"
              label="Email"
              :rules="[rules.required, rules.email]"
              type="email"
            />
            <v-select
              v-model="formData.skills"
              chips
              class="mb-3"
              :items="availableSkills"
              label="Skills"
              multiple
            />
            <v-text-field
              v-model.number="formData.max_daily_bookings"
              label="Max Daily Bookings"
              :rules="[rules.required, rules.positive]"
              type="number"
            />
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            :disabled="!formValid"
            :loading="saving"
            @click="saveCleaner"
          >
            {{ editingCleaner ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmationDialog
      confirm-text="Delete"
      dangerous
      :message="`Are you sure you want to delete ${cleanerToDelete?.name}? This action cannot be undone.`"
      :open="deleteDialog"
      title="Delete Cleaner"
      @cancel="deleteDialog = false"
      @close="deleteDialog = false"
      @confirm="handleDeleteConfirm"
    />

    <!-- Mobile FAB -->
    <v-btn
      v-if="mobile"
      class="fab-btn"
      color="primary"
      icon="mdi-account-plus"
      location="bottom end"
      position="fixed"
      size="large"
      @click="showAddDialog = true"
    />
  </div>
</template>

<script setup lang="ts">
  import type { Cleaner } from '@/types/user'
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import StatCard from '@/components/dumb/shared/StatCard.vue'
  import { useCleanerManagement } from '@/composables/admin/useCleanerManagement'

  const router = useRouter()
  const { mobile } = useDisplay()
  const { allCleaners, loading, error: cleanerError, fetchCleaners, createCleaner, updateCleaner, deleteCleaner } = useCleanerManagement()

  // Reactive state
  const searchQuery = ref('')
  const statusFilter = ref<string | null>(null)
  const showAddDialog = ref(false)
  const editingCleaner = ref<Cleaner | null>(null)
  const formValid = ref(false)
  const saving = ref(false)
  const deleteDialog = ref(false)
  const cleanerToDelete = ref<Cleaner | null>(null)

  // Form data
  const formData = ref({
    name: '',
    email: '',
    skills: [] as string[],
    max_daily_bookings: 4,
  })

  const statusOptions = [
    { title: 'Active', value: 'active' },
    { title: 'Inactive', value: 'inactive' },
    { title: 'On Leave', value: 'on_leave' },
  ]

  const availableSkills = [
    'Standard Cleaning',
    'Deep Cleaning',
    'Move-in/Move-out',
    'Post-Construction',
    'Carpet Cleaning',
    'Window Cleaning',
    'Pressure Washing',
    'Organizing',
  ]

  const rules = {
    required: (value: string | number) => !!value || 'This field is required',
    email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email address',
    positive: (value: number) => value > 0 || 'Must be greater than 0',
  }

  const tableHeaders = computed(() => [
    { title: '', key: 'avatar', sortable: false, width: mobile.value ? 60 : 80 },
    { title: 'Cleaner', key: 'name', sortable: true },
    { title: 'Skills', key: 'skills', sortable: false },
    { title: 'Capacity', key: 'max_daily_bookings', sortable: true },
    { title: 'Status', key: 'status', sortable: false },
    { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
  ])

  const filteredCleaners = computed(() => {
    if (!searchQuery.value) return allCleaners.value
    const query = searchQuery.value.toLowerCase()
    return allCleaners.value.filter(c =>
      c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query),
    )
  })

  const cleanerStats = computed(() => ({
    total: allCleaners.value.length,
    available: Math.floor(allCleaners.value.length * 0.7),
    busy: Math.floor(allCleaners.value.length * 0.3),
  }))

  function getInitials (name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function viewSchedule (cleaner: Cleaner) {
    router.push(`/admin/schedule?cleaner=${cleaner.id}`)
  }

  function editCleaner (cleaner: Cleaner) {
    editingCleaner.value = cleaner
    formData.value = {
      name: cleaner.name,
      email: cleaner.email,
      skills: [...cleaner.skills],
      max_daily_bookings: cleaner.max_daily_bookings,
    }
    showAddDialog.value = true
  }

  function confirmDelete (cleaner: Cleaner) {
    cleanerToDelete.value = cleaner
    deleteDialog.value = true
  }

  async function handleDeleteConfirm () {
    if (!cleanerToDelete.value) return
    try {
      await deleteCleaner(cleanerToDelete.value.id)
      deleteDialog.value = false
      cleanerToDelete.value = null
    } catch (err) {
      console.error('Failed to delete cleaner:', err)
      cleanerError.value = err instanceof Error ? err.message : 'Failed to delete cleaner. Please try again.'
    }
  }

  async function saveCleaner () {
    saving.value = true
    try {
      await (editingCleaner.value
        ? updateCleaner(editingCleaner.value.id, formData.value)
        : createCleaner(formData.value))
      closeDialog()
    } catch (err) {
      console.error('Failed to save cleaner:', err)
      cleanerError.value = err instanceof Error ? err.message : 'Failed to save cleaner. Please try again.'
    } finally {
      saving.value = false
    }
  }

  function closeDialog () {
    showAddDialog.value = false
    editingCleaner.value = null
    formData.value = { name: '', email: '', skills: [], max_daily_bookings: 4 }
  }

  onMounted(() => {
    fetchCleaners()
  })
</script>

<style scoped>
.admin-cleaners-page {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}

.cleaners-content {
  min-height: 100vh;
}

.cleaners-header {
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

.cleaners-table {
  background: rgb(var(--v-theme-surface));
}

.cleaners-table :deep(.v-data-table__tbody tr) {
  cursor: pointer;
}

.cleaners-table :deep(.v-data-table__tbody tr:hover) {
  background: rgb(var(--v-theme-surface-variant));
}

.cleaners-table :deep(.v-data-table__td),
.cleaners-table :deep(.v-data-table__th) {
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.user-name-cell {
  min-width: 150px;
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
