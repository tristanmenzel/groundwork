import { useCallback, useRef, useState } from 'react'
import './App.css'
import { Toolbar } from './components/Toolbar'
import { Canvas } from './components/Canvas'
import { TotalArea } from './components/TotalArea'
import { AddShapeModal } from './components/AddShapeModal'
import { EditShapeModal } from './components/EditShapeModal'
import { SelectionActionBar } from './components/SelectionActionBar'
import { useFloorPlanStore } from './store/useFloorPlanStore'
import { useIsMobile } from './hooks/useIsMobile'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import type { Point, Shape } from './types'
import { isShape } from './types'

export default function App() {
  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const items = useFloorPlanStore((s) => s.items)
  const selectionIds = useFloorPlanStore((s) => s.selectionIds)
  const selectionMode = useFloorPlanStore((s) => s.selectionMode)
  const isMobile = useIsMobile()
  const barVisible = selectionMode || (isMobile && selectionIds.length > 0)
  const editingShape: Shape | null = (() => {
    if (!editingId) return null
    const it = items.find((i) => i.id === editingId)
    if (!it || !isShape(it)) return null
    return it
  })()

  useKeyboardShortcuts()

  // Canvas registers its worldCenter function so the Add modal can place at viewport center.
  const worldCenterRef = useRef<() => Point>(() => ({ x: 0, y: 0 }))
  const registerWorldCenter = useCallback((fn: () => Point) => {
    worldCenterRef.current = fn
  }, [])

  return (
    <div className="app">
      <Toolbar onAddClick={() => setAddOpen(true)} />
      <div className={`canvas-wrap${barVisible ? ' canvas-wrap--bar' : ''}`}>
        <Canvas onRequestEdit={setEditingId} registerWorldCenter={registerWorldCenter} />
        <TotalArea />
        <SelectionActionBar />
      </div>
      {addOpen && (
        <AddShapeModal worldCenter={() => worldCenterRef.current()} onClose={() => setAddOpen(false)} />
      )}
      {editingShape && <EditShapeModal shape={editingShape} onClose={() => setEditingId(null)} />}
    </div>
  )
}
