<!-- 
👑 ADMIN INTERFACE
 src/components/smart/admin/HomeAdmin.vue - 

✅ UNFILTERED VIEW - Admin sees all data
✅ Access to all properties across all owners
✅ System-wide metrics and controls
✅ Can manage any owner's data 

 -->
<template>
  <div class="home-admin-layout">
    <!-- Main Dashboard Content (sidebar and header are now in admin layout) -->
    <AdminDashboard />
  </div>
   
  <!-- Owner-focused Modals -->

  <PropertyModal
    :open="propertyModalOpen"
    :mode="propertyModalMode"
    :property="propertyModalData"
    @close="handlePropertyModalClose"
    @save="handlePropertyModalSave"
    @delete="handlePropertyModalDelete"
  />

  <ConfirmationDialog
    :open="confirmDialogOpen"
    :title="confirmDialogTitle"
    :message="confirmDialogMessage"
    :confirm-text="confirmDialogConfirmText"
    :cancel-text="confirmDialogCancelText"
    :dangerous="confirmDialogDangerous"
    @confirm="handleConfirmDialogConfirm"
    @cancel="handleConfirmDialogCancel"
    @close="handleConfirmDialogClose"
  />
</template>

<script setup lang="ts">


// ============================================================================
// UI STATE - MODAL MANAGEMENT
// ============================================================================

// Event Modal
const eventModalOpen = computed(() => uiStore.isModalOpen('eventModal'));
const eventModalMode = computed(() => {
  const modal = uiStore.getModalState('eventModal');
  return (modal?.mode as 'create' | 'edit') || 'create';
});
const eventModalData = computed(() => {
  const modal = uiStore.getModalState('eventModal');
  return modal?.data as Booking | undefined;
});

// Property Modal
const propertyModalOpen = computed(() => uiStore.isModalOpen('propertyModal'));
const propertyModalMode = computed(() => {
  const modal = uiStore.getModalState('propertyModal');
  return (modal?.mode as 'create' | 'edit') || 'create';
});
const propertyModalData = computed(() => {
  const modal = uiStore.getModalState('propertyModal');
  return modal?.data as Property | undefined;
});

// Confirmation Dialog
const confirmDialogOpen = computed(() => uiStore.isConfirmDialogOpen('confirmDialog'));
const confirmDialogTitle = computed(() => {
  const dialog = uiStore.getConfirmDialogState('confirmDialog');
  return dialog?.title || 'Confirm';
});
const confirmDialogMessage = computed(() => {
  const dialog = uiStore.getConfirmDialogState('confirmDialog');
  return dialog?.message || 'Are you sure you want to proceed?';
});
const confirmDialogConfirmText = computed(() => {
  const dialog = uiStore.getConfirmDialogState('confirmDialog');
  return dialog?.confirmText || 'Confirm';
});
const confirmDialogCancelText = computed(() => {
  const dialog = uiStore.getConfirmDialogState('confirmDialog');
  return dialog?.cancelText || 'Cancel';
});
const confirmDialogDangerous = computed(() => {
  const dialog = uiStore.getConfirmDialogState('confirmDialog');
  return dialog?.dangerous || false;
});
const confirmDialogData = computed(() => {
  const dialog = uiStore.getConfirmDialogState('confirmDialog');
  return dialog?.data;
});


// ============================================================================
// CONFIRMATION DIALOG HANDLERS
// ============================================================================

const handleConfirmDialogConfirm = async (): Promise<void> => {
  const data = confirmDialogData.value;
  
  if (data?.type === 'booking' && data?.id) {
    try {
      // Admin can delete any booking - no ownership check needed
      await deleteBooking(data.id as string);
      uiStore.closeModal('eventModal');
    } catch (error) {
      console.error('Failed to delete booking:', error);
    }
  } else if (data?.type === 'property' && data?.id) {
    try {
      // Admin can delete any property - no ownership check needed
      await deleteProperty(data.id as string);
      uiStore.closeModal('propertyModal');
    } catch (error) {
      console.error('Failed to delete property:', error);
    }
  }
  
  uiStore.closeConfirmDialog('confirmDialog');
};

