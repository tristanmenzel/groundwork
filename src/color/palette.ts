import { PASTEL_PALETTE } from '../constants'

export function paletteColor(index: number): { fill: string; border: string } {
  const i = ((index % PASTEL_PALETTE.length) + PASTEL_PALETTE.length) % PASTEL_PALETTE.length
  return PASTEL_PALETTE[i]!
}

/**
 * Picks the lowest-numbered palette slot not already used by `existing`.
 * Once every slot is taken, falls back to a random index so we keep colouring.
 */
export function pickNextColorIndex(existing: readonly number[]): number {
  const used = new Set(existing)
  for (let i = 0; i < PASTEL_PALETTE.length; i++) {
    if (!used.has(i)) return i
  }
  return Math.floor(Math.random() * PASTEL_PALETTE.length)
}
