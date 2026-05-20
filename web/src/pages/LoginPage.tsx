import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Container, Paper, Tab, Tabs, Typography } from '@mui/material'
import { LoginForm } from '../components/auth/LoginForm'
import { RegisterForm } from '../components/auth/RegisterForm'
import type { LoginForm as LoginValues } from '../schemas/auth.schema'
import type { RegisterForm as RegisterValues } from '../schemas/auth.schema'

// Firebase calls are added in the merge phase (specs/firebase.md).
// For now, both handlers navigate directly so the UI can be developed and tested.
export const LoginPage = () => {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [error] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (_data: LoginValues) => {
    navigate('/connections')
  }

  const handleRegister = async (_data: RegisterValues) => {
    navigate('/connections')
  }

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gray-50">
      <Container maxWidth="xs">
        <Paper className="p-8" elevation={2}>
          <Typography variant="h5" className="mb-4 font-bold text-center">Broadcast</Typography>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} centered className="mb-4">
            <Tab label="Entrar" value="login" />
            <Tab label="Criar conta" value="register" />
          </Tabs>
          {error && <Alert severity="error" className="mb-4">{error}</Alert>}
          {tab === 'login' ? <LoginForm onSubmit={handleLogin} /> : <RegisterForm onSubmit={handleRegister} />}
        </Paper>
      </Container>
    </Box>
  )
}
