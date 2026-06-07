// src/__tests__/utils/timelineMath.test.ts
import { describe, expect, it } from 'vitest'
import { fmt12, fmt12Now } from '@/utils/timelineMath'

describe('timelineMath utils', () => {
  it('fmt12 formats 24h string to 12h', () => {
    expect(fmt12('14:30')).toBe('2:30 PM')
    expect(fmt12('09:15')).toBe('9:15 AM')
    expect(fmt12('00:00')).toBe('12:00 AM')
    expect(fmt12('12:00')).toBe('12:00 PM')
  })

  it('fmt12Now returns current time in 12h format', () => {
    const result = fmt12Now()
    expect(result).toMatch(/\d{1,2}:\d{2} (AM|PM)/)
  })
})
