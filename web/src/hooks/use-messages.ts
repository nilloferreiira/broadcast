import { useEffect, useState } from 'react'
import type { Message } from '../types'
import { listenMessages } from '../services/messages'

export const useMessages = (userId: string, connectionId: string) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId || !connectionId) {
      setMessages([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const unsubscribe = listenMessages(userId, connectionId, (data) => {
      setMessages(data)
      setIsLoading(false)
    })

    return unsubscribe
  }, [userId, connectionId])

  return { messages, isLoading }
}
