import { useCallback, useEffect, useRef } from 'react'
import { useFloorPlanStore } from '../store/useFloorPlanStore'
import { GESTURE_CANCEL_EVENT, LONG_PRESS_MS, LONG_PRESS_MOVE_PX } from '../constants'

/**
 * Touch-only long-press to enter selection mode. Call `arm(e, itemId)` from a
 * pointerdown handler: if the press is a touch and stays roughly still for
 * LONG_PRESS_MS, selection mode turns on and (when `itemId` is given) that item
 * becomes the first member of the selection. Movement beyond LONG_PRESS_MOVE_PX
 * or an early release cancels — so the gesture coexists with drag-to-move and
 * marquee, which take over once the finger moves.
 */
export function useLongPress() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Cleanup for the press currently in flight (removes listeners, clears timer).
  const teardown = useRef<(() => void) | null>(null)

  const arm = useCallback((e: React.PointerEvent, itemId: string | null) => {
    if (e.pointerType !== 'touch') return
    if (useFloorPlanStore.getState().selectionMode) return

    const startX = e.clientX
    const startY = e.clientY
    const pointerId = e.pointerId

    // Defined once per press, so add/removeEventListener use the same reference.
    const finish = () => {
      if (timer.current !== null) {
        clearTimeout(timer.current)
        timer.current = null
      }
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      window.removeEventListener(GESTURE_CANCEL_EVENT, finish)
      teardown.current = null
    }
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > LONG_PRESS_MOVE_PX) finish()
    }

    teardown.current?.() // cancel any prior press still in flight
    teardown.current = finish
    timer.current = setTimeout(() => {
      finish()
      const store = useFloorPlanStore.getState()
      store.enterSelectionMode()
      if (itemId) store.addToSelection([itemId])
      navigator.vibrate?.(10)
    }, LONG_PRESS_MS)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    // A two-finger touch gesture (pan/pinch) cancels a pending long-press.
    window.addEventListener(GESTURE_CANCEL_EVENT, finish)
  }, [])

  // Tidy up if the component unmounts mid-press.
  useEffect(() => () => teardown.current?.(), [])

  return { arm }
}
