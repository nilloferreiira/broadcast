import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(1),
  phone: z.string().regex(/^[\d\s()+\-]+$/),
})

export type ContactForm = z.infer<typeof contactSchema>
