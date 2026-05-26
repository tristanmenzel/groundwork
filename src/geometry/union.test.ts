import { describe, expect, it } from 'vitest'
import { unionShapes } from './union'
import type { Shape } from '../types'
import { createUnitValue } from '../units/unit'

const sq = (id: string, x: number, y: number, side: number): Shape => ({
  id,
  kind: 'square',
  position: { x, y },
  colorIndex: 0,
  side: createUnitValue(side, 'ft'),
})

describe('unionShapes', () => {
  it('returns area + perimeter for a single shape', () => {
    const u = unionShapes([sq('a', 0, 0, 10)])
    expect(u.area).toBeCloseTo(100)
    expect(u.perimeter).toBeCloseTo(40)
    expect(u.polygons).toHaveLength(1)
  })

  it('two 10×10 squares overlapping by 5×5 have area 175 and exterior perimeter 60', () => {
    const u = unionShapes([sq('a', 0, 0, 10), sq('b', 5, 5, 10)])
    expect(u.area).toBeCloseTo(175)
    // exterior outline is an L-shape with 8 segments totalling 60ft
    expect(u.perimeter).toBeCloseTo(60)
    expect(u.polygons).toHaveLength(1)
  })

  it('two disjoint squares stay separate', () => {
    const u = unionShapes([sq('a', 0, 0, 5), sq('b', 100, 100, 5)])
    expect(u.area).toBeCloseTo(50)
    expect(u.polygons).toHaveLength(2)
  })

  it('returns empty result for no shapes', () => {
    expect(unionShapes([]).area).toBe(0)
  })
})
