import { useCallback, useRef, useState } from 'react'
import './App.css'
import { Toolbar } from './components/Toolbar'
import { Canvas } from './components/Canvas'
import { TotalArea } from './components/TotalArea'
import { AddShapeModal } from './components/AddShapeModal'
import { EditShapeModal } from './components/EditShapeModal'
import { useFloorPlanStore } from './store/useFloorPlanStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import type { Point, Shape } from './types'
import { isShape } from './types'

export default function App() {
  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const items = useFloorPlanStore((s) => s.items)
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
      <div className="canvas-wrap">
        <Canvas onRequestEdit={setEditingId} registerWorldCenter={registerWorldCenter} />
        <TotalArea />
      </div>
      {addOpen && (
        <AddShapeModal worldCenter={() => worldCenterRef.current()} onClose={() => setAddOpen(false)} />
      )}
      {editingShape && <EditShapeModal shape={editingShape} onClose={() => setEditingId(null)} />}
    </div>
  )
}
