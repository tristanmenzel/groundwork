import { describe, expect, it } from 'vitest'
import { itemBoundaryRings, measureAt } from './measure'
import type { Shape } from '../types'
import { createUnitValue } from '../units/unit'

const square = (x: number, y: number, side: number): Shape => ({
  id: 's',
  kind: 'square',
  position: { x, y },
  colorIndex: 0,
  side: createUnitValue(side, 'ft'),
})

describe('measureAt', () => {
  it('returns the spans through a point inside a square', () => {
    const rings = itemBoundaryRings(square(0, 0, 8))
    const m = measureAt(rings, { x: 2, y: 5 })
    expect(m).not.toBeNull()
    expect(m!.h).toEqual({ min: 0, max: 8 }) // total horizontal = 8
    expect(m!.v).toEqual({ min: 0, max: 8 }) // total vertical = 8
    // cursor at x=2 → left dist 2, right dist 6
    expect(m!.h.max - m!.h.min).toBe(8)
  })

  it('returns null when the point is outside', () => {
    const rings = itemBoundaryRings(square(0, 0, 8))
    expect(measureAt(rings, { x: 20, y: 20 })).toBeNull()
  })

  it('handles an L-shaped room boundary (notch excluded)', () => {
    // Two 10x10 squares overlapping by 5 → L-shape spanning 0..15.
    const room = {
      id: 'r',
      kind: 'room' as const,
      name: 'Room 1',
      position: { x: 0, y: 0 },
      colorIndex: 0,
      members: [square(0, 0, 10), square(5, 5, 10)],
    }
    const rings = itemBoundaryRings(room)
    // A point in the lower square at y=2 only spans the first square horizontally (0..10)
    const m = measureAt(rings, { x: 3, y: 2 })
    expect(m).not.toBeNull()
    expect(m!.h).toEqual({ min: 0, max: 10 })
  })
})
