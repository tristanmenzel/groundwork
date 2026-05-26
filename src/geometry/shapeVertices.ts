import type { Corner, Point, Room, Shape } from '../types'

/**
 * Returns absolute polygon points (counter-clockwise in screen-y-down terms,
 * which is clockwise in math terms — polygon-clipping accepts either winding).
 *
 * For triangles, `rightAngle` indicates which corner of the length×height
 * bounding box holds the 90° corner. The hypotenuse connects the two corners
 * adjacent to it.
 *
 *   TL:  (0,0)–(L,0)         TR:  (0,0)–(L,0)
 *         |                              \    |
 *         |                               \   |
 *        (0,H)                            (L,H)
 *
 *   BL:  (0,0)                         TR-mirror...
 *         | \
 *         |  \
 *        (0,H)–(L,H)
 */
export function vertices(shape: Shape): Point[] {
  const { position } = shape
  switch (shape.kind) {
    case 'square': {
      const s = shape.side.ft
      return rect(position, s, s)
    }
    case 'rectangle': {
      return rect(position, shape.width.ft, shape.height.ft)
    }
    case 'triangle': {
      const l = shape.width.ft
      const h = shape.height.ft
      // local coords (origin top-left of bounding box)
      const local = triangleLocal(l, h, shape.rightAngle)
      return local.map((p) => ({ x: position.x + p.x, y: position.y + p.y }))
    }
  }
}

function rect(position: Point, w: number, h: number): Point[] {
  return [
    { x: position.x, y: position.y },
    { x: position.x + w, y: position.y },
    { x: position.x + w, y: position.y + h },
    { x: position.x, y: position.y + h },
  ]
}

function triangleLocal(l: number, h: number, corner: Corner): Point[] {
  switch (corner) {
    case 'TL':
      // right angle at (0,0); legs along +x and +y
      return [
        { x: 0, y: 0 },
        { x: l, y: 0 },
        { x: 0, y: h },
      ]
    case 'TR':
      // right angle at (L,0); legs along -x and +y
      return [
        { x: l, y: 0 },
        { x: l, y: h },
        { x: 0, y: 0 },
      ]
    case 'BR':
      // right angle at (L,H); legs along -x and -y
      return [
        { x: l, y: h },
        { x: 0, y: h },
        { x: l, y: 0 },
      ]
    case 'BL':
      // right angle at (0,H); legs along +x and -y
      return [
        { x: 0, y: h },
        { x: 0, y: 0 },
        { x: l, y: h },
      ]
  }
}

/** Member shapes of a room expressed in world coordinates. */
export function roomMemberVertices(room: Room): Point[][] {
  return room.members.map((m) => {
    const moved: Shape = { ...m, position: { x: room.position.x + m.position.x, y: room.position.y + m.position.y } }
    return vertices(moved)
  })
}

/** Returns the bounding box width and height of a shape in feet. */
export function shapeSize(shape: Shape): { w: number; h: number } {
  switch (shape.kind) {
    case 'square':
      return { w: shape.side.ft, h: shape.side.ft }
    case 'rectangle':
      return { w: shape.width.ft, h: shape.height.ft }
    case 'triangle':
      return { w: shape.width.ft, h: shape.height.ft }
  }
}
