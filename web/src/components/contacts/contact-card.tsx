import { useState } from 'react'
import {
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
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { ContactForm } from './contact-form'
import type { Contact } from '../../types'
import type { ContactForm as ContactFormType } from '../../schemas/contact.schema'

interface ContactCardProps {
  contact: Contact
  onEdit: (data: ContactFormType) => Promise<void>
  onDelete: () => Promise<void>
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleEdit = async (data: ContactFormType) => {
    await onEdit(data)
    setEditOpen(false)
  }

  const handleDelete = async () => {
    await onDelete()
    setDeleteOpen(false)
  }

  return (
    <Card data-slot="contact-card">
      <CardContent>
        <Typography variant="h6">{contact.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {contact.phone}
        </Typography>
      </CardContent>
      <CardActions>
        <IconButton
          aria-label="Editar contato"
          onClick={() => setEditOpen(true)}
          className="focus-visible:outline-none focus-visible:ring-2"
        >
          <EditIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          aria-label="Excluir contato"
          onClick={() => setDeleteOpen(true)}
          className="focus-visible:outline-none focus-visible:ring-2"
        >
          <DeleteIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </CardActions>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Editar contato</DialogTitle>
        <DialogContent>
          <ContactForm
            defaultValues={{ name: contact.name, phone: contact.phone }}
            onSubmit={handleEdit}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Excluir contato?</DialogTitle>
        <DialogContent>
          <Typography>Isso excluirá o contato permanentemente.</Typography>
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
