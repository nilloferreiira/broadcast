import { Outlet, useNavigate } from 'react-router-dom'
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'

// Logout calls Firebase signOut in the merge phase. For now, navigates to /login.
export const AppLayout = () => {
  const navigate = useNavigate()

  return (
    <Box className="min-h-screen bg-gray-50">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" className="flex-1">Broadcast</Typography>
          <Button color="inherit" onClick={() => navigate('/login')}>Sair</Button>
        </Toolbar>
      </AppBar>
      <Box component="main" className="p-4"><Outlet /></Box>
    </Box>
  )
}
