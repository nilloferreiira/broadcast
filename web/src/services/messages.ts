import type { MessageForm } from '../schemas/message.schema'

export const addMessage = async (_userId: string, _connectionId: string, _data: MessageForm): Promise<void> => {}

export const updateMessage = async (_id: string, _data: MessageForm): Promise<void> => {}

export const deleteMessage = async (_messageId: string): Promise<void> => {}
