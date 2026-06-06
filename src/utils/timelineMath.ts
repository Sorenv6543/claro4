/**
 * src/utils/timelineMath.ts
 *
 * Shared timeline math for the owner day-bar and overview timeline.
 * Covers the 8 AM – 10 PM (14-hour) visible window.
 */

// ── Constants ────────────────────────────────────────────────────────────────

/** First hour of the visible timeline window (8 AM). */
export const TIMELINE_DAY_START = 8

/** Number of hours in the visible timeline window (8 AM – 10 PM). */
export const TIMELINE_DAY_SPAN = 14

// ── Position helpers ─────────────────────────────────────────────────────────

/**
 * Convert an "HH:MM" time string to a percentage position [0–100] on the
 * timeline bar (clamped to the visible window).
 *
 * Was: `barPct` in OwnerDayBar.vue, `deskBarPct` in OwnerOverview.vue.
 */
export function timelinePct (timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  const frac = ((h ?? 0) + (m ?? 0) / 60 - TIMELINE_DAY_START) / TIMELINE_DAY_SPAN
  return Math.max(0, Math.min(100, frac * 100))
}

/**
 * Return the current wall-clock time as a percentage position on the
 * timeline bar.  Reads `new Date()` directly so callers can wrap it in a
 * Vue `computed` if they need reactivity.
 *
 * Was: computed `deskNowPct` in OwnerOverview.vue.
 */
export function timelineNowPct (): number {
  const now = new Date()
  const frac = (now.getHours() + now.getMinutes() / 60 - TIMELINE_DAY_START) / TIMELINE_DAY_SPAN
  return Math.max(0, Math.min(100, frac * 100))
}

/**
 * Return true when the "HH:MM" time string is in the past relative to the
 * provided current hour and minute values.
 *
 * Was: `isPast` in OwnerDayBar.vue, `deskIsPast` in OwnerOverview.vue.
 */
export function timelineIsPast (timeStr: string, currentHour: number, currentMin: number): boolean {
  const [h, m] = timeStr.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0) < currentHour * 60 + currentMin
}

// ── Formatting helpers ────────────────────────────────────────────────────────

/**
 * Format an "HH:MM" string as "h:mm AM/PM" (e.g. "14:30" → "2:30 PM").
 *
 * Was: `fmt12` in both OwnerDayBar.vue and OwnerOverview.vue (identical
 * implementations).
 */
export function fmt12 (timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return timeStr
  }
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

/**
 * Get current time in 12h format.
 */
export function fmt12Now(): string {
  const now = new Date()
  return fmt12(`${now.getHours()}:${now.getMinutes()}`)
}

/**
 * Build a compact chip label for the desktop timeline, e.g. "2:30pm Out",
 * "4pm In", "11am Turn!".
 *
 * Was: `fmtChipLabel` in OwnerOverview.vue.
 */
export function fmtChipLabel (timeStr: string, type: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  if (Number.isNaN(h)) {
    return timeStr
  }
  const period = (h ?? 0) >= 12 ? 'pm' : 'am'
  const h12 = (h ?? 0) % 12 || 12
  const minStr = (m ?? 0) > 0 ? `:${String(m ?? 0).padStart(2, '0')}` : ''
  const timePart = `${h12}${minStr}${period}`
  if (type === 'checkout') {
    return `${timePart} Out`
  }
  if (type === 'checkin') {
    return `${timePart} In`
  }
  return `${timePart} Turn!`
}

/**
 * Format a "YYYY-MM-DD" date string as a human-readable label.  Returns
 * "Today" when `dateStr` matches `todayStr`, otherwise a locale short-form
 * day string (e.g. "Mon, May 12").
 *
 * Was: `formatDateLabel` in OwnerOverview.vue.
 */
export function formatDateLabel (dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) {
    return 'Today'
  }
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
