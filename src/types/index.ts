/**
 * Central type exports for the Property Cleaning Scheduler
 */

// API types
export * from './api'

// Booking types
export * from './booking'

// Property types
export * from './property'

// Team types
export type { CleanerTeam, CleanerTeamFormData } from './team'
export { isCleanerTeam } from './team'

// Router types
export * from './router'

// UI types - export everything except UserRole
export type {
  AccessibilityOptions,
  ApiError,
  BusinessImpact,
  CalendarEvent,
  CalendarView,
  ConfirmDialogState,
  // Skip UserRole since it's already exported from './user'
  ErrorCategory,
  ErrorContext,
  ErrorHandlingOptions,
  ErrorInfo,
  ErrorRecoveryAction,
  FilterState,
  FilterValue,
  FormValidationState,
  LoadingOperation,
  LoadingState,
  LoadingStateOptions,
  LoadingType,
  ModalData,
  ModalState,
  Notification,
  NotificationAction,
  NotificationQueueConfig,
  NotificationType,
  RetryConfig,
  RoleBasedNotification,
  ValidationError,
} from './ui'

// User types
export * from './user'
