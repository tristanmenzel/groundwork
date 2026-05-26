import type { SnapGuide } from '../geometry/snap'

export function SnapGuides({ guides }: { guides: SnapGuide[] }) {
  if (guides.length === 0) return null
  return (
    <g pointerEvents="none">
      {guides.map((g, i) => (
        <line
          key={i}
          x1={g.a.x}
          y1={g.a.y}
          x2={g.b.x}
          y2={g.b.y}
          stroke="#ff5577"
          strokeWidth={0.05}
          strokeDasharray="0.2 0.15"
        />
      ))}
    </g>
  )
}
