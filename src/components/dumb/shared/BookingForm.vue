<template>
  <v-dialog
    v-model="isOpen"
    max-width="700px"
    max-height="90vh"
    persistent
    scrollable
    @keydown.esc="handleClose"
  >
    <v-card class="modal-card">
      <v-card-title class="text-h5 pb-2 shrink-0">
        {{ formTitle }}
        <v-chip
          v-if="form.booking_type === 'turn'"
          color="error"
          size="small"
          class="ml-2"
        >
          URGENT TURN
        </v-chip>
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="modal-content">
        <v-form
          ref="formRef"
          v-model="formValid"
          @submit.prevent="handleSubmit"
        >
          <v-container>
            <!-- Property Selection -->
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="form.property_id"
                  :items="propertiesArray"
                  item-title="name"
                  item-value="id"
                  label="Property"
                  :rules="propertyRules"
                  required
                  variant="outlined"
                  :disabled="loading"
                  :error-messages="errors.get('property_id')"
                  prepend-inner-icon="mdi-home"
                />
              </v-col>
            </v-row>
            
            <!-- Dates -->
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <DatePickerField
                  v-model="form.checkin_date"
                  label="Checkin Date"
                  :rules="dateRules"
                  :disabled="loading"
                  hint="When guests arrive"
                  :error-messages="errors.get('checkin_date')"
                  @update:model-value="updateBookingType"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <DatePickerField
                  v-model="form.checkout_date"
                  label="Checkout Date"
                  :rules="dateRules"
                  :disabled="loading"
                  hint="When guests depart"
                  :error-messages="errors.get('checkout_date')"
                  @update:model-value="updateBookingType"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <TimePickerField
                  v-model="form.checkin_time"
                  label="Checkin Time"
                  :rules="timeRules"
                  :disabled="loading"
                  hint="When guests arrive"
                  :error-messages="errors.get('checkin_time')"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <TimePickerField
                  v-model="form.checkout_time"
                  label="Checkout Time"
                  :rules="timeRules"
                  :disabled="loading"
                  hint="When guests depart"
                  :error-messages="errors.get('checkout_time')"
                />
              </v-col>
            </v-row>
            
            <!-- Booking Type and Guest Count -->
            <v-row>
              <v-col>
                <v-select
                  v-model="form.booking_type"
                  :items="bookingTypeItems"
                  label="Booking Type"
                  :rules="bookingTypeRules"
                  required
                  variant="outlined"
                  :disabled="loading"
                  :error-messages="errors.get('booking_type')"
                  prepend-inner-icon="mdi-tag"
                />
                
                <v-checkbox
                  v-model="autoDetectType"
                  label="Auto-detect booking type from dates"
                  :disabled="loading"
                />
              </v-col>
              
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model.number="form.guest_count"
                  label="Guest Count"
                  type="number"
                  min="1"
                  variant="outlined"
                  :disabled="loading"
                  :error-messages="errors.get('guest_count')"
                  hint="Optional"
                  persistent-hint
                  prepend-inner-icon="mdi-account-group"
                />
              </v-col>
            </v-row>
            
            <!-- Notes -->
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="form.notes"
                  label="Notes"
                  variant="outlined"
                  :disabled="loading"
                  :error-messages="errors.get('notes')"
                  hint="Special instructions, requirements, etc."
                  persistent-hint
                  :counter="500"
                  rows="3"
                  prepend-inner-icon="mdi-note-text"
                />
              </v-col>
            </v-row>
            
            <!-- Status (Edit mode only) -->
            <v-row v-if="mode === 'edit'">
              <v-col cols="12">
                <v-select
                  v-model="form.status"
                  :items="statusItems"
                  label="Status"
                  variant="outlined"
                  :disabled="loading"
                  :error-messages="errors.get('status')"
                  prepend-inner-icon="mdi-progress-check"
                />
              </v-col>
            </v-row>
            
            <!-- Turn Booking Warning -->
            <v-row v-if="showTurnWarning">
              <v-col cols="12">
                <v-alert
                  type="warning"
                  variant="tonal"
                  title="Same-Day Turnover"
                  text="This booking has same-day checkout and checkin dates, which typically indicates a 'turn' booking (urgent same-day cleaning between guests)."
                  class="mb-0"
                />
              </v-col>
            </v-row>
            
            <!-- Turn Booking Error -->
            <v-row v-if="showTurnError">
              <v-col cols="12">
                <v-alert
                  type="error"
                  variant="tonal"
                  title="Invalid Turn Booking"
                  text="Turn bookings must have checkout and checkin on the same day. Please adjust dates or change booking type to standard."
                  class="mb-0"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
      
      <v-divider />
      
      <v-card-actions>
        <v-btn
          color="grey-darken-1"
          variant="text"
          :disabled="loading"
          @click="handleClose"
        >
          Cancel
        </v-btn>
        
        <v-spacer />
        
        <v-btn
          v-if="mode === 'edit'"
          color="error"
          variant="text"
          :disabled="loading"
          :loading="loading"
          @click="handleDelete"
        >
          Delete
        </v-btn>
        
        <v-btn
          color="primary"
          variant="text"
          :disabled="formValid === false || loading || showTurnError"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ submitButtonText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import DatePickerField from '@components/dumb/shared/DatePickerField.vue'
