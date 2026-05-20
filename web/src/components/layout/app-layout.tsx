import { Outlet, useNavigate } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'

export function AppLayout() {
  const navigate = useNavigate()

  return (
    <div data-slot="app-layout" className="min-h-screen bg-gray-50">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Broadcast
          </Typography>
          <Button
            color="inherit"
            onClick={() => navigate('/login')}
            className="focus-visible:outline-none focus-visible:ring-2"
          >
            Sair
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" className="p-4">
        <Outlet />
      </Box>
    </div>
  )
}
