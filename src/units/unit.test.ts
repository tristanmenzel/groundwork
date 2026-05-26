import { describe, expect, it } from 'vitest'
import { createUnitValue, formatArea, formatLength, inUnit } from './unit'

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

  it('treats metres as a display layer over the mm backing', () => {
    // entering 2 m stores 2000 mm exactly; ft derived
    const v = createUnitValue(2, 'm')
    expect(v.mm).toBe(2000)
    expect(v.ft).toBeCloseTo(6.56167979, 6)
    // a value backed by mm displays as mm/1000 in metres
    expect(inUnit(createUnitValue(3500, 'mm'), 'm')).toBe(3.5)
  })
})

describe('formatLength', () => {
  it('trims trailing zeros and shows the active unit', () => {
    const v = createUnitValue(3, 'ft')
    expect(formatLength(v, 'ft')).toBe('3 ft')
    expect(formatLength(v, 'mm')).toBe('914.4 mm')
  })
})

describe('formatArea', () => {
  it('formats square feet directly', () => {
    expect(formatArea(12.5, 'ft')).toBe('12.5 sq ft')
  })

  it('converts square feet to square mm', () => {
    // 1 sq ft = 304.8 * 304.8 sq mm = 92903.04 sq mm
    expect(formatArea(1, 'mm')).toBe('92903 sq mm')
  })

  it('converts square feet to square metres', () => {
    // 1 sq ft = 0.09290304 sq m
    expect(formatArea(1, 'm')).toBe('0.09 sq m')
  })
})

describe('formatLength metres', () => {
  it('shows the m suffix and derives from mm', () => {
    expect(formatLength(createUnitValue(2500, 'mm'), 'm')).toBe('2.5 m')
  })
})
