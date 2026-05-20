import { z } from 'zod'

export const connectionSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(50, 'Máximo 50 caracteres'),
})

export type ConnectionForm = z.infer<typeof connectionSchema>
