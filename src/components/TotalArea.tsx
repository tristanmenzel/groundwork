import { useFloorPlanStore } from '../store/useFloorPlanStore'
import { isRoom } from '../types'
import { vertices } from '../geometry/shapeVertices'
import { polygonArea } from '../geometry/polygon'
import { unionShapes } from '../geometry/union'
import { formatArea } from '../units/unit'

export function TotalArea() {
  const items = useFloorPlanStore((s) => s.items)
  const displayUnit = useFloorPlanStore((s) => s.displayUnit)

  const total = items.reduce((sum, item) => {
    if (isRoom(item)) {
      const u = unionShapes(item.members.map((m) => ({
        ...m,
        position: { x: item.position.x + m.position.x, y: item.position.y + m.position.y },
      })))
      return sum + u.area
    }
    return sum + polygonArea(vertices(item))
  }, 0)

  return (
    <div className="total-area">
      <span className="total-area__label">Total</span>
      <span className="total-area__value">{formatArea(total, displayUnit)}</span>
    </div>
  )
}
