<template>
  <div class="admin-system-users">
    <div class="users-content">
      <!-- Header (Desktop only) -->
      <div
        v-if="!mobile"
        class="users-header"
      >
        <v-container fluid>
          <v-row align="center">
            <v-col>
              <h1 class="text-h4 font-weight-bold mb-2">
                System Users
              </h1>
              <p class="text-subtitle-1 text-medium-emphasis">
                Manage all system users including admins, property owners, and cleaners
              </p>
            </v-col>
            <v-col cols="auto">
              <v-btn
                color="primary"
                prepend-icon="mdi-account-plus"
                @click="openAddUser"
              >
                Add User
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <!-- Stats Cards -->
      <div class="stats-section">
        <v-container fluid>
          <v-row>
            <v-col
              cols="6"
              md="3"
            >
              <v-card class="stat-card">
                <v-card-text class="pa-4">
                  <div class="d-flex align-center">
                    <v-icon
                      class="me-3"
                      color="primary"
                      size="32"
                    >
                      mdi-account-group
                    </v-icon>
                    <div>
                      <div class="text-h6 font-weight-bold">
                        {{ totalUsers }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        Total Users
                      </div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col
              cols="6"
              md="3"
            >
              <v-card class="stat-card">
                <v-card-text class="pa-4">
                  <div class="d-flex align-center">
                    <v-icon
                      class="me-3"
                      color="success"
                      size="32"
                    >
                      mdi-shield-account
                    </v-icon>
                    <div>
                      <div class="text-h6 font-weight-bold">
                        {{ adminCount }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        Admins
                      </div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col
              cols="6"
              md="3"
            >
              <v-card class="stat-card">
                <v-card-text class="pa-4">
                  <div class="d-flex align-center">
                    <v-icon
                      class="me-3"
                      color="info"
                      size="32"
                    >
                      mdi-home-account
                    </v-icon>
                    <div>
                      <div class="text-h6 font-weight-bold">
                        {{ ownerCount }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        Property Owners
                      </div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col
              cols="6"
              md="3"
            >
              <v-card class="stat-card">
                <v-card-text class="pa-4">
                  <div class="d-flex align-center">
                    <v-icon
                      class="me-3"
                      color="warning"
                      size="32"
                    >
                      mdi-broom
                    </v-icon>
                    <div>
                      <div class="text-h6 font-weight-bold">
                        {{ cleanerCount }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        Cleaners
                      </div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
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

      <!-- Filters and Search -->
      <div class="filters-section">
        <v-container fluid>
          <v-row align="center">
            <v-col
              cols="12"
              md="4"
            >
              <v-text-field
                v-model="searchQuery"
                clearable
                density="compact"
                label="Search users..."
                prepend-inner-icon="mdi-magnify"
              />
            </v-col>
            <v-col
              cols="6"
              md="2"
            >
              <v-select
                v-model="roleFilter"
                clearable
                density="compact"
                :items="roleOptions"
                label="Role"
              />
            </v-col>
            <v-col
              cols="6"
              md="2"
            >
              <v-select
                v-model="statusFilter"
                clearable
                density="compact"
                :items="statusOptions"
                label="Status"
              />
            </v-col>
            <v-col
              class="d-flex align-center gap-2"
              cols="12"
              md="4"
            >
              <v-chip
                v-if="filteredUsers.length !== allUsers.length"
                color="primary"
                size="small"
                variant="outlined"
              >
                {{ filteredUsers.length }} of {{ allUsers.length }} users
              </v-chip>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <!-- Users Table -->
      <div class="main-content">
        <v-container fluid>
          <v-card>
            <v-data-table
              class="users-table"
              :headers="tableHeaders"
              :items="filteredUsers"
              :loading="loading"
              :mobile-breakpoint="0"
              :search="searchQuery"
            >
              <template #[`item.avatar`]="{ item }">
                <v-avatar
                  class="ma-2"
                  :color="getRoleColor(item.role)"
                  :size="mobile ? 32 : 40"
                >
                  <span class="text-white font-weight-bold">
                    {{ getInitials(item.name) }}
                  </span>
                </v-avatar>
              </template>

              <template #[`item.name`]="{ item }">
                <div class="user-name-cell">
                  <div
                    class="user-name font-weight-medium"
                    :class="mobile ? 'text-body-2' : 'text-body-1'"
                  >
                    {{ item.name }}
                  </div>
                  <div
                    class="user-email text-medium-emphasis"
                    :class="mobile ? 'text-caption' : 'text-body-2'"
                  >
                    {{ item.email }}
                  </div>
                </div>
              </template>

              <template #[`item.role`]="{ item }">
                <v-chip
                  :color="getRoleColor(item.role)"
                  size="small"
                  variant="flat"
                >
                  {{ item.role }}
                </v-chip>
              </template>

              <template #[`item.status`]="{ item }">
                <v-chip
                  :color="getStatusColor(item)"
                  size="small"
                  variant="flat"
                >
                  {{ getStatusText(item) }}
                </v-chip>
              </template>

              <template #[`item.last_sign_in_at`]="{ item }">
                <div
                  class="last-activity"
                  :class="mobile ? 'text-caption' : 'text-body-2'"
                >
                  {{ item.last_sign_in_at ? formatDate(item.last_sign_in_at) : 'Never' }}
                </div>
              </template>

              <template #[`item.actions`]="{ item }">
                <div class="d-flex align-center gap-1">
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    @click.stop="openEditUser(item)"
                  />
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
                      <v-list-item @click="resetPassword(item)">
                        <v-list-item-title>Reset Password</v-list-item-title>
                      </v-list-item>
                      <v-divider />
                      <v-list-item
                        class="text-error"
                        @click="confirmDeleteUser(item)"
                      >
                        <v-list-item-title>Delete User</v-list-item-title>
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

    <!-- Mobile FAB -->
    <v-btn
      v-if="mobile"
      class="fab-btn"
      color="primary"
      icon="mdi-account-plus"
      location="bottom end"
      position="fixed"
      size="large"
      @click="openAddUser"
    />
  </div>
</template>

<script setup lang="ts">
  import type { User, UserFormData, UserRole } from '@/types/user'
  import { computed, onMounted, ref } from 'vue'
  import { useDisplay } from 'vuetify'
  import UserFormDialog from '@/components/dumb/admin/UserFormDialog.vue'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import { useAdminUserManagement } from '@/composables/admin/useAdminUserManagement'

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
  const searchQuery = ref('')
  const roleFilter = ref('')
  const statusFilter = ref('')
  const userDialog = ref(false)
  const editingUser = ref<User | null>(null)
  const saving = ref(false)
  const deleteDialog = ref(false)
  const userToDelete = ref<User | null>(null)

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

  // Table headers
  const tableHeaders = computed(() => [
    { title: '', key: 'avatar', sortable: false, width: mobile.value ? 60 : 80 },
    { title: 'User', key: 'name', sortable: true },
    { title: 'Role', key: 'role', sortable: true },
    { title: 'Status', key: 'status', sortable: true },
    { title: 'Last Activity', key: 'last_sign_in_at', sortable: true },
    { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
  ])

  // Computed stats
  const totalUsers = computed(() => allUsers.value.length)
  const adminCount = computed(() => allUsers.value.filter((u: User) => u.role === 'admin').length)
  const ownerCount = computed(() => allUsers.value.filter((u: User) => u.role === 'owner').length)
  const cleanerCount = computed(() => allUsers.value.filter((u: User) => u.role === 'cleaner').length)

  const filteredUsers = computed(() => {
    let users = [...allUsers.value]

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      users = users.filter((user: User) =>
        user.name.toLowerCase().includes(query)
        || user.email.toLowerCase().includes(query),
      )
    }

    if (roleFilter.value) {
      users = users.filter((user: User) => user.role === roleFilter.value)
    }

    if (statusFilter.value) {
      users = users.filter((user: User) => getStatusText(user).toLowerCase() === statusFilter.value)
    }

    return users
  })

  // Helpers
  function getInitials (name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
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
    await removeUser(userToDelete.value.id)
    deleteDialog.value = false
    userToDelete.value = null
  }

  function resetPassword (user: User) {
    console.log('Reset password for:', user.name)
  // TODO: Implement password reset flow
  }

  // Initialize
  onMounted(() => {
    fetchAllUsers()
  })
</script>

<style scoped>
.admin-system-users {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}

.users-content {
  min-height: 100vh;
}

.users-header {
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

.users-table {
  background: rgb(var(--v-theme-surface));
}

.users-table :deep(.v-data-table__tbody tr) {
  cursor: pointer;
}

.users-table :deep(.v-data-table__tbody tr:hover) {
  background: rgb(var(--v-theme-surface-variant));
}

.user-name-cell {
  min-width: 150px;
}

.user-name {
  line-height: 1.2;
}

.user-email {
  line-height: 1.1;
  margin-top: 2px;
}

.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
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
