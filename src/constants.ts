import type { UnitValue } from './types'

export const FT_TO_MM = 304.8

export const SNAP_BUFFER: UnitValue = { ft: 0.5, mm: 0.5 * FT_TO_MM }

export const ARROW_NUDGE_FT = 0.25
export const ARROW_NUDGE_MM = 50

// Edges shorter than this (in feet) are union/numeric artifacts — don't label them.
export const MIN_EDGE_LABEL_FT = 0.1

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

// Touch long-press to enter selection mode: hold duration and movement
// tolerance (in screen px) before the press is treated as a drag/pan instead.
export const LONG_PRESS_MS = 500
export const LONG_PRESS_MOVE_PX = 10

// Viewports at or below this width (px) are treated as "mobile": the contextual
// actions move to the bottom action bar and the Add button collapses to "+".
export const MOBILE_BREAKPOINT = 640

// Fired on `window` when a two-finger touch gesture (pan/pinch) begins, so any
// in-flight single-finger gesture (drag, long-press) can bail out.
export const GESTURE_CANCEL_EVENT = 'groundwork:gesture-cancel'
