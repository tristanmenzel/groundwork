import type { Shape, ShapeDraft } from '../types'
import { useFloorPlanStore } from '../store/useFloorPlanStore'
import { ShapeForm, type ShapeFormInitial } from './ShapeForm'

type Props = {
  shape: Shape
  onClose: () => void
}

export function EditShapeModal({ shape, onClose }: Props) {
  const displayUnit = useFloorPlanStore((s) => s.displayUnit)
  const updateShape = useFloorPlanStore((s) => s.updateShape)

  function handleSubmit(draft: ShapeDraft) {
    if (draft.kind !== shape.kind) {
      onClose()
      return
    }
    if (draft.kind === 'square') {
      updateShape(shape.id, { kind: 'square', side: draft.side } as Partial<Shape>)
    } else if (draft.kind === 'rectangle') {
      updateShape(shape.id, { kind: 'rectangle', width: draft.width, height: draft.height } as Partial<Shape>)
    } else {
      updateShape(shape.id, {
        kind: 'triangle',
        width: draft.width,
        height: draft.height,
        rightAngle: draft.rightAngle,
      } as Partial<Shape>)
    }
    onClose()
  }

  return (
    <ShapeForm
      title="Edit shape"
      submitLabel="Save"
      allowKindChange={false}
      displayUnit={displayUnit}
      initial={initialFor(shape)}
      onCancel={onClose}
      onSubmit={handleSubmit}
    />
  )
}

function initialFor(shape: Shape): ShapeFormInitial {
  switch (shape.kind) {
    case 'square':
      return { kind: 'square', side: shape.side }
    case 'rectangle':
      return { kind: 'rectangle', width: shape.width, height: shape.height }
    case 'triangle':
      return { kind: 'triangle', width: shape.width, height: shape.height, rightAngle: shape.rightAngle }
  }
}
