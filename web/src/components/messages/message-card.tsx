import { useState } from 'react'
import {
  Alert,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { MessageForm as MessageFormComponent } from './message-form'
import type { Message, Contact } from '../../types'
import type { MessageForm } from '../../schemas/message.schema'

interface MessageCardProps {
  message: Message
  contacts: Contact[]
  onEdit: (data: MessageForm) => Promise<void>
  onDelete: () => Promise<void>
}

export function MessageCard({ message, contacts, onEdit, onDelete }: MessageCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleEdit = async (data: MessageForm) => {
    await onEdit(data)
    setEditOpen(false)
  }

  const handleDelete = async () => {
    try {
      await onDelete()
      setDeleteOpen(false)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Ocorreu um erro. Tente novamente.')
    }
  }

  const recipientNames = contacts
    .filter((c) => message.contactIds.includes(c.id))
    .map((c) => c.name)
    .join(', ')

  const editDefaultValues: MessageForm = {
    body: message.body,
    contactIds: message.contactIds,
    scheduleType: 'scheduled',
    sendAt: message.sendAt.toDate(),
  }

  return (
    <Card data-slot="message-card">
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {recipientNames}
        </Typography>
        <Typography
          variant="body1"
          className="line-clamp-2"
          sx={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
        >
          {message.body}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {message.sendAt.toDate().toLocaleString('pt-BR')}
        </Typography>
        <Chip
          label={message.status === 'scheduled' ? 'Agendado' : 'Enviado'}
          color={message.status === 'scheduled' ? 'warning' : 'success'}
          size="small"
          sx={{ mt: 1 }}
        />
      </CardContent>

      {message.status === 'scheduled' && (
        <CardActions>
          <IconButton
            aria-label="Editar mensagem"
            onClick={() => setEditOpen(true)}
            className="focus-visible:outline-none focus-visible:ring-2"
          >
            <EditIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton
            aria-label="Excluir mensagem"
            onClick={() => setDeleteOpen(true)}
            className="focus-visible:outline-none focus-visible:ring-2"
          >
            <DeleteIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </CardActions>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Editar mensagem</DialogTitle>
        <DialogContent>
          <MessageFormComponent
            contacts={contacts}
            defaultValues={editDefaultValues}
            onSubmit={handleEdit}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => { setDeleteOpen(false); setDeleteError(null) }}>
        <DialogTitle>Excluir mensagem?</DialogTitle>
        <DialogContent>
          <Typography>Isso excluirá a mensagem permanentemente.</Typography>
          {deleteError && <Alert severity="error" sx={{ mt: 1 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          <Button color="error" onClick={handleDelete}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
