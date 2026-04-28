<template>
    <div class="admin-profile">
<AdminProfile />
    </div>
</template>

<script setup lang="ts">                                                
import AdminProfile from '@/components/smart/admin/AdminProfile.vue';
defineOptions({
    name: 'AdminProfile',
})
</script>

<style scoped>
.admin-profile {
    height: 100%;
}
</style>