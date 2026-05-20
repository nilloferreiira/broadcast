import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	onSnapshot,
	query,
	serverTimestamp,
	Timestamp,
	updateDoc,
	where
} from "firebase/firestore"
import { db } from "../lib/firebase"
import type { Message } from "../types"
import type { MessageForm } from "../schemas/message.schema"

const deriveStatus = (scheduleType: MessageForm["scheduleType"], sendAt: Date) =>
	scheduleType === "immediate" || sendAt <= new Date() ? "sent" : "scheduled"

const assertNotSent = async (id: string, action: "editada" | "excluída"): Promise<void> => {
	const snap = await getDoc(doc(db, "messages", id))
	if (!snap.exists()) throw new Error("Mensagem não encontrada.")
	if ((snap.data() as Message).status === "sent")
		throw new Error(`Esta mensagem já foi enviada e não pode ser ${action}.`)
}

export const addMessage = async (userId: string, connectionId: string, data: MessageForm): Promise<void> => {
	const sendAt = data.scheduleType === "immediate" ? Timestamp.now() : Timestamp.fromDate(data.sendAt)

	await addDoc(collection(db, "messages"), {
		userId,
		connectionId,
		contactIds: data.contactIds,
		body: data.body,
		status: deriveStatus(data.scheduleType, sendAt.toDate()),
		sendAt,
		createdAt: serverTimestamp()
	})
}

export const updateMessage = async (id: string, data: MessageForm): Promise<void> => {
	await assertNotSent(id, "editada")
	const sendAt = data.scheduleType === "immediate" ? Timestamp.now() : Timestamp.fromDate(data.sendAt)

	await updateDoc(doc(db, "messages", id), {
		contactIds: data.contactIds,
		body: data.body,
		status: deriveStatus(data.scheduleType, sendAt.toDate()),
		sendAt
	})
}

export const deleteMessage = async (messageId: string): Promise<void> => {
	await assertNotSent(messageId, "excluída")
	await deleteDoc(doc(db, "messages", messageId))
}

export const listenMessages = (userId: string, connectionId: string, callback: (messages: Message[]) => void) => {
	const q = query(collection(db, "messages"), where("userId", "==", userId), where("connectionId", "==", connectionId))

	return onSnapshot(q, (snap) =>
		callback(
			snap.docs.map((d) => ({
				id: d.id,
				...(d.data() as Omit<Message, "id">)
			}))
		)
	)
}
