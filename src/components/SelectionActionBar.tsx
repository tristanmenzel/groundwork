import { useFloorPlanStore } from '../store/useFloorPlanStore'
import { isRoom } from '../types'
import { useIsMobile } from '../hooks/useIsMobile'

/**
 * Bottom action bar for touch selection mode. Shows the live selection count and
 * a "Cancel selection mode" button. On mobile viewports it also hosts the
 * contextual actions (Combine / Disband / rename / Delete) that are hidden from
 * the cramped top toolbar.
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
      <span className="action-bar__count">{count} selected</span>

      {isMobile && (
        <>
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
          {count > 0 && (
            <button
              type="button"
              className="toolbar__btn danger"
              onClick={removeSelected}
              aria-label="Delete selection"
              title="Delete selection"
            >
              Delete
            </button>
          )}
        </>
      )}

      <div className="action-bar__spacer" />

      {selectionMode && (
        <button type="button" className="toolbar__btn" onClick={cancel}>
          Cancel selection mode
        </button>
      )}
    </div>
  )
}
