# Claro Admin UI Kit

The **Business Admin** interface — desktop-first, system-wide. Single admin user manages all cleaners, all properties, and all bookings across every owner.

## Files
- `index.html` — interactive click-through prototype (Dashboard, All Properties, All Bookings, Users, Cleaners)
- `Shell.jsx` — App bar + grouped admin drawer
- `Pages.jsx` — Dashboard, AllProperties, AllBookings, Users, Cleaners
- (shares `shared.jsx` with owner kit — copied in for standalone use)

## Design notes
- Canvas is 1280px wide (desktop-first)
- Drawer has 3 grouped sections: **Administration** · **Business Overview** · **Quick Actions**
- Data tables are dense (56px rows); filters are pill-style outlined chips above the table
- Urgent / unassigned cleanings get the red-bordered warning card (top of Dashboard)
