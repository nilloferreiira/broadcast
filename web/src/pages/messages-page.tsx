import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useAuth } from '../hooks/use-auth'
import { useMessages } from '../hooks/use-messages'
import { useContacts } from '../hooks/use-contacts'
import { addMessage, updateMessage, deleteMessage } from '../services/messages'
import { MessageCard } from '../components/messages/message-card'
import { MessageFilter } from '../components/messages/message-filter'
import { MessageForm } from '../components/messages/message-form'
import type { MessageForm as MessageFormType } from '../schemas/message.schema'

export function MessagesPage() {
  const { connectionId = '' } = useParams<{ connectionId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { messages, isLoading } = useMessages(user?.uid ?? '', connectionId)
  const { contacts } = useContacts(user?.uid ?? '', connectionId)
  const [statusFilter, setStatusFilter] = useState<'all' | 'agendado' | 'enviado'>('all')
  const [addOpen, setAddOpen] = useState(false)

  const filtered =
    statusFilter === 'all'
      ? messages
      : messages.filter((m) => m.status === statusFilter)

  const handleAdd = async (data: MessageFormType) => {
    await addMessage(user?.uid ?? '', connectionId, data)
    setAddOpen(false)
  }

  const handleEdit = async (id: string, data: MessageFormType) => {
    await updateMessage(id, data)
  }

  const handleDelete = async (id: string) => {
    await deleteMessage(id)
  }

  return (
    <Box>
      <Box className="flex items-center justify-between mb-4">
        <Box className="flex items-center gap-2">
          <IconButton onClick={() => navigate('/connections')} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">Mensagens</Typography>
        </Box>
        <Button variant="contained" onClick={() => setAddOpen(true)}>
          Nova mensagem
        </Button>
      </Box>

      <MessageFilter value={statusFilter} onChange={setStatusFilter} />

      {filtered.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Nenhuma mensagem encontrada.
        </Typography>
      ) : (
        <Box className="flex flex-col gap-3 mt-4">
          {isLoading ? (
            <CircularProgress />
          ) : filtered.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              contacts={contacts}
              onEdit={(data) => handleEdit(message.id, data)}
              onDelete={() => handleDelete(message.id)}
            />
          ))}
        </Box>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nova mensagem</DialogTitle>
        <DialogContent>
          <MessageForm contacts={contacts} onSubmit={handleAdd} />
        </DialogContent>
      </Dialog>
    </Box>
  )
}
