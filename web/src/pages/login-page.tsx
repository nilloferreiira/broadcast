import { useState } from "react"
import { Box, Paper, Tab, Tabs } from "@mui/material"
import { LoginForm } from "../components/auth/login-form"
import { RegisterForm } from "../components/auth/register-form"
import type { LoginForm as LoginFormType } from "../schemas/auth.schema"
import type { RegisterForm as RegisterFormType } from "../schemas/auth.schema"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { FirebaseError } from "firebase/app"
import { auth } from "../lib/firebase"
import { useNavigate } from "react-router-dom"

const firebaseAuthMessages: Record<string, string> = {
	"auth/invalid-credential": "Email ou senha incorretos.",
	"auth/user-not-found": "Nenhuma conta encontrada com este email.",
	"auth/wrong-password": "Senha incorreta.",
	"auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
	"auth/user-disabled": "Esta conta foi desativada.",
	"auth/email-already-in-use": "Este email já está cadastrado.",
	"auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
	"auth/invalid-email": "Endereço de email inválido."
}

export function LoginPage() {
	const [tab, setTab] = useState<"login" | "register">("login")
	const navigate = useNavigate()
	const handleLogin = async (data: LoginFormType) => {
		try {
			await signInWithEmailAndPassword(auth, data.email, data.password)
			navigate("/connections")
		} catch (error) {
			if (error instanceof FirebaseError) {
				throw new Error(firebaseAuthMessages[error.code] ?? "Ocorreu um erro. Tente novamente.")
			}
			throw error
		}
	}

	const handleRegister = async (data: RegisterFormType) => {
		try {
			await createUserWithEmailAndPassword(auth, data.email, data.password)
			navigate("/connections")
		} catch (error) {
			if (error instanceof FirebaseError) {
				throw new Error(firebaseAuthMessages[error.code] ?? "Ocorreu um erro. Tente novamente.")
			}
			throw error
		}
	}

	return (
		<Box className="min-h-screen bg-gray-100 flex items-center justify-center">
			<Paper className="p-8 w-full max-w-sm">
				<Tabs value={tab} onChange={(_, v) => setTab(v)} className="mb-6">
					<Tab label="Entrar" value="login" />
					<Tab label="Criar conta" value="register" />
				</Tabs>
				{tab === "login" ? <LoginForm onSubmit={handleLogin} /> : <RegisterForm onSubmit={handleRegister} />}
			</Paper>
		</Box>
	)
}
