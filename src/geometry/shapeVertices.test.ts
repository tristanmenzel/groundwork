import { describe, expect, it } from 'vitest'
import { roomMemberVertices, shapeSize, vertices } from './shapeVertices'
import { polygonArea } from './polygon'
import type { Room, Triangle } from '../types'
import { createUnitValue } from '../units/unit'

const tri = (rightAngle: Triangle['rightAngle']): Triangle => ({
  id: 't',
  kind: 'triangle',
  position: { x: 0, y: 0 },
  colorIndex: 0,
  width: createUnitValue(4, 'ft'),
  height: createUnitValue(3, 'ft'),
  rightAngle,
})

describe('vertices(triangle)', () => {
  it('TL: right-angle at top-left, area = 6', () => {
    const pts = vertices(tri('TL'))
    expect(pts).toEqual([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 3 },
    ])
    expect(polygonArea(pts)).toBeCloseTo(6)
  })

  it('TR: right-angle at top-right, area = 6', () => {
    const pts = vertices(tri('TR'))
    expect(pts.find((p) => p.x === 4 && p.y === 0)).toBeDefined()
    expect(polygonArea(pts)).toBeCloseTo(6)
  })

  it('BL: right-angle at bottom-left, area = 6', () => {
    const pts = vertices(tri('BL'))
    expect(pts.find((p) => p.x === 0 && p.y === 3)).toBeDefined()
    expect(polygonArea(pts)).toBeCloseTo(6)
  })

  it('BR: right-angle at bottom-right, area = 6', () => {
    const pts = vertices(tri('BR'))
    expect(pts.find((p) => p.x === 4 && p.y === 3)).toBeDefined()
    expect(polygonArea(pts)).toBeCloseTo(6)
  })

  it('respects shape position', () => {
    const t = tri('TL')
    t.position = { x: 10, y: 20 }
    const pts = vertices(t)
    expect(pts[0]).toEqual({ x: 10, y: 20 })
    expect(pts[1]).toEqual({ x: 14, y: 20 })
    expect(pts[2]).toEqual({ x: 10, y: 23 })
  })
})

describe('vertices(square|rectangle)', () => {
  it('square has 4 axis-aligned points', () => {
    const pts = vertices({
      id: 's',
      kind: 'square',
      position: { x: 0, y: 0 },
      colorIndex: 0,
      side: createUnitValue(5, 'ft'),
    })
    expect(pts).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 5 },
      { x: 0, y: 5 },
    ])
  })

  it('rectangle uses width as x and height as y', () => {
    const pts = vertices({
      id: 'r',
      kind: 'rectangle',
      position: { x: 1, y: 1 },
      colorIndex: 0,
      width: createUnitValue(6, 'ft'),
      height: createUnitValue(2, 'ft'),
    })
    expect(pts).toEqual([
      { x: 1, y: 1 },
      { x: 7, y: 1 },
      { x: 7, y: 3 },
      { x: 1, y: 3 },
    ])
  })
})

describe('shapeSize', () => {
  it('returns the bounding box in feet', () => {
    expect(
      shapeSize({
        id: 's',
        kind: 'square',
        position: { x: 0, y: 0 },
        colorIndex: 0,
        side: createUnitValue(4, 'ft'),
      }),
    ).toEqual({ w: 4, h: 4 })
  })
})

describe('roomMemberVertices', () => {
  it('translates member shapes by the room position', () => {
    const room: Room = {
      id: 'rm1',
      kind: 'room',
      name: 'Room 1',
      position: { x: 5, y: 5 },
      colorIndex: 0,
      members: [
        {
          id: 's',
          kind: 'square',
          position: { x: 0, y: 0 },
          colorIndex: 0,
          side: createUnitValue(2, 'ft'),
        },
      ],
    }
    const rings = roomMemberVertices(room)
    expect(rings[0]).toEqual([
      { x: 5, y: 5 },
      { x: 7, y: 5 },
      { x: 7, y: 7 },
      { x: 5, y: 7 },
    ])
  })
})
