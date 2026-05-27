import { beforeEach, describe, expect, it } from 'vitest'
import { useFloorPlanStore } from './useFloorPlanStore'
import { createUnitValue } from '../units/unit'
import { isRoom } from '../types'
import type { ShapeDraft } from '../types'

const square: ShapeDraft = { kind: 'square', side: createUnitValue(5, 'ft') }

/** Add a square at an offset and return its id. */
function addSquareAt(x: number): string {
  useFloorPlanStore.getState().addShape(square, { x, y: 0 })
  return useFloorPlanStore.getState().selectionIds[0]!
}

beforeEach(() => {
  useFloorPlanStore.getState().resetAll()
})

describe('selection mode', () => {
  it('enter/exit toggles the flag and exit leaves the selection intact', () => {
    const store = useFloorPlanStore.getState()
    const id = addSquareAt(0)
    store.setSelection([id])

    store.enterSelectionMode()
    expect(useFloorPlanStore.getState().selectionMode).toBe(true)

    store.exitSelectionMode()
    expect(useFloorPlanStore.getState().selectionMode).toBe(false)
    expect(useFloorPlanStore.getState().selectionIds).toEqual([id])
  })

  it('combineSelectionAsRoom exits selection mode and keeps the new room selected', () => {
    const store = useFloorPlanStore.getState()
    const a = addSquareAt(0)
    const b = addSquareAt(10)
    store.setSelection([a, b])
    store.enterSelectionMode()

    store.combineSelectionAsRoom()

    const next = useFloorPlanStore.getState()
    expect(next.selectionMode).toBe(false)
    expect(next.items.filter(isRoom)).toHaveLength(1)
    expect(next.selectionIds).toHaveLength(1)
  })

  it('disbandSelectedRooms exits selection mode', () => {
    const store = useFloorPlanStore.getState()
    store.setSelection([addSquareAt(0), addSquareAt(10)])
    store.combineSelectionAsRoom() // selects the room, exits mode
    store.enterSelectionMode()

    store.disbandSelectedRooms()

    expect(useFloorPlanStore.getState().selectionMode).toBe(false)
  })

  it('removeSelected exits selection mode', () => {
    const store = useFloorPlanStore.getState()
    store.setSelection([addSquareAt(0)])
    store.enterSelectionMode()

    store.removeSelected()

    const next = useFloorPlanStore.getState()
    expect(next.selectionMode).toBe(false)
    expect(next.items).toHaveLength(0)
  })

  it('is not part of the persisted state', () => {
    useFloorPlanStore.getState().enterSelectionMode()
    const partialize = useFloorPlanStore.persist.getOptions().partialize
    const persisted = partialize?.(useFloorPlanStore.getState()) as Record<string, unknown>
    expect(persisted).not.toHaveProperty('selectionMode')
  })
})
