import { Outlet, useNavigate } from "react-router-dom"
import { AppBar, Toolbar, Typography, Button, Box, Snackbar, Alert } from "@mui/material"
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
		<div data-slot="app-layout" className="min-h-screen bg-gray-50">
			<AppBar position="static">
				<Toolbar>
					<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
						Broadcast
					</Typography>
					<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
						{user?.email}
					</Typography>
					<Button color="inherit" onClick={handleLogout} className="focus-visible:outline-none focus-visible:ring-2">
						Sair
					</Button>
				</Toolbar>
			</AppBar>
			<Box component="main" className="p-4">
				<Outlet />
			</Box>
			<Snackbar open={!!logoutError} autoHideDuration={4000} onClose={() => setLogoutError(null)}>
				<Alert severity="error" onClose={() => setLogoutError(null)}>
					{logoutError}
				</Alert>
			</Snackbar>
		</div>
	)
}
