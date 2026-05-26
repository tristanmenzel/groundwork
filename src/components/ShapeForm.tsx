import { useState } from 'react'
import type { Corner, ShapeDraft, Unit, UnitValue } from '../types'
import { createUnitValue, inUnit } from '../units/unit'

export type ShapeFormInitial = {
  kind: ShapeDraft['kind']
  width?: UnitValue
  height?: UnitValue
  side?: UnitValue
  rightAngle?: Corner
}

type Props = {
  initial: ShapeFormInitial
  displayUnit: Unit
  allowKindChange: boolean
  onCancel: () => void
  onSubmit: (draft: ShapeDraft) => void
  submitLabel: string
  title: string
}

const KINDS: ShapeDraft['kind'][] = ['square', 'rectangle', 'triangle']
const CORNERS: Corner[] = ['TL', 'TR', 'BL', 'BR']

export function ShapeForm({ initial, displayUnit, allowKindChange, onCancel, onSubmit, submitLabel, title }: Props) {
  const [kind, setKind] = useState<ShapeDraft['kind']>(initial.kind)
  const [width, setWidth] = useState<number>(numberFor(initial.width ?? initial.side, displayUnit, 4))
  const [height, setHeight] = useState<number>(numberFor(initial.height, displayUnit, 3))
  const [side, setSide] = useState<number>(numberFor(initial.side, displayUnit, 4))
  const [rightAngle, setRightAngle] = useState<Corner>(initial.rightAngle ?? 'TL')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (kind === 'square') {
      onSubmit({ kind: 'square', side: createUnitValue(side, displayUnit) })
    } else if (kind === 'rectangle') {
      onSubmit({
        kind: 'rectangle',
        width: createUnitValue(width, displayUnit),
        height: createUnitValue(height, displayUnit),
      })
    } else {
      onSubmit({
        kind: 'triangle',
        width: createUnitValue(width, displayUnit),
        height: createUnitValue(height, displayUnit),
        rightAngle,
      })
    }
  }

  return (
    <form className="modal" onSubmit={handleSubmit}>
      <div className="modal__backdrop" onClick={onCancel} />
      <div className="modal__panel">
        <h2 className="modal__title">{title}</h2>

        <label className="field">
          <span className="field__label">Shape</span>
          <div className="field__group">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                disabled={!allowKindChange}
                className={`pill ${k === kind ? 'pill--active' : ''}`}
                onClick={() => setKind(k)}
              >
                {k[0]!.toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
        </label>

        {kind === 'square' && (
          <NumberField label={`Side (${displayUnit})`} value={side} onChange={setSide} />
        )}

        {kind === 'rectangle' && (
          <>
            <NumberField label={`Width (${displayUnit})`} value={width} onChange={setWidth} />
            <NumberField label={`Height (${displayUnit})`} value={height} onChange={setHeight} />
          </>
        )}

        {kind === 'triangle' && (
          <>
            <NumberField label={`Width (${displayUnit})`} value={width} onChange={setWidth} />
            <NumberField label={`Perpendicular height (${displayUnit})`} value={height} onChange={setHeight} />
            <label className="field">
              <span className="field__label">Right-angle corner</span>
              <div className="field__group">
                {CORNERS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`pill ${c === rightAngle ? 'pill--active' : ''}`}
                    onClick={() => setRightAngle(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </label>
          </>
        )}

        <div className="modal__actions">
          <button type="button" className="toolbar__btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="toolbar__btn primary">{submitLabel}</button>
        </div>
      </div>
    </form>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        className="field__input"
        type="number"
        min="0"
        step="any"
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        autoFocus
      />
    </label>
  )
}

function numberFor(v: UnitValue | undefined, unit: Unit, fallback: number): number {
  if (!v) return fallback
  return inUnit(v, unit)
}
