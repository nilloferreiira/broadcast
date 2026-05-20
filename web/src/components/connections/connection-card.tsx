import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { ConnectionForm } from './connection-form'
import type { Connection } from '../../types'
import type { ConnectionForm as ConnectionFormType } from '../../schemas/connection.schema'

interface ConnectionCardProps {
  connection: Connection
  onEdit: (data: ConnectionFormType) => Promise<void>
  onDelete: () => Promise<void>
}

export function ConnectionCard({ connection, onEdit, onDelete }: ConnectionCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const navigate = useNavigate()

  const handleEdit = async (data: ConnectionFormType) => {
    await onEdit(data)
    setEditOpen(false)
  }

  const handleDelete = async () => {
    await onDelete()
    setDeleteOpen(false)
  }

  return (
    <div data-slot="connection-card" className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-3">
      <p className="font-semibold text-zinc-900">{connection.name}</p>

      <div className="flex gap-2">
        <Button
          size="small"
          variant="text"
          sx={{ color: 'var(--color-text-3)', '&:hover': { background: 'rgba(0,0,0,0.04)' } }}
          onClick={() => navigate(`/connections/${connection.id}/contacts`)}
        >
          Contatos
        </Button>
        <Button
          size="small"
          variant="text"
          sx={{ color: 'var(--color-text-3)', '&:hover': { background: 'rgba(0,0,0,0.04)' } }}
          onClick={() => navigate(`/connections/${connection.id}/messages`)}
        >
          Mensagens
        </Button>
      </div>

      <div className="flex gap-1 border-t border-zinc-100 pt-2">
        <IconButton
          aria-label="Editar conexão"
          size="small"
          onClick={() => setEditOpen(true)}
          sx={{ color: '#a1a1aa', '&:hover': { color: 'var(--color-text-2)' } }}
        >
          <EditIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          aria-label="Excluir conexão"
          size="small"
          onClick={() => setDeleteOpen(true)}
          sx={{ color: '#a1a1aa', '&:hover': { color: 'var(--color-destructive)' } }}
        >
          <DeleteIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </div>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Editar conexão</DialogTitle>
        <DialogContent>
          <ConnectionForm
            defaultValues={{ name: connection.name }}
            onSubmit={handleEdit}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Excluir conexão?</DialogTitle>
        <DialogContent>
          <Typography>
            Isso excluirá todos os contatos e mensagens desta conexão.
          </Typography>
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
