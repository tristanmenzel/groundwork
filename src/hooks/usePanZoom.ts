import { useCallback, useEffect, useRef } from 'react'
import { GESTURE_CANCEL_EVENT, MAX_SCALE, MIN_SCALE, PX_PER_FT } from '../constants'
import { useFloorPlanStore } from '../store/useFloorPlanStore'
import type { Point, Viewport } from '../types'

export function useViewport() {
  return useFloorPlanStore((s) => s.viewport)
}

export function useSetViewport() {
  return useFloorPlanStore((s) => s.setViewport)
}

/** Convert a world point (ft) to a screen point (px), given the viewport. */
export function worldToScreen(p: Point, v: Viewport): Point {
  return { x: p.x * PX_PER_FT * v.scale + v.tx, y: p.y * PX_PER_FT * v.scale + v.ty }
}

/** Convert a screen point (px relative to svg) to a world point (ft). */
export function screenToWorld(p: Point, v: Viewport): Point {
  return { x: (p.x - v.tx) / (PX_PER_FT * v.scale), y: (p.y - v.ty) / (PX_PER_FT * v.scale) }
}

export function usePanZoom(svgRef: React.RefObject<SVGSVGElement | null>) {
  const viewport = useViewport()
  const setViewport = useSetViewport()
  const isPanning = useRef(false)
  const lastPoint = useRef<Point | null>(null)
  const spaceDown = useRef(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space') {
        spaceDown.current = true
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') {
        spaceDown.current = false
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const rect = svg!.getBoundingClientRect()
      const localX = e.clientX - rect.left
      const localY = e.clientY - rect.top
      // Zoom toward the cursor: solve for the new tx,ty that keeps the world point under the cursor fixed.
      const v = useFloorPlanStore.getState().viewport
      const factor = Math.exp(-e.deltaY * 0.0015)
      const nextScale = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE)
      const k = nextScale / v.scale
      const tx = localX - k * (localX - v.tx)
      const ty = localY - k * (localY - v.ty)
      setViewport({ tx, ty, scale: nextScale })
    }

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === 'touch') return // touch is handled by the gesture listeners below
      // right-click OR middle-click OR (left-click + space) starts a pan
      if (e.button === 1 || e.button === 2 || (e.button === 0 && spaceDown.current)) {
        e.preventDefault()
        isPanning.current = true
        lastPoint.current = { x: e.clientX, y: e.clientY }
        svg!.setPointerCapture(e.pointerId)
      }
    }
    function onContextMenu(e: MouseEvent) {
      // suppress the menu so right-drag can pan the canvas
      e.preventDefault()
    }
    function onPointerMove(e: PointerEvent) {
      if (!isPanning.current || !lastPoint.current) return
      const dx = e.clientX - lastPoint.current.x
      const dy = e.clientY - lastPoint.current.y
      lastPoint.current = { x: e.clientX, y: e.clientY }
      const v = useFloorPlanStore.getState().viewport
      setViewport({ ...v, tx: v.tx + dx, ty: v.ty + dy })
    }
    function onPointerUp(e: PointerEvent) {
      if (isPanning.current) {
        isPanning.current = false
        lastPoint.current = null
        try {
          svg!.releasePointerCapture(e.pointerId)
        } catch {
          // ignore
        }
      }
    }

    // ----- Touch gestures: one-finger pan on empty canvas, two-finger pan + pinch zoom -----
    const touches = new Map<number, Point>() // pointerId -> svg-local point
    let pinchDist = 0
    let pinchMid: Point = { x: 0, y: 0 }
    let onePanActive = false
    let onePanLast: Point = { x: 0, y: 0 }

    function localPt(e: PointerEvent): Point {
      const r = svg!.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }

    // Capture phase so we also see touches that start on a shape (the shape's
    // pointerdown handler calls stopPropagation, which only affects bubbling).
    function onTouchDown(e: PointerEvent) {
      if (e.pointerType !== 'touch') return
      touches.set(e.pointerId, localPt(e))
      if (touches.size === 1) {
        // Pan only when the press lands on empty canvas; a touch on a shape is a
        // tap / drag / long-press handled elsewhere.
        onePanActive = e.target === svg
        onePanLast = { x: e.clientX, y: e.clientY }
      } else if (touches.size === 2) {
        // Second finger: take over as a pan/pinch gesture and cancel any
        // single-finger gesture already in flight.
        e.stopPropagation()
        e.preventDefault()
        window.dispatchEvent(new Event(GESTURE_CANCEL_EVENT))
        onePanActive = false
        const [a, b] = [...touches.values()] as [Point, Point]
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y) || 1
        pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      }
    }

    function onTouchMove(e: PointerEvent) {
      if (e.pointerType !== 'touch') return
      if (!touches.has(e.pointerId)) return
      touches.set(e.pointerId, localPt(e))
      const v = useFloorPlanStore.getState().viewport
      if (touches.size >= 2) {
        const [a, b] = [...touches.values()] as [Point, Point]
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1
        const mid: Point = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        const nextScale = clamp(v.scale * (dist / pinchDist), MIN_SCALE, MAX_SCALE)
        // Keep the world point under the previous midpoint anchored to the new
        // midpoint — this folds the pan (midpoint movement) and the zoom together.
        const w = screenToWorld(pinchMid, v)
        const tx = mid.x - w.x * PX_PER_FT * nextScale
        const ty = mid.y - w.y * PX_PER_FT * nextScale
        setViewport({ tx, ty, scale: nextScale })
        pinchDist = dist
        pinchMid = mid
      } else if (onePanActive) {
        const dx = e.clientX - onePanLast.x
        const dy = e.clientY - onePanLast.y
        onePanLast = { x: e.clientX, y: e.clientY }
        setViewport({ ...v, tx: v.tx + dx, ty: v.ty + dy })
      }
    }

    function onTouchUp(e: PointerEvent) {
      if (e.pointerType !== 'touch') return
      touches.delete(e.pointerId)
      if (touches.size < 2) pinchDist = 0
      if (touches.size === 0) onePanActive = false
    }

    svg.addEventListener('wheel', onWheel, { passive: false })
    svg.addEventListener('pointerdown', onPointerDown)
    svg.addEventListener('pointermove', onPointerMove)
    svg.addEventListener('pointerup', onPointerUp)
    svg.addEventListener('pointercancel', onPointerUp)
    svg.addEventListener('contextmenu', onContextMenu)
    svg.addEventListener('pointerdown', onTouchDown, { capture: true })
    window.addEventListener('pointermove', onTouchMove)
    window.addEventListener('pointerup', onTouchUp)
    window.addEventListener('pointercancel', onTouchUp)
    return () => {
      svg.removeEventListener('wheel', onWheel)
      svg.removeEventListener('pointerdown', onPointerDown)
      svg.removeEventListener('pointermove', onPointerMove)
      svg.removeEventListener('pointerup', onPointerUp)
      svg.removeEventListener('pointercancel', onPointerUp)
      svg.removeEventListener('contextmenu', onContextMenu)
      svg.removeEventListener('pointerdown', onTouchDown, { capture: true })
      window.removeEventListener('pointermove', onTouchMove)
      window.removeEventListener('pointerup', onTouchUp)
      window.removeEventListener('pointercancel', onTouchUp)
    }
  }, [svgRef, setViewport])

  /** Returns world-coordinate center of the viewport (for placing new shapes). */
  const worldCenterRef = useCallback((): Point => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    return screenToWorld({ x: rect.width / 2, y: rect.height / 2 }, viewport)
  }, [svgRef, viewport])

  return { viewport, worldCenter: worldCenterRef }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi)
}
