import { useEffect } from 'react'
import { useFloorPlanStore } from '../store/useFloorPlanStore'
import { ARROW_NUDGE_FT, ARROW_NUDGE_MM, FT_TO_MM } from '../constants'

export function useKeyboardShortcuts() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return
      }
      const state = useFloorPlanStore.getState()

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectionIds.length === 0) return
        e.preventDefault()
        state.removeSelected()
        return
      }

      const dir = arrowDir(e.key)
      if (!dir) return
      if (state.selectionIds.length === 0) return
      e.preventDefault()
      // Use the active display unit to decide nudge magnitude
      const stepFt = state.displayUnit === 'ft' ? ARROW_NUDGE_FT : ARROW_NUDGE_MM / FT_TO_MM
      state.translateSelection({ x: dir.x * stepFt, y: dir.y * stepFt })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}

function arrowDir(key: string): { x: number; y: number } | null {
  switch (key) {
    case 'ArrowLeft':
      return { x: -1, y: 0 }
    case 'ArrowRight':
      return { x: 1, y: 0 }
    case 'ArrowUp':
      return { x: 0, y: -1 }
    case 'ArrowDown':
      return { x: 0, y: 1 }
    default:
      return null
  }
}
