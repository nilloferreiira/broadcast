import { useState } from 'react'
import { Box, Button, Dialog, DialogContent, DialogTitle, Typography } from '@mui/material'
import { useAuth } from '../hooks/use-auth'
import { useConnections } from '../hooks/use-connections'
import { addConnection, updateConnection, deleteConnection } from '../services/connections'
import { ConnectionCard } from '../components/connections/connection-card'
import { ConnectionForm } from '../components/connections/connection-form'
import type { ConnectionForm as ConnectionFormType } from '../schemas/connection.schema'

export function ConnectionsPage() {
  const { user } = useAuth()
  const connections = useConnections(user?.uid ?? '')
  const [addOpen, setAddOpen] = useState(false)

  const handleAdd = async (data: ConnectionFormType) => {
    await addConnection(user?.uid ?? '', data.name)
    setAddOpen(false)
  }

  const handleEdit = async (id: string, data: ConnectionFormType) => {
    await updateConnection(id, data.name)
  }

  const handleDelete = async (id: string) => {
    await deleteConnection(id)
  }

  return (
    <Box>
      <Box className="flex items-center justify-between mb-4">
        <Typography variant="h5">Conexões</Typography>
        <Button variant="contained" onClick={() => setAddOpen(true)}>
          Nova conexão
        </Button>
      </Box>

      {connections.length === 0 ? (
        <Typography color="text.secondary">
          Nenhuma conexão. Crie uma!
        </Typography>
      ) : (
        <Box className="flex flex-col gap-3">
          {connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onEdit={(data) => handleEdit(connection.id, data)}
              onDelete={() => handleDelete(connection.id)}
            />
          ))}
        </Box>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)}>
        <DialogTitle>Nova conexão</DialogTitle>
        <DialogContent>
          <ConnectionForm onSubmit={handleAdd} />
        </DialogContent>
      </Dialog>
    </Box>
  )
}
