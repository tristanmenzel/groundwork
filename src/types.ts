// 'm' is display-only — values are still stored as ft + mm; metres are derived from mm.
export type Unit = 'ft' | 'mm' | 'm'

export type UnitValue = { ft: number; mm: number }

export type Point = { x: number; y: number }

export type Corner = 'TL' | 'TR' | 'BL' | 'BR'

export type ShapeKind = 'square' | 'rectangle' | 'triangle'

type ShapeBase = {
  id: string
  position: Point
  colorIndex: number
}

export type Square = ShapeBase & {
  kind: 'square'
  side: UnitValue
}

export type Rectangle = ShapeBase & {
  kind: 'rectangle'
  width: UnitValue
  height: UnitValue
}

export type Triangle = ShapeBase & {
  kind: 'triangle'
  width: UnitValue
  height: UnitValue
  rightAngle: Corner
}

export type Shape = Square | Rectangle | Triangle

export type Room = {
  id: string
  kind: 'room'
  name: string
  position: Point
  colorIndex: number
  members: Shape[]
}

export type LayoutItem = Shape | Room

export type ShapeDraft =
  | { kind: 'square'; side: UnitValue }
  | { kind: 'rectangle'; width: UnitValue; height: UnitValue }
  | { kind: 'triangle'; width: UnitValue; height: UnitValue; rightAngle: Corner }

export type Viewport = { tx: number; ty: number; scale: number }

export type BBox = { min: Point; max: Point }

export type Edge = { a: Point; b: Point }

export const isRoom = (item: LayoutItem): item is Room => item.kind === 'room'
export const isShape = (item: LayoutItem): item is Shape => item.kind !== 'room'
