import { useState } from 'react'
import { Box, Button, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { ConnectionCard } from '../components/connections/ConnectionCard'
import { ConnectionForm } from '../components/connections/ConnectionForm'
import type { Connection } from '../types'
import type { ConnectionForm as Values } from '../schemas/connection.schema'
import type { Timestamp } from 'firebase/firestore'

// Local state mock — replaced by useConnections + service in specs/firebase.md merge phase
const mockTs = { toDate: () => new Date(), seconds: 0, nanoseconds: 0 } as unknown as Timestamp

export const ConnectionsPage = () => {
  const [connections, setConnections] = useState<Connection[]>([])
  const [addOpen, setAddOpen] = useState(false)

  const handleAdd = async (data: Values) => {
    setConnections((prev) => [...prev, { id: crypto.randomUUID(), userId: 'mock', name: data.name, createdAt: mockTs }])
    setAddOpen(false)
  }

  const handleEdit = async (id: string, data: Values) => {
    setConnections((prev) => prev.map((c) => c.id === id ? { ...c, name: data.name } : c))
  }

  const handleDelete = async (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" className="mb-4">
        <Typography variant="h5" className="flex-1">Conexões</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setAddOpen(true)}>Nova conexão</Button>
      </Stack>
      <Stack spacing={2}>
        {connections.map((conn) => (
          <ConnectionCard key={conn.id} connection={conn}
            onEdit={(data) => handleEdit(conn.id, data)}
            onDelete={() => handleDelete(conn.id)} />
        ))}
        {connections.length === 0 && <Typography color="text.secondary">Nenhuma conexão. Crie uma!</Typography>}
      </Stack>
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth>
        <DialogTitle>Nova conexão</DialogTitle>
        <DialogContent><Box className="pt-2"><ConnectionForm onSubmit={handleAdd} /></Box></DialogContent>
      </Dialog>
    </Box>
  )
}
