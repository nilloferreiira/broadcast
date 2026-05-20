import { useState } from 'react'
import { Box, Paper, Tab, Tabs } from '@mui/material'
import { LoginForm } from '../components/auth/login-form'
import { RegisterForm } from '../components/auth/register-form'
import type { LoginForm as LoginFormType } from '../schemas/auth.schema'
import type { RegisterForm as RegisterFormType } from '../schemas/auth.schema'

export function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')

  const handleLogin = async (_data: LoginFormType) => {
    // Firebase auth wiring comes later
  }

  const handleRegister = async (_data: RegisterFormType) => {
    // Firebase auth wiring comes later
  }

  return (
    <Box className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Paper className="p-8 w-full max-w-sm">
        <Tabs value={tab} onChange={(_, v) => setTab(v)} className="mb-6">
          <Tab label="Entrar" value="login" />
          <Tab label="Criar conta" value="register" />
        </Tabs>
        {tab === 'login' ? (
          <LoginForm onSubmit={handleLogin} />
        ) : (
          <RegisterForm onSubmit={handleRegister} />
        )}
      </Paper>
    </Box>
  )
}
