import { useFloorPlanStore } from '../store/useFloorPlanStore'
import { STORAGE_VERSION } from '../constants'
import type { Unit } from '../types'
import { floorPlanPayloadSchema, type FloorPlanPayload } from './schema'

export function downloadJson() {
  const state = useFloorPlanStore.getState()
  const payload: FloorPlanPayload = {
    version: STORAGE_VERSION,
    displayUnit: state.displayUnit,
    items: state.items,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `floor-plan-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importJsonFile(file: File): Promise<{ items: FloorPlanPayload['items']; displayUnit: Unit }> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('File is not valid JSON')
  }
  const result = floorPlanPayloadSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`Invalid floor-plan file: ${result.error.issues[0]?.message ?? 'unknown error'}`)
  }
  // Legacy files may carry the old display-only 'm'; treat it as metric (mm).
  const displayUnit: Unit = result.data.displayUnit === 'm' ? 'mm' : result.data.displayUnit
  return { items: result.data.items, displayUnit }
}
