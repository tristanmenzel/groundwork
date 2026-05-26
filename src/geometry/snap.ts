import type { Edge, LayoutItem, Point, Shape } from '../types'
import { isRoom } from '../types'
import { vertices, roomMemberVertices } from './shapeVertices'

type Axis = 'x' | 'y'

type AxisAlignedEdge = {
  axis: Axis            // 'x': edge runs along x (constant y); 'y': edge runs along y (constant x)
  fixed: number         // the constant coordinate value
  start: number         // tangent-axis start
  end: number           // tangent-axis end (start <= end)
}

export type SnapGuide = Edge

export type SnapResult = {
  /** Position delta to apply. May be a snap-adjusted version of the proposed delta. */
  delta: Point
  /** Edges to render as snap guides. */
  guides: SnapGuide[]
}

/**
 * Given a layout item being dragged and the rest of the layout, return the
 * snap-corrected world-delta. Snapping considers only axis-aligned edges
 * (triangles' hypotenuse is skipped). x and y are snapped independently.
 */
export function snapOffset(
  draggingIds: ReadonlySet<string>,
  items: LayoutItem[],
  proposed: Point,
  buffer: number,
): SnapResult {
  const dragging: LayoutItem[] = []
  const others: LayoutItem[] = []
  for (const item of items) {
    if (draggingIds.has(item.id)) dragging.push(item)
    else others.push(item)
  }

  if (dragging.length === 0 || others.length === 0) {
    return { delta: proposed, guides: [] }
  }

  const draggingEdges = collectAxisAlignedEdges(dragging, proposed)
  const otherEdges = collectAxisAlignedEdges(others, { x: 0, y: 0 })

  let bestX: { adjustment: number; guide: SnapGuide } | null = null
  let bestY: { adjustment: number; guide: SnapGuide } | null = null

  for (const d of draggingEdges) {
    for (const o of otherEdges) {
      if (d.axis !== o.axis) continue
      // Tangent-axis proximity: edges that overlap, OR whose nearest endpoints
      // are within the buffer. The endpoint case is what makes corners snap —
      // two diagonally-offset rectangles align even though their perpendicular
      // edges don't overlap.
      const overlapStart = Math.max(d.start, o.start)
      const overlapEnd = Math.min(d.end, o.end)
      const tangentGap = overlapStart - overlapEnd // <= 0 when overlapping
      if (tangentGap > buffer) continue

      const distance = o.fixed - d.fixed
      if (Math.abs(distance) > buffer) continue

      const guide: SnapGuide = guideEdge(o)
      if (d.axis === 'x') {
        // horizontal edges: snap on y
        if (bestY === null || Math.abs(distance) < Math.abs(bestY.adjustment)) {
          bestY = { adjustment: distance, guide }
        }
      } else {
        // vertical edges: snap on x
        if (bestX === null || Math.abs(distance) < Math.abs(bestX.adjustment)) {
          bestX = { adjustment: distance, guide }
        }
      }
    }
  }

  const delta: Point = {
    x: proposed.x + (bestX ? bestX.adjustment : 0),
    y: proposed.y + (bestY ? bestY.adjustment : 0),
  }

  const guides: SnapGuide[] = []
  if (bestX) guides.push(bestX.guide)
  if (bestY) guides.push(bestY.guide)

  return { delta, guides }
}

function guideEdge(e: AxisAlignedEdge): Edge {
  if (e.axis === 'x') {
    return { a: { x: e.start, y: e.fixed }, b: { x: e.end, y: e.fixed } }
  }
  return { a: { x: e.fixed, y: e.start }, b: { x: e.fixed, y: e.end } }
}

function collectAxisAlignedEdges(items: LayoutItem[], offset: Point): AxisAlignedEdge[] {
  const edges: AxisAlignedEdge[] = []
  for (const item of items) {
    const rings = itemRings(item)
    for (const ring of rings) {
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i]!
        const b = ring[(i + 1) % ring.length]!
        const ax = a.x + offset.x
        const ay = a.y + offset.y
        const bx = b.x + offset.x
        const by = b.y + offset.y
        if (ay === by) {
          // horizontal edge (constant y)
          edges.push({
            axis: 'x',
            fixed: ay,
            start: Math.min(ax, bx),
            end: Math.max(ax, bx),
          })
        } else if (ax === bx) {
          // vertical edge (constant x)
          edges.push({
            axis: 'y',
            fixed: ax,
            start: Math.min(ay, by),
            end: Math.max(ay, by),
          })
        }
        // ignore diagonal edges
      }
    }
  }
  return edges
}

function itemRings(item: LayoutItem): Point[][] {
  if (isRoom(item)) {
    return roomMemberVertices(item)
  }
  return [vertices(item as Shape)]
}
