import { useEffect, useRef, useState } from 'react'
import { useFloorPlanStore } from '../store/useFloorPlanStore'
import { usePanZoom, screenToWorld } from '../hooks/usePanZoom'
import { ShapeLayer, ShapeLabels } from './ShapeLayer'
import { PX_PER_FT } from '../constants'
import type { LayoutItem, Point } from '../types'
import { useDrag } from '../hooks/useDrag'
import { useMarquee } from '../hooks/useMarquee'
import { SnapGuides } from './SnapGuides'
import { MeasureOverlay } from './MeasureOverlay'

type Props = {
  onRequestEdit: (id: string) => void
  registerWorldCenter: (fn: () => Point) => void
}

export function Canvas({ onRequestEdit, registerWorldCenter }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const items = useFloorPlanStore((s) => s.items)
  const selectionIds = useFloorPlanStore((s) => s.selectionIds)
  const selectOnly = useFloorPlanStore((s) => s.selectOnly)
  const toggleSelect = useFloorPlanStore((s) => s.toggleSelect)
  const measureMode = useFloorPlanStore((s) => s.measureMode)
  const { viewport, worldCenter } = usePanZoom(svgRef)

  const [measurePoint, setMeasurePoint] = useState<Point | null>(null)
  // Clear the stale measure point when leaving measure mode. Adjusting state
  // during render (rather than in an effect) is React's recommended pattern for
  // resetting state in response to a prop/state change.
  const [prevMeasureMode, setPrevMeasureMode] = useState(measureMode)
  if (measureMode !== prevMeasureMode) {
    setPrevMeasureMode(measureMode)
    if (!measureMode) setMeasurePoint(null)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!measureMode) return
    const svg = svgRef.current
    if (!svg) return
    const r = svg.getBoundingClientRect()
    setMeasurePoint(screenToWorld({ x: e.clientX - r.left, y: e.clientY - r.top }, viewport))
  }

  // expose worldCenter to parent (so Toolbar's Add can place at viewport center)
  useEffect(() => {
    registerWorldCenter(worldCenter)
  }, [worldCenter, registerWorldCenter])

  const { onLabelPointerDown, guides } = useDrag(svgRef)
  const { onPointerDown: onMarqueePointerDown, rect: marqueeRect, previewIds, additive } = useMarquee(svgRef)

  const selectionSet = new Set(selectionIds)

  // While a marquee drag is active, preview the items it would select. A plain
  // drag previews only the enclosed items; a Ctrl-drag previews existing + enclosed.
  const marqueeActive = marqueeRect !== null && (marqueeRect.w > 0 || marqueeRect.h > 0)
  const effectiveSelected = marqueeActive
    ? new Set(additive ? [...selectionIds, ...previewIds] : previewIds)
    : selectionSet

  function handleShapePointerDown(e: React.PointerEvent, id: string) {
    // only fire on left-click; ignore if pan-modifier (space) is held
    if (e.button !== 0) return
    if (measureMode) return // measure tool is non-interactive w.r.t. selection
    e.stopPropagation()
    if (e.ctrlKey || e.metaKey) {
      toggleSelect(id)
    } else {
      if (!selectionSet.has(id)) {
        selectOnly(id)
      }
    }
  }

  const [size, setSize] = useState({ w: 1000, h: 700 })
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    function update() {
      const rect = svg!.getBoundingClientRect()
      setSize({ w: rect.width, h: rect.height })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(svg)
    return () => ro.disconnect()
  }, [])

  // Sort so selected items render last (on top)
  const renderItems = [...items].sort(
    (a, b) => Number(effectiveSelected.has(a.id)) - Number(effectiveSelected.has(b.id)),
  )

  return (
    <svg
      ref={svgRef}
      className="canvas"
      width="100%"
      height="100%"
      style={{
        display: 'block',
        background: 'var(--canvas-bg)',
        touchAction: 'none',
        cursor: measureMode ? 'crosshair' : 'default',
      }}
      onPointerDown={onMarqueePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setMeasurePoint(null)}
    >
      <BackgroundGrid viewport={viewport.scale} tx={viewport.tx} ty={viewport.ty} w={size.w} h={size.h} />
      <g
        transform={`translate(${viewport.tx} ${viewport.ty}) scale(${PX_PER_FT * viewport.scale})`}
      >
        {/* Pass 1: shape fills/outlines (interaction lives here) */}
        {renderItems.map((item) => (
          <ShapeLayer
            key={item.id}
            item={item as LayoutItem}
            selected={effectiveSelected.has(item.id)}
            onShapePointerDown={handleShapePointerDown}
            onDoubleClick={onRequestEdit}
          />
        ))}
        {/* Pass 2: labels on top of every fill, so none render as faint ghosts */}
        {renderItems.map((item) => (
          <ShapeLabels
            key={item.id}
            item={item as LayoutItem}
            onLabelPointerDown={onLabelPointerDown}
            onDoubleClick={onRequestEdit}
          />
        ))}
        <SnapGuides guides={guides} />
        {measureMode && <MeasureOverlay point={measurePoint} />}
      </g>
      {marqueeRect && (
        <rect
          x={marqueeRect.x}
          y={marqueeRect.y}
          width={marqueeRect.w}
          height={marqueeRect.h}
          fill="rgba(99, 102, 241, 0.12)"
          stroke="#6366f1"
          strokeWidth={1}
          strokeDasharray="4 3"
          pointerEvents="none"
        />
      )}
    </svg>
  )
}

function BackgroundGrid({ viewport, tx, ty, w, h }: { viewport: number; tx: number; ty: number; w: number; h: number }) {
  const step = PX_PER_FT * viewport // 1ft in px
  if (step < 6) return null // too dense to draw
  // Find offsets so the grid lines align with world (0,0)
  const offX = ((tx % step) + step) % step
  const offY = ((ty % step) + step) % step
  const lines: React.ReactElement[] = []
  for (let x = offX; x < w; x += step) {
    lines.push(<line key={`v${x}`} x1={x} x2={x} y1={0} y2={h} style={{ stroke: 'var(--grid-line)' }} strokeWidth={x === offX || (x - tx) % (step * 5) < 0.5 ? 1 : 0.5} />)
  }
  for (let y = offY; y < h; y += step) {
    lines.push(<line key={`h${y}`} x1={0} x2={w} y1={y} y2={y} style={{ stroke: 'var(--grid-line)' }} strokeWidth={1} />)
  }
  return <g pointerEvents="none">{lines}</g>
}