import TimePickerField from '@components/dumb/shared/TimePickerField.vue'
import { usePropertyStore } from '@/stores/property';
import type { Booking, BookingFormData, BookingStatus, BookingType, Property } from '@/types';
import type { VForm } from 'vuetify/components';

// PROPS & EMITS
interface Props {
  open?: boolean;
  mode?: 'create' | 'edit';
  booking?: Booking;
  initialData?: Partial<BookingFormData>;
}

interface Emits {
  (e: 'close'): void;
  (e: 'save', booking: BookingFormData): void;
  (e: 'delete', id: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  mode: 'create',
  booking: undefined,
  initialData: undefined
});

const emit = defineEmits<Emits>();

// STORES
const propertyStore = usePropertyStore();

// FORM REFS
const formRef = ref<VForm | null>(null);
const formValid = ref<boolean | null>(null);
const loading = ref<boolean>(false);
const errors = ref<Map<string, string>>(new Map());
const autoDetectType = ref<boolean>(true);

// FORM DATA
const form = reactive<Partial<BookingFormData>>({
  property_id: '',
  checkout_date: '',
  checkin_date: '',
  checkout_time: '',
  checkin_time: '',
  booking_type: 'standard',
  guest_count: undefined,
  notes: '',
  status: 'pending',
  owner_id: '', // Will be set by the parent component
});

// COMPUTED PROPERTIES
const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => {
    if (!value) emit('close');
  }
});

const formTitle = computed((): string => {
  return props.mode === 'create' ? 'Create Booking' : 'Edit Booking';
});

const submitButtonText = computed((): string => {
  return props.mode === 'create' ? 'Create' : 'Save';
});

const propertiesArray = computed((): Property[] => {
  return propertyStore.activeProperties;
});

// Check if dates indicate a turn booking (same day)
const isTurnBooking = computed((): boolean => {
  if (!form.checkout_date || !form.checkin_date) return false;
  
  const checkoutDate = new Date(form.checkout_date as string);
  const checkinDate = new Date(form.checkin_date as string);
  
  if (isNaN(checkoutDate.getTime()) || isNaN(checkinDate.getTime())) {
    return false;
  }
  
  return checkoutDate.toDateString() === checkinDate.toDateString();
});

// Show warning if dates indicate turn but type is standard
const showTurnWarning = computed((): boolean => {
  return isTurnBooking.value && form.booking_type === 'standard';
});

// Show error if type is turn but dates are not same day
const showTurnError = computed((): boolean => {
  return !isTurnBooking.value && form.booking_type === 'turn';
});

// DROPDOWN OPTIONS
const bookingTypeItems = [
  { title: 'Standard Booking', value: 'standard', subtitle: 'Regular cleaning with time gap between guests' },
  { title: 'Turn (Urgent)', value: 'turn', subtitle: 'Same-day checkout/checkin, high priority' }
];

