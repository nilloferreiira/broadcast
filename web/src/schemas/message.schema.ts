import { z } from 'zod'

export const messageSchema = z.object({
  body: z.string().min(1, 'Mensagem obrigatória'),
  contactIds: z.array(z.string()).min(1, 'Selecione ao menos um contato'),
  scheduleType: z.enum(['immediate', 'scheduled']),
  sendAt: z.coerce.date({ error: (issue) => issue.input === undefined ? 'Horário obrigatório' : 'Data inválida' }),
}).refine(
  (data) => data.scheduleType === 'immediate' || data.sendAt > new Date(),
  { message: 'Horário agendado deve ser no futuro', path: ['sendAt'] }
)

export type MessageForm = z.infer<typeof messageSchema>
