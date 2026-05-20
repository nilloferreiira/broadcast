import { Outlet, useNavigate } from "react-router-dom"
import { Button, Snackbar, Alert } from "@mui/material"
import { signOut } from "firebase/auth"
import { FirebaseError } from "firebase/app"
import { useState } from "react"
import { auth } from "../../lib/firebase"
import { useAuth } from "../../hooks/use-auth"

export function AppLayout() {
	const navigate = useNavigate()
	const { user } = useAuth()
	const [logoutError, setLogoutError] = useState<string | null>(null)

	const handleLogout = async () => {
		try {
			await signOut(auth)
			navigate("/login")
		} catch (error) {
			if (error instanceof FirebaseError) {
				setLogoutError("Não foi possível sair. Tente novamente.")
			}
		}
	}

	return (
		<div data-slot="app-layout" className="min-h-screen bg-zinc-50">
			<header className="h-14 bg-white border-b border-zinc-200 flex items-center px-6">
				<div className="flex items-center gap-2 flex-1">
					<span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
					<span className="font-semibold text-zinc-900 text-sm tracking-tight">Broadcast</span>
				</div>
				<div className="flex items-center gap-3">
					<span className="text-sm text-zinc-500">{user?.email}</span>
					<Button
						size="small"
						variant="outlined"
						onClick={handleLogout}
						sx={{
							borderColor: 'var(--color-border)',
							color: 'var(--color-text-3)',
							'&:hover': { borderColor: 'var(--color-border-strong)', background: 'transparent' },
						}}
					>
						Sair
					</Button>
				</div>
			</header>
			<main className="p-6">
				<Outlet />
			</main>
			<Snackbar open={!!logoutError} autoHideDuration={4000} onClose={() => setLogoutError(null)}>
				<Alert severity="error" onClose={() => setLogoutError(null)}>
					{logoutError}
				</Alert>
			</Snackbar>
		</div>
	)
}
