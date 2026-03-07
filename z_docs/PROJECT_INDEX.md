# Claro3 Project Index

**Project**: Multi-tenant property cleaning scheduler  
**Tech Stack**: Vue 3 + Vite + Vuetify 3, Pinia, Supabase  
**Date Generated**: 2026-02-21

---

## 📁 Root Level Structure

```
claro3/
├── .claude/                    # Claude Code settings
├── .cursor/                    # Cursor IDE config
├── .serena/                    # Serena tools config
├── .specstory/                 # Test specifications
├── .vscode/                    # VS Code settings
├── docs/                       # Documentation
├── e2e/                        # End-to-end tests
├── public/                     # Static assets
├── scripts/                    # Build/utility scripts
├── src/                        # Main source code
├── supabase/                   # Supabase migrations & config
├── CLAUDE.md                   # Project guidelines
├── package.json                # Dependencies
├── pnpm-lock.yaml             # Lock file
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite config
├── vitest.config.ts           # Vitest config
├── vercel.json                # Vercel deployment config
└── [other config files]
```

---

## 🎯 Main Source Structure (`src/`)

### **Components** (`src/components/`)

#### **Dumb Components** (Pure UI, no business logic)
```
src/components/dumb/
├── admin/
│   ├── AdminBookingForm.vue
│   ├── AdminCalendarControls.vue
│   ├── AdminQuickActions.vue
│   ├── AdminRoleSwitcher.vue
│   ├── BookingDetailsModal.vue
│   ├── BulkRoleChangeDialog.vue
│   ├── CleanerAssignmentModal.vue
│   ├── PerformanceMetricsDashboard.vue
│   ├── TurnPriorityPanel.vue
│   └── UserFormDialog.vue
├── owner/
│   ├── OwnerBookingForm.vue
│   ├── OwnerCalendarControls.vue
│   ├── OwnerDayViewBottomSheet.vue
│   ├── OwnerPropertyForm.vue
│   └── OwnerQuickActions.vue
├── shared/
│   ├── ConfirmationDialog.vue
│   ├── DashboardSidebar.vue
│   ├── DatePickerModal.vue
│   ├── EnhancedToast.vue
│   ├── ErrorAlert.vue
│   ├── InvoiceEditor.vue
│   ├── LoadingSpinner.vue
│   ├── MobileBottomNav.vue
│   ├── PropertyCard.vue
│   ├── PWANotifications.vue
│   ├── PWAStatusCard.vue
│   ├── QuickActionsFab.vue
│   ├── RecentItemsList.vue
│   ├── SkeletonLoader.vue
│   ├── SmartNavigationPanel.vue
│   ├── StatsCardGrid.vue
│   ├── ThemePicker.vue
│   ├── TrendChart.vue
│   ├── TurnAlerts.vue
│   ├── TurnPriorityBadge.vue
│   ├── UpcomingCleanings.vue
│   ├── UpcomingScheduleCard.vue
│   ├── UrgentTurnIndicator.vue
│   └── WelcomeBanner.vue
├── BookingForm.vue
└── PropertyModal.vue
```

#### **Smart Components** (Data-aware, orchestration)
```
src/components/smart/
├── admin/
│   ├── AdminCalendar.vue
│   ├── AdminDashboard.vue
│   ├── AdminProperties.vue
│   ├── AdminPropertyOwners.vue
│   ├── AdminSidebar.vue
│   ├── AdminUsers.vue
│   ├── HomeAdmin.vue
│   └── README.md
├── owner/
│   ├── HomeOwner.vue
│   ├── OwnerCalendar.vue
│   ├── OwnerProperties.vue
│   ├── OwnerSidebar.vue
│   └── README.md
├── FullCalendar.vue
└── README.md
```

---

### **Composables** (`src/composables/`)

#### **Owner Composables**
```
src/composables/owner/
├── useOwnerBookings.ts        # Owner booking operations
├── useOwnerCalendarState.ts   # Owner calendar state
├── useOwnerErrorHandler.ts    # Owner error handling
├── useOwnerProperties.ts      # Owner property management
└── admin/
    ├── useAdminBookings.ts    # Admin booking operations
    ├── useAdminCalendarState.ts
    ├── useAdminErrorHandler.ts
    ├── useAdminProperties.ts
    ├── useAdminUserManagement.ts
    ├── useCleanerManagement.ts
    └── README.md
```

#### **Shared Composables**
```
src/composables/shared/
├── useBackgroundSync.ts       # Background sync logic
├── useBookings.ts             # Booking utilities
├── useCalendarState.ts        # Calendar state management
├── useComponentEventLogger.ts # Event logging
├── useErrorHandler.ts         # Error handling
├── useLoadingState.ts         # Loading state
├── usePerformanceMonitor.ts   # Performance monitoring
├── useProperties.ts           # Property utilities
├── usePushNotifications.ts    # Push notifications
├── usePWA.ts                  # PWA functionality
├── useResponsiveLayout.ts     # Responsive layout
└── useSwipeNavigation.ts      # Swipe navigation
```

#### **Supabase Composables**
```
src/composables/supabase/
├── useRealtimeSync.ts         # Realtime database sync
├── useSupabaseAuth.ts         # Authentication
├── useSupabaseBookings.ts     # Booking queries
├── useSupabaseProperties.ts   # Property queries
└── enable-leaked-password-management.ts
```

---

### **Stores** (Pinia State) (`src/stores/`)

```
src/stores/
├── auth.ts                    # Authentication state
├── booking.ts                 # Booking state (Map-based collections)
├── property.ts                # Property state (Map-based collections)
├── ownerData.ts               # Owner-specific data
├── adminData.ts               # Admin-specific data
└── ui.ts                      # UI state (theme, layout, etc.)
```

