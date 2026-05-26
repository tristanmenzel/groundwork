import { paletteColor } from '../color/palette'

// A blocky "G" built from the app's own pastel shapes. Each stroke is a tile
// in a different palette hue, with a small gap so they read as separate shapes.
type Block = { x: number; y: number; w: number; h: number; colorIndex: number }

const BLOCKS: Block[] = [
  { x: 2, y: 2, w: 19, h: 5, colorIndex: 0 }, // top bar
  { x: 2, y: 8, w: 5, h: 8, colorIndex: 3 }, // left side
  { x: 2, y: 17, w: 19, h: 5, colorIndex: 6 }, // bottom bar
  { x: 11, y: 12, w: 4, h: 4, colorIndex: 8 }, // inner tongue
  { x: 16, y: 12, w: 5, h: 4, colorIndex: 10 }, // lower-right return
]

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label="Groundwork logo"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {BLOCKS.map((b, i) => {
        const c = paletteColor(b.colorIndex)
        return (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={1.4}
            fill={c.fill}
            stroke={c.border}
            strokeWidth={1}
          />
        )
      })}
    </svg>
  )
}
