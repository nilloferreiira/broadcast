import { z } from 'zod'

export const messageSchema = z
  .object({
    body: z.string().min(1, { error: "Mensagem é obrigatória" }),
    contactIds: z.array(z.string()).min(1, { error: "Selecione ao menos um contato" }),
    scheduleType: z.enum(['imediato', 'agendado']),
    sendAt: z.date(),
  })
  .refine(
    (data) =>
      data.scheduleType !== 'agendado' || data.sendAt > new Date(),
    { message: 'A data deve ser futura', path: ['sendAt'] }
  )

export type MessageForm = z.infer<typeof messageSchema>
