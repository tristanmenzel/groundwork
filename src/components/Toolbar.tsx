import { useRef } from 'react'
import { useFloorPlanStore } from '../store/useFloorPlanStore'
import { isRoom, isShape } from '../types'
import { downloadJson, importJsonFile } from '../persistence/exportImport'
import { useIsMobile } from '../hooks/useIsMobile'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  onAddClick: () => void
  onHelpClick: () => void
  onEdit: (id: string) => void
}

export function Toolbar({ onAddClick, onHelpClick, onEdit }: Props) {
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
  const isMobile = useIsMobile()
  const fileRef = useRef<HTMLInputElement>(null)

  const selected = items.filter((it) => selectionIds.includes(it.id))
  const selectedRoom = selected.length === 1 && isRoom(selected[0]!) ? (selected[0]!) : null
  const selectedShape = selected.length === 1 && isShape(selected[0]!) ? (selected[0]!) : null
  const roomCount = selected.filter(isRoom).length
  const canCombine = selected.length >= 2
  const canDisband = roomCount > 0

  return (
    <div className="toolbar">
      <span className="toolbar__brand">
        <Logo size={22} />
        {!isMobile && 'Groundwork'}
      </span>

      <button
        type="button"
        className="toolbar__btn primary"
        onClick={onAddClick}
        aria-label="Add shape"
        title="Add shape"
      >
        {isMobile ? '+' : '+ Add Shape'}
      </button>

      {/* Contextual actions move to the bottom SelectionActionBar on mobile. */}
      {!isMobile && (
        <>
          {selectedShape && (
            <button type="button" className="toolbar__btn" onClick={() => onEdit(selectedShape.id)}>
              Edit
            </button>
          )}

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
        </>
      )}

      <div className="toolbar__spacer" />

      <button
        type="button"
        className={`toolbar__btn ${isMobile ? 'icon-btn' : ''} ${measureMode ? 'active' : ''}`}
        onClick={toggleMeasureMode}
        aria-label="Measure tool"
        aria-pressed={measureMode}
        title="Measure tool"
      >
        <RulerIcon />
        {!isMobile && 'Measure'}
      </button>

      <div className="toolbar__unit-toggle" role="group" aria-label="Unit system">
        <button
          type="button"
          className={`toolbar__btn ${displayUnit === 'ft' ? 'active' : ''}`}
          onClick={() => setDisplayUnit('ft')}
          title="Imperial — feet"
        >
          {isMobile ? 'Imp' : 'Imperial'}
        </button>
        <button
          type="button"
          className={`toolbar__btn ${displayUnit !== 'ft' ? 'active' : ''}`}
          onClick={() => setDisplayUnit('mm')}
          title="Metric — millimetres, area in square metres"
        >
          {isMobile ? 'Met' : 'Metric'}
        </button>
      </div>

      <button
        type="button"
        className={`toolbar__btn${isMobile ? ' icon-btn' : ''}`}
        onClick={() => downloadJson()}
        aria-label="Save"
        title="Save"
      >
        <ExportIcon />
        {!isMobile && 'Save'}
      </button>
      <button
        type="button"
        className={`toolbar__btn${isMobile ? ' icon-btn' : ''}`}
        onClick={() => fileRef.current?.click()}
        aria-label="Open"
        title="Open"
      >
        <ImportIcon />
        {!isMobile && 'Open'}
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

      <button
        type="button"
        className={`toolbar__btn${isMobile ? ' icon-btn' : ''}`}
        onClick={onHelpClick}
        aria-label="Help"
        title="Help"
      >
        <HelpIcon />
        {!isMobile && 'Help'}
      </button>
    </div>
  )
}

function HelpIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
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

function ExportIcon() {
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
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}

function ImportIcon() {
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
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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
