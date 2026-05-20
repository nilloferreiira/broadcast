import { initializeApp } from "firebase-admin/app"
import { getFirestore, Timestamp } from "firebase-admin/firestore"
import { onSchedule } from "firebase-functions/scheduler"

initializeApp()

export const processScheduledMessages = onSchedule("every 1 minutes", async () => {
	const db = getFirestore()
	const now = Timestamp.now()
})
