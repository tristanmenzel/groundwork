import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEY, STORAGE_VERSION } from '../constants'
import type { LayoutItem, Point, Room, Shape, ShapeDraft, Unit, Viewport } from '../types'
import { isRoom } from '../types'
import { pickNextColorIndex } from '../color/palette'
import { vertices } from '../geometry/shapeVertices'
import { polygonBBox } from '../geometry/polygon'

type State = {
  items: LayoutItem[]
  selectionIds: string[]
  displayUnit: Unit
  viewport: Viewport
  measureMode: boolean
}

type Actions = {
  addShape: (draft: ShapeDraft, worldCenter: Point) => void
  updateShape: (id: string, patch: Partial<Shape>) => void
  removeItem: (id: string) => void
  removeSelected: () => void

  selectOnly: (id: string) => void
  toggleSelect: (id: string) => void
  setSelection: (ids: string[]) => void
  addToSelection: (ids: string[]) => void
  clearSelection: () => void

  combineSelectionAsRoom: () => void
  disbandSelectedRooms: () => void
  renameRoom: (roomId: string, name: string) => void

  translateSelection: (delta: Point) => void

  setDisplayUnit: (unit: Unit) => void
  setViewport: (v: Viewport) => void
  toggleMeasureMode: () => void

  replaceState: (payload: { items: LayoutItem[]; displayUnit: Unit }) => void
  resetAll: () => void
}

export type FloorPlanStore = State & Actions

