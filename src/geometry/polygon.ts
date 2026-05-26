import type { BBox, Edge, Point } from '../types'

/** Shoelace area in square units. Result is always non-negative. */
export function polygonArea(points: Point[]): number {
  if (points.length < 3) return 0
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!
    const b = points[(i + 1) % points.length]!
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2
}

/** Total length of all ring edges (multi-ring aware). */
export function polygonPerimeter(rings: Point[][]): number {
  let total = 0
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!
      const b = ring[(i + 1) % ring.length]!
      total += Math.hypot(b.x - a.x, b.y - a.y)
    }
  }
  return total
}

export function polygonBBox(points: Point[]): BBox {
  if (points.length === 0) return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } }
}

export function combineBBoxes(boxes: BBox[]): BBox {
  if (boxes.length === 0) return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const b of boxes) {
    if (b.min.x < minX) minX = b.min.x
    if (b.min.y < minY) minY = b.min.y
    if (b.max.x > maxX) maxX = b.max.x
    if (b.max.y > maxY) maxY = b.max.y
  }
  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } }
}

export function polygonEdges(points: Point[]): Edge[] {
  const edges: Edge[] = []
  for (let i = 0; i < points.length; i++) {
    edges.push({ a: points[i]!, b: points[(i + 1) % points.length]! })
  }
  return edges
}

export function centroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 }
  let sx = 0
  let sy = 0
  for (const p of points) {
    sx += p.x
    sy += p.y
  }
  return { x: sx / points.length, y: sy / points.length }
}
