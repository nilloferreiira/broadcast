import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Message } from '../types'
import type { MessageForm } from '../schemas/message.schema'

const deriveStatus = (scheduleType: MessageForm['scheduleType'], sendAt: Date) =>
  scheduleType === 'imediato' || sendAt <= new Date() ? 'enviado' : 'agendado'

export const addMessage = async (userId: string, connectionId: string, data: MessageForm): Promise<void> => {
  const sendAt = data.scheduleType === 'imediato' ? Timestamp.now() : Timestamp.fromDate(data.sendAt)

  await addDoc(collection(db, 'messages'), {
    userId,
    connectionId,
    contactIds: data.contactIds,
    body: data.body,
    status: deriveStatus(data.scheduleType, sendAt.toDate()),
    sendAt,
    createdAt: serverTimestamp(),
  })
}

export const updateMessage = async (id: string, data: MessageForm): Promise<void> => {
  const sendAt = data.scheduleType === 'imediato' ? Timestamp.now() : Timestamp.fromDate(data.sendAt)

  await updateDoc(doc(db, 'messages', id), {
    contactIds: data.contactIds,
    body: data.body,
    status: deriveStatus(data.scheduleType, sendAt.toDate()),
    sendAt,
  })
}

export const deleteMessage = async (messageId: string): Promise<void> => {
  await deleteDoc(doc(db, 'messages', messageId))
}

export const listenMessages = (userId: string, connectionId: string, callback: (messages: Message[]) => void) => {
  const q = query(
    collection(db, 'messages'),
    where('userId', '==', userId),
    where('connectionId', '==', connectionId),
  )

  return onSnapshot(q, (snap) =>
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Message, 'id'>),
      })),
    ),
  )
}
