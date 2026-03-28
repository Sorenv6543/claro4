<script setup lang="ts">
  interface TablesDataRow {
    fullName: string
    email: string
    startDate: string
    salary: string
    age: number
    status: number
    avatar?: string
    post: string
  }

  // Mock data - replace with actual data source
  const data: TablesDataRow[] = [
    {
      fullName: 'John Doe',
      email: 'john@example.com',
      startDate: '2024-01-15',
      salary: '$50,000',
      age: 28,
      status: 1,
      post: 'Senior Developer',
    },
  ]

  const headers = [
    { title: 'NAME', key: 'fullName' },
    { title: 'EMAIL', key: 'email' },
    { title: 'DATE', key: 'startDate' },
    { title: 'SALARY', key: 'salary' },
    { title: 'AGE', key: 'age' },
    { title: 'STATUS', key: 'status' },
  ]

  function avatarText (fullName: string): string {
    return fullName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  function resolveStatusVariant (status: number) {
    switch (status) {
      case 1: {
        return { color: 'primary', text: 'Current' }
      }
      case 2: {
        return { color: 'success', text: 'Professional' }
      }
      case 3: {
        return { color: 'error', text: 'Rejected' }
      }
      case 4: {
        return { color: 'warning', text: 'Resigned' }
      }
      default: {
        return { color: 'info', text: 'Applied' }
      }
    }
  }
</script>

<template>
  <VDataTable
    class="text-no-wrap"
    :headers="headers"
    :items="data"
    :items-per-page="5"
  >
    <!-- full name -->
    <template #item.fullName="{ item }">
      <div class="d-flex align-center">
        <VAvatar
          :class="item.avatar ? '' : 'v-avatar-light-bg primary--text'"
          :color="item.avatar ? '' : 'primary'"
          size="32"
          :variant="!item.avatar ? 'tonal' : undefined"
        >
          <VImg
            v-if="item.avatar"
            :src="item.avatar"
          />
          <span
            v-else
            class="text-sm"
          >{{ avatarText(item.fullName) }}</span>
        </VAvatar>
        <div class="d-flex flex-column ms-3">
          <span class="d-block font-weight-medium text-high-emphasis text-truncate">{{ item.fullName }}</span>
          <small>{{ item.post }}</small>
        </div>
      </div>
    </template>

    <template #item.status="{ item }">
      <VChip
        class="font-weight-medium"
        :color="resolveStatusVariant(item.status).color"
        size="small"
      >
        {{ resolveStatusVariant(item.status).text }}
      </VChip>
    </template>
  </VDataTable>
</template>
