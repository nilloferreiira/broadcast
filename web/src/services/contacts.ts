import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	query,
	serverTimestamp,
	updateDoc,
	where
} from "firebase/firestore"
import { db } from "../lib/firebase"
import type { Contact } from "../types"

export const addContact = async (userId: string, connectionId: string, name: string, phone: string): Promise<void> => {
	await addDoc(collection(db, "contacts"), {
		userId,
		connectionId,
		name,
		phone,
		createdAt: serverTimestamp()
	})
}

export const updateContact = async (id: string, name: string, phone: string): Promise<void> => {
	await updateDoc(doc(db, "contacts", id), { name, phone })
}

export const deleteContact = async (contactId: string): Promise<void> => {
	await deleteDoc(doc(db, "contacts", contactId))
}

export const listenContacts = (userId: string, connectionId: string, callback: (contacts: Contact[]) => void) => {
	const q = query(
		collection(db, "contacts"),
		where("userId", "==", userId),
		where("connectionId", "==", connectionId)
	)

	return onSnapshot(q, (snap) =>
		callback(
			snap.docs.map((d) => ({
				id: d.id,
				...(d.data() as Omit<Contact, "id">)
			}))
		)
	)
}
