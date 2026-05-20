import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export const registerSchema = loginSchema.extend({
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Senhas não coincidem', path: ['confirmPassword'] }
)

export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>
