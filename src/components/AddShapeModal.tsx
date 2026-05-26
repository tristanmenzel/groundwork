import type { Point, ShapeDraft } from '../types'
import { useFloorPlanStore } from '../store/useFloorPlanStore'
import { ShapeForm } from './ShapeForm'

type Props = {
  worldCenter: () => Point
  onClose: () => void
}

export function AddShapeModal({ worldCenter, onClose }: Props) {
  const displayUnit = useFloorPlanStore((s) => s.displayUnit)
  const addShape = useFloorPlanStore((s) => s.addShape)

  function handleSubmit(draft: ShapeDraft) {
    addShape(draft, worldCenter())
    onClose()
  }

  return (
    <ShapeForm
      title="Add shape"
      submitLabel="Add"
      allowKindChange
      displayUnit={displayUnit}
      initial={{ kind: 'rectangle' }}
      onCancel={onClose}
      onSubmit={handleSubmit}
    />
  )
}
