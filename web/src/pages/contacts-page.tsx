import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useAuth } from "../hooks/use-auth"
import { useContacts } from "../hooks/use-contacts"
import { addContact, updateContact, deleteContact } from "../services/contacts"
import { ContactCard } from "../components/contacts/contact-card"
import { ContactForm } from "../components/contacts/contact-form"
import type { ContactForm as ContactFormType } from "../schemas/contact.schema"

export function ContactsPage() {
	const { connectionId = "" } = useParams<{ connectionId: string }>()
	const { user } = useAuth()
	const navigate = useNavigate()
	const { isLoading, contacts } = useContacts(user?.uid ?? "", connectionId)
	const [addOpen, setAddOpen] = useState(false)

	const handleAdd = async (data: ContactFormType) => {
		await addContact(user?.uid ?? "", connectionId, data.name, data.phone)
		setAddOpen(false)
	}

	const handleEdit = async (id: string, data: ContactFormType) => {
		await updateContact(id, data.name, data.phone)
	}

	const handleDelete = async (id: string) => {
		await deleteContact(id)
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-2">
					<IconButton
						onClick={() => navigate("/connections")}
						size="small"
						sx={{ color: 'var(--color-text-3)' }}
					>
						<ArrowBackIcon sx={{ fontSize: 20 }} />
					</IconButton>
					<h1 className="text-xl font-semibold text-zinc-900">Contatos</h1>
				</div>
				<Button variant="contained" onClick={() => setAddOpen(true)}>
					Novo contato
				</Button>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-12">
					<CircularProgress size={24} />
				</div>
			) : contacts.length === 0 ? (
				<div className="flex justify-center py-12">
					<Typography className="text-zinc-400">Nenhum contato. Adicione um!</Typography>
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{contacts.map((contact) => (
						<ContactCard
							key={contact.id}
							contact={contact}
							onEdit={(data) => handleEdit(contact.id, data)}
							onDelete={() => handleDelete(contact.id)}
						/>
					))}
				</div>
			)}

			<Dialog open={addOpen} onClose={() => setAddOpen(false)}>
				<DialogTitle>Novo contato</DialogTitle>
				<DialogContent>
					<ContactForm onSubmit={handleAdd} />
				</DialogContent>
			</Dialog>
		</div>
	)
}
