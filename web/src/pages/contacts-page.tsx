import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material"
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
		<Box>
			<Box className="flex items-center justify-between mb-4">
				<Box className="flex items-center gap-2">
					<IconButton onClick={() => navigate("/connections")} size="small">
						<ArrowBackIcon />
					</IconButton>
					<Typography variant="h5">Contatos</Typography>
				</Box>
				<Button variant="contained" onClick={() => setAddOpen(true)}>
					Novo contato
				</Button>
			</Box>

			{contacts.length === 0 ? (
				<Typography color="text.secondary">Nenhum contato. Adicione um!</Typography>
			) : (
				<Box className="flex flex-col gap-3">
					{isLoading ? (
						<CircularProgress />
					) : (
						contacts.map((contact) => (
							<ContactCard
								key={contact.id}
								contact={contact}
								onEdit={(data) => handleEdit(contact.id, data)}
								onDelete={() => handleDelete(contact.id)}
							/>
						))
					)}
				</Box>
			)}

			<Dialog open={addOpen} onClose={() => setAddOpen(false)}>
				<DialogTitle>Novo contato</DialogTitle>
				<DialogContent>
					<ContactForm onSubmit={handleAdd} />
				</DialogContent>
			</Dialog>
		</Box>
	)
}
