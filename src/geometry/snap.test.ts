import { describe, expect, it } from 'vitest'
import { snapOffset } from './snap'
import type { LayoutItem } from '../types'
import { createUnitValue } from '../units/unit'

const sq = (id: string, x: number, y: number, side: number): LayoutItem => ({
  id,
  kind: 'square',
  position: { x, y },
  colorIndex: 0,
  side: createUnitValue(side, 'ft'),
})

describe('snapOffset', () => {
  it('returns the proposed delta when there are no other items', () => {
    const a = sq('a', 0, 0, 5)
    const r = snapOffset(new Set(['a']), [a], { x: 2, y: 3 }, 0.5)
    expect(r.delta).toEqual({ x: 2, y: 3 })
    expect(r.guides).toEqual([])
  })

  it("snaps a square's right edge to the left edge of an adjacent square within the buffer", () => {
    // a is at x:0..5; b is at x:10..15. Drag a by +4.7 → would land at 4.7..9.7;
    // b's left edge at x=10 is 0.3 away. With buffer 0.5, snap to x=10 → land at 5..10.
    const a = sq('a', 0, 0, 5)
    const b = sq('b', 10, 0, 5)
    const r = snapOffset(new Set(['a']), [a, b], { x: 4.7, y: 0 }, 0.5)
    expect(r.delta.x).toBeCloseTo(5)
    expect(r.delta.y).toBe(0)
    expect(r.guides.length).toBeGreaterThan(0)
  })

  it('releases beyond the buffer', () => {
    const a = sq('a', 0, 0, 5)
    const b = sq('b', 10, 0, 5)
    // proposed delta x:4 → a lands at 4..9, b.left at 10, distance 1 > 0.5 buffer → no snap
    const r = snapOffset(new Set(['a']), [a, b], { x: 4, y: 0 }, 0.5)
    expect(r.delta).toEqual({ x: 4, y: 0 })
    expect(r.guides).toEqual([])
  })

  it('snaps y independently from x', () => {
    const a = sq('a', 0, 0, 5)
    const b = sq('b', 0, 10, 5)
    const r = snapOffset(new Set(['a']), [a, b], { x: 0, y: 4.8 }, 0.5)
    expect(r.delta.y).toBeCloseTo(5)
  })

  it('does not snap to a far-away aligned shape', () => {
    const a = sq('a', 0, 0, 5)
    const c = sq('c', 100, 0, 5) // c's left edge at x=100 — too far for our buffer
    const r = snapOffset(new Set(['a']), [a, c], { x: 1, y: 0 }, 0.5)
    expect(r.delta).toEqual({ x: 1, y: 0 })
  })

  it('snaps a diagonally-offset square so its corner meets the other square', () => {
    // a fixed at (0,0)-(5,5). Drag b so its top-left corner sits near a's top-right
    // corner: proposed lands b at (5.3,0.3)-(10.3,5.3). Edges do NOT overlap, but the
    // corners are within buffer → both x and y snap so the corners coincide.
    const a = sq('a', 0, 0, 5)
    const b = sq('b', 0, 0, 5)
    const r = snapOffset(new Set(['b']), [a, b], { x: 5.3, y: 0.3 }, 0.5)
    expect(r.delta.x).toBeCloseTo(5)
    expect(r.delta.y).toBeCloseTo(0)
    expect(r.guides.length).toBe(2)
  })

  it('does not corner-snap when the perpendicular gap exceeds the buffer', () => {
    // b lands at (5.3, 0.8): the closest edge still snaps in x, but the corner is
    // 0.8 away in y (> buffer) so y is left alone.
    const a = sq('a', 0, 0, 5)
    const b = sq('b', 0, 0, 5)
    const r = snapOffset(new Set(['b']), [a, b], { x: 5.3, y: 0.8 }, 0.5)
    expect(r.delta.x).toBeCloseTo(5)
    expect(r.delta.y).toBeCloseTo(0.8)
  })
})
