import { useState } from 'react'
import {
  Alert,
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

  const isScheduled = message.status === 'scheduled'

  return (
    <div
      data-slot="message-card"
      className={`bg-white border border-zinc-200 rounded-xl overflow-hidden border-l-4 ${
        isScheduled ? 'border-l-amber-400' : 'border-l-emerald-400'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-semibold text-sm text-zinc-900 leading-tight">{recipientNames}</p>
          <Chip
            label={isScheduled ? 'Agendado' : 'Enviado'}
            size="small"
            sx={{
              backgroundColor: isScheduled ? 'var(--color-scheduled-bg)' : 'var(--color-sent-bg)',
              color: isScheduled ? 'var(--color-scheduled)' : 'var(--color-sent)',
              fontWeight: 500,
              fontSize: '0.7rem',
              height: 22,
              flexShrink: 0,
            }}
          />
        </div>

        <p
          className="text-sm text-zinc-700 mb-3"
          style={{
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {message.body}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">
            {message.sendAt.toDate().toLocaleString('pt-BR')}
          </span>

          {isScheduled && (
            <div className="flex gap-1">
              <IconButton
                aria-label="Editar mensagem"
                size="small"
                onClick={() => setEditOpen(true)}
                sx={{
                  color: 'var(--color-indigo-600, #4f46e5)',
                  '&:hover': { background: 'var(--color-indigo-50, #eef2ff)', color: 'var(--color-indigo-700, #4338ca)' },
                }}
              >
                <EditIcon sx={{ fontSize: 15 }} />
              </IconButton>
              <IconButton
                aria-label="Excluir mensagem"
                size="small"
                onClick={() => setDeleteOpen(true)}
                sx={{
                  color: '#ef4444',
                  '&:hover': { background: '#fef2f2', color: '#dc2626' },
                }}
              >
                <DeleteIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </div>
          )}
        </div>
      </div>

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
    </div>
  )
}
