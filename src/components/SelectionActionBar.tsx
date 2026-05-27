import { useFloorPlanStore } from '../store/useFloorPlanStore'
import { isRoom } from '../types'
import { useIsMobile } from '../hooks/useIsMobile'

/**
 * Bottom action bar for touch selection mode. Two rows: an info row (the room
 * name field when a single room is selected, otherwise the selection count) and
 * an actions row (Combine / Ungroup / Delete, plus Cancel). On mobile viewports
 * this is the home for the contextual actions hidden from the top toolbar.
 */
export function SelectionActionBar() {
  const items = useFloorPlanStore((s) => s.items)
  const selectionIds = useFloorPlanStore((s) => s.selectionIds)
  const selectionMode = useFloorPlanStore((s) => s.selectionMode)
  const combine = useFloorPlanStore((s) => s.combineSelectionAsRoom)
  const disbandSelected = useFloorPlanStore((s) => s.disbandSelectedRooms)
  const renameRoom = useFloorPlanStore((s) => s.renameRoom)
  const removeSelected = useFloorPlanStore((s) => s.removeSelected)
  const exitSelectionMode = useFloorPlanStore((s) => s.exitSelectionMode)
  const clearSelection = useFloorPlanStore((s) => s.clearSelection)
  const isMobile = useIsMobile()

  const count = selectionIds.length
  const visible = selectionMode || (isMobile && count > 0)
  if (!visible) return null

  const selected = items.filter((it) => selectionIds.includes(it.id))
  const selectedRoom = selected.length === 1 && isRoom(selected[0]!) ? selected[0]! : null
  const roomCount = selected.filter(isRoom).length
  const canCombine = selected.length >= 2
  const canDisband = roomCount > 0

  function cancel() {
    exitSelectionMode()
    clearSelection()
  }

  return (
    <div className="action-bar" role="toolbar" aria-label="Selection actions">
      <div className="action-bar__row">
        {isMobile && selectedRoom ? (
          <input
            className="toolbar__input action-bar__name"
            aria-label="Room name"
            value={selectedRoom.name}
            onChange={(e) => renameRoom(selectedRoom.id, e.target.value)}
          />
        ) : (
          <span className="action-bar__count">
            {count} {count === 1 ? 'item' : 'items'} selected
          </span>
        )}
      </div>

      <div className="action-bar__row action-bar__row--actions">
        {isMobile && canCombine && (
          <button type="button" className="toolbar__btn" onClick={combine}>
            Combine
          </button>
        )}
        {isMobile && canDisband && (
          <button type="button" className="toolbar__btn" onClick={disbandSelected}>
            Ungroup
          </button>
        )}
        {isMobile && count > 0 && (
          <button
            type="button"
            className="toolbar__btn danger icon-btn"
            onClick={removeSelected}
            aria-label="Delete selection"
            title="Delete selection"
          >
            <TrashIcon />
          </button>
        )}

        <div className="action-bar__spacer" />

        <button
          type="button"
          className="toolbar__btn icon-btn"
          onClick={cancel}
          aria-label="Clear selection"
          title="Clear selection"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  )
}

function CloseIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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
