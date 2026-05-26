import { useEffect, useRef, useState } from 'react'
import { useFloorPlanStore } from '../store/useFloorPlanStore'
import { screenToWorld } from './usePanZoom'
import type { LayoutItem, Point } from '../types'
import { isRoom } from '../types'
import { vertices, roomMemberVertices } from '../geometry/shapeVertices'

/** Marquee rectangle in screen pixels, relative to the SVG's top-left. */
export type MarqueeRect = { x: number; y: number; w: number; h: number }

function itemWorldVertices(item: LayoutItem): Point[] {
  return isRoom(item) ? roomMemberVertices(item).flat() : vertices(item)
}

function fullyInside(item: LayoutItem, minX: number, minY: number, maxX: number, maxY: number): boolean {
  const vs = itemWorldVertices(item)
  if (vs.length === 0) return false
  return vs.every((p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY)
}

/**
 * Rubber-band selection on empty canvas. A plain drag replaces the selection
 * with the fully-enclosed items; Ctrl/Cmd-drag adds them to the existing
 * selection. A plain click (no drag) clears the selection.
 */
export function useMarquee(svgRef: React.RefObject<SVGSVGElement | null>) {
  const [rect, setRect] = useState<MarqueeRect | null>(null)
  const [previewIds, setPreviewIds] = useState<string[]>([])
  const [additive, setAdditive] = useState(false)

  const startRef = useRef<{ x: number; y: number; pointerId: number } | null>(null)
  const additiveRef = useRef(false)
  const draggedRef = useRef(false)
  const previewRef = useRef<string[]>([])
  const spaceDown = useRef(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceDown.current = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceDown.current = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return
    if (useFloorPlanStore.getState().measureMode) return // measure tool owns the canvas
    if (spaceDown.current) return // space+drag is a pan
    if (e.target !== svgRef.current) return // only on empty background
    const svg = svgRef.current
    if (!svg) return
    const r = svg.getBoundingClientRect()
    const sx = e.clientX - r.left
    const sy = e.clientY - r.top
    startRef.current = { x: sx, y: sy, pointerId: e.pointerId }
    additiveRef.current = e.ctrlKey || e.metaKey
    setAdditive(additiveRef.current)
    draggedRef.current = false
    previewRef.current = []
    setRect({ x: sx, y: sy, w: 0, h: 0 })
    setPreviewIds([])
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  function onMove(e: PointerEvent) {
    const start = startRef.current
    const svg = svgRef.current
    if (!start || !svg || e.pointerId !== start.pointerId) return
    const r = svg.getBoundingClientRect()
    const cx = e.clientX - r.left
    const cy = e.clientY - r.top
    if (!draggedRef.current && Math.hypot(cx - start.x, cy - start.y) < 3) return
    draggedRef.current = true

    const x = Math.min(start.x, cx)
    const y = Math.min(start.y, cy)
    const w = Math.abs(cx - start.x)
    const h = Math.abs(cy - start.y)
    setRect({ x, y, w, h })

    const v = useFloorPlanStore.getState().viewport
    const p1 = screenToWorld({ x, y }, v)
    const p2 = screenToWorld({ x: x + w, y: y + h }, v)
    const minX = Math.min(p1.x, p2.x)
    const maxX = Math.max(p1.x, p2.x)
    const minY = Math.min(p1.y, p2.y)
    const maxY = Math.max(p1.y, p2.y)

    const items = useFloorPlanStore.getState().items
    const inside = items.filter((it) => fullyInside(it, minX, minY, maxX, maxY)).map((it) => it.id)
    previewRef.current = inside
    setPreviewIds(inside)
  }

  function onUp(e: PointerEvent) {
    const start = startRef.current
    if (!start || e.pointerId !== start.pointerId) return
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)

    const store = useFloorPlanStore.getState()
    if (draggedRef.current) {
      if (additiveRef.current) store.addToSelection(previewRef.current)
      else store.setSelection(previewRef.current)
    } else if (!additiveRef.current) {
      // plain click on empty space clears; ctrl-click on empty space keeps selection
      store.clearSelection()
    }

    startRef.current = null
    draggedRef.current = false
    previewRef.current = []
    setRect(null)
    setPreviewIds([])
  }

  return { onPointerDown, rect, previewIds, additive }
}
