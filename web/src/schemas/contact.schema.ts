import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  phone: z
    .string()
    .min(8, 'Telefone inválido')
    .regex(/^[\d\s()+-]+$/, 'Formato inválido'),
})

export type ContactForm = z.infer<typeof contactSchema>