const handleConfirmDialogCancel = (): void => {
  uiStore.closeConfirmDialog('confirmDialog');
};

const handleConfirmDialogClose = (): void => {
  uiStore.closeConfirmDialog('confirmDialog');
};

// ============================================================================
// SIDEBAR MANAGEMENT
// ============================================================================


const _toggleSidebar = (): void => {
  sidebarOpen.value = !sidebarOpen.value;
};

// ============================================================================
// LIFECYCLE HOOKS
// ============================================================================

console.log('🔄 [HomeAdmin] Admin component script setup running...');

// Watch for template rendering (proper debugging)
watch(isAdminAuthenticated, (newValue) => {
  console.log('🎨 [HomeAdmin] Template will render, isAdminAuthenticated:', newValue);
}, { immediate: true });

onMounted(async () => {
  console.log('🚀 [HomeAdmin] Admin component mounted successfully!');
  // Wait for auth to be properly initialized
  if (authStore.loading) {
    console.log('⏳ [HomeAdmin] Auth store still loading, waiting...');
    const maxWait = 5000; // 5 seconds max
    const startTime = Date.now();
    while (authStore.loading && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('🔍 [HomeAdmin] Auth state after waiting:', {
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    loading: authStore.loading,
    isAdminAuthenticated: isAdminAuthenticated.value
  });
  
  if (isAdminAuthenticated.value) {
    console.log('✅ [HomeAdmin] User is authenticated as admin, loading system data...');
    try {
      // Fetch ALL data across system - admin has full access
      await Promise.all([
        propertyStore.fetchProperties(),
        bookingStore.fetchBookings(),
        fetchAllUsers()
      ]);
      console.log('✅ [HomeAdmin] System data loaded successfully');
      
      // Debug data after loading
      console.log('🔍 [HomeAdmin] System data state after loading:', {
        allProperties: allProperties.value.length,
        allBookings: allBookings.value.length,
        allUsers: allUsers.value.length,
        systemMetrics: systemMetrics.value,
        propertyMetrics: systemPropertyMetrics.value
      });
      
    } catch (error) {
      console.error('❌ [HomeAdmin] Failed to load system data:', error);
    }
  } else {
    console.warn('⚠️ [HomeAdmin] User is not authenticated as admin, redirecting or showing error');
  }
});

onUnmounted(() => {
  // Cleanup if needed
});

// ============================================================================
// RESPONSIVE BEHAVIOR
// ============================================================================

watch(xs, (newValue) => {
  if (newValue) {
    sidebarOpen.value = false;
  }
});

// Watch for authentication changes
watch(isAdminAuthenticated, async (newValue, oldValue) => {
  console.log('🔄 [HomeAdmin] isAdminAuthenticated changed:', { 
    from: oldValue, 
    to: newValue,
    user: authStore.user
  });
  if (newValue && !oldValue) {
    // User became authenticated as admin - load all system data
    console.log('✅ [HomeAdmin] User gained admin authentication, loading system data...');
    try {
      await Promise.all([
        propertyStore.fetchProperties(),
        bookingStore.fetchBookings(),
        fetchAllUsers()
      ]);
      console.log('✅ [HomeAdmin] System data loaded after auth change');
    } catch (error) {
      console.error('❌ [HomeAdmin] Failed to load system data after auth change:', error);
    }
  } else if (!newValue && oldValue) {
    // User lost admin authentication
    console.log('⚠️ [HomeAdmin] User lost admin authentication');
  }
});
</script>

<style scoped>
/* ================================================================ */
/* ADMIN-SPECIFIC LAYOUT STYLES */
/* ================================================================ */

.home-admin-layout {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.calendar-main-container {
  flex: 1;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: margin-left 0.3s ease-in-out;
  margin-left: 0;
}

.calendar-main-container.sidebar-open {
  margin-left: 280px; /* Match sidebar width */
}

/* Responsive behavior - overlay on mobile */
@media (max-width: 959px) {
  .calendar-main-container.sidebar-open {
    margin-left: 0; /* No push on mobile */
  }
  
  .main-app-header.sidebar-open {
    margin-left: 0; /* No push on mobile */
  }
}

.calendar-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.calendar-header-card {
  flex-shrink: 0;
  border-bottom: 1px solid rgb(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  height: 48px;
  min-height: 48px;
  max-height: 48px;
}

.prominent-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.9) 100%) !important;
  border-bottom: 3px solid rgba(var(--v-theme-secondary), 0.8) !important;
  height: 80px !important;
  min-height: 80px !important;
  max-height: 80px !important;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.25) !important;
}

