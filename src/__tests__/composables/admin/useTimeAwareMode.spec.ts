import { useTimeAwareMode } from '@composables/admin/useTimeAwareMode'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('useTimeAwareMode', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns morning mode before 4 PM', () => {
    vi.setSystemTime(new Date('2026-03-27T10:00:00'))
    const { isEveningMode, modeLabel } = useTimeAwareMode()
    expect(isEveningMode.value).toBe(false)
    expect(modeLabel.value).toBe('Today\'s Schedule')
  })

  it('returns evening mode at 4 PM', () => {
    vi.setSystemTime(new Date('2026-03-27T16:00:00'))
    const { isEveningMode, modeLabel } = useTimeAwareMode()
    expect(isEveningMode.value).toBe(true)
    expect(modeLabel.value).toBe('Tomorrow\'s Prep')
  })

  it('returns evening mode after 4 PM', () => {
    vi.setSystemTime(new Date('2026-03-27T19:30:00'))
    const { isEveningMode, modeLabel } = useTimeAwareMode()
    expect(isEveningMode.value).toBe(true)
    expect(modeLabel.value).toBe('Tomorrow\'s Prep')
  })

  it('provides today and tomorrow date strings', () => {
    vi.setSystemTime(new Date('2026-03-27T10:00:00'))
    const { todayDateString, tomorrowDateString } = useTimeAwareMode()
    expect(todayDateString.value).toBe('2026-03-27')
    expect(tomorrowDateString.value).toBe('2026-03-28')
  })

  it('uses configurable threshold', () => {
    vi.setSystemTime(new Date('2026-03-27T14:00:00'))
    const { isEveningMode } = useTimeAwareMode({ thresholdHour: 14 })
    expect(isEveningMode.value).toBe(true)
  })
})
