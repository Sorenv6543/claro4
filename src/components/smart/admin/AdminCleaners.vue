<template>
  <div class="admin-cleaners-page">
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

    <!-- Cleaners Data Table -->
    <AppDataTable
      :active-filter-count="activeFilterCount"
      :headers="tableHeaders"
      :items="filteredCleaners"
      :loading="loading"
      :search-keys="['name', 'email']"
      searchable
      subtitle="Manage cleaner profiles, skills, and availability"
      title="Cleaners"
    >
      <!-- Header actions -->
      <template #header-actions>
        <v-btn
          color="primary"
          prepend-icon="mdi-account-plus"
          @click="showAddDialog = true"
        >
          Add Cleaner
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

      <!-- Avatar Column -->
      <template #[`item.avatar`]="{ item }">
        <v-avatar
          class="my-1"
          color="success"
          :size="mobile ? 28 : 32"
        >
          <span class="text-white font-weight-bold">
            {{ getInitials(item.name as string) }}
          </span>
        </v-avatar>
      </template>

      <!-- Cleaner Name Column -->
      <template #[`item.name`]="{ item }">
        <div style="min-width: 150px">
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

      <!-- Skills Column -->
      <template #[`item.skills`]="{ item }">
        <div class="d-flex flex-wrap ga-1 py-1">
          <v-chip
            v-for="skill in (item.skills as string[]).slice(0, 2)"
            :key="skill"
            size="x-small"
            variant="outlined"
          >
            {{ skill }}
          </v-chip>

          <v-chip
            v-if="(item.skills as string[]).length > 2"
            size="x-small"
            variant="outlined"
          >
            +{{ (item.skills as string[]).length - 2 }}
          </v-chip>
        </div>
      </template>

      <!-- Capacity Column -->
      <template #[`item.max_daily_bookings`]="{ item }">
        <v-chip color="info" size="small" variant="tonal">
          {{ item.max_daily_bookings }}/day
        </v-chip>
      </template>

      <!-- Status Column -->
      <template #[`item.status`]>
        <v-chip color="success" size="small" variant="flat">
          Active
        </v-chip>
      </template>

      <!-- Actions Column -->
      <template #[`item.actions`]="{ item }">
        <div class="d-flex align-center ga-1">
          <v-tooltip location="top" text="Edit">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                icon="mdi-pencil-outline"
                size="small"
                variant="text"
                v-bind="tooltipProps"
                @click.stop="editCleaner(item as unknown as Cleaner)"
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
              <v-list-item @click="viewSchedule(item as unknown as Cleaner)">
                <template #prepend>
                  <v-icon>mdi-calendar</v-icon>
                </template>

                <v-list-item-title>View Schedule</v-list-item-title>
              </v-list-item>

              <v-divider />

              <v-list-item
                class="text-error"
                @click="confirmDelete(item as unknown as Cleaner)"
              >
                <v-list-item-title>Delete Cleaner</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </template>
    </AppDataTable>

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
  </div>
</template>

<script setup lang="ts">
  import type { Cleaner } from '@/types/user'
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import AppDataTable from '@/components/dumb/shared/AppDataTable.vue'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import StatCard from '@/components/dumb/shared/StatCard.vue'
  import { useCleanerManagement } from '@/composables/admin/useCleanerManagement'

  const router = useRouter()
  const { mobile } = useDisplay()
  const { allCleaners, loading, error: cleanerError, createCleaner, updateCleaner, deleteCleaner } = useCleanerManagement()

  // Reactive state
  const statusFilter = ref<string | null>(null)
  const selectedSegment = ref('all')
  const showAddDialog = ref(false)
  const editingCleaner = ref<Cleaner | null>(null)
  const formValid = ref(false)
  const saving = ref(false)
  const deleteDialog = ref(false)
  const cleanerToDelete = ref<Cleaner | null>(null)

  // Segments
  const segments = [
    { title: 'All', value: 'all' },
  ]

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

  // Active filter count
  const activeFilterCount = computed(() => {
    let count = 0
    if (statusFilter.value) count++
    return count
  })

  // Table headers with mobileHidden
  const tableHeaders = computed(() => [
    { title: '', key: 'avatar', sortable: false, width: 50 },
    { title: 'Cleaner', key: 'name', sortable: true },
    { title: 'Skills', key: 'skills', sortable: false, mobileHidden: true },
    { title: 'Capacity', key: 'max_daily_bookings', sortable: true, width: '110px', mobileHidden: true },
    { title: 'Status', key: 'status', sortable: false, width: '100px', mobileHidden: true },
    { title: '', key: 'actions', sortable: false, align: 'end' as const, width: '60px' },
  ])

  const filteredCleaners = computed(() => {
    let cleaners = allCleaners.value

    // Status filter — no-op until `status` field is added to the Cleaner type.
    // All cleaners are currently treated as 'active'.
    if (statusFilter.value && statusFilter.value !== 'active') {
      cleaners = []
    }

    return cleaners
  })

  const cleanerStats = computed(() => ({
    total: allCleaners.value.length,
    available: allCleaners.value.length,
    busy: 0,
  }))

  function getInitials (name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function viewSchedule (cleaner: Cleaner) {
    router.push(`/admin/calendar?cleaner=${cleaner.id}`)
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
    } catch (error) {
      console.error('Failed to delete cleaner:', error)
      cleanerError.value = error instanceof Error ? error.message : 'Failed to delete cleaner. Please try again.'
    }
  }

  async function saveCleaner () {
    saving.value = true
    try {
      await (editingCleaner.value
        ? updateCleaner(editingCleaner.value.id, formData.value)
        : createCleaner(formData.value))
      closeDialog()
    } catch (error) {
      console.error('Failed to save cleaner:', error)
      cleanerError.value = error instanceof Error ? error.message : 'Failed to save cleaner. Please try again.'
    } finally {
      saving.value = false
    }
  }

  function closeDialog () {
    showAddDialog.value = false
    editingCleaner.value = null
    formData.value = { name: '', email: '', skills: [], max_daily_bookings: 4 }
  }

</script>

<style scoped>
.admin-cleaners-page {
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
