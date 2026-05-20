import { z } from 'zod'

export const messageSchema = z
  .object({
    body: z.string().min(1),
    contactIds: z.array(z.string()).min(1),
    scheduleType: z.enum(['imediato', 'agendado']),
    sendAt: z.coerce.date(),
  })
  .refine(
    (data) =>
      data.scheduleType !== 'agendado' || data.sendAt > new Date(),
    { message: 'A data deve ser futura', path: ['sendAt'] }
  )

export type MessageForm = z.infer<typeof messageSchema>
