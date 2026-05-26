import { memo, useMemo } from 'react'
import type { LayoutItem, Point, Unit } from '../types'
import { isRoom } from '../types'
import { vertices } from '../geometry/shapeVertices'
import { polygonArea, centroid, combineBBoxes, polygonBBox } from '../geometry/polygon'
import { unionShapes } from '../geometry/union'
import { paletteColor } from '../color/palette'
import { createUnitValue, formatArea, formatLength } from '../units/unit'
import { useFloorPlanStore } from '../store/useFloorPlanStore'

type Props = {
  item: LayoutItem
  selected: boolean
  onShapePointerDown: (e: React.PointerEvent, id: string) => void
  onLabelPointerDown: (e: React.PointerEvent, id: string) => void
  onDoubleClick: (id: string) => void
}

function ShapeLayerImpl({
  item,
  selected,
  onShapePointerDown,
  onLabelPointerDown,
  onDoubleClick,
}: Props) {
  const displayUnit = useFloorPlanStore((s) => s.displayUnit)
  const color = paletteColor(item.colorIndex)

  const { pathD, center, areaSqFt, name, edgeRings } = useMemo(() => {
    if (isRoom(item)) {
      const u = unionShapes(item.members.map((m) => ({
        ...m,
        position: { x: item.position.x + m.position.x, y: item.position.y + m.position.y },
      })))
      const path = pathFromMultiPolygon(u.polygons)
      // label center = bbox center of all outer rings
      const outerRings = u.polygons.map((poly) => poly[0]!).filter(Boolean)
      const bbox = combineBBoxes(outerRings.map(polygonBBox))
      const c: Point = {
        x: (bbox.min.x + bbox.max.x) / 2,
        y: (bbox.min.y + bbox.max.y) / 2,
      }
      // measure only the exterior outline of the combined room
      return { pathD: path, center: c, areaSqFt: u.area, name: item.name, edgeRings: outerRings }
    }
    const pts = vertices(item)
    return {
      // centroid (vertex average) sits inside the shape — for a right triangle
      // the bbox midpoint lands on the hypotenuse, the centroid does not.
      pathD: pathFromRing(pts),
      center: centroid(pts),
      areaSqFt: polygonArea(pts),
      name: null,
      edgeRings: [pts],
    }
  }, [item])

  const clipId = `clip-${item.id}`

  return (
    <g
      onPointerDown={(e) => onShapePointerDown(e, item.id)}
      onDoubleClick={() => onDoubleClick(item.id)}
      style={{ cursor: 'pointer' }}
    >
      {selected && (
        <clipPath id={clipId}>
          <path d={pathD} />
        </clipPath>
      )}
      <path
        d={pathD}
        fill={color.fill}
        stroke={color.border}
        strokeWidth={0.06}
        strokeLinejoin="round"
        opacity={0.95}
      />
      {selected && (
        // Selection highlight: a wide stroke clipped to the shape so it only
        // grows inward — the shape's outer footprint never changes.
        <path
          d={pathD}
          fill="none"
          stroke={color.border}
          strokeWidth={0.24}
          strokeLinejoin="round"
          clipPath={`url(#${clipId})`}
          pointerEvents="none"
        />
      )}
      <EdgeLabels rings={edgeRings} color={color.border} displayUnit={displayUnit} />
      <Label
        center={center}
        color={color.border}
        name={name}
        text={formatArea(areaSqFt, displayUnit)}
        onPointerDown={(e) => onLabelPointerDown(e, item.id)}
      />
    </g>
  )
}

function EdgeLabels({ rings, color, displayUnit }: { rings: Point[][]; color: string; displayUnit: Unit }) {
  const labels: React.ReactElement[] = []
  rings.forEach((ring, ri) => {
    if (ring.length < 2) return
    const c = centroid(ring)
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!
      const b = ring[(i + 1) % ring.length]!
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len = Math.hypot(dx, dy)
      if (len < 0.01) continue
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      // outward normal, flipped to point away from the ring's centre
      let nx = -dy / len
      let ny = dx / len
      if ((mid.x - c.x) * nx + (mid.y - c.y) * ny < 0) {
        nx = -nx
        ny = -ny
      }
      const off = 0.45
      const pos = { x: mid.x + nx * off, y: mid.y + ny * off }
      let deg = (Math.atan2(dy, dx) * 180) / Math.PI
      if (deg > 90) deg -= 180
      else if (deg < -90) deg += 180
      labels.push(
        <g key={`${ri}-${i}`} transform={`translate(${pos.x} ${pos.y}) rotate(${deg})`} pointerEvents="none">
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={0.42}
            fill={color}
            stroke="white"
            strokeWidth={0.12}
            paintOrder="stroke"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {formatLength(createUnitValue(len, 'ft'), displayUnit)}
          </text>
        </g>,
      )
    }
  })
  return <g pointerEvents="none">{labels}</g>
}

export const ShapeLayer = memo(ShapeLayerImpl)

function Label({
  center,
  color,
  text,
  name,
  onPointerDown,
}: {
  center: Point
  color: string
  text: string
  name: string | null
  onPointerDown: (e: React.PointerEvent) => void
}) {
  return (
    <g transform={`translate(${center.x} ${center.y})`} style={{ cursor: 'grab' }} onPointerDown={onPointerDown}>
      {name && (
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={0.65}
          fontWeight={600}
          fill={color}
          y={-0.5}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {name}
        </text>
      )}
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={0.7}
        fontWeight={600}
        fill={color}
        y={name ? 0.4 : 0}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {text}
      </text>
      {/* invisible hit-area for the label so it's draggable even on triangle tips */}
      <rect
        x={-1.5}
        y={name ? -1.2 : -0.7}
        width={3}
        height={name ? 1.8 : 1.4}
        fill="transparent"
      />
    </g>
  )
}

function pathFromRing(pts: Point[]): string {
  if (pts.length === 0) return ''
  const head = pts[0]!
  return `M ${head.x} ${head.y} ` + pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ') + ' Z'
}

function pathFromMultiPolygon(multi: Point[][][]): string {
  return multi
    .flatMap((poly) => poly.map((ring) => pathFromRing(ring)))
    .join(' ')
}
