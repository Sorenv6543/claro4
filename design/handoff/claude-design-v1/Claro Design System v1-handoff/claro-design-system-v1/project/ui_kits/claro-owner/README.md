# Claro Owner UI Kit

The **Property Owner** interface — personal property & booking management, mobile-first. Owners are 30-40 clients using Claro to manage their own rental properties and bookings.

## Files
- `index.html` — interactive click-through prototype (Overview, Properties, Bookings, Calendar)
- `Shell.jsx` — App bar + drawer scaffolding
- `Overview.jsx` — Hero welcome card + stat tiles
- `Properties.jsx` — Property list with color-coded rows
- `Bookings.jsx` — Booking list
- `Calendar.jsx` — Month view with event bars
- `shared.jsx` — Buttons, chips, avatar, icon helpers

## Design notes
- Mobile canvas is 420px wide; desktop expands to 1200px
- Active route: purple-tint background (#F0EEFF) + purple text
- Property rows have a 4px colored left-border (5-color cycle)
- Hero "Welcome back" card is the ONLY gradient surface in the product
