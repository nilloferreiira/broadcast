import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardActions,
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
    <Card data-slot="connection-card">
      <CardContent>
        <Typography variant="h6">{connection.name}</Typography>
      </CardContent>
      <CardActions>
        <Button onClick={() => navigate(`/connections/${connection.id}/contacts`)}>
          Contatos
        </Button>
        <Button onClick={() => navigate(`/connections/${connection.id}/messages`)}>
          Mensagens
        </Button>
        <IconButton
          aria-label="Editar conexão"
          onClick={() => setEditOpen(true)}
          className="focus-visible:outline-none focus-visible:ring-2"
        >
          <EditIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          aria-label="Excluir conexão"
          onClick={() => setDeleteOpen(true)}
          className="focus-visible:outline-none focus-visible:ring-2"
        >
          <DeleteIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </CardActions>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Editar conexão</DialogTitle>
        <DialogContent>
          <ConnectionForm
            defaultValues={{ name: connection.name }}
            onSubmit={handleEdit}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
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
    </Card>
  )
}
