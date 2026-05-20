import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../hooks/use-auth"
import { CircularProgress } from "@mui/material"

export function PrivateRoute() {
	const { isLoading, user } = useAuth()
	const { pathname } = useLocation()

	if (isLoading) return <CircularProgress aria-label="Loading…" />

	const isLoginPage = pathname === "/login"

	if (isLoginPage && user) return <Navigate to="/connections" replace />
	if (!isLoginPage && !user) return <Navigate to="/login" replace />

	return <Outlet />
}