---

### **Pages** (`src/pages/`)

#### **Admin Pages**
```
src/pages/admin/
├── dashboard.vue              # Admin dashboard
├── index.vue                  # Admin home
├── bookings/index.vue         # Admin booking management
├── cleaners/index.vue         # Cleaner management
├── properties/index.vue       # Property management
├── property-owners/index.vue  # Property owner management
├── reports/index.vue          # Reports & analytics
├── schedule/index.vue         # Admin schedule view
└── users/index.vue            # User management
```

#### **Owner Pages**
```
src/pages/owner/
├── dashboard.vue              # Owner dashboard
├── calendar.vue               # Calendar view
├── profile.vue                # Owner profile
├── bookings/index.vue         # Booking management
├── properties/
│   ├── index.vue             # Property list
│   ├── create.vue            # Create property
│   ├── edit.vue              # Edit property
│   └── view.vue              # Property details
```

#### **Auth Pages**
```
src/pages/auth/
├── login.vue                  # Login page
└── register.vue               # Registration page
```

#### **Other Pages**
```
src/pages/
├── 404.vue                    # 404 page
├── demoadmin.vue              # Demo admin page
├── invoice.vue                # Invoice page
└── properties/index.vue       # Shared properties page
```

---

### **Types** (`src/types/`)

```
src/types/
├── booking.ts                 # Booking type definitions
├── property.ts                # Property type definitions
├── user.ts                    # User type definitions
├── api.ts                     # API response types
├── ui.ts                      # UI state types
├── router.ts                  # Router types
├── env.d.ts                   # Environment variables
├── build.d.ts                 # Build-time definitions
├── pwa.d.ts                   # PWA types
└── index.ts                   # Type exports
```

---

### **Utils** (`src/utils/`)

```
src/utils/
├── businessLogic.ts           # Core booking/cleaning rules
├── timeDefaults.ts            # Time validation & defaults
├── authHelpers.ts             # Authentication utilities
├── constants.ts               # Application constants
├── errorMessages.ts           # Centralized error messages
├── typeHelpers.ts             # TypeScript type helpers
└── mobileViewport.ts          # Mobile viewport utilities
```

---

### **Layouts** (`src/layouts/`)

```
src/layouts/
├── default.vue                # Default layout
├── auth.vue                   # Auth layout
├── admin.vue                  # Admin layout
└── owner.vue                  # Owner layout
```

---

### **Plugins** (`src/plugins/`)

```
src/plugins/
├── supabase.ts                # Supabase client config
└── vuetify.ts                 # Vuetify config & theme
```

---

### **Router** (`src/router/`)

```
src/router/
├── index.ts                   # Route definitions
└── guards.ts                  # Route guards & auth checks
```

---

### **Assets & Styles**

```
src/
├── assets/
│   └── main.css              # Global styles
├── styles/
│   ├── variables.scss        # SCSS variables
│   └── responsive.scss       # Responsive utilities
└── App.vue                   # Root component
```

---

### **Tests** (`src/__tests__/`)

```
src/__tests__/
├── components/
│   └── SimpleTest.spec.ts
├── composables/
│   ├── owner/
│   │   └── useOwnerBookings.spec.ts
│   └── admin/
│       └── useAdminBookings.spec.ts
├── stores/
│   ├── booking.spec.ts
│   ├── property.spec.ts
│   └── ui.spec.ts
├── utils/
│   ├── performance-regression.spec.ts
│   └── test-utils.ts
└── setup/
    ├── setupTests.ts
    └── cssStub.js
```

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Build config, chunking strategy, path aliases |
| `tsconfig.json` | TypeScript strict mode, path mappings |
| `vitest.config.ts` | Test framework configuration |
| `eslint.config.js` | Linting rules (Vue 3, TS strict) |
| `.eslintrc.json` | ESLint config |
| `playwright.config.ts` | E2E test configuration |
| `vercel.json` | Vercel deployment config |
| `deployment.config.ts` | Deployment settings |
| `manifest.webmanifest` | PWA manifest |

---

## 🎨 Key Concepts

### **Role-Based Separation**
- **Owner**: 30-40 clients with personal property/booking management
- **Admin**: 1 user with system-wide operations and cleaner management
- Separate component trees, pages, stores for each role

### **Smart vs Dumb Components**
- **Dumb** (`src/components/dumb/`): Pure UI, receives props, emits events
- **Smart** (`src/components/smart/`): Data-aware, orchestration logic

### **State Management Pattern**
- Pinia stores with `Map`-based collections
- Cached filtered Maps with TTL-based invalidation
- O(1) data access and optimistic updates

### **Composables Organization**
- Owner/Admin specific composables
- Shared cross-cutting concerns
- Supabase integration layer
- Reuse before adding new composables

---

## 🚀 Quick Commands

```bash
pnpm dev                       # Start dev server
pnpm build                     # Production build
pnpm test                      # Run tests
pnpm test:performance          # Performance regression tests
pnpm lint                      # Lint with auto-fix
pnpm analyze:bundle            # Bundle size analysis
```

---

## 📋 Important Files to Know

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project guidelines & architecture decisions |
| `src/utils/businessLogic.ts` | Core booking/cleaning rules |
| `src/utils/timeDefaults.ts` | Time validation & defaults |
| `src/stores/auth.ts` | Authentication state source of truth |
| `src/router/guards.ts` | Route protection & auth checks |
| `src/types/` | Domain type definitions |

---

**Generated with Serena Tools**
