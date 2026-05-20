import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardActions, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { ConnectionForm } from './ConnectionForm'
import type { Connection } from '../../types'
import type { ConnectionForm as Values } from '../../schemas/connection.schema'

interface Props { connection: Connection; onEdit: (data: Values) => Promise<void>; onDelete: () => Promise<void> }

export const ConnectionCard = ({ connection, onEdit, onDelete }: Props) => {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">{connection.name}</Typography>
        </CardContent>
        <CardActions>
          <Button size="small" onClick={() => navigate(`/connections/${connection.id}/contacts`)}>Contatos</Button>
          <Button size="small" onClick={() => navigate(`/connections/${connection.id}/messages`)}>Mensagens</Button>
          <Box className="flex-1" />
          <IconButton size="small" onClick={() => setEditOpen(true)} aria-label="Editar"><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => setDeleteOpen(true)} aria-label="Excluir"><DeleteIcon fontSize="small" /></IconButton>
        </CardActions>
      </Card>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth>
        <DialogTitle>Editar conexão</DialogTitle>
        <DialogContent><Box className="pt-2">
          <ConnectionForm defaultValues={{ name: connection.name }} onSubmit={async (d) => { await onEdit(d); setEditOpen(false) }} />
        </Box></DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Excluir conexão?</DialogTitle>
        <DialogContent><Typography>Isso também excluirá todos os contatos e mensagens desta conexão.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          <Button color="error" onClick={async () => { await onDelete(); setDeleteOpen(false) }}>Excluir</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
