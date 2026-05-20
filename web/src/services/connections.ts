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
import type { Connection } from "../types"

export const addConnection = async (userId: string, name: string) => {
	const collectionRef = collection(db, "connections")

	await addDoc(collectionRef, {
		userId,
		name,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	})
}

export const updateConnection = async (id: string, name: string): Promise<void> => {
	const docRef = doc(db, "connections", id)

	await updateDoc(docRef, {
		name,
		updatedAt: serverTimestamp()
	})
}

export const deleteConnection = async (connectionId: string): Promise<void> => {
	const docRef = doc(db, "connections", connectionId)

	await deleteDoc(docRef)
}
export const listenConnections = (userId: string, callback: (connections: any[]) => void) => {
	const connectionsRef = collection(db, "connections")
	const connectionsQuery = query(connectionsRef, where("userId", "==", userId))

	return onSnapshot(connectionsQuery, (snap) =>
		callback(
			snap.docs.map((doc) => ({
				id: doc.id,
				...(doc.data() as Omit<Connection, "id">)
			}))
		)
	)
}
