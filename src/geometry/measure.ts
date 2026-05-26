import type { LayoutItem, Point } from '../types'
import { isRoom } from '../types'
import { vertices } from './shapeVertices'
import { unionShapes } from './union'

export type AxisSpan = { min: number; max: number }
export type Measurement = { h: AxisSpan; v: AxisSpan }

/** Boundary rings (in world coords) used for hit-testing and span casting. */
export function itemBoundaryRings(item: LayoutItem): Point[][] {
  if (isRoom(item)) {
    const u = unionShapes(
      item.members.map((m) => ({
        ...m,
        position: { x: item.position.x + m.position.x, y: item.position.y + m.position.y },
      })),
    )
    return u.polygons.flat()
  }
  return [vertices(item)]
}

function horizontalCrossings(rings: Point[][], py: number): number[] {
  const xs: number[] = []
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!
      const b = ring[(i + 1) % ring.length]!
      // half-open rule excludes horizontal edges and avoids double-counting vertices
      if ((a.y <= py && b.y > py) || (b.y <= py && a.y > py)) {
        const t = (py - a.y) / (b.y - a.y)
        xs.push(a.x + t * (b.x - a.x))
      }
    }
  }
  return xs.sort((m, n) => m - n)
}

function verticalCrossings(rings: Point[][], px: number): number[] {
  const ys: number[] = []
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!
      const b = ring[(i + 1) % ring.length]!
      if ((a.x <= px && b.x > px) || (b.x <= px && a.x > px)) {
        const t = (px - a.x) / (b.x - a.x)
        ys.push(a.y + t * (b.y - a.y))
      }
    }
  }
  return ys.sort((m, n) => m - n)
}

/** The interior interval [min,max] of a scanline that contains `p`, or null if p is outside. */
function spanContaining(sorted: number[], p: number): AxisSpan | null {
  let left = -Infinity
  let right = Infinity
  let leftCount = 0
  for (const c of sorted) {
    if (c < p) {
      leftCount++
      if (c > left) left = c
    } else if (c > p && c < right) {
      right = c
    }
  }
  const inside = leftCount % 2 === 1
  if (!inside || !Number.isFinite(left) || !Number.isFinite(right)) return null
  return { min: left, max: right }
}

/** Horizontal and vertical interior spans through `p`, or null if p is not inside the rings. */
export function measureAt(rings: Point[][], p: Point): Measurement | null {
  const h = spanContaining(horizontalCrossings(rings, p.y), p.x)
  const v = spanContaining(verticalCrossings(rings, p.x), p.y)
  if (!h || !v) return null
  return { h, v }
}