/* Admin-specific header styling */
.admin-header {
  background: linear-gradient(135deg, #d32f2f 0%, rgba(211, 47, 47, 0.9) 100%) !important;
  border-bottom: 3px solid rgba(255, 152, 0, 0.8) !important;
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.25) !important;
}

.calendar-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
  height: calc(100% - 80px); /* Subtract admin header height */
}

/* Admin-specific navigation arrows */
.nav-arrow-prominent.admin-nav {
  background: rgba(255, 255, 255, 0.95) !important;
  color: #d32f2f !important;
  border: 2px solid rgba(255, 255, 255, 0.8) !important;
}

.nav-arrow-prominent.admin-nav:hover {
  background: rgba(255, 255, 255, 1) !important;
  transform: scale(1.05) !important;
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.2) !important;
}

/* Admin month display */
.month-display-prominent.admin-month {
  background: rgba(255, 255, 255, 0.95);
  color: #d32f2f;
  padding: 12px 24px;
  border-radius: 16px;
  text-align: center;
  min-width: 250px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.admin-metrics {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(211, 47, 47, 0.8);
  line-height: 1;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ================================================================ */
/* MAIN APP HEADER - ADMIN STYLING */
/* ================================================================ */

.main-app-header {
  background: white !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  border-bottom: 1px solid #e0e0e0 !important;
  z-index: 19 !important;
  transition: margin-left 0.3s ease-in-out;
  margin-left: 0;
}

.main-app-header.sidebar-open {
  margin-left: 280px;
}

.app-title {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.brand-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-icon {
  background: #1976d2;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.1rem;
}

/* Admin brand styling */
.brand-icon.admin-brand {
  background: #d32f2f;
  border: 2px solid #ff9800;
  animation: admin-pulse 3s infinite;
}

@keyframes admin-pulse {
  0% { 
    box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.7);
  }
  70% { 
    box-shadow: 0 0 0 6px rgba(211, 47, 47, 0);
  }
  100% { 
    box-shadow: 0 0 0 0 rgba(211, 47, 47, 0);
  }
}

.brand-text {
  color: #d32f2f;
  font-weight: 700;
  font-size: 1.1rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.main-app-header .v-app-bar-nav-icon {
  color: #d32f2f !important;
}

.main-app-header .v-app-bar-nav-icon:hover {
  background: rgba(211, 47, 47, 0.05) !important;
}

/* ================================================================ */
/* ADMIN SPEED DIAL ACTIONS */
/* ================================================================ */

.speed-dial-action {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
  width: 140px;
  margin-bottom: 8px;
}

.speed-dial-action .text-body-2 {
  justify-self: end;
  white-space: nowrap;
  color: #d32f2f;
  font-weight: 600;
}

.speed-dial-action .v-fab {
  justify-self: center;
}

/* ================================================================ */
/* RESPONSIVE MOBILE-FIRST ENHANCEMENTS */
/* ================================================================ */

@media (max-width: 959px) {
  .home-admin-layout {
    height: 100vh !important;
    height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom)) !important;
  }
  
  .calendar-main-container {
    height: calc(100vh - 56px - env(safe-area-inset-top) - env(safe-area-inset-bottom)) !important;
    margin-top: calc(56px + env(safe-area-inset-top)) !important;
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .prominent-header.admin-header {
    height: 70px !important;
    min-height: 70px !important;
    max-height: 70px !important;
  }
  
  .calendar-content {
    height: calc(100% - 70px) !important;
  }
  
  .month-display-prominent.admin-month {
    min-width: 180px !important;
    padding: 8px 16px !important;
  }
}

@media (min-width: 960px) {
  .calendar-main-container {
    margin-left: 0;
    height: calc(100vh - 56px) !important;
    margin-top: 56px !important;
  }
}
</style>

