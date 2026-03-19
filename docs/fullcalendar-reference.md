# FullCalendar v6 Reference

> Compiled from [fullcalendar.io/docs](https://fullcalendar.io/docs) (v6). Covers the APIs, options, views, events, styling, and plugins used in this project.

---

## Table of Contents

- [1. Getting Started](#1-getting-started)
  - [1.1 Installation (ES6 Build System)](#11-installation-es6-build-system)
  - [1.2 Installation (Script Tags)](#12-installation-script-tags)
  - [1.3 Vue 3 Integration](#13-vue-3-integration)
  - [1.4 Premium Plugins](#14-premium-plugins)
- [2. Calendar API](#2-calendar-api)
  - [2.1 Calendar Initialization & Rendering](#21-calendar-initialization--rendering)
  - [2.2 Dynamic Options (Get/Set)](#22-dynamic-options-getset)
  - [2.3 Calendar Methods](#23-calendar-methods)
  - [2.4 Handlers (Callbacks)](#24-handlers-callbacks)
  - [2.5 View-Specific Options](#25-view-specific-options)
- [3. Views](#3-views)
  - [3.1 DayGrid View](#31-daygrid-view)
  - [3.2 Month View](#32-month-view)
  - [3.3 TimeGrid View](#33-timegrid-view)
  - [3.4 List View](#34-list-view)
  - [3.5 Multi-Month Grid](#35-multi-month-grid)
  - [3.6 Multi-Month Stack](#36-multi-month-stack)
  - [3.7 Timeline View (Premium)](#37-timeline-view-premium)
  - [3.8 Vertical Resource View (Premium)](#38-vertical-resource-view-premium)
  - [3.9 Custom Views](#39-custom-views)
  - [3.10 View API](#310-view-api)
- [4. Events](#4-events)
  - [4.1 Event Object](#41-event-object)
  - [4.2 Event Sources](#42-event-sources)
  - [4.3 Event Display](#43-event-display)
  - [4.4 Event Render Hooks](#44-event-render-hooks)
  - [4.5 Event Clicking & Hovering](#45-event-clicking--hovering)
  - [4.6 Event Dragging & Resizing](#46-event-dragging--resizing)
  - [4.7 Event Popover](#47-event-popover)
  - [4.8 Background Events](#48-background-events)
- [5. Date & Time](#5-date--time)
  - [5.1 Date & Time Display](#51-date--time-display)
  - [5.2 Date Navigation](#52-date-navigation)
  - [5.3 Date Nav Links](#53-date-nav-links)
  - [5.4 Date Clicking & Selecting](#54-date-clicking--selecting)
  - [5.5 Week Numbers](#55-week-numbers)
  - [5.6 Now Indicator](#56-now-indicator)
  - [5.7 Business Hours](#57-business-hours)
- [6. Navigation & Toolbar](#6-navigation--toolbar)
  - [6.1 Toolbar Configuration](#61-toolbar-configuration)
  - [6.2 Button Text & Icons](#62-button-text--icons)
  - [6.3 Custom Buttons](#63-custom-buttons)
- [7. Styling & Theming](#7-styling--theming)
  - [7.1 CSS Customization](#71-css-customization)
  - [7.2 CSS Custom Properties (Variables)](#72-css-custom-properties-variables)
  - [7.3 Theme System](#73-theme-system)
  - [7.4 ClassName Inputs](#74-classname-inputs)
  - [7.5 Content Injection](#75-content-injection)
  - [7.6 Sizing](#76-sizing)
- [8. Plugins](#8-plugins)
  - [8.1 Plugin Index](#81-plugin-index)
  - [8.2 Standard Packages in This Project](#82-standard-packages-in-this-project)
- [9. Date Library](#9-date-library)
  - [9.1 Date Parsing](#91-date-parsing)
  - [9.2 Date Objects](#92-date-objects)
  - [9.3 Duration Object](#93-duration-object)
  - [9.4 Date Formatting](#94-date-formatting)
  - [9.5 Utility Methods](#95-utility-methods)
- [10. Resources (Premium)](#10-resources-premium)
- [11. International](#11-international)
- [12. Accessibility](#12-accessibility)
- [13. Complete Options Reference](#13-complete-options-reference)

---

## 1. Getting Started

### 1.1 Installation (ES6 Build System)

For projects using a build system (Webpack, Rollup, Vite), install packages via npm/yarn/pnpm:

```bash
npm install \
  @fullcalendar/core \
  @fullcalendar/daygrid \
  @fullcalendar/timegrid \
  @fullcalendar/list
```

Then import plugins and supply them to a `Calendar` instance:

```js
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,listWeek'
  }
})
calendar.render()
```

FullCalendar's functionality is broken into **plugins**. You only include plugins you need -- unused plugins are excluded from the bundle. The bare core does nothing by itself; you need at least one view plugin.

### 1.2 Installation (Script Tags)

**Standard bundle** (`fullcalendar`):

```html
<script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.20/index.global.min.js'></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar')
    var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth'
    })
    calendar.render()
  })
</script>
```

The standard `fullcalendar` bundle includes: `@fullcalendar/core`, `@fullcalendar/interaction`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/list`, `@fullcalendar/multimonth`.

**Premium bundle** (`fullcalendar-scheduler`) additionally includes: `@fullcalendar/adaptive`, `@fullcalendar/scrollgrid`, `@fullcalendar/timeline`, `@fullcalendar/resource`, `@fullcalendar/resource-daygrid`, `@fullcalendar/resource-timegrid`, `@fullcalendar/resource-timeline`.

**Individual plugin script tags** are also supported:

```html
<script src='https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.20/index.global.min.js'></script>
<script src='https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.20/index.global.min.js'></script>
```

### 1.3 Vue 3 Integration

This project uses `@fullcalendar/vue3` for Vue 3 integration:

```vue
<template>
  <FullCalendar :options="calendarOptions" />
</template>

<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import type { CalendarOptions } from '@fullcalendar/core'

const calendarOptions: CalendarOptions = {
  plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
  initialView: 'dayGridMonth',
  // ... other options
}
</script>
```

Key TypeScript types from `@fullcalendar/core`:
- `CalendarOptions` -- the options object type
- `DateSelectArg` -- argument for `select` callback
- `EventClickArg` -- argument for `eventClick` callback
- `EventDropArg` -- argument for `eventDrop` callback

From `@fullcalendar/interaction`:
- `EventResizeDoneArg` -- argument for `eventResize` callback

### 1.4 Premium Plugins

FullCalendar Premium (aka "FullCalendar Scheduler") provides:
- **Timeline View** -- horizontal time-axis with resources as rows
- **Vertical Resource View** -- resources displayed as columns
- **Print Optimization** -- improved print styling

Free trial license key: `'CC-Attribution-NonCommercial-NoDerivatives'`

```js
const calendar = new Calendar(calendarEl, {
  schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives'
})
```

---

## 2. Calendar API

### 2.1 Calendar Initialization & Rendering

| Option/Method | Description |
|---|---|
| `Calendar::render()` | Initially render the calendar, or rerender after initialization |
| `Calendar::batchRendering(callback)` | Group operations that cause rerenders into a single rerender |
| `render` | (option) Will initially render a calendar, or rerender it |
| `destroy` | Restores the container element to pre-initialization state |
| `rerenderDelay` | Milliseconds to wait before rerendering (default: batching) |

### 2.2 Dynamic Options (Get/Set)

You can get/set calendar options after initialization:

```js
// Get
calendar.getOption('locale')

// Set
calendar.setOption('locale', 'fr')
calendar.setOption('weekends', false)
```

### 2.3 Calendar Methods

**Date Navigation Methods:**

| Method | Description |
|---|---|
| `Calendar::prev()` | Move one step back (month, week, etc.) |
| `Calendar::next()` | Move one step forward |
| `Calendar::prevYear()` | Move back one year |
| `Calendar::nextYear()` | Move forward one year |
| `Calendar::today()` | Move to current date |
| `Calendar::gotoDate(date)` | Move to arbitrary date |
| `Calendar::incrementDate(duration)` | Move forward/backward arbitrary amount |
| `Calendar::getDate()` | Get current Date of the calendar |

**View Methods:**

| Method | Description |
|---|---|
| `Calendar::view` | Access the current View Object |
| `Calendar::changeView(viewName, dateOrRange?)` | Switch to a different view |

**Event Methods:**

| Method | Description |
|---|---|
| `Calendar::getEvents()` | Get all Event Objects |
| `Calendar::getEventById(id)` | Get a single Event Object by ID |
| `Calendar::addEvent(eventData, source?)` | Add an event programmatically |
| `Calendar::refetchEvents()` | Refetch events from all sources |

**Event Source Methods:**

| Method | Description |
|---|---|
| `Calendar::getEventSources()` | Get all EventSource Objects |
| `Calendar::getEventSourceById(id)` | Get a single EventSource |
| `Calendar::addEventSource(source)` | Add a new event source |

**Selection Methods:**

| Method | Description |
|---|---|
| `Calendar::select(start, end?)` | Programmatically select a date range |
| `Calendar::unselect()` | Clear current selection |

**Date Formatting Methods:**

| Method | Description |
|---|---|
| `Calendar::formatDate(date, settings)` | Format a date (inherits calendar locale/tz) |
| `Calendar::formatIso(date, omitTime?)` | Format to ISO8601 string |
| `Calendar::formatRange(start, end, settings)` | Format a date range |

**Sizing:**

| Method | Description |
|---|---|
| `Calendar::updateSize()` | Force calendar to readjust its size |
| `Calendar::scrollToTime(duration)` | Scroll current view to given time |

### 2.4 Handlers (Callbacks)

Handlers execute when something happens in the calendar. They are supplied as options:

```js
const calendar = new Calendar(calendarEl, {
  dateClick: function(info) {
    alert('Clicked on: ' + info.dateStr)
  },
  eventClick: function(info) {
    alert('Event: ' + info.event.title)
  }
})
```

Key callbacks are documented throughout this reference in their respective sections.

### 2.5 View-Specific Options

Options can be applied to specific views using the `views` object:

```js
const calendar = new Calendar(calendarEl, {
  // global option
  weekends: true,

  views: {
    dayGridMonth: {
      // option specific to dayGridMonth
      weekends: false
    },
    dayGrid: {
      // applies to all dayGrid-based views
    },
    timeGrid: {
      // applies to all timeGrid-based views
    }
  }
})
```

---

## 3. Views

### 3.1 DayGrid View

Displays one or more cells, each representing a day. **Plugin:** `@fullcalendar/daygrid`.

**Available views:** `dayGridMonth`, `dayGridWeek`, `dayGridDay`, `dayGridYear` (v6.1.0+), `dayGrid` (generic).

```js
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'

const calendar = new Calendar(calendarEl, {
  plugins: [dayGridPlugin],
  initialView: 'dayGridWeek',
  headerToolbar: {
    left: 'prev,next',
    center: 'title',
    right: 'dayGridWeek,dayGridDay'
  }
})
```

**Year View** (`dayGridYear`): Shows one continuous grid of cells for an entire year. First cell of each month is emphasized via `monthStartFormat`.

**Custom Duration DayGrid:**

```js
const calendar = new Calendar(calendarEl, {
  plugins: [dayGridPlugin],
  initialView: 'dayGridFourWeek',
  views: {
    dayGridFourWeek: {
      type: 'dayGrid',
      duration: { weeks: 4 }
    }
  }
})
```

**DayGrid-specific options:**

| Option | Description |
|---|---|
| `monthStartFormat` | Text format for first cell of each month when view spans months |

### 3.2 Month View

The Month view is a specific DayGrid view: `dayGridMonth`. **Plugin:** `@fullcalendar/daygrid`.

```js
const calendar = new Calendar(calendarEl, {
  plugins: [dayGridPlugin],
  initialView: 'dayGridMonth'
})
```

**Month-specific options:**

| Option | Description |
|---|---|
| `fixedWeekCount` | Number of weeks displayed (default `true` = always 6 rows) |
| `showNonCurrentDates` | Whether to render dates from adjacent months (default `true`) |

### 3.3 TimeGrid View

Displays horizontal days with a vertical time axis (midnight to midnight). **Plugin:** `@fullcalendar/timegrid`.

**Available views:** `timeGridWeek`, `timeGridDay`, `timeGrid` (generic).

```js
import { Calendar } from '@fullcalendar/core'
import timeGridPlugin from '@fullcalendar/timegrid'

const calendar = new Calendar(calendarEl, {
  plugins: [timeGridPlugin],
  initialView: 'timeGridWeek',
  headerToolbar: {
    left: 'prev,next',
    center: 'title',
    right: 'timeGridWeek,timeGridDay'
  }
})
```

**Custom Duration TimeGrid:**

```js
views: {
  timeGridFourDay: {
    type: 'timeGrid',
    duration: { days: 4 }
  }
}
```

**TimeGrid-specific options:**

| Option | Description |
|---|---|
| `eventMinHeight` | Minimum pixel height an event is allowed to be |
| `eventShortHeight` | Height threshold for "short" event style |
| `slotEventOverlap` | Whether timed events should visually overlap (default `true`) |
| `allDaySlot` | Whether to display the "all-day" slot at top (default `true`) |

**All-Day Render Hooks:** `allDayClassNames`, `allDayContent`, `allDayDidMount`, `allDayWillUnmount`

**Shared time-axis options used with TimeGrid:**

| Option | Description |
|---|---|
| `slotDuration` | Frequency for displaying time slots (default `'00:30:00'`) |
| `slotLabelInterval` | Frequency of slot labels |
| `slotLabelFormat` | Text displayed within a time slot |
| `slotMinTime` | First time slot displayed (default `'00:00:00'`) |
| `slotMaxTime` | Last time slot displayed (exclusive, default `'24:00:00'`) |
| `scrollTime` | Initial scroll position (default `'06:00:00'`) |
| `expandRows` | If rows don't fill height, expand to fit |
| `nowIndicator` | Display a current-time marker |
| `eventMaxStack` | Max events stacked left-to-right |

### 3.4 List View

Displays events in a simple vertical list. **Plugin:** `@fullcalendar/list`.

**Available views:** `listDay`, `listWeek`, `listMonth`, `listYear`, `list` (generic).

```js
import { Calendar } from '@fullcalendar/core'
import listPlugin from '@fullcalendar/list'

const calendar = new Calendar(calendarEl, {
  plugins: [listPlugin],
  initialView: 'listWeek'
})
```

If no events in the visible range, displays "No events to display" (customizable via render hooks).

**Event appearance** in list view: The event dot marker color matches `backgroundColor`. Use `eventDidMount` for deeper customization:

```js
eventDidMount: function(info) {
  if (info.event.extendedProps.status === 'done') {
    info.el.style.backgroundColor = 'red'
    var dotEl = info.el.getElementsByClassName('fc-event-dot')[0]
    if (dotEl) {
      dotEl.style.backgroundColor = 'white'
    }
  }
}
```

**List-specific options:**

| Option | Description |
|---|---|
| `listDayFormat` | Date format for left side of day headings |
| `listDaySideFormat` | Date format for right side of day headings |

**No-Events Render Hooks:** `noEventsClassNames`, `noEventsContent`, `noEventsDidMount`, `noEventsWillUnmount`

### 3.5 Multi-Month Grid

Displays multiple individual months in a responsive grid. **Plugin:** `@fullcalendar/multimonth`. Added in **v6.1.0**.

**Available views:** `multiMonthYear`, `multiMonth` (generic).

```js
import { Calendar } from '@fullcalendar/core'
import multiMonthPlugin from '@fullcalendar/multimonth'

const calendar = new Calendar(calendarEl, {
  plugins: [multiMonthPlugin],
  initialView: 'multiMonthYear'
})
```

`multiMonthYear` displays a 3x4 grid. Responsively shifts to 2x6 or 1x12 based on space.

**Custom Duration:**

```js
views: {
  multiMonthFourMonth: {
    type: 'multiMonth',
    duration: { months: 4 }
  }
}
```

**Multi-Month-specific options:**

| Option | Description |
|---|---|
| `multiMonthMaxColumns` | Max columns of months (set to `1` for stack) |
| `multiMonthMinWidth` | Minimum pixel width per mini-month (controls responsiveness) |
| `multiMonthTitleFormat` | Format of text above each month |

### 3.6 Multi-Month Stack

A single-column variant of Multi-Month Grid. Set `multiMonthMaxColumns: 1`. Months are separated by sticky headers.

```js
const calendar = new Calendar(calendarEl, {
  plugins: [multiMonthPlugin],
  initialView: 'multiMonthYear',
  multiMonthMaxColumns: 1
})
```

For a continuous grid without month headers, use `dayGridYear` instead.

### 3.7 Timeline View (Premium)

Horizontal time-axis with resources as rows. **Plugin:** `@fullcalendar/resource-timeline` (requires `@fullcalendar/resource`).

**Available views:** `resourceTimelineDay`, `resourceTimelineWeek`, `resourceTimelineMonth`, `resourceTimelineYear`, `resourceTimeline` (generic).

```js
import { Calendar } from '@fullcalendar/core'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'

const calendar = new Calendar(calendarEl, {
  plugins: [resourceTimelinePlugin],
  initialView: 'resourceTimelineWeek',
  resources: [
    { id: 'a', title: 'Room A' },
    { id: 'b', title: 'Room B' }
  ]
})
```

**Timeline-specific options:**

| Option | Description |
|---|---|
| `resourceGroupField` | Visually group resources by a property |
| `resourceAreaWidth` | Width of the resource list area (e.g. `'30%'`, `200`) |
| `resourceAreaColumns` | Turns resource area into a data grid |
| `resourcesInitiallyExpanded` | Whether child resources start expanded (default `true`) |
| `slotMinWidth` | Minimum pixel width of each time slot |
| `eventMinWidth` | Minimum pixel width an event is allowed to be |

**Timeline with no resources:** Use `@fullcalendar/timeline` plugin alone for a pure timeline without resource rows.

**Render Hooks:** Resource Group (`resourceGroupLabelClassNames`, etc.), Resource-Area Header (`resourceAreaHeaderClassNames`, etc.)

### 3.8 Vertical Resource View (Premium)

TimeGrid or DayGrid with resources as columns. **Plugin:** `@fullcalendar/resource-timegrid` or `@fullcalendar/resource-daygrid`.

```js
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'

const calendar = new Calendar(calendarEl, {
  plugins: [resourceTimeGridPlugin],
  initialView: 'resourceTimeGridDay',
  resources: [/* ... */]
})
```

| Option | Description |
|---|---|
| `datesAboveResources` | Whether date headings appear above resource headings |

### 3.9 Custom Views

Create views with custom time spans.

**Via Settings:**

```js
const calendar = new Calendar(calendarEl, {
  initialView: 'timeGridFourDay',
  views: {
    timeGridFourDay: {
      type: 'timeGrid',
      duration: { days: 4 }
    }
  }
})
```

**Duration settings:**

| Option | Description |
|---|---|
| `duration` | Exact duration of the custom view (`{ days: 4 }`, `{ weeks: 2 }`, etc.) |
| `dayCount` | Exact number of visible days (excludes hidden days) |
| `visibleRange` | Exact `{ start, end }` date range |

**Via JS:** For advanced developers, FullCalendar provides an API for building custom views with JavaScript code. See [Custom Views via JS](https://fullcalendar.io/docs/custom-view-with-js).

### 3.10 View API

| API | Description |
|---|---|
| `initialView` | The initial view when calendar loads (e.g. `'dayGridMonth'`) |
| `Calendar::view` | Access the current View Object |
| `Calendar::changeView(name, dateOrRange?)` | Switch views programmatically |

**View Object** properties: `type`, `title`, `activeStart`, `activeEnd`, `currentStart`, `currentEnd`, `calendar`. Passed into nearly every handler callback.

**View Render Hooks:** `viewClassNames`, `viewDidMount`, `viewWillUnmount`

---

## 4. Events

### 4.1 Event Object

An Event Object represents a scheduled event. Key properties:

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier |
| `groupId` | `string` | Group ID for related events |
| `allDay` | `boolean` | Whether it's an all-day event |
| `start` | `Date` | Start date/time |
| `end` | `Date \| null` | End date/time (exclusive) |
| `title` | `string` | Display text |
| `url` | `string` | URL to navigate to on click |
| `display` | `string` | `'auto'`, `'block'`, `'list-item'`, `'background'`, `'inverse-background'`, `'none'` |
| `backgroundColor` | `string` | Background color |
| `borderColor` | `string` | Border color |
| `textColor` | `string` | Text color |
| `classNames` | `string[]` | CSS class names |
| `extendedProps` | `object` | Custom properties hash |
| `source` | `EventSource` | The source this event came from |

**Event Object Methods:**

| Method | Description |
|---|---|
| `setProp(name, value)` | Set a standard property |
| `setExtendedProp(name, value)` | Set a custom property |
| `setStart(date, options?)` | Change start date |
| `setEnd(date)` | Change end date |
| `setDates(start, end, options?)` | Change both dates |
| `setAllDay(allDay, options?)` | Toggle all-day |
| `moveStart(delta)` | Move start by duration |
| `moveEnd(delta)` | Move end by duration |
| `moveDates(delta)` | Move both dates by duration |
| `formatRange(settings)` | Format the event's date range |
| `remove()` | Remove from calendar |
| `getResources()` | Get associated Resources (Premium) |
| `setResources(resources)` | Set associated Resources (Premium) |
| `toPlainObject(settings?)` | Convert to plain object |

**Event Data Parsing options:**

| Option | Description |
|---|---|
| `eventDataTransform` | Hook to transform event data before rendering |
| `defaultAllDay` | Default `allDay` for events without it specified |
| `defaultAllDayEventDuration` | Default duration for all-day events (default `{ days: 1 }`) |
| `defaultTimedEventDuration` | Default duration for timed events (default `'01:00:00'`) |
| `forceEventDuration` | Whether to force events to have an end |

**Event Mutation Callbacks:**

| Callback | Description |
|---|---|
| `eventAdd` | Fires after an event is added |
| `eventChange` | Fires after event data changes |
| `eventRemove` | Fires after an event is removed |
| `eventsSet` | Fires every time the event set changes |

**Recurring Events:** Supported via `daysOfWeek`, `startTime`, `endTime`, `startRecur`, `endRecur` on event objects, or via the **RRule Plugin** (`@fullcalendar/rrule`).

### 4.2 Event Sources

Events can be provided via multiple source types:

**As an Array:**
```js
events: [
  { title: 'Event 1', start: '2024-01-01' },
  { title: 'Event 2', start: '2024-01-05', end: '2024-01-07' }
]
```

**As a JSON Feed:**
```js
events: {
  url: '/api/events',
  method: 'GET',
  extraParams: { custom_param: 'value' },
  failure: function() { alert('Error fetching events') }
}
```

**As a Function:**
```js
events: function(fetchInfo, successCallback, failureCallback) {
  // fetchInfo has: start, end, startStr, endStr, timeZone
  successCallback([/* event array */])
}
```

**Event Source Object** properties:
- `id`, `url`, `method`, `extraParams`, `events` (array or function)
- `color`, `backgroundColor`, `borderColor`, `textColor`, `className`
- `display`, `overlap`, `constraint`, `allow`
- `defaultAllDay`, `eventDataTransform`

**Key options:**

| Option | Description |
|---|---|
| `eventSources` | Array of event source objects |
| `initialEvents` | Events for initial render (vs dynamic sources) |
| `eventSourceSuccess` | Global success transform for all sources |
| `eventSourceFailure` | Global failure handler for all sources |
| `startParam` | GET parameter name for range start (default `'start'`) |
| `endParam` | GET parameter name for range end (default `'end'`) |
| `timeZoneParam` | GET parameter name for timezone (default `'timeZone'`) |
| `lazyFetching` | Only fetch when date range actually changes (default `true`) |
| `loading` | Callback when event loading starts/stops: `function(isLoading)` |

**EventSource Methods:**

| Method | Description |
|---|---|
| `Calendar::getEventSources()` | Get all event sources |
| `Calendar::getEventSourceById(id)` | Get source by ID |
| `Calendar::addEventSource(source)` | Add new source |
| `Calendar::refetchEvents()` | Refetch all event sources |
| `EventSource::refetch()` | Refetch a single source |
| `EventSource::remove()` | Remove a source |

### 4.3 Event Display

| Option | Type | Description |
|---|---|---|
| `eventColor` | `string` | Shorthand for background + border color |
| `eventBackgroundColor` | `string` | Background color for all events |
| `eventBorderColor` | `string` | Border color for all events |
| `eventTextColor` | `string` | Text color for all events |
| `eventDisplay` | `string` | Default display type: `'auto'`, `'block'`, `'list-item'`, `'background'`, `'inverse-background'`, `'none'` |
| `eventTimeFormat` | `DateFormatter` | Time format within each event |
| `displayEventTime` | `boolean` | Whether to show time text |
| `displayEventEnd` | `boolean` | Whether to show end time |
| `nextDayThreshold` | `string` | When an event ends past midnight, the minimum time it must reach to render on the next day (default `'00:00:00'`). E.g. `'09:00:00'` means an event ending at 2am won't render on the next day |
| `eventOrder` | `string/function` | How to order events with the same start. String form: comma-separated field names (prefix with `-` for descending) |
| `eventOrderStrict` | `boolean` | Force strict ordering (default `false`) |
| `progressiveEventRendering` | `boolean` | Render events as they arrive from sources |

### 4.4 Event Render Hooks

Customize event DOM elements:

| Hook | Description |
|---|---|
| `eventClassNames` | ClassName input -- add CSS classes to event element |
| `eventContent` | Content injection -- custom inner HTML/DOM for events |
| `eventDidMount` | Called after event element is added to DOM |
| `eventWillUnmount` | Called before event element is removed from DOM |

Each hook receives an object with: `event` (Event Object), `timeText`, `isStart`, `isEnd`, `isMirror`, `isPast`, `isFuture`, `isToday`, `el` (DOM element), `view`.

**`eventContent` example:**
```js
eventContent: function(arg) {
  return { html: '<b>' + arg.event.title + '</b>' }
}
// or return a DOM node array:
eventContent: function(arg) {
  let el = document.createElement('span')
  el.innerHTML = arg.event.title
  return { domNodes: [el] }
}
```

### 4.5 Event Clicking & Hovering

| Callback | Description |
|---|---|
| `eventClick` | Triggered when an event is clicked. Receives `EventClickArg` with `event`, `el`, `jsEvent`, `view` |
| `eventMouseEnter` | Triggered when mouse enters an event |
| `eventMouseLeave` | Triggered when mouse leaves an event |

```js
eventClick: function(info) {
  info.jsEvent.preventDefault() // prevent browser navigation if url set
  alert('Event: ' + info.event.title)
}
```

### 4.6 Event Dragging & Resizing

Requires `@fullcalendar/interaction` plugin.

**Flag options:**

| Option | Type | Description |
|---|---|---|
| `editable` | `boolean` | Master switch for drag + resize |
| `eventStartEditable` | `boolean` | Whether event start can be changed by dragging |
| `eventResizableFromStart` | `boolean` | Whether events can be resized from their start |
| `eventDurationEditable` | `boolean` | Whether event duration can be changed by resizing |
| `eventResourceEditable` | `boolean` | Whether events can be dragged between resources (Premium) |
| `droppable` | `boolean` | Whether external elements can be dropped on calendar |

**Effect options:**

| Option | Description |
|---|---|
| `eventDragMinDistance` | Pixels mouse must move before drag starts |
| `dragRevertDuration` | Animation time for reverting an invalid drag (ms) |
| `dragScroll` | Auto-scroll containers during drag (default `true`) |
| `snapDuration` | Snap interval for dragging (default matches `slotDuration`) |
| `allDayMaintainDuration` | Keep event duration when moved between timed/all-day |
| `fixedMirrorParent` | DOM element to render drag mirror in |

**Control options:**

| Option | Description |
|---|---|
| `eventOverlap` | Whether events can overlap (boolean or function) |
| `eventConstraint` | Constrain events to a time range or `businessHours` |
| `eventAllow` | Programmatic control over where events can be dropped |
| `dropAccept` | CSS selector for which external elements to accept |

**Callbacks:**

| Callback | Description |
|---|---|
| `eventDragStart` | When dragging begins |
| `eventDragStop` | When dragging stops (even if reverted) |
| `eventDrop` | When event is dropped at a new position. Receives `EventDropArg` with `event`, `oldEvent`, `delta`, `revert()`, `el`, `view` |
| `drop` | When an external element is dropped |
| `eventReceive` | When an external event is dropped or event from another calendar |
| `eventLeave` | When an event is dragged away from this calendar |
| `eventResizeStart` | When resizing begins |
| `eventResizeStop` | When resizing stops |
| `eventResize` | When event is resized. Receives `EventResizeDoneArg` with `event`, `oldEvent`, `startDelta`, `endDelta`, `revert()`, `el`, `view` |

### 4.7 Event Popover

When too many events fit in a cell, a "+N more" link appears.

| Option | Type | Description |
|---|---|---|
| `dayMaxEventRows` | `boolean \| number` | Limit event rows; excess shows "+more" link |
| `dayMaxEvents` | `boolean \| number` | Limit events per day; excess shows "+more" link. `true` = auto based on cell height |
| `eventMaxStack` | `number` | Max events stacked (timeline: top-to-bottom, timeGrid: left-to-right) |
| `moreLinkClick` | `string \| function` | Action for "+more" click: `'popover'` (default), `'day'`, `'week'`, or custom view name, or a function |
| `dayPopoverFormat` | `DateFormatter` | Date format in the popover header |

**More-Link Render Hooks:** `moreLinkClassNames`, `moreLinkContent`, `moreLinkDidMount`, `moreLinkWillUnmount`

### 4.8 Background Events

Display events as colored backgrounds rather than normal events:

```js
events: [
  {
    start: '2024-01-01',
    end: '2024-01-05',
    display: 'background'  // renders as background
  },
  {
    start: '2024-01-10',
    end: '2024-01-15',
    display: 'inverse-background'  // colors everything EXCEPT this range
  }
]
```

---

## 5. Date & Time

### 5.1 Date & Time Display

**Whole-day settings:**

| Option | Type | Description |
|---|---|---|
| `weekends` | `boolean` | Include Sat/Sun (default `true`) |
| `hiddenDays` | `number[]` | Days to exclude (0=Sun, 1=Mon, ..., 6=Sat) |
| `dayHeaders` | `boolean` | Show day-of-week column headers (default `true`) |
| `dayHeaderFormat` | `DateFormatter` | Format for column headings |
| `dayMinWidth` | `number` | Min pixel width for day cells; triggers horizontal scrolling |

**Day-Header Render Hooks:** `dayHeaderClassNames`, `dayHeaderContent`, `dayHeaderDidMount`, `dayHeaderWillUnmount`

**Day-Cell Render Hooks:** `dayCellClassNames`, `dayCellContent`, `dayCellDidMount`, `dayCellWillUnmount`

**Time-Axis settings:**

| Option | Type | Default | Description |
|---|---|---|---|
| `slotDuration` | `Duration` | `'00:30:00'` | Interval for time slots |
| `slotLabelInterval` | `Duration` | (auto) | Interval for slot labels |
| `slotLabelFormat` | `DateFormatter` | (auto) | Text within time slot labels |
| `slotMinTime` | `Duration` | `'00:00:00'` | First visible time slot |
| `slotMaxTime` | `Duration` | `'24:00:00'` | Last visible time slot (exclusive) |
| `scrollTime` | `Duration` | `'06:00:00'` | Initial scroll position |
| `scrollTimeReset` | `boolean` | `true` | Reset scroll to `scrollTime` on date change |

**Slot Render Hooks:** `slotLabelClassNames`, `slotLabelContent`, `slotLabelDidMount`, `slotLabelWillUnmount`, `slotLaneClassNames`, `slotLaneContent`, `slotLaneDidMount`, `slotLaneWillUnmount`

**Methods:** `scrollToTime(duration)` -- programmatically scroll the view.

**Callbacks:** `datesSet` -- fired after the calendar's date range changes and DOM updates.

### 5.2 Date Navigation

| Option | Type | Description |
|---|---|---|
| `initialDate` | `Date \| string` | Date displayed on first load (default: today) |
| `dateIncrement` | `Duration` | How far prev/next navigates |
| `dateAlignment` | `string` | First visible day alignment (e.g. `'week'`, `'month'`) |
| `validRange` | `{ start?, end? }` | Limits navigable date range |

**Navigation methods:** `prev()`, `next()`, `prevYear()`, `nextYear()`, `today()`, `gotoDate(date)`, `incrementDate(duration)`, `getDate()`.

### 5.3 Date Nav Links

Turn date/time text into clickable navigation links.

| Option | Type | Description |
|---|---|---|
| `navLinks` | `boolean` | Enable clickable day/week names (default `false`) |
| `navLinkDayClick` | `string \| function` | Action on day-heading click. View name or `function(date, jsEvent)` |
| `navLinkWeekClick` | `string \| function` | Action on week-number click |

### 5.4 Date Clicking & Selecting

Requires `@fullcalendar/interaction` plugin for `dateClick`.

| Option | Type | Description |
|---|---|---|
| `selectable` | `boolean` | Allow click-drag to select dates/times (default `false`) |
| `selectMirror` | `boolean` | Show placeholder event during drag selection |
| `unselectAuto` | `boolean` | Clear selection when clicking elsewhere (default `true`) |
| `unselectCancel` | `string` | CSS selector for elements that ignore unselectAuto |
| `selectOverlap` | `boolean \| function` | Allow selecting over existing events |
| `selectConstraint` | `object` | Constrain selections to a range or `businessHours` |
| `selectAllow` | `function` | Programmatic control over selectability |
| `selectMinDistance` | `number` | Min mouse travel (px) before selection starts |

**Callbacks:**

| Callback | Argument | Description |
|---|---|---|
| `dateClick` | `{ date, dateStr, allDay, resource?, dayEl, jsEvent, view }` | User clicks a date/time |
| `select` | `{ start, end, startStr, endStr, allDay, resource?, jsEvent, view }` | User completes a selection |
| `unselect` | `{ jsEvent, view }` | Selection is cleared |

### 5.5 Week Numbers

| Option | Type | Description |
|---|---|---|
| `weekNumbers` | `boolean` | Show week numbers (default `false`) |
| `weekNumberCalculation` | `string \| function` | Method: `'local'` (default), `'ISO'`, or custom function |
| `weekText` | `string` | Heading text (default `'W'`) |
| `weekTextLong` | `string` | Long form of week text |
| `weekNumberFormat` | `DateFormatter` | Controls week number text |

**Week-Number Render Hooks:** `weekNumberClassNames`, `weekNumberContent`, `weekNumberDidMount`, `weekNumberWillUnmount`

### 5.6 Now Indicator

| Option | Type | Description |
|---|---|---|
| `nowIndicator` | `boolean` | Display current-time marker (default `false`) |
| `nowIndicatorSnap` | `Duration` | How often the indicator snaps to time slots |
| `now` | `Date \| string \| function` | Override "now" for testing |

**Render Hooks:** `nowIndicatorClassNames`, `nowIndicatorContent`, `nowIndicatorDidMount`, `nowIndicatorWillUnmount`

### 5.7 Business Hours

| Option | Type | Description |
|---|---|---|
| `businessHours` | `boolean \| object \| array` | Emphasize certain time slots (default Mon-Fri 9am-5pm when `true`) |

```js
businessHours: {
  daysOfWeek: [1, 2, 3, 4, 5],  // Mon-Fri
  startTime: '09:00',
  endTime: '17:00'
}
// or per-resource (Premium):
// businessHours set on individual resource objects
```

---

## 6. Navigation & Toolbar

### 6.1 Toolbar Configuration

| Option | Type | Description |
|---|---|---|
| `headerToolbar` | `object \| false` | Top toolbar. Object with `left`, `center`, `right` string keys. `false` to hide |
| `footerToolbar` | `object \| false` | Bottom toolbar (same format) |
| `titleFormat` | `DateFormatter` | Format for the title text |
| `titleRangeSeparator` | `string` | Separator for date range in title (default `' \u2013 '`) |

**Toolbar button names:** `title`, `prev`, `next`, `prevYear`, `nextYear`, `today`, and any view name (e.g. `dayGridMonth`, `timeGridWeek`).

```js
headerToolbar: {
  left: 'prev,next today',
  center: 'title',
  right: 'dayGridMonth,timeGridWeek,timeGridDay'
}
```

Separate buttons with commas (no space between) to group them. Separate with spaces to add gaps.

### 6.2 Button Text & Icons

| Option | Description |
|---|---|
| `buttonText` | Object mapping button names to display text: `{ today: 'Today', month: 'Month', week: 'Week', day: 'Day', list: 'List' }` |
| `buttonIcons` | Object mapping button names to icon CSS classes: `{ prev: 'chevron-left', next: 'chevron-right' }` |

### 6.3 Custom Buttons

```js
customButtons: {
  myButton: {
    text: 'custom!',
    click: function() {
      alert('clicked the custom button!')
    }
  }
},
headerToolbar: {
  left: 'prev,next today myButton',
  center: 'title',
  right: 'dayGridMonth,timeGridWeek'
}
```

---

## 7. Styling & Theming

### 7.1 CSS Customization

FullCalendar's DOM elements are styled with CSS classes prefixed `fc-`. You can override these. The recommended approaches:

1. **CSS Custom Properties** (variables) -- easiest for colors and sizes
2. **CSS class overrides** -- target `.fc-*` classes
3. **Render hooks** -- inject custom classNames or DOM content
4. **Content injection** -- replace inner content of calendar elements

### 7.2 CSS Custom Properties (Variables)

FullCalendar defines these CSS custom properties on `:root`. Override them to change global appearance:

```css
:root {
  /* Typography */
  --fc-small-font-size: .85em;

  /* Page */
  --fc-page-bg-color: #fff;
  --fc-neutral-bg-color: rgba(208, 208, 208, 0.3);
  --fc-neutral-text-color: #808080;
  --fc-border-color: #ddd;

  /* Buttons */
  --fc-button-text-color: #fff;
  --fc-button-bg-color: #2C3E50;
  --fc-button-border-color: #2C3E50;
  --fc-button-hover-bg-color: #1e2b37;
  --fc-button-hover-border-color: #1a252f;
  --fc-button-active-bg-color: #1a252f;
  --fc-button-active-border-color: #151e27;

  /* Events */
  --fc-event-bg-color: #3788d8;
  --fc-event-border-color: #3788d8;
  --fc-event-text-color: #fff;
  --fc-event-selected-overlay-color: rgba(0, 0, 0, 0.25);

  /* More Link */
  --fc-more-link-bg-color: #d0d0d0;
  --fc-more-link-text-color: inherit;

  /* Event Resizer */
  --fc-event-resizer-thickness: 8px;
  --fc-event-resizer-dot-total-width: 8px;
  --fc-event-resizer-dot-border-width: 1px;

  /* Backgrounds & Overlays */
  --fc-non-business-color: rgba(215, 215, 215, 0.3);
  --fc-bg-event-color: rgb(143, 223, 130);
  --fc-bg-event-opacity: 0.3;
  --fc-highlight-color: rgba(188, 232, 241, 0.3);
  --fc-today-bg-color: rgba(255, 220, 40, 0.15);
  --fc-now-indicator-color: red;
}
```

### 7.3 Theme System

| Option | Values | Description |
|---|---|---|
| `themeSystem` | `'standard'` (default), `'bootstrap5'`, `'bootstrap'` | Which CSS framework theme to use |

- **Standard theme** -- FullCalendar's own look (default)
- **Bootstrap 5** -- requires `@fullcalendar/bootstrap5` plugin + Bootstrap 5 CSS
- **Bootstrap 4** -- requires `@fullcalendar/bootstrap4` plugin + Bootstrap 4 CSS
- `bootstrapFontAwesome` -- icon mapping for Bootstrap 4 (not needed for Bootstrap 5)

### 7.4 ClassName Inputs

CSS classNames can be injected in various places. Formats:

```js
// As a string
eventClassNames: 'my-class'

// As an array
eventClassNames: ['class-a', 'class-b']

// As a function (dynamic)
eventClassNames: function(arg) {
  if (arg.event.extendedProps.isUrgent) {
    return ['urgent-event']
  }
  return []
}
```

Used in: `eventClassNames`, `dayHeaderClassNames`, `dayCellClassNames`, `slotLabelClassNames`, `viewClassNames`, `moreLinkClassNames`, `nowIndicatorClassNames`, `weekNumberClassNames`, `noEventsClassNames`, `allDayClassNames`, etc.

### 7.5 Content Injection

Custom content can be injected into FullCalendar DOM:

```js
// As a string (treated as text, not HTML)
eventContent: 'my content'

// As an object with HTML
eventContent: { html: '<b>bold</b>' }

// As an object with DOM nodes
eventContent: { domNodes: [myDomNode] }

// As a function (dynamic)
eventContent: function(arg) {
  return { html: '<i>' + arg.event.title + '</i>' }
}
```

Used in: `eventContent`, `dayHeaderContent`, `dayCellContent`, `slotLabelContent`, `slotLaneContent`, `moreLinkContent`, `nowIndicatorContent`, `weekNumberContent`, `noEventsContent`, `allDayContent`, `resourceLabelContent`, `resourceGroupLabelContent`, `resourceAreaHeaderContent`, etc.

### 7.6 Sizing

| Option | Type | Default | Description |
|---|---|---|---|
| `height` | `number \| string \| function` | (auto) | Total calendar height. `'auto'`, `'100%'`, number (px), or `'parent'` |
| `contentHeight` | `number \| string \| function` | (auto) | View area height (excludes header/footer) |
| `aspectRatio` | `number` | `1.35` | Width-to-height ratio (used when height not set) |
| `expandRows` | `boolean` | `false` | Expand rows to fill available height |
| `handleWindowResize` | `boolean` | `true` | Auto-resize on browser window resize |
| `windowResizeDelay` | `number` | `100` | Debounce delay (ms) for window resize |
| `stickyHeaderDates` | `boolean \| 'auto'` | `'auto'` | Stick date headers to viewport top while scrolling |
| `stickyFooterScrollbar` | `boolean \| 'auto'` | `'auto'` | Stick horizontal scrollbar to viewport bottom |

**Callback:** `windowResize` -- fires after calendar dimensions change due to browser resize.

---

## 8. Plugins

### 8.1 Plugin Index

| Package | Description | Views Provided |
|---|---|---|
| `@fullcalendar/core` | Core library, `Calendar` class | (none -- required by all) |
| `@fullcalendar/interaction` | Date clicking, selecting, event drag-n-drop & resizing. **Not needed** for `eventClick` or `eventMouseEnter`/`eventMouseLeave` | (none -- adds interactivity) |
| `@fullcalendar/daygrid` | Month and DayGrid views | `dayGridYear`, `dayGridMonth`, `dayGridWeek`, `dayGridDay`, `dayGrid` |
| `@fullcalendar/timegrid` | TimeGrid views | `timeGridWeek`, `timeGridDay`, `timeGrid` |
| `@fullcalendar/list` | List views | `listYear`, `listMonth`, `listWeek`, `listDay`, `list` |
| `@fullcalendar/multimonth` | Multi-Month views | `multiMonthYear`, `multiMonth` |
| `@fullcalendar/scrollgrid` | Advanced scrolling for certain views | (none -- enhances views) |
| `@fullcalendar/vue3` | Vue 3 component wrapper | (none -- provides `<FullCalendar>`) |
| `@fullcalendar/react` | React component wrapper | (none) |
| `@fullcalendar/angular` | Angular component wrapper | (none) |
| `@fullcalendar/web-component` | Web Component wrapper | (none) |
| `@fullcalendar/google-calendar` | Load events from public Google Calendar | (none -- event source) |
| `@fullcalendar/icalendar` | Load events from iCalendar feed | (none -- event source) |
| `@fullcalendar/rrule` | Recurring events via RRule | (none -- enhances events) |
| `@fullcalendar/moment` | Moment.js date formatting | (none -- date formatting) |
| `@fullcalendar/moment-timezone` | Named timezone support via Moment Timezone | (none -- timezone) |
| `@fullcalendar/luxon` | Luxon v2/v3 date formatting | (none -- date formatting) |
| `@fullcalendar/bootstrap5` | Bootstrap 5 theming | (none -- styling) |
| `@fullcalendar/bootstrap4` | Bootstrap 4 theming | (none -- styling) |

**Premium packages:**

| Package | Description |
|---|---|
| `@fullcalendar/resource` | Resource data infrastructure (required by resource views) |
| `@fullcalendar/resource-timeline` | Timeline view with resources as rows |
| `@fullcalendar/resource-timegrid` | TimeGrid with resources as columns |
| `@fullcalendar/resource-daygrid` | DayGrid with resources as columns |
| `@fullcalendar/timeline` | Timeline view without resources |
| `@fullcalendar/adaptive` | Print optimization |

### 8.2 Standard Packages in This Project

This project (`claro4`) uses:

```json
{
  "@fullcalendar/core": "^6.1.20",
  "@fullcalendar/daygrid": "^6.1.20",
  "@fullcalendar/interaction": "^6.1.20",
  "@fullcalendar/list": "^6.1.20",
  "@fullcalendar/timegrid": "^6.1.20",
  "@fullcalendar/vue3": "^6.1.20"
}
```

---

## 9. Date Library

### 9.1 Date Parsing

FullCalendar accepts dates in many formats:
- **ISO8601 strings:** `'2024-01-15'`, `'2024-01-15T09:30:00'`, `'2024-01-15T09:30:00+05:00'`
- **Date objects:** `new Date(2024, 0, 15)`
- **Milliseconds since epoch:** `1705276800000`

### 9.2 Date Objects

FullCalendar exposes native JavaScript `Date` objects in callbacks (e.g. `dateClick`, View `activeStart`/`activeEnd`).

When `timeZone` is `'local'`, Dates are in the browser's local timezone. When `timeZone` is `'UTC'`, Dates are in UTC. When using named timezones with a plugin (Moment/Luxon), Dates are in UTC but represent the named timezone.

### 9.3 Duration Object

Durations express amounts of time:

```js
// Object form
{ days: 1 }
{ hours: 2, minutes: 30 }
{ weeks: 2 }

// String form (HH:MM:SS or HH:MM)
'01:30:00'  // 1 hour 30 minutes
'24:00:00'  // 24 hours
```

Used in: `slotDuration`, `slotMinTime`, `slotMaxTime`, `scrollTime`, `snapDuration`, `duration`, `dateIncrement`, `defaultTimedEventDuration`, etc.

### 9.4 Date Formatting

Use a **formatting object** (based on `Intl.DateTimeFormat`):

```js
titleFormat: { year: 'numeric', month: 'long' }
// → "January 2024"

eventTimeFormat: {
  hour: 'numeric',
  minute: '2-digit',
  meridiem: 'short'
}
// → "7:00p"
```

Supported formatting fields: `year`, `month`, `day`, `weekday`, `hour`, `minute`, `second`, `meridiem`, `timeZoneName`, `week`, `omitZeroMinute`, `omitCommas`.

| `defaultRangeSeparator` | `string` | Default `' - '` | Separator for formatted date ranges |

### 9.5 Utility Methods

**Standalone functions:**
- `formatDate(date, settings)` -- format a single date
- `formatRange(start, end, settings)` -- format a date range with smart separator

**Calendar instance methods:**
- `calendar.formatDate(date, settings)` -- inherits calendar locale/timezone
- `calendar.formatIso(date, omitTime?)` -- ISO8601 with appropriate UTC offset
- `calendar.formatRange(start, end, settings)` -- inherits calendar locale/timezone

**Date library plugins:**
- `@fullcalendar/moment` -- Moment.js formatting strings (e.g. `'MMMM D, YYYY'`)
- `@fullcalendar/moment-timezone` -- named timezone support
- `@fullcalendar/luxon` -- Luxon v2/v3 formatting tokens

---

## 10. Resources (Premium)

Resources represent people, rooms, or other entities. Requires `@fullcalendar/resource`.

**Providing resources:**
```js
resources: [
  { id: 'a', title: 'Room A' },
  { id: 'b', title: 'Room B', eventColor: 'green' }
]
// or as JSON feed, or as function
```

**Resource Object** properties: `id`, `title`, `eventColor`, `eventBackgroundColor`, `eventBorderColor`, `eventTextColor`, `eventClassNames`, `extendedProps`, `children` (array of child resources), `parentId`.

**Resource methods:** `getParent()`, `getChildren()`, `getEvents()`, `setProp()`, `setExtendedProp()`, `remove()`, `toPlainObject()`.

**Calendar resource methods:** `refetchResources()`, `getTopLevelResources()`, `getResources()`, `getResourceById(id)`, `addResource(data)`.

**Options:**

| Option | Description |
|---|---|
| `resources` | Array, JSON URL, or function providing resource data |
| `initialResources` | Resources for initial render |
| `refetchResourcesOnNavigate` | Refetch resources when dates change |
| `resourceOrder` | Property(ies) to sort resources by |
| `filterResourcesWithEvents` | Hide resources with no events |

**Callbacks:** `resourceAdd`, `resourceChange`, `resourceRemove`, `resourcesSet`.

**Resource Render Hooks:** `resourceLabelClassNames`, `resourceLabelContent`, `resourceLabelDidMount`, `resourceLabelWillUnmount`, `resourceLaneClassNames`, `resourceLaneContent`, `resourceLaneDidMount`, `resourceLaneWillUnmount`.

---

## 11. International

| Option | Type | Description |
|---|---|---|
| `locale` | `string` | Locale code (e.g. `'en'`, `'fr'`, `'de'`). Affects date formatting, week start, etc. |
| `direction` | `string` | `'ltr'` (default) or `'rtl'` |
| `firstDay` | `number` | Start day of week: 0=Sun, 1=Mon, ..., 6=Sat. Defaults to locale-appropriate value |
| `timeZone` | `string` | `'local'` (default), `'UTC'`, or a named timezone (requires plugin) |

---

## 12. Accessibility

| Option | Description |
|---|---|
| `eventInteractive` | Whether events are tabbable and announce-able (default: auto based on `eventClick`) |

**Hint options** for screen readers:

| Option | Description |
|---|---|
| `buttonHints` | Accessible labels for toolbar buttons |
| `viewHint` | Label for current view |
| `navLinkHint` | Label for nav links |
| `timeHint` | Label for time in time grids |
| `eventHint` | Label for events |
| `closeHint` | Label for close buttons |

**Touch Support:**

| Option | Default | Description |
|---|---|---|
| `longPressDelay` | `1000` | ms before long-press triggers action |
| `eventLongPressDelay` | (inherits) | Specifically for event dragging |
| `selectLongPressDelay` | (inherits) | Specifically for date selection |

---

## 13. Complete Options Reference

Quick-lookup table of all commonly used options:

### Initialization
| Option | Description |
|---|---|
| `plugins` | Array of plugin objects |
| `initialView` | Starting view name |
| `initialDate` | Starting date |
| `initialEvents` | Events for initial render |
| `schedulerLicenseKey` | Premium license key |

### Toolbar
| Option | Description |
|---|---|
| `headerToolbar` | Top toolbar config `{ left, center, right }` |
| `footerToolbar` | Bottom toolbar config |
| `titleFormat` | Title date format |
| `titleRangeSeparator` | Title range separator |
| `buttonText` | Button label overrides |
| `buttonIcons` | Button icon overrides |
| `customButtons` | Custom button definitions |

### Sizing
| Option | Description |
|---|---|
| `height` | Total calendar height |
| `contentHeight` | View area height |
| `aspectRatio` | Width-to-height ratio |
| `expandRows` | Expand rows to fill height |
| `handleWindowResize` | Auto-resize on window resize |
| `windowResizeDelay` | Resize debounce delay (ms) |
| `stickyHeaderDates` | Stick headers while scrolling |
| `stickyFooterScrollbar` | Stick scrollbar while scrolling |

### Date Display
| Option | Description |
|---|---|
| `weekends` | Show Sat/Sun |
| `hiddenDays` | Array of hidden day numbers |
| `dayHeaders` | Show day-of-week headers |
| `dayHeaderFormat` | Day header format |
| `dayMinWidth` | Min day cell width (px) |
| `firstDay` | First day of week (0-6) |
| `showNonCurrentDates` | Show adjacent-month dates |
| `fixedWeekCount` | Fixed number of weeks in month view |

### Time Axis
| Option | Description |
|---|---|
| `slotDuration` | Time slot interval |
| `slotLabelInterval` | Label interval |
| `slotLabelFormat` | Label text format |
| `slotMinTime` | First visible time |
| `slotMaxTime` | Last visible time (exclusive) |
| `scrollTime` | Initial scroll position |
| `scrollTimeReset` | Reset scroll on date change |
| `nowIndicator` | Show current-time marker |
| `now` | Override current time |

### Date Navigation
| Option | Description |
|---|---|
| `dateIncrement` | Prev/next step size |
| `dateAlignment` | View date alignment |
| `validRange` | Navigable date range `{ start?, end? }` |
| `navLinks` | Clickable day/week names |

### Date Selection
| Option | Description |
|---|---|
| `selectable` | Enable date selection |
| `selectMirror` | Show placeholder during selection |
| `unselectAuto` | Clear on outside click |
| `selectOverlap` | Allow selection over events |
| `selectConstraint` | Constrain selection range |
| `selectAllow` | Programmatic selection control |
| `selectMinDistance` | Min mouse travel to start |

### Events - Data
| Option | Description |
|---|---|
| `events` | Event data (array, function, or JSON URL) |
| `eventSources` | Multiple event sources |
| `eventDataTransform` | Transform incoming event data |
| `defaultAllDay` | Default allDay value |
| `defaultAllDayEventDuration` | Default all-day event duration |
| `defaultTimedEventDuration` | Default timed event duration |
| `forceEventDuration` | Force events to have end |
| `lazyFetching` | Only refetch on date change |

### Events - Display
| Option | Description |
|---|---|
| `eventColor` | Shorthand color |
| `eventBackgroundColor` | Background color |
| `eventBorderColor` | Border color |
| `eventTextColor` | Text color |
| `eventDisplay` | Display mode |
| `eventTimeFormat` | Time format in events |
| `displayEventTime` | Show time |
| `displayEventEnd` | Show end time |
| `nextDayThreshold` | Threshold for next-day rendering |
| `eventOrder` | Sort within same time slot |
| `eventOrderStrict` | Force strict ordering |

### Events - Interaction
| Option | Description |
|---|---|
| `editable` | Enable drag + resize |
| `eventStartEditable` | Enable drag |
| `eventDurationEditable` | Enable resize |
| `eventResizableFromStart` | Resize from start edge |
| `droppable` | Accept external drops |
| `eventOverlap` | Allow overlap |
| `eventConstraint` | Constrain drop targets |
| `eventAllow` | Programmatic drop control |
| `snapDuration` | Drag snap interval |
| `dragScroll` | Auto-scroll during drag |
| `dragRevertDuration` | Revert animation (ms) |

### Events - Popover
| Option | Description |
|---|---|
| `dayMaxEvents` | Max events per day |
| `dayMaxEventRows` | Max event rows per day |
| `eventMaxStack` | Max stacked events |
| `moreLinkClick` | "+more" click action |
| `dayPopoverFormat` | Popover header format |

### Callbacks
| Callback | Description |
|---|---|
| `dateClick` | Date/time clicked |
| `select` | Date range selected |
| `unselect` | Selection cleared |
| `eventClick` | Event clicked |
| `eventMouseEnter` | Mouse enters event |
| `eventMouseLeave` | Mouse leaves event |
| `eventDragStart` | Drag begins |
| `eventDragStop` | Drag ends |
| `eventDrop` | Event dropped at new time |
| `eventResizeStart` | Resize begins |
| `eventResizeStop` | Resize ends |
| `eventResize` | Event resized |
| `drop` | External element dropped |
| `eventReceive` | External event dropped |
| `eventLeave` | Event dragged away |
| `eventAdd` | Event added |
| `eventChange` | Event data changed |
| `eventRemove` | Event removed |
| `eventsSet` | Event set changed |
| `datesSet` | Date range changed |
| `loading` | Event loading state changed |
| `windowResize` | Calendar resized |
| `navLinkDayClick` | Nav link day clicked |
| `navLinkWeekClick` | Nav link week clicked |

### Render Hooks
| Hook Group | Hooks |
|---|---|
| Event | `eventClassNames`, `eventContent`, `eventDidMount`, `eventWillUnmount` |
| Day Header | `dayHeaderClassNames`, `dayHeaderContent`, `dayHeaderDidMount`, `dayHeaderWillUnmount` |
| Day Cell | `dayCellClassNames`, `dayCellContent`, `dayCellDidMount`, `dayCellWillUnmount` |
| Slot Label | `slotLabelClassNames`, `slotLabelContent`, `slotLabelDidMount`, `slotLabelWillUnmount` |
| Slot Lane | `slotLaneClassNames`, `slotLaneContent`, `slotLaneDidMount`, `slotLaneWillUnmount` |
| View | `viewClassNames`, `viewDidMount`, `viewWillUnmount` |
| More Link | `moreLinkClassNames`, `moreLinkContent`, `moreLinkDidMount`, `moreLinkWillUnmount` |
| Now Indicator | `nowIndicatorClassNames`, `nowIndicatorContent`, `nowIndicatorDidMount`, `nowIndicatorWillUnmount` |
| Week Number | `weekNumberClassNames`, `weekNumberContent`, `weekNumberDidMount`, `weekNumberWillUnmount` |
| All-Day | `allDayClassNames`, `allDayContent`, `allDayDidMount`, `allDayWillUnmount` |
| No Events (List) | `noEventsClassNames`, `noEventsContent`, `noEventsDidMount`, `noEventsWillUnmount` |
| Resource Label | `resourceLabelClassNames`, `resourceLabelContent`, `resourceLabelDidMount`, `resourceLabelWillUnmount` |
| Resource Lane | `resourceLaneClassNames`, `resourceLaneContent`, `resourceLaneDidMount`, `resourceLaneWillUnmount` |
| Resource Group Label | `resourceGroupLabelClassNames`, `resourceGroupLabelContent`, `resourceGroupLabelDidMount`, `resourceGroupLabelWillUnmount` |
| Resource Group Lane | `resourceGroupLaneClassNames`, `resourceGroupLaneContent`, `resourceGroupLaneDidMount`, `resourceGroupLaneWillUnmount` |
| Resource-Area Header | `resourceAreaHeaderClassNames`, `resourceAreaHeaderContent`, `resourceAreaHeaderDidMount`, `resourceAreaHeaderWillUnmount` |

### Locale / Timezone
| Option | Description |
|---|---|
| `locale` | Locale code |
| `direction` | `'ltr'` or `'rtl'` |
| `firstDay` | Week start day |
| `timeZone` | Timezone setting |

### Views (Custom)
| Option | Description |
|---|---|
| `views` | View-specific option overrides |
| `duration` | Custom view duration |
| `dayCount` | Fixed visible day count |
| `visibleRange` | Fixed visible range |

### Business Hours
| Option | Description |
|---|---|
| `businessHours` | Business hours definition |

### Multi-Month
| Option | Description |
|---|---|
| `multiMonthMaxColumns` | Max month columns |
| `multiMonthMinWidth` | Min month width (px) |
| `multiMonthTitleFormat` | Month title format |

### Week Numbers
| Option | Description |
|---|---|
| `weekNumbers` | Show week numbers |
| `weekNumberCalculation` | Calculation method |
| `weekText` | Week heading text |
| `weekTextLong` | Long week heading text |
| `weekNumberFormat` | Week number format |

---

*Source: [FullCalendar v6 Documentation](https://fullcalendar.io/docs) -- crawled 2026-03-18*
