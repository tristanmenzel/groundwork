import { describe, expect, it } from 'vitest'
import { pickNextColorIndex } from './palette'
import { PASTEL_PALETTE } from '../constants'

describe('pickNextColorIndex', () => {
  it('returns 0 when nothing is used', () => {
    expect(pickNextColorIndex([])).toBe(0)
  })

  it('returns the lowest unused slot', () => {
    expect(pickNextColorIndex([0, 1, 2])).toBe(3)
    expect(pickNextColorIndex([0, 2])).toBe(1)
  })

  it('allocates a unique colour per shape until the palette is exhausted', () => {
    const used: number[] = []
    for (let i = 0; i < PASTEL_PALETTE.length; i++) {
      used.push(pickNextColorIndex(used))
    }
    expect(new Set(used).size).toBe(PASTEL_PALETTE.length)
  })

  it('falls back to an in-range index once every slot is taken', () => {
    const all = PASTEL_PALETTE.map((_, i) => i)
    const next = pickNextColorIndex(all)
    expect(next).toBeGreaterThanOrEqual(0)
    expect(next).toBeLessThan(PASTEL_PALETTE.length)
  })
})
