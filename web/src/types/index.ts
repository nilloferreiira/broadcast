import type { Timestamp } from 'firebase/firestore'

export type MessageStatus = 'scheduled' | 'sent'

export interface Connection {
  id: string
  userId: string
  name: string
  createdAt: Timestamp
}

export interface Contact {
  id: string
  userId: string
  connectionId: string
  name: string
  phone: string
  createdAt: Timestamp
}

export interface Message {
  id: string
  userId: string
  connectionId: string
  contactIds: string[]
  body: string
  status: MessageStatus
  sendAt: Timestamp
  createdAt: Timestamp
}