const statusItems = [
  { title: 'Pending', value: 'pending' },
  { title: 'Scheduled', value: 'scheduled' },
  { title: 'In Progress', value: 'in_progress' },
  { title: 'Completed', value: 'completed' },
  { title: 'Cancelled', value: 'cancelled' }
];

// VALIDATION RULES
const propertyRules = [
  (v: string) => !!v || 'Property is required',
  (v: string) => {
    const property = propertyStore.getPropertyById(v);
    return !!property || 'Selected property does not exist';
  }
];

const dateRules = [
  (v: string) => !!v || 'Date is required',
  (v: string) => {
    const date = new Date(v);
    return !isNaN(date.getTime()) || 'Invalid date format';
  }
];

const bookingTypeRules = [
  (v: string) => !!v || 'Booking type is required',
  (v: string) => ['standard', 'turn'].includes(v) || 'Invalid booking type'
];

// Time validation rules for time input fields
const timeRules = [
  (v: string) => !!v || 'Time is required',
  (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v) || 'Invalid time format (HH:MM, 24-hour)'
];

// METHODS
// Automatically update booking type based on dates if auto-detect is enabled
function updateBookingType(): void {
  if (!autoDetectType.value) return;
  if (!form.checkout_date || !form.checkin_date) return;
  
  const checkoutDate = new Date(form.checkout_date as string);
  const checkinDate = new Date(form.checkin_date as string);
  
  if (isNaN(checkoutDate.getTime()) || isNaN(checkinDate.getTime())) {
    return;
  }
  
  const isSameDay = checkoutDate.toDateString() === checkinDate.toDateString();
  form.booking_type = isSameDay ? 'turn' : 'standard';
}

// Reset form to default or to booking data
function resetForm(): void {
  errors.value.clear();
  
  if (props.mode === 'edit' && props.booking) {
    // Populate form with existing booking data
    // Convert dates to the format expected by Vuetify date inputs (YYYY-MM-DD)
    const checkoutDate = props.booking.checkout_date;
    const checkinDate = props.booking.checkin_date;
    
    Object.assign(form, {
      property_id: props.booking.property_id,
      checkout_date: formatDateForInput(checkoutDate),
      checkin_date: formatDateForInput(checkinDate),
      checkin_time: (props.booking.checkin_time || '15:00').slice(0, 5),
      checkout_time: (props.booking.checkout_time || '11:00').slice(0, 5),
      booking_type: props.booking.booking_type,
      guest_count: props.booking.guest_count,
      notes: props.booking.notes,
      status: props.booking.status,
      priority: props.booking.priority || 'normal',
      owner_id: props.booking.owner_id
    });
  } else {
    // Reset to defaults for create mode, but use initial data if provided
    const defaults = {
      property_id: '',
      checkout_date: '',
      checkin_date: '',
      checkin_time: '15:00',
      checkout_time: '11:00',
      booking_type: 'standard',
      guest_count: undefined,
      notes: '',
      status: 'pending',
      priority: 'normal' as const,
      owner_id: ''
    };
    
    // Merge defaults with initial data, mapping calendar date properties
    const initialData = props.initialData || {};
    const formData = { 
      ...defaults, 
      ...initialData,
      // FullCalendar events use 'start' for arrival (checkin) and 'end' for departure (checkout)
      checkin_date: initialData.start || initialData.checkin_date || '',
      checkout_date: initialData.end || initialData.checkout_date || ''
    };
    
    // Format dates if they exist
    if (formData.checkout_date) {
      formData.checkout_date = formatDateForInput(String(formData.checkout_date));
    }
    if (formData.checkin_date) {
      formData.checkin_date = formatDateForInput(String(formData.checkin_date));
    }
    
    Object.assign(form, formData);
  }
}

