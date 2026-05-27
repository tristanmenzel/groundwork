import { describe, expect, it } from 'vitest'
import { createUnitValue, formatArea, formatLength, inUnit, unitForLocales } from './unit'

describe('createUnitValue', () => {
  it('stores both units when entered as ft', () => {
    const v = createUnitValue(3, 'ft')
    expect(v.ft).toBe(3)
    expect(v.mm).toBeCloseTo(914.4, 6)
  })

  it('stores both units when entered as mm', () => {
    const v = createUnitValue(1000, 'mm')
    expect(v.mm).toBe(1000)
    expect(v.ft).toBeCloseTo(3.28083989501, 6)
  })

  it('preserves the entered value losslessly across toggles', () => {
    const v1 = createUnitValue(3, 'ft')
    // Simulate toggling: display as mm, then back to ft. The stored ft value never changes.
    expect(inUnit(v1, 'mm')).toBeCloseTo(914.4)
    expect(inUnit(v1, 'ft')).toBe(3)

    const v2 = createUnitValue(1000, 'mm')
    expect(inUnit(v2, 'ft')).toBeCloseTo(3.28083989501)
    expect(inUnit(v2, 'mm')).toBe(1000)
  })

  it('clamps non-finite input to zero', () => {
    expect(createUnitValue(NaN, 'ft')).toEqual({ ft: 0, mm: 0 })
    expect(createUnitValue(Infinity, 'mm')).toEqual({ ft: 0, mm: 0 })
  })
})

describe('formatLength', () => {
  it('trims trailing zeros and shows the active unit', () => {
    const v = createUnitValue(3, 'ft')
    expect(formatLength(v, 'ft')).toBe('3 ft')
    // mm measurements round to the nearest whole millimetre
    expect(formatLength(v, 'mm')).toBe('914 mm')
  })
})

describe('unitForLocales', () => {
  it('uses feet for the US and Canada', () => {
    expect(unitForLocales(['en-US'])).toBe('ft')
    expect(unitForLocales(['en-CA'])).toBe('ft')
    expect(unitForLocales(['fr-CA'])).toBe('ft')
  })

  it('uses millimetres elsewhere', () => {
    expect(unitForLocales(['en-GB'])).toBe('mm')
    expect(unitForLocales(['en-AU'])).toBe('mm')
    expect(unitForLocales(['de-DE'])).toBe('mm')
  })

  it('falls back to metric when no region is present', () => {
    expect(unitForLocales(['en'])).toBe('mm')
    expect(unitForLocales([])).toBe('mm')
  })

  it('uses the first locale that carries a region', () => {
    expect(unitForLocales(['en', 'en-US'])).toBe('ft')
  })
})

describe('formatArea', () => {
  it('formats square feet directly', () => {
    expect(formatArea(12.5, 'ft')).toBe('12.5 sq ft')
  })

  it('renders metric area in square metres', () => {
    // 1 sq ft = 0.09290304 sq m
    expect(formatArea(1, 'mm')).toBe('0.09 sq m')
  })
})
