import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(1, { error: "Nome é obrigatório" }),
  phone: z.string().regex(/^[\d\s()+\-]+$/, { error: "Telefone inválido" }),
})

export type ContactForm = z.infer<typeof contactSchema>
