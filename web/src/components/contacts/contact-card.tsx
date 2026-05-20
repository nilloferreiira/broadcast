import { useState } from 'react'
import {
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

  const initials = contact.name.charAt(0).toUpperCase()

  return (
    <div data-slot="contact-card" className="bg-white border border-zinc-200 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-semibold text-indigo-600">{initials}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-zinc-900 text-sm truncate">{contact.name}</p>
        <p className="text-zinc-500 text-xs">{contact.phone}</p>
      </div>

      <div className="flex gap-1 flex-shrink-0">
        <IconButton
          aria-label="Editar contato"
          size="small"
          onClick={() => setEditOpen(true)}
          sx={{
            color: 'var(--color-indigo-600, #4f46e5)',
            '&:hover': { background: 'var(--color-indigo-50, #eef2ff)', color: 'var(--color-indigo-700, #4338ca)' },
          }}
        >
          <EditIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          aria-label="Excluir contato"
          size="small"
          onClick={() => setDeleteOpen(true)}
          sx={{
            color: '#ef4444',
            '&:hover': { background: '#fef2f2', color: '#dc2626' },
          }}
        >
          <DeleteIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </div>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Editar contato</DialogTitle>
        <DialogContent>
          <ContactForm
            defaultValues={{ name: contact.name, phone: contact.phone }}
            onSubmit={handleEdit}
          />
        </DialogContent>
      </Dialog>

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
    </div>
  )
}
