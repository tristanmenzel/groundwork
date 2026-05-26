import { useFloorPlanStore } from '../store/useFloorPlanStore'
import type { Point } from '../types'
import { itemBoundaryRings, measureAt, type Measurement } from '../geometry/measure'
import { createUnitValue, formatLength } from '../units/unit'

const MEASURE_COLOR = '#0c8599'

export function MeasureOverlay({ point }: { point: Point | null }) {
  const items = useFloorPlanStore((s) => s.items)
  const displayUnit = useFloorPlanStore((s) => s.displayUnit)

  if (!point) return null

  // Topmost item (last rendered) whose interior contains the cursor.
  let m: Measurement | null = null
  for (let i = items.length - 1; i >= 0; i--) {
    const found = measureAt(itemBoundaryRings(items[i]!), point)
    if (found) {
      m = found
      break
    }
  }
  if (!m) return null

  const { h, v } = m
  const px = point.x
  const py = point.y
  const hTotal = h.max - h.min
  const vTotal = v.max - v.min

  const fmt = (n: number) => formatLength(createUnitValue(n, 'ft'), displayUnit)
  const seg = (dist: number, total: number) => `${fmt(dist)} of total ${fmt(total)}`

  return (
    <g pointerEvents="none">
      {/* projection lines spanning the shape through the cursor */}
      <line x1={h.min} y1={py} x2={h.max} y2={py} stroke={MEASURE_COLOR} strokeWidth={0.05} strokeDasharray="0.25 0.18" />
      <line x1={px} y1={v.min} x2={px} y2={v.max} stroke={MEASURE_COLOR} strokeWidth={0.05} strokeDasharray="0.25 0.18" />

      {/* cursor marker */}
      <circle cx={px} cy={py} r={0.12} fill={MEASURE_COLOR} />

      {/* per-direction labels: distance to that boundary + total axis length */}
      <MeasureLabel x={(h.min + px) / 2} y={py - 0.35} text={seg(px - h.min, hTotal)} />
      <MeasureLabel x={(px + h.max) / 2} y={py - 0.35} text={seg(h.max - px, hTotal)} />
      <MeasureLabel x={px + 0.4} y={(v.min + py) / 2} text={seg(py - v.min, vTotal)} anchor="start" />
      <MeasureLabel x={px + 0.4} y={(py + v.max) / 2} text={seg(v.max - py, vTotal)} anchor="start" />
    </g>
  )
}

function MeasureLabel({
  x,
  y,
  text,
  anchor = 'middle',
}: {
  x: number
  y: number
  text: string
  anchor?: 'middle' | 'start'
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      fontSize={0.42}
      fontWeight={600}
      fill={MEASURE_COLOR}
      stroke="white"
      strokeWidth={0.14}
      paintOrder="stroke"
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      {text}
    </text>
  )
}
