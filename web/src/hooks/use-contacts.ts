import { useEffect, useState } from "react"
import type { Contact } from "../types"
import { listenContacts } from "../services/contacts"

export const useContacts = (userId: string, connectionId: string) => {
	const [contacts, setContacts] = useState<Contact[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(true)

	useEffect(() => {
		if (!userId || !connectionId) {
			setContacts([])
			setIsLoading(false)
			return
		}

		setIsLoading(true)

		const unsubscribe = listenContacts(userId, connectionId, (data) => {
			setContacts(data)
			setIsLoading(false)
		})

		return unsubscribe
	}, [userId, connectionId])

	return { contacts, isLoading }
}
