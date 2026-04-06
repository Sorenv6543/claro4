<template>
  <div class="admin-system-users">
    <!-- Stats Cards -->
    <div class="stats-section">
      <v-container fluid>
        <v-row density="compact">
          <v-col cols="6" md="3">
            <StatCard color="primary" icon="mdi-account-group" label="Total Users" :value="totalUsers" />
          </v-col>
          <v-col cols="6" md="3">
            <StatCard color="success" icon="mdi-shield-account" label="Admins" :value="adminCount" />
          </v-col>
          <v-col cols="6" md="3">
            <StatCard color="info" icon="mdi-home-account" label="Property Owners" :value="ownerCount" />
          </v-col>
          <v-col cols="6" md="3">
            <StatCard color="warning" icon="mdi-broom" label="Cleaners" :value="cleanerCount" />
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Error Alert -->
    <v-container
      v-if="error"
      class="py-2"
      fluid
    >
      <v-alert
        closable
        type="error"
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>
    </v-container>

    <!-- Users Data Table -->
    <MaterioDataTable
      :active-filter-count="activeFilterCount"
      :headers="tableHeaders"
      :items="filteredUsers"
      :loading="loading"
      :search-keys="['name', 'email']"
      searchable
      subtitle="Manage all system users including admins, property owners, and cleaners"
      title="System Users"
    >
      <!-- Header actions -->
      <template #header-actions>
        <v-btn
          color="primary"
          prepend-icon="mdi-account-plus"
          @click="openAddUser"
        >
          Add User
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
            rounded="lg"
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
          <v-col cols="6" md="2" sm="3">
            <v-select
              v-model="roleFilter"
              clearable
              density="compact"
              hide-details
              :items="roleOptions"
              placeholder="Role"
              variant="outlined"
            />
          </v-col>
          <v-col cols="6" md="2" sm="3">
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
          :color="getRoleColor(item.role as UserRole)"
          :size="mobile ? 28 : 32"
        >
          <span class="text-white font-weight-bold">
            {{ getInitials(item.name as string) }}
          </span>
        </v-avatar>
      </template>

      <!-- User Name Column -->
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

      <!-- Role Column -->
      <template #[`item.role`]="{ item }">
        <v-chip
          class="text-capitalize"
          :color="getRoleColor(item.role as UserRole)"
          size="small"
          variant="flat"
        >
          {{ item.role }}
        </v-chip>
      </template>

      <!-- Status Column -->
      <template #[`item.status`]="{ item }">
        <v-chip
          :color="getStatusColor(item as unknown as User)"
          size="small"
          variant="flat"
        >
          {{ getStatusText(item as unknown as User) }}
        </v-chip>
      </template>

      <!-- Last Activity Column -->
      <template #[`item.last_sign_in_at`]="{ item }">
        <span
          class="text-body-2"
          :class="mobile ? 'text-caption' : ''"
        >
          {{ item.last_sign_in_at ? formatDate(item.last_sign_in_at as string) : 'Never' }}
        </span>
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
                @click.stop="openEditUser(item as unknown as User)"
              />
            </template>
          </v-tooltip>
          <v-menu>
            <template #activator="{ props: menuProps }">
              <v-btn
                icon="mdi-dots-vertical"
                size="small"
                variant="text"
                v-bind="menuProps"
                @click.stop
              />
            </template>
            <v-list>
              <v-list-item @click="resetPassword(item as unknown as User)">
                <v-list-item-title>Reset Password</v-list-item-title>
              </v-list-item>
              <v-divider />
              <v-list-item
                class="text-error"
                @click="confirmDeleteUser(item as unknown as User)"
              >
                <v-list-item-title>Delete User</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </template>
    </MaterioDataTable>

    <!-- Add/Edit User Dialog -->
    <UserFormDialog
      v-model="userDialog"
      :is-editing="!!editingUser"
      :loading="saving"
      :user="editingUser"
      @submit="handleUserSubmit"
    />

    <!-- Delete Confirmation Dialog -->
    <ConfirmationDialog
      confirm-text="Delete"
      dangerous
      :message="`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`"
      :open="deleteDialog"
      title="Delete User"
      @cancel="deleteDialog = false"
      @close="deleteDialog = false"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
  import UserFormDialog from '@/components/dumb/admin/UserFormDialog.vue'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import MaterioDataTable from '@/components/dumb/shared/MaterioDataTable.vue'
  import StatCard from '@/components/dumb/shared/StatCard.vue'
  import { useAdminUserManagement } from '@/composables/admin/useAdminUserManagement'
  import type { User, UserFormData, UserRole } from '@/types/user'
  import { computed, onMounted, ref } from 'vue'
  import { useDisplay } from 'vuetify'

  const { mobile } = useDisplay()
  const {
    users: allUsers,
    loading,
    error,
    fetchAllUsers,
    createUser,
    updateUser,
    deleteUser: removeUser,
  } = useAdminUserManagement()

  // Reactive state
  const roleFilter = ref('')
  const statusFilter = ref('')
  const selectedSegment = ref('all')
  const userDialog = ref(false)
  const editingUser = ref<User | null>(null)
  const saving = ref(false)
  const deleteDialog = ref(false)
  const userToDelete = ref<User | null>(null)

  // Segments
  const segments = [
    { title: 'All', value: 'all' },
    { title: 'Admins', value: 'admin' },
    { title: 'Owners', value: 'owner' },
    { title: 'Cleaners', value: 'cleaner' },
  ]

  // Filter options
  const roleOptions = [
    { title: 'Admin', value: 'admin' },
    { title: 'Property Owner', value: 'owner' },
    { title: 'Cleaner', value: 'cleaner' },
  ]

  const statusOptions = [
    { title: 'Active', value: 'active' },
    { title: 'Inactive', value: 'inactive' },
  ]

  // Active filter count
  const activeFilterCount = computed(() => {
    let count = 0
    if (roleFilter.value) count++
    if (statusFilter.value) count++
    return count
  })

  // Table headers with mobileHidden
  const tableHeaders = computed(() => [
    { title: '', key: 'avatar', sortable: false, width: 50 },
    { title: 'User', key: 'name', sortable: true },
    { title: 'Role', key: 'role', sortable: true, width: '110px', mobileHidden: true },
    { title: 'Status', key: 'status', sortable: true, width: '100px', mobileHidden: true },
    { title: 'Last Activity', key: 'last_sign_in_at', sortable: true, width: '140px', mobileHidden: true },
    { title: '', key: 'actions', sortable: false, align: 'end' as const, width: '100px', mobileHidden: true },
  ])

  // Computed stats
  const totalUsers = computed(() => allUsers.value.length)
  const adminCount = computed(() => allUsers.value.filter((u: User) => u.role === 'admin').length)
  const ownerCount = computed(() => allUsers.value.filter((u: User) => u.role === 'owner').length)
  const cleanerCount = computed(() => allUsers.value.filter((u: User) => u.role === 'cleaner').length)

  const filteredUsers = computed(() => {
    let users = [...allUsers.value]

    // Segment filter
    if (selectedSegment.value !== 'all') {
      users = users.filter((user: User) => user.role === selectedSegment.value)
    }

    // Role filter from collapsible filters
    if (roleFilter.value) {
      users = users.filter((user: User) => user.role === roleFilter.value)
    }

    // Status filter from collapsible filters
    if (statusFilter.value) {
      users = users.filter((user: User) => getStatusText(user).toLowerCase() === statusFilter.value)
    }

    return users
  })

  // Helpers
  function getInitials (name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function getRoleColor (role: UserRole): string {
    const colors: Record<UserRole, string> = {
      admin: 'error',
      owner: 'primary',
      cleaner: 'success',
    }
    return colors[role] || 'grey'
  }

  function getStatusColor (user: User): string {
    if (!user.created_at) return 'grey'
    if (user.last_sign_in_at) return 'success'
    return 'warning'
  }

  function getStatusText (user: User): string {
    if (!user.created_at) return 'Pending'
    if (user.last_sign_in_at) return 'Active'
    return 'Inactive'
  }

  function formatDate (dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Actions
  function openAddUser () {
    editingUser.value = null
    userDialog.value = true
  }

  function openEditUser (user: User) {
    editingUser.value = user
    userDialog.value = true
  }

  async function handleUserSubmit (formData: UserFormData) {
    saving.value = true
    try {
      if (editingUser.value) {
        const success = await updateUser(editingUser.value.id, {
          name: formData.name,
          role: formData.role,
          company_name: formData.company_name,
          access_level: formData.access_level as 'full' | 'limited',
          skills: formData.skills,
          max_daily_bookings: formData.max_daily_bookings,
          timezone: formData.timezone,
          language: formData.language,
          notifications_enabled: formData.notifications_enabled,
        })
        if (success) {
          userDialog.value = false
        }
      } else {
        const success = await createUser({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          company_name: formData.company_name,
          access_level: formData.access_level as 'full' | 'limited',
          skills: formData.skills,
          max_daily_bookings: formData.max_daily_bookings,
          timezone: formData.timezone,
          language: formData.language,
          notifications_enabled: formData.notifications_enabled,
        })
        if (success) {
          userDialog.value = false
        }
      }
    } catch (error_) {
      console.error('Failed to save user:', error_)
      error.value = error_ instanceof Error ? error_.message : 'Failed to save user. Please try again.'
    } finally {
      saving.value = false
    }
  }

  function confirmDeleteUser (user: User) {
    userToDelete.value = user
    deleteDialog.value = true
  }

  async function handleDeleteConfirm () {
    if (!userToDelete.value) return
    try {
      await removeUser(userToDelete.value.id)
      deleteDialog.value = false
      userToDelete.value = null
    } catch (error_) {
      console.error('Failed to delete user:', error_)
      error.value = error_ instanceof Error ? error_.message : 'Failed to delete user. Please try again.'
    }
  }

  function resetPassword (_user: User) {
    // TODO: Implement password reset flow
  }

  // Initialize
  onMounted(() => {
    fetchAllUsers()
  })
</script>

<style scoped>
.admin-system-users {
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
