import { FT_TO_MM } from '../constants'
import type { Unit, UnitValue } from '../types'

export function createUnitValue(value: number, unit: Unit): UnitValue {
  if (!Number.isFinite(value)) {
    return { ft: 0, mm: 0 }
  }
  if (unit === 'ft') {
    return { ft: value, mm: value * FT_TO_MM }
  }
  if (unit === 'm') {
    // metres are display-only: store the backing mm, derive ft
    const mm = value * 1000
    return { ft: mm / FT_TO_MM, mm }
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
  if (unit === 'ft') return v.ft
  if (unit === 'm') return v.mm / 1000
  return v.mm
}

function defaultPrecision(unit: Unit): number {
  return unit === 'm' ? 3 : 2
}

export function formatLength(v: UnitValue, unit: Unit, precision = defaultPrecision(unit)): string {
  const n = inUnit(v, unit)
  return `${trim(n, precision)} ${unit}`
}

export function formatArea(squareFt: number, unit: Unit, precision?: number): string {
  if (unit === 'ft') {
    return `${trim(squareFt, precision ?? 2)} sq ft`
  }
  const squareMm = squareFt * FT_TO_MM * FT_TO_MM
  if (unit === 'm') {
    return `${trim(squareMm / 1_000_000, precision ?? 2)} sq m`
  }
  return `${trim(squareMm, precision ?? 0)} sq mm`
}

function trim(n: number, precision: number): string {
  return n
    .toFixed(precision)
    .replace(/\.?0+$/, '')
    .replace(/^-0$/, '0')
}
