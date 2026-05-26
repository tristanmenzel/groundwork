import type { UnitValue } from './types'

export const FT_TO_MM = 304.8

export const SNAP_BUFFER: UnitValue = { ft: 0.5, mm: 0.5 * FT_TO_MM }

export const ARROW_NUDGE_FT = 0.25
export const ARROW_NUDGE_MM = 50

// 12 pastel hues
const HUES = [0, 30, 60, 95, 130, 165, 200, 220, 250, 285, 315, 340]

export const PASTEL_PALETTE = HUES.map((h) => ({
  fill: `hsl(${h}, 70%, 88%)`,
  border: `hsl(${h}, 55%, 45%)`,
}))

export const STORAGE_KEY = 'floor-plan-v1'
export const STORAGE_VERSION = 2

// Pixels per foot at scale = 1
export const PX_PER_FT = 20

// Min/max zoom factors
export const MIN_SCALE = 0.2
export const MAX_SCALE = 8