const initial: State = {
  items: [],
  selectionIds: [],
  displayUnit: 'ft',
  viewport: { tx: 0, ty: 0, scale: 1 },
  measureMode: false,
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

function buildShape(draft: ShapeDraft, position: Point, colorIndex: number): Shape {
  const base = { id: newId(), position, colorIndex }
  switch (draft.kind) {
    case 'square':
      return { ...base, kind: 'square', side: draft.side }
    case 'rectangle':
      return { ...base, kind: 'rectangle', width: draft.width, height: draft.height }
    case 'triangle':
      return { ...base, kind: 'triangle', width: draft.width, height: draft.height, rightAngle: draft.rightAngle }
  }
}

function buildRoomFromShapes(shapes: Shape[], name: string): Room {
  // Pick the origin as the bbox min of all shape vertices.
  const allPts = shapes.flatMap(vertices)
  const bbox = polygonBBox(allPts)
  const origin: Point = { x: bbox.min.x, y: bbox.min.y }
  const members = shapes.map((s) => ({
    ...s,
    position: { x: s.position.x - origin.x, y: s.position.y - origin.y },
  }))
  return {
    id: newId(),
    kind: 'room',
    name,
    position: origin,
    colorIndex: shapes[0]?.colorIndex ?? 0,
    members,
  }
}

function nextRoomName(items: LayoutItem[]): string {
  const used = new Set(items.filter(isRoom).map((r) => r.name))
  for (let i = 1; i < 10_000; i++) {
    const name = `Room ${i}`
    if (!used.has(name)) return name
  }
  return 'Room'
}

function moveItem(item: LayoutItem, delta: Point): LayoutItem {
  return { ...item, position: { x: item.position.x + delta.x, y: item.position.y + delta.y } } as LayoutItem
}

export const useFloorPlanStore = create<FloorPlanStore>()(
  persist(
    (set, get) => ({
      ...initial,

      addShape: (draft, worldCenter) => {
        const items = get().items
        const count = items.length
        const jitter = (count % 8) * 0.5
        const colorIndex = pickNextColorIndex(items.map((it) => it.colorIndex))
        const shape = buildShape(draft, { x: worldCenter.x + jitter, y: worldCenter.y + jitter }, colorIndex)
        set((s) => ({ items: [...s.items, shape], selectionIds: [shape.id] }))
      },

      updateShape: (id, patch) => {
        set((s) => ({
          items: s.items.map((item) => {
            if (item.id === id && !isRoom(item)) {
              return { ...item, ...patch } as Shape
            }
            return item
          }),
        }))
      },

      removeItem: (id) => {
        set((s) => ({
          items: s.items.filter((it) => it.id !== id),
          selectionIds: s.selectionIds.filter((sid) => sid !== id),
        }))
      },

      removeSelected: () => {
        set((s) => {
          const sel = new Set(s.selectionIds)
          if (sel.size === 0) return s
          return { items: s.items.filter((it) => !sel.has(it.id)), selectionIds: [] }
        })
      },

      selectOnly: (id) => set({ selectionIds: [id] }),

      toggleSelect: (id) =>
        set((s) =>
          s.selectionIds.includes(id)
            ? { selectionIds: s.selectionIds.filter((sid) => sid !== id) }
            : { selectionIds: [...s.selectionIds, id] },
        ),

      setSelection: (ids) => set({ selectionIds: [...new Set(ids)] }),

      addToSelection: (ids) =>
        set((s) => ({ selectionIds: [...new Set([...s.selectionIds, ...ids])] })),

      clearSelection: () => set({ selectionIds: [] }),

      combineSelectionAsRoom: () => {
        const { items, selectionIds } = get()
        const selectedSet = new Set(selectionIds)
        const selected = items.filter((it) => selectedSet.has(it.id))
        if (selected.length < 2) return
        // Flatten the selection into plain shapes: standalone shapes pass through,
        // selected rooms contribute their members (lifted to absolute positions).
        const shapes: Shape[] = []
        for (const it of selected) {
          if (isRoom(it)) {
            for (const m of it.members) {
              shapes.push({ ...m, position: { x: it.position.x + m.position.x, y: it.position.y + m.position.y } })
            }
          } else {
            shapes.push(it)
          }
        }
        if (shapes.length < 2) return
        const room = buildRoomFromShapes(shapes, nextRoomName(items))
        const remaining = items.filter((it) => !selectedSet.has(it.id))
        set({ items: [...remaining, room], selectionIds: [room.id] })
      },

      disbandSelectedRooms: () => {
        const { items, selectionIds } = get()
        const selectedSet = new Set(selectionIds)
        const rooms = items.filter((it): it is Room => selectedSet.has(it.id) && isRoom(it))
        if (rooms.length === 0) return
        const roomIds = new Set(rooms.map((r) => r.id))
        const restored: Shape[] = rooms.flatMap((room) =>
          room.members.map((m) => ({
            ...m,
            position: { x: room.position.x + m.position.x, y: room.position.y + m.position.y },
          })),
        )
        const others = items.filter((it) => !roomIds.has(it.id))
        // Keep any selected non-room items selected, plus the freshly-restored shapes.
        const keepSelected = selectionIds.filter((id) => !roomIds.has(id))
        set({ items: [...others, ...restored], selectionIds: [...keepSelected, ...restored.map((s) => s.id)] })
      },

      renameRoom: (roomId, name) => {
        set((s) => ({
          items: s.items.map((it) => (it.id === roomId && isRoom(it) ? { ...it, name } : it)),
        }))
      },

      translateSelection: (delta) => {
        const ids = new Set(get().selectionIds)
        if (ids.size === 0) return
        set((s) => ({
          items: s.items.map((it) => (ids.has(it.id) ? moveItem(it, delta) : it)),
        }))
      },

      setDisplayUnit: (unit) => set({ displayUnit: unit }),
      setViewport: (v) => set({ viewport: v }),
      toggleMeasureMode: () => set((s) => ({ measureMode: !s.measureMode })),

      replaceState: ({ items, displayUnit }) => set({ items, displayUnit, selectionIds: [] }),
      resetAll: () => set({ ...initial }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      partialize: (s) => ({
        items: s.items,
        displayUnit: s.displayUnit,
        viewport: s.viewport,
      }),
    },
  ),
)

