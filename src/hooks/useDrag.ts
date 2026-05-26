import { useRef, useState } from 'react'
import { useFloorPlanStore } from '../store/useFloorPlanStore'
import type { Point } from '../types'
import { snapOffset, type SnapGuide } from '../geometry/snap'
import { SNAP_BUFFER, PX_PER_FT } from '../constants'

type Snapshot = {
  pointerId: number
  startClient: Point
  /** ids of items snapshotted at drag start */
  draggingIds: ReadonlySet<string>
  /** original positions of dragging items, keyed by id */
  origin: Map<string, Point>
}

export function useDrag(svgRef: React.RefObject<SVGSVGElement | null>) {
  const snap = useRef<Snapshot | null>(null)
  const [guides, setGuides] = useState<SnapGuide[]>([])
  const draggedRef = useRef(false)

  function onLabelPointerDown(e: React.PointerEvent, id: string) {
    if (e.button !== 0) return
    const store = useFloorPlanStore.getState()
    if (store.measureMode) return // measure tool: no dragging
    e.stopPropagation()
    // Ctrl/Cmd-click on the label is a selection toggle, not a drag — so clicking
    // anywhere on a shape (body or label) adds/removes it from the selection.
    if (e.ctrlKey || e.metaKey) {
      store.toggleSelect(id)
      return
    }
    // Make sure the dragged item is in the selection. If it isn't, select-only it.
    const selection = store.selectionIds.includes(id) ? store.selectionIds : (store.selectOnly(id), [id])
    const draggingIds = new Set(selection)
    const origin = new Map<string, Point>()
    for (const item of store.items) {
      if (draggingIds.has(item.id)) origin.set(item.id, { ...item.position })
    }
    snap.current = {
      pointerId: e.pointerId,
      startClient: { x: e.clientX, y: e.clientY },
      draggingIds,
      origin,
    }
    draggedRef.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  function onPointerMove(e: PointerEvent) {
    const s = snap.current
    if (!s) return
    if (e.pointerId !== s.pointerId) return
    const v = useFloorPlanStore.getState().viewport
    const dxPx = e.clientX - s.startClient.x
    const dyPx = e.clientY - s.startClient.y
    if (!draggedRef.current && Math.hypot(dxPx, dyPx) < 2) return
    draggedRef.current = true
    const dx = dxPx / (PX_PER_FT * v.scale)
    const dy = dyPx / (PX_PER_FT * v.scale)
    applyDelta(s, { x: dx, y: dy })
  }

  function onPointerUp(e: PointerEvent) {
    const s = snap.current
    if (!s) return
    if (e.pointerId !== s.pointerId) return
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    setGuides([])
    snap.current = null
  }

  function applyDelta(s: Snapshot, proposed: Point) {
    const items = useFloorPlanStore.getState().items
    // First reset items back to their snapshotted origin so snap calculations work on a fresh proposed position.
    // We do this by computing the delta from origin → desired position directly, applying to a virtual copy.
    const itemsVirtual = items.map((it) => {
      const orig = s.origin.get(it.id)
      return orig ? { ...it, position: orig } : it
    })
    const { delta, guides: g } = snapOffset(s.draggingIds, itemsVirtual, proposed, SNAP_BUFFER.ft)
    // Apply the corrected delta to the original positions.
    useFloorPlanStore.setState((st) => ({
      items: st.items.map((it) => {
        const orig = s.origin.get(it.id)
        if (!orig) return it
        return { ...it, position: { x: orig.x + delta.x, y: orig.y + delta.y } }
      }),
    }))
    setGuides(g)
  }

  // Avoid an unused warning on svgRef when caller wires nothing else
  void svgRef

  return { onLabelPointerDown, guides }
}