// Validate form
async function validate(): Promise<boolean> {
  errors.value.clear();
  
  if (!formRef.value) return false;
  
  const { valid } = await formRef.value.validate();
  if (!valid) return false;
  
  // Additional validation
  const checkoutDate = new Date(String(form.checkout_date || ''));
  const checkinDate = new Date(String(form.checkin_date || ''));
  
  // Check if dates are valid
  if (isNaN(checkoutDate.getTime()) || isNaN(checkinDate.getTime())) {
    errors.value.set('checkout_date', 'Invalid date format');
    errors.value.set('checkin_date', 'Invalid date format');
    return false;
  }
  // Guests check in first (arrival), then check out later (departure).
  // checkout_date must be on or after checkin_date; same day is valid for turn bookings.
  if (checkoutDate < checkinDate) {
    errors.value.set('checkout_date', 'Checkout date must be on or after checkin date');
    return false;
  }

  // For same-day (turn) bookings, checkout time must be after checkin time.
  if (checkoutDate.toDateString() === checkinDate.toDateString() && form.checkout_time && form.checkin_time) {
    if (form.checkout_time <= form.checkin_time) {
      errors.value.set('checkout_time', 'For same-day bookings, checkout time must be after checkin time');
      return false;
    }
  }

  // Check turn booking consistency
  if (form.booking_type === 'turn' && !isTurnBooking.value) {
    errors.value.set('booking_type', 'Turn bookings must have checkout and checkin on the same day');
    return false;
  }
  
  // All validation passed
  return true;
}

// Handle form submission
async function handleSubmit(): Promise<void> {
  loading.value = true;
  
  try {
    const isValid = await validate();
    if (!isValid) {
      loading.value = false;
      return;
    }
    
    // Ensure all required fields are present
    if (!form.property_id || !form.checkout_date || !form.checkin_date || !form.booking_type) {
      errors.value.set('form', 'Please fill in all required fields');
      loading.value = false;
      return;
    }
    
    // Prepare data for emission
    const bookingData: BookingFormData = {
      property_id: form.property_id,
      checkout_date: form.checkout_date,
      checkin_date: form.checkin_date,
      checkin_time: (form.checkin_time as string) || '15:00',
      checkout_time: (form.checkout_time as string) || '11:00',
      booking_type: form.booking_type as BookingType,
      status: (form.status as BookingStatus) || 'pending',
      priority: (form.priority as 'low' | 'normal' | 'high' | 'urgent') || 'normal',
      owner_id: form.owner_id as string,
      guest_count: form.guest_count,
      notes: form.notes
    };
    
    // Emit save event with booking data
    emit('save', bookingData);
    
    // Reset and close (parent component will handle actual saving)
    loading.value = false;
    resetForm();
    isOpen.value = false;
  } catch (err) {
    console.error('Error submitting form:', err);
    errors.value.set('form', err instanceof Error ? err.message : 'An error occurred');
    loading.value = false;
  }
}

// Handle booking deletion
function handleDelete(): void {
  if (props.mode !== 'edit' || !props.booking) return;
  
  loading.value = true;
  emit('delete', props.booking.id);
  
  // Parent component will handle actual deletion
  loading.value = false;
  isOpen.value = false;
}

// Handle modal close
function handleClose(): void {
  resetForm();
  emit('close');
}

// Format date for input field (ensure YYYY-MM-DD format)
function formatDateForInput(dateStr: string): string {
  if (!dateStr) return '';
  
  // If it's already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Try to parse and format the date
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateStr);
      return '';
    }
    
    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', dateStr, error);
    return '';
  }
}

// LIFECYCLE HOOKS
onMounted(() => {
  resetForm();
});

// WATCHERS
watch(() => props.open, (newValue) => {
  if (newValue) {
    nextTick(() => {
      resetForm();
    });
  }
});

watch(() => props.booking, (newBooking, oldBooking) => {
  if (props.open && props.mode === 'edit' && newBooking && newBooking.id !== oldBooking?.id) {
    resetForm();
  }
});

watch(() => props.initialData, (newInitialData) => {
  if (props.open && props.mode === 'create' && newInitialData) {
    resetForm();
  }
});
</script>

<style scoped>
.v-alert {
  margin-top: 8px;
}

/* Modal viewport constraints */
.modal-card {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-content {
  overflow-y: auto;
  flex: 1;
  max-height: calc(90vh - 120px); /* Subtract header and footer space */
}
</style> 