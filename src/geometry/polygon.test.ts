import { describe, expect, it } from 'vitest'
import {
  centroid,
  combineBBoxes,
  polygonArea,
  polygonBBox,
  polygonEdges,
  polygonPerimeter,
} from './polygon'

const square = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 4, y: 4 },
  { x: 0, y: 4 },
]

describe('polygonArea', () => {
  it('handles a square', () => {
    expect(polygonArea(square)).toBe(16)
  })
  it('handles winding direction agnostically', () => {
    expect(polygonArea([...square].reverse())).toBe(16)
  })
  it('returns 0 for degenerate input', () => {
    expect(polygonArea([])).toBe(0)
    expect(polygonArea([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(0)
  })
})

describe('polygonPerimeter', () => {
  it('sums edge lengths across rings', () => {
    expect(polygonPerimeter([square])).toBe(16)
    expect(polygonPerimeter([square, square])).toBe(32)
  })
})

describe('polygonBBox / combineBBoxes', () => {
  it('returns the tight bounding box', () => {
    expect(polygonBBox(square)).toEqual({ min: { x: 0, y: 0 }, max: { x: 4, y: 4 } })
  })
  it('combines multiple bboxes', () => {
    expect(
      combineBBoxes([
        { min: { x: 0, y: 0 }, max: { x: 4, y: 4 } },
        { min: { x: -2, y: 3 }, max: { x: 5, y: 8 } },
      ]),
    ).toEqual({ min: { x: -2, y: 0 }, max: { x: 5, y: 8 } })
  })
})

describe('polygonEdges', () => {
  it('returns N edges for N vertices', () => {
    expect(polygonEdges(square)).toHaveLength(4)
  })
})

describe('centroid', () => {
  it('averages points', () => {
    expect(centroid(square)).toEqual({ x: 2, y: 2 })
  })
  it('lands inside a right triangle (not on the hypotenuse)', () => {
    // TL right triangle, legs 6 and 6. Hypotenuse: x + y = 6. Centroid at (2,2): 2+2=4 < 6 → inside.
    const t = [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 0, y: 6 },
    ]
    const c = centroid(t)
    expect(c).toEqual({ x: 2, y: 2 })
    expect(c.x + c.y).toBeLessThan(6)
  })
})
