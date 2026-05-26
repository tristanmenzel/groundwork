import polygonClipping from 'polygon-clipping'
import type { BBox, Point, Shape } from '../types'
import { combineBBoxes, polygonArea, polygonBBox, polygonPerimeter } from './polygon'
import { vertices } from './shapeVertices'

export type UnionResult = {
  /**
   * Multi-polygon: array of polygons; each polygon has one outer ring + zero or
   * more inner (hole) rings. Coordinates are in feet.
   */
  polygons: Point[][][]
  area: number
  perimeter: number
  bbox: BBox
}

/** Unions every shape into one or more polygons; computes area (without double-counting overlap) and exterior perimeter. */
export function unionShapes(shapes: Shape[]): UnionResult {
  if (shapes.length === 0) {
    return { polygons: [], area: 0, perimeter: 0, bbox: { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } } }
  }

  // Convert each shape into a polygon-clipping Polygon: [outer ring].
  const inputs = shapes.map((s) => [vertices(s).map((p): [number, number] => [p.x, p.y])])

  // polygon-clipping accepts (poly, ...polys); typescript types are loose but runtime accepts any number.
  const first = inputs[0]!
  const rest = inputs.slice(1)
  const result = polygonClipping.union(first, ...rest)

  // result is MultiPolygon = Polygon[]; Polygon = Ring[]; Ring = [number,number][]
  const polygons: Point[][][] = result.map((poly) =>
    poly.map((ring) =>
      ring.map(([x, y]) => ({ x, y }))
    ),
  )

  let area = 0
  const allRings: Point[][] = []
  for (const poly of polygons) {
    const [outer, ...holes] = poly
    if (!outer) continue
    area += polygonArea(outer)
    for (const hole of holes) area -= polygonArea(hole)
    allRings.push(outer, ...holes)
  }
  const perimeter = polygonPerimeter(allRings)
  const bbox = combineBBoxes(allRings.map(polygonBBox))

  return { polygons, area, perimeter, bbox }
}
