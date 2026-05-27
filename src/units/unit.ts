import { FT_TO_MM } from '../constants'
import type { Unit, UnitValue } from '../types'

// Canada is grouped with the US as imperial: floor plans there are conventionally
// laid out in feet, even though the country is otherwise metric.
const IMPERIAL_REGIONS = new Set(['US', 'CA'])

/** Pick a sensible default unit from the user's locale(s). Metric unless the
 *  first locale with a known region is the US or Canada. */
export function unitForLocales(locales: readonly string[]): Unit {
  for (const locale of locales) {
    let region: string | undefined
    try {
      region = new Intl.Locale(locale).region ?? undefined
    } catch {
      region = locale.split('-')[1]?.toUpperCase()
    }
    if (region) return IMPERIAL_REGIONS.has(region) ? 'ft' : 'mm'
  }
  return 'mm'
}

export function createUnitValue(value: number, unit: Unit): UnitValue {
  if (!Number.isFinite(value)) {
    return { ft: 0, mm: 0 }
  }
  if (unit === 'ft') {
    return { ft: value, mm: value * FT_TO_MM }
  }
  return { ft: value / FT_TO_MM, mm: value }
}

export function toFt(v: UnitValue): number {
  return v.ft
}

export function toMm(v: UnitValue): number {
  return v.mm
}

export function inUnit(v: UnitValue, unit: Unit): number {
  return unit === 'ft' ? v.ft : v.mm
}

export function formatLength(v: UnitValue, unit: Unit, precision = unit === 'mm' ? 0 : 2): string {
  const n = inUnit(v, unit)
  return `${trim(n, precision)} ${unit}`
}

export function formatArea(squareFt: number, unit: Unit, precision?: number): string {
  if (unit === 'ft') {
    return `${trim(squareFt, precision ?? 2)} sq ft`
  }
  // Metric lengths are captured in mm, but area reads better in square metres
  // than the (non-standard) square millimetre.
  const squareM = (squareFt * FT_TO_MM * FT_TO_MM) / 1_000_000
  return `${trim(squareM, precision ?? 2)} sq m`
}

function trim(n: number, precision: number): string {
  return n
    .toFixed(precision)
    .replace(/\.?0+$/, '')
    .replace(/^-0$/, '0')
}
