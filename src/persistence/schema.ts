import { z } from 'zod'

const unitValue = z.object({ ft: z.number(), mm: z.number() })
const point = z.object({ x: z.number(), y: z.number() })
const corner = z.enum(['TL', 'TR', 'BL', 'BR'])

const shapeBase = z.object({
  id: z.string(),
  position: point,
  colorIndex: z.number().int(),
})

const square = shapeBase.extend({ kind: z.literal('square'), side: unitValue })
const rectangle = shapeBase.extend({ kind: z.literal('rectangle'), width: unitValue, height: unitValue })
const triangle = shapeBase.extend({ kind: z.literal('triangle'), width: unitValue, height: unitValue, rightAngle: corner })

const shape = z.discriminatedUnion('kind', [square, rectangle, triangle])

const room = z.object({
  id: z.string(),
  kind: z.literal('room'),
  name: z.string(),
  position: point,
  colorIndex: z.number().int(),
  members: z.array(shape),
})

const layoutItem = z.discriminatedUnion('kind', [square, rectangle, triangle, room])

export const floorPlanPayloadSchema = z.object({
  version: z.literal(2),
  displayUnit: z.enum(['ft', 'mm', 'm']),
  items: z.array(layoutItem),
})

export type FloorPlanPayload = z.infer<typeof floorPlanPayloadSchema>
