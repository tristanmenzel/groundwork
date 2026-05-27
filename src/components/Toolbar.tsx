import { useRef } from 'react'
import { useFloorPlanStore } from '../store/useFloorPlanStore'
import { isRoom } from '../types'
import { downloadJson, importJsonFile } from '../persistence/exportImport'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  onAddClick: () => void
}

export function Toolbar({ onAddClick }: Props) {
  const items = useFloorPlanStore((s) => s.items)
  const selectionIds = useFloorPlanStore((s) => s.selectionIds)
  const displayUnit = useFloorPlanStore((s) => s.displayUnit)
  const setDisplayUnit = useFloorPlanStore((s) => s.setDisplayUnit)
  const combine = useFloorPlanStore((s) => s.combineSelectionAsRoom)
  const disbandSelected = useFloorPlanStore((s) => s.disbandSelectedRooms)
  const renameRoom = useFloorPlanStore((s) => s.renameRoom)
  const removeSelected = useFloorPlanStore((s) => s.removeSelected)
  const measureMode = useFloorPlanStore((s) => s.measureMode)
  const toggleMeasureMode = useFloorPlanStore((s) => s.toggleMeasureMode)
  const replaceState = useFloorPlanStore((s) => s.replaceState)
  const fileRef = useRef<HTMLInputElement>(null)

  const selected = items.filter((it) => selectionIds.includes(it.id))
  const selectedRoom = selected.length === 1 && isRoom(selected[0]!) ? (selected[0]!) : null
  const roomCount = selected.filter(isRoom).length
  const canCombine = selected.length >= 2
  const canDisband = roomCount > 0

  return (
    <div className="toolbar">
      <span className="toolbar__brand">
        <Logo size={22} />
        Groundwork
      </span>

      <button type="button" className="toolbar__btn primary" onClick={onAddClick}>
        + Add Shape
      </button>

      {canCombine && (
        <button type="button" className="toolbar__btn" onClick={combine}>
          Combine into Room
        </button>
      )}

      {canDisband && (
        <button type="button" className="toolbar__btn" onClick={disbandSelected}>
          {roomCount > 1 ? 'Disband Rooms' : 'Disband Room'}
        </button>
      )}

      {selectedRoom && (
        <input
          className="toolbar__input"
          aria-label="Room name"
          value={selectedRoom.name}
          onChange={(e) => renameRoom(selectedRoom.id, e.target.value)}
        />
      )}

      {selected.length > 0 && (
        <button
          type="button"
          className="toolbar__btn danger"
          onClick={removeSelected}
          aria-label="Delete selection"
          title="Delete selection"
        >
          <TrashIcon />
          Delete
        </button>
      )}

      <div className="toolbar__spacer" />

      <button
        type="button"
        className={`toolbar__btn icon-btn ${measureMode ? 'active' : ''}`}
        onClick={toggleMeasureMode}
        aria-label="Measure tool"
        aria-pressed={measureMode}
        title="Measure tool"
      >
        <RulerIcon />
      </button>

      <div className="toolbar__unit-toggle" role="group" aria-label="Unit toggle">
        <button
          type="button"
          className={`toolbar__btn ${displayUnit === 'ft' ? 'active' : ''}`}
          onClick={() => setDisplayUnit('ft')}
        >
          ft
        </button>
        <button
          type="button"
          className={`toolbar__btn ${displayUnit === 'mm' ? 'active' : ''}`}
          onClick={() => setDisplayUnit('mm')}
        >
          mm
        </button>
        <button
          type="button"
          className={`toolbar__btn ${displayUnit === 'm' ? 'active' : ''}`}
          onClick={() => setDisplayUnit('m')}
        >
          m
        </button>
      </div>

      <button type="button" className="toolbar__btn" onClick={() => downloadJson()}>
        Export
      </button>
      <button type="button" className="toolbar__btn" onClick={() => fileRef.current?.click()}>
        Import
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          try {
            const payload = await importJsonFile(file)
            replaceState(payload)
          } catch (err) {
            alert(`Could not import: ${err instanceof Error ? err.message : String(err)}`)
          }
          e.target.value = ''
        }}
      />

      <ThemeToggle />
    </div>
  )
}

function RulerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 16.5 16.5 3a1.5 1.5 0 0 1 2.12 0L21 5.38a1.5 1.5 0 0 1 0 2.12L7.5 21a1.5 1.5 0 0 1-2.12 0L3 18.62a1.5 1.5 0 0 1 0-2.12Z" />
      <path d="M9 8.5 11 10.5" />
      <path d="M12 5.5 14 7.5" />
      <path d="M6 11.5 8 13.5" />
      <path d="M15 14.5 17 16.5" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}
