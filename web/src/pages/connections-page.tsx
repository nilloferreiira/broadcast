import { useState } from "react"
import { Button, CircularProgress, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material"
import { useAuth } from "../hooks/use-auth"
import { useConnections } from "../hooks/use-connections"
import { addConnection, updateConnection, deleteConnection } from "../services/connections"
import { ConnectionCard } from "../components/connections/connection-card"
import { ConnectionForm } from "../components/connections/connection-form"
import type { ConnectionForm as ConnectionFormType } from "../schemas/connection.schema"

export function ConnectionsPage() {
	const { user } = useAuth()
	const { connections, isLoading } = useConnections(user?.uid ?? "")
	const [addOpen, setAddOpen] = useState(false)

	const handleAdd = async (data: ConnectionFormType) => {
		await addConnection(user?.uid ?? "", data.name)
		setAddOpen(false)
	}

	const handleEdit = async (id: string, data: ConnectionFormType) => {
		await updateConnection(id, data.name)
	}

	const handleDelete = async (id: string) => {
		await deleteConnection(id)
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-xl font-semibold text-zinc-900">Conexões</h1>
				<Button variant="contained" onClick={() => setAddOpen(true)}>
					Nova conexão
				</Button>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-12">
					<CircularProgress size={24} />
				</div>
			) : connections.length === 0 ? (
				<div className="flex justify-center py-12">
					<Typography className="text-zinc-400">Nenhuma conexão. Crie uma!</Typography>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{connections.map((connection) => (
						<ConnectionCard
							key={connection.id}
							connection={connection}
							onEdit={(data) => handleEdit(connection.id, data)}
							onDelete={() => handleDelete(connection.id)}
						/>
					))}
				</div>
			)}

			<Dialog open={addOpen} onClose={() => setAddOpen(false)}>
				<DialogTitle>Nova conexão</DialogTitle>
				<DialogContent>
					<ConnectionForm onSubmit={handleAdd} />
				</DialogContent>
			</Dialog>
		</div>
	)
}
