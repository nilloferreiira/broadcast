import { useEffect, useState } from "react"
import { auth } from "../lib/firebase"
import { onAuthStateChanged, type User } from "firebase/auth"

export const useAuth = () => {
	const [user, setUser] = useState<User | null>(auth.currentUser!)
	const [isLoading, setIsloading] = useState<boolean>(true)
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (u) => {
			setUser(u)
			setIsloading(false)
		})
		return () => unsubscribe()
	}, [])

	return { user, isLoading }
}
