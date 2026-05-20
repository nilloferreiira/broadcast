import { z } from "zod"

export const loginSchema = z.object({
	email: z.email({ error: "E-mail inválido" }),
	password: z.string().min(6, { error: "Mínimo de 6 caracteres" })
})

export const registerSchema = loginSchema
	.extend({ confirmPassword: z.string() })
	.refine((data) => data.password === data.confirmPassword, {
		message: "Senhas não conferem",
		path: ["confirmPassword"]
	})

export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>
