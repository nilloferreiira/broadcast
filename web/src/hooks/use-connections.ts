import { useEffect, useState } from "react"
import type { Connection } from "../types"
import { listenConnections } from "../services/connections"

export const useConnections = (userId: string) => {
	const [connections, setConnections] = useState<Connection[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(true)

	useEffect(() => {
		if (!userId) {
			setConnections([])
			setIsLoading(false)
			return
		}

		setIsLoading(true)

		const unsubscribe = listenConnections(userId, (data: Connection[]) => {
			setConnections(data)
			setIsLoading(false)
		})

		return unsubscribe
	}, [userId])

	return { connections, isLoading }
}
