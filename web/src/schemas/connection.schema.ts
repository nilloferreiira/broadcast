import { z } from 'zod'

export const connectionSchema = z.object({
  name: z.string().min(1).max(50),
})

export type ConnectionForm = z.infer<typeof connectionSchema>
