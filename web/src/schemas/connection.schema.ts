import { z } from 'zod'

export const connectionSchema = z.object({
  name: z.string().min(1, { error: "Nome é obrigatório" }).max(50, { error: "Máximo de 50 caracteres" }),
})

export type ConnectionForm = z.infer<typeof connectionSchema>
